/**
 * 客服 Copilot 编排器：把记忆 / RAG / 工具 / HITL 审批 / 安全 / 可观测串成一条「每轮处理管线」。
 *
 * 单轮管线（顺序即纵深防御）：
 *   ① 安全入口    detectInjection 扫用户输入 → 命中即拒绝执行（不让注入劫持后续动作）
 *   ② 记忆        从会话快照补全订单号（多轮不必重复给）
 *   ③ 路由        routeIntent → faq / order_status / refund / smalltalk
 *   ④ 取证        FAQ 走知识库检索（带引用）；订单类走工具
 *   ⑤ HITL 审批门 退款这类敏感动作按风控决策：自动放行 / 需人工 / 拒绝
 *   ⑥ 安全出口    redactPii 脱敏对外文本与审计日志
 *   ⑦ 可观测      Tracer 累加工具调用 / 估算 token 与成本
 */
import { approxTokens } from "../../../src/shared/rag/chunk";
import { detectInjection } from "../../../src/shared/rag/security";
import { redactPii } from "../../../src/shared/rag/security";
import { ToolRegistry } from "../../../src/shared/agent/tool";
import { buildKnowledgeBase, type KnowledgeBase } from "./knowledgeBase";
import {
  ORDER_DB,
  buildToolRegistry,
  newSession,
  advanceSession,
  withApproval,
  type Order,
  type Session,
  type ToolContext,
} from "./session";
import {
  routeIntent,
  approvalDecision,
  DEFAULT_APPROVAL_POLICY,
  type ApprovalPolicy,
} from "./policy";

/** 一笔待人工审批的敏感动作。 */
export interface PendingApproval {
  signature: string;
  orderId: string;
  amountCents: number;
  reason: string;
}

/** 单轮处理结果。 */
export interface TurnResult {
  reply: string;
  intent: string;
  /** 命中的引用来源（FAQ 场景）。 */
  citations: { citation: number; source: string }[];
  /** 安全事件（注入命中），非空表示本轮被安全门拦截。 */
  securityFlags: string[];
  /** 若非空：本轮产生了一笔待人工审批的动作，需 approve() 后重发。 */
  pendingApproval?: PendingApproval;
  /** 更新后的会话快照（不可变）。 */
  session: Session;
}

/** 极简价格表（每百万 token 的美元价，教学估算用）。 */
const PRICE_PER_MTOK = { input: 0.5, output: 1.5 };

/** 可观测追踪器：累加工具调用与估算 token/成本。纯累加，便于一轮轮汇总。 */
export class Tracer {
  toolCalls = 0;
  toolBreakdown: Record<string, number> = {};
  inputTokens = 0;
  outputTokens = 0;

  onToolCall(name: string): void {
    this.toolCalls += 1;
    this.toolBreakdown[name] = (this.toolBreakdown[name] ?? 0) + 1;
  }

  /** 用 approxTokens 估算一轮的输入(上下文)与输出(回复) token。 */
  account(contextText: string, replyText: string): void {
    this.inputTokens += approxTokens(contextText);
    this.outputTokens += approxTokens(replyText);
  }

  costUsd(): number {
    return (
      (this.inputTokens / 1_000_000) * PRICE_PER_MTOK.input +
      (this.outputTokens / 1_000_000) * PRICE_PER_MTOK.output
    );
  }
}

/** Copilot 配置。 */
export interface CopilotOptions {
  orders?: Readonly<Record<string, Order>>;
  approvalPolicy?: ApprovalPolicy;
}

/**
 * 客服 Copilot：持有知识库、工具注册表、会话快照、追踪器。
 * 状态（session）以不可变快照在 handle() 之间流转。
 */
export class Copilot {
  private readonly kb: KnowledgeBase = buildKnowledgeBase();
  private readonly registry: ToolRegistry;
  private readonly orders: Readonly<Record<string, Order>>;
  private readonly policy: ApprovalPolicy;
  readonly tracer = new Tracer();
  private session: Session = newSession();

  constructor(opts: CopilotOptions = {}) {
    this.orders = opts.orders ?? ORDER_DB;
    this.policy = opts.approvalPolicy ?? DEFAULT_APPROVAL_POLICY;
    const ctx: ToolContext = { orders: this.orders, onCall: (name) => this.tracer.onToolCall(name) };
    this.registry = buildToolRegistry(ctx);
  }

  get currentSession(): Session {
    return this.session;
  }

  /** 人工审批：把签名记入会话，使下一次同名动作得以放行。 */
  approve(signature: string): void {
    this.session = withApproval(this.session, signature);
  }

