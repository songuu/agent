/**
 * 确定性「策略大脑」：意图路由 + 退款审批策略。
 *
 * WHY 用规则而非真 LLM：毕业项目要**离线可回归**，把不确定的模型决策替换成确定性规则，
 * 任何人 clone 下来都能跑出同样的轨迹。真实项目里，routeIntent() 换成一次「LLM 结构化输出」
 * （让模型在固定枚举里选 intent + 抽 orderId），approvalDecision() 换成你的风控规则——
 * **上层 copilot 编排一行不用改**，这正是「接口不变、实现可换」。
 */

/** 客服意图枚举。 */
export type Intent = "faq" | "order_status" | "refund" | "smalltalk";

/** 路由结果：意图 + 从话语里抽到的订单号（若有）。 */
export interface RouteResult {
  intent: Intent;
  orderId?: string;
}

/** 订单号形如 A 后跟数字。 */
const ORDER_RE = /\b([A-Za-z]\d{3,})\b/;

const REFUND_HINTS = ["退款", "退货", "退钱", "退掉", "退了", "不想要了"];
const STATUS_HINTS = ["到哪", "物流", "发货", "什么时候到", "快递", "运输", "查订单", "订单状态"];
/** 疑问标记：把「想办退款」(动作) 和「退款几天到账」(咨询) 区分开——含疑问词的退款归 FAQ。 */
const QUESTION_HINTS = ["几天", "多久", "怎么", "如何", "政策", "规则", "可以吗", "支持吗", "能不能"];

/**
 * 把用户话语路由到意图。规则优先级：退款动作 > 查单 > FAQ > 闲聊。
 * 关键区分：含退款词但又带疑问标记的，是「咨询退款政策」而非「发起退款」，归 FAQ。
 * 抽取订单号（用于多轮记忆）。纯函数、确定。
 */
export function routeIntent(utterance: string): RouteResult {
  const orderId = ORDER_RE.exec(utterance)?.[1]?.toUpperCase();
  const text = utterance.toLowerCase();
  const isQuestion = QUESTION_HINTS.some((h) => utterance.includes(h)) || /[?？]/.test(utterance);
  if (REFUND_HINTS.some((h) => utterance.includes(h)) && !isQuestion) return { intent: "refund", orderId };
  if (STATUS_HINTS.some((h) => utterance.includes(h)) || (orderId && /查|看|状态/.test(utterance))) {
    return { intent: "order_status", orderId };
  }
  if (/你好|谢谢|在吗|hi|hello/.test(text)) return { intent: "smalltalk", orderId };
  return { intent: "faq", orderId };
}

/** 退款审批策略的阈值与结果。 */
export interface ApprovalPolicy {
  /** 超过该金额（分）的退款必须人工审批。 */
  humanApprovalAboveCents: number;
}

export const DEFAULT_APPROVAL_POLICY: ApprovalPolicy = { humanApprovalAboveCents: 50000 };

export type ApprovalDecision =
  | { kind: "auto-approve"; reason: string }
  | { kind: "needs-human"; reason: string }
  | { kind: "reject"; reason: string };

/**
 * 决定一笔退款如何放行。确定性风控：
 *  - 不支持无理由退款的类目 → 直接拒绝（转人工走特殊流程）；
 *  - 金额超阈值 → 需人工审批（HITL）；
 *  - 否则 → 自动放行。
 */
export function approvalDecision(
  amountCents: number,
  noFreeReturn: boolean,
  policy: ApprovalPolicy = DEFAULT_APPROVAL_POLICY,
): ApprovalDecision {
  if (noFreeReturn) {
    return { kind: "reject", reason: "该类目（生鲜/定制）不支持无理由退款，需转人工特殊处理" };
  }
  if (amountCents > policy.humanApprovalAboveCents) {
    return { kind: "needs-human", reason: `退款金额 ¥${(amountCents / 100).toFixed(2)} 超过自动放行阈值，需人工审批` };
  }
  return { kind: "auto-approve", reason: "金额在自动放行阈值内，风控通过" };
}
