/**
 * 会话短期记忆 + 工具系统（查单 / 退款）。
 *
 * 记忆用**不可变更新**：每次都返回新的 session 快照，不就地改写——避免跨轮次的隐藏副作用，
 * 也让「这一轮记住了什么」可被快照比对、可回放。工具用 shared 的 defineTool（一个 zod schema
 * 同时管参数描述与运行期校验），把「不可信的模型/用户输入」挡在系统边界外。
 */
import { z } from "zod";
import { defineTool, ToolRegistry, type Tool } from "../../../src/shared/agent/tool";

/** 一笔订单（内置假数据，模拟订单系统）。 */
export interface Order {
  id: string;
  status: "已签收" | "运输中" | "已退款";
  amountCents: number;
  item: string;
  /** 是否属于「不支持无理由退款」的类目（生鲜 / 定制）。 */
  noFreeReturn: boolean;
}

/** 内置订单库：客服可查询的样本订单。 */
export const ORDER_DB: Readonly<Record<string, Order>> = {
  A1001: { id: "A1001", status: "已签收", amountCents: 9900, item: "机械键盘", noFreeReturn: false },
  A1002: { id: "A1002", status: "运输中", amountCents: 25800, item: "定制刻字钢笔", noFreeReturn: true },
  A1003: { id: "A1003", status: "已签收", amountCents: 1290000, item: "高端显示器", noFreeReturn: false },
};

/** 会话记忆：跨轮次累积的槽位。所有字段只读，更新走 withSlot 产出新快照。 */
export interface Session {
  readonly turn: number;
  /** 上下文里记住的订单号（用户说过一次后，后续轮次不必重复给）。 */
  readonly orderId?: string;
  /** 已为本会话审批通过的敏感动作签名集合（如 "refund:A1003"）。 */
  readonly approvals: readonly string[];
}

/** 空会话。 */
export function newSession(): Session {
  return { turn: 0, approvals: [] };
}

/** 不可变更新：返回带某字段更新的新快照，轮次自动 +1。 */
export function advanceSession(prev: Session, patch: Partial<Omit<Session, "turn">>): Session {
  return { ...prev, ...patch, turn: prev.turn + 1 };
}

/** 给会话追加一条审批记录（不可变）。 */
export function withApproval(prev: Session, signature: string): Session {
  if (prev.approvals.includes(signature)) return prev;
  return { ...prev, approvals: [...prev.approvals, signature] };
}

/** 工具执行所需的上下文（闭包注入，避免全局可变单例）。 */
export interface ToolContext {
  orders: Readonly<Record<string, Order>>;
  /** 工具调用计数器（可观测用），按工具名累加。 */
  onCall: (name: string) => void;
}

/** 查单工具：只读，按订单号返回状态/金额/商品。 */
export function makeLookupOrderTool(ctx: ToolContext): Tool {
  return defineTool({
    name: "lookupOrder",
    description: "按订单号查询订单状态、金额与商品。需要订单信息时优先调用，不要凭空编造。",
    schema: z.object({ orderId: z.string().min(1).describe("订单号，形如 A1001") }),
    execute: ({ orderId }) => {
      ctx.onCall("lookupOrder");
      const order = ctx.orders[orderId];
      if (!order) return { found: false as const, note: `未找到订单 ${orderId}` };
      return { found: true as const, ...order, amountYuan: order.amountCents / 100 };
    },
  });
}

/**
 * 退款工具：**敏感动作**。这里只产出「拟执行的退款意图」，不直接落库——
 * 是否真正放行由 copilot 的 HITL 审批门决定（见 policy.ts / copilot.ts）。
 */
export function makeIssueRefundTool(ctx: ToolContext): Tool {
  return defineTool({
    name: "issueRefund",
    description: "对指定订单发起退款（敏感操作，可能需要人工审批）。amountCents 为退款金额（分）。",
    schema: z.object({
      orderId: z.string().min(1),
      amountCents: z.number().int().positive().describe("退款金额（分），不得超过订单实付"),
    }),
    execute: ({ orderId, amountCents }) => {
      ctx.onCall("issueRefund");
      const order = ctx.orders[orderId];
      if (!order) return { ok: false as const, note: `未找到订单 ${orderId}` };
      if (amountCents > order.amountCents) {
        return { ok: false as const, note: `退款金额 ${amountCents} 超过订单实付 ${order.amountCents}` };
      }
      return { ok: true as const, orderId, amountCents, note: "退款意图已生成，待审批" };
    },
  });
}

/** 组装本项目的工具注册表。 */
export function buildToolRegistry(ctx: ToolContext): ToolRegistry {
  return new ToolRegistry([makeLookupOrderTool(ctx), makeIssueRefundTool(ctx)]);
}