  /** 处理一轮用户输入。 */
  async handle(userText: string): Promise<TurnResult> {
    // ① 安全入口：注入检测。命中即拒绝，不进入后续动作。
    const injection = detectInjection(userText);
    if (injection.suspicious) {
      const flags = injection.findings.map((f) => f.rule);
      const reply = "抱歉，你的消息中包含疑似越权指令，已被安全策略拦截。如需帮助请换一种描述方式。";
      this.session = advanceSession(this.session, {});
      this.tracer.account(userText, reply);
      return { reply, intent: "blocked", citations: [], securityFlags: flags, session: this.session };
    }

    // ② 记忆：补全订单号。③ 路由。
    const route = routeIntent(userText);
    const orderId = route.orderId ?? this.session.orderId;
    this.session = advanceSession(this.session, orderId ? { orderId } : {});

    let result: Omit<TurnResult, "session" | "securityFlags">;
    switch (route.intent) {
      case "smalltalk":
        result = { reply: "你好，我是智能客服助手。可以帮你查询订单、办理退款或解答常见问题。", intent: "smalltalk", citations: [] };
        break;
      case "order_status":
        result = await this.handleOrderStatus(orderId);
        break;
      case "refund":
        result = await this.handleRefund(orderId);
        break;
      default:
        result = this.handleFaq(userText);
    }

    // ⑥ 安全出口：脱敏对外文本（检索内容或订单信息可能含 PII）。
    const safeReply = redactPii(result.reply).redacted;
    // ⑦ 可观测：估算本轮 token/成本。
    this.tracer.account(userText + result.citations.map((c) => c.source).join(""), safeReply);
    return { ...result, reply: safeReply, securityFlags: [], session: this.session };
  }

  /** FAQ：知识库检索 → 带引用作答；检索为空则拒答（不编造）。 */
  private handleFaq(userText: string): Omit<TurnResult, "session" | "securityFlags"> {
    const hits = this.kb.retrieve(userText, 3);
    if (hits.length === 0) {
      return { reply: "抱歉，资料中未提及该问题，建议你联系人工客服进一步处理。", intent: "faq", citations: [] };
    }
    const body = hits.map((h) => `${h.doc.text}[${h.citation}]`).join(" ");
    const citations = hits.map((h) => ({ citation: h.citation, source: h.doc.source }));
    const sources = citations.map((c) => `[${c.citation}] ${c.source}`).join("\n");
    return { reply: `${body}\n\n参考来源：\n${sources}`, intent: "faq", citations };
  }

  /** 查单：必须有订单号，否则反问；命中则格式化状态。 */
  private async handleOrderStatus(orderId?: string): Promise<Omit<TurnResult, "session" | "securityFlags">> {
    if (!orderId) {
      return { reply: "请提供你的订单号（形如 A1001），我帮你查询物流与状态。", intent: "order_status", citations: [] };
    }
    const raw = await this.registry.run({ name: "lookupOrder", arguments: { orderId } });
    const data = JSON.parse(raw) as { found: boolean; status?: string; item?: string; amountYuan?: number };
    if (!data.found) {
      return { reply: `未找到订单 ${orderId}，请核对订单号。`, intent: "order_status", citations: [] };
    }
    return {
      reply: `订单 ${orderId}（${data.item}）当前状态：${data.status}，实付 ¥${data.amountYuan?.toFixed(2)}。`,
      intent: "order_status",
      citations: [],
    };
  }

  /** 退款：取订单 → 风控决策 → HITL 审批门 → 放行/拒绝/挂起。 */
  private async handleRefund(orderId?: string): Promise<Omit<TurnResult, "session" | "securityFlags">> {
    if (!orderId) {
      return { reply: "请提供需要退款的订单号（形如 A1001）。", intent: "refund", citations: [] };
    }
    const order = this.orders[orderId];
    if (!order) {
      return { reply: `未找到订单 ${orderId}，请核对订单号。`, intent: "refund", citations: [] };
    }
    const decision = approvalDecision(order.amountCents, order.noFreeReturn, this.policy);
    const signature = `refund:${orderId}`;

    if (decision.kind === "reject") {
      return { reply: `无法自助退款：${decision.reason}。`, intent: "refund", citations: [] };
    }

    const alreadyApproved = this.session.approvals.includes(signature);
    if (decision.kind === "needs-human" && !alreadyApproved) {
      // 挂起：返回待审批动作，由人工 approve() 后重发本轮。
      return {
        reply: `这笔退款（¥${(order.amountCents / 100).toFixed(2)}）${decision.reason}，已提交人工审批，请稍候。`,
        intent: "refund",
        citations: [],
        pendingApproval: { signature, orderId, amountCents: order.amountCents, reason: decision.reason },
      };
    }

    // 自动放行，或人工已审批 → 执行退款工具。
    const raw = await this.registry.run({ name: "issueRefund", arguments: { orderId, amountCents: order.amountCents } });
    const data = JSON.parse(raw) as { ok: boolean; note: string };
    const how = decision.kind === "needs-human" ? "（已通过人工审批）" : "（风控自动放行）";
    return {
      reply: data.ok
        ? `已为订单 ${orderId} 办理退款 ¥${(order.amountCents / 100).toFixed(2)}${how}，1-3 个工作日原路退回。`
        : `退款失败：${data.note}。`,
      intent: "refund",
      citations: [],
    };
  }
}
