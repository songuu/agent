/**
 * 进阶 LangGraph · 第 04 章「Human-in-the-Loop：interrupt 暂停 + Command 续跑」的可复用图与纯函数节点。
 *
 * WHY: 第 03 章给图加了 checkpointer（能记住状态、能从中途重放）。本章在它之上加一件事——
 * 让图能**在节点中途停下来等人**：`interrupt(payload)` 把 payload 交给人、暂停整张图；
 * 人给出决定后用 `invoke(new Command({ resume }), cfg)` 续跑，`interrupt()` 就地返回那个决定。
 * 这就是「审批门 / 人工纠偏 / 危险操作前确认」的底座。
 *
 * **全部用纯函数节点离线演示**：把「人」抽象成 demo/smoke 里确定地传入的 resume 值，
 * 于是 approve / reject 两条路径完全确定、可单测、可回归——无需任何 LLM 或真人。
 *
 * 关键依赖：interrupt 必须配 checkpointer（暂停点要持久化）。本模块编译时即挂 MemorySaver。
 */
import {
  StateGraph,
  Annotation,
  START,
  END,
  MemorySaver,
  interrupt,
  type CompiledStateGraph,
} from "@langchain/langgraph";

/** 审批流状态的结构视图（运行时由 Annotation channels 承载）。 */
export interface ApprovalState {
  /** replace：待审批的数额（propose 节点准备，交给人看）。 */
  amount: number;
  /** replace：人给出的决定（resume 值，如 "approve" / "reject"）。 */
  decision: string;
  /** replace：终态——pending（暂停中）/ applied:<amount>（已放行）/ rejected（已拦截）。 */
  status: string;
  /** append：执行轨迹。 */
  log: string[];
}

export interface BuildApprovalOptions {
  /** 视为「批准」的关键字；其余一律按拒绝处理。默认 "approve"。 */
  approveWord?: string;
}

/** 已编译、挂了 MemorySaver 的审批图类型（暴露 invoke/getState/...；resume 用 Command 传给 invoke）。 */
export type ApprovalGraph = CompiledStateGraph<ApprovalState, Partial<ApprovalState>, string>;

/**
 * 构建并编译一张「人工审批门」图：START → propose → humanReview(interrupt 暂停) →(条件边: 人的决定)→ apply / cancel → END。
 *
 * - `humanReview` 节点调用 `interrupt({ kind, amount })`：把待批数额交给人，**就地暂停整张图**。
 * - 人用 `invoke(new Command({ resume }), cfg)` 续跑，`interrupt()` 返回 resume 值写入 decision。
 * - 条件边按 decision 是否等于 approveWord 路由到 apply（放行）或 cancel（拦截）。
 * 终态完全由「人给的 resume 值」决定，节点本身是纯函数 ⇒ 两条路径确定可回归。
 */
export function buildApprovalGraph(options: BuildApprovalOptions = {}): ApprovalGraph {
  const approveWord = options.approveWord ?? "approve";

  const State = Annotation.Root({
    amount: Annotation<number>({ reducer: (_old, next) => next, default: () => 0 }),
    decision: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
    status: Annotation<string>({ reducer: (_old, next) => next, default: () => "pending" }),
    log: Annotation<string[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
  });

  const propose = (state: Pick<ApprovalState, "amount">) => ({ log: [`propose:${state.amount}`] });

  const humanReview = (state: Pick<ApprovalState, "amount">) => {
    // 在节点中途暂停，把待批数额交给人；resume 时 interrupt() 就地返回人给的决定。
    const decision = interrupt({ kind: "approval", amount: state.amount });
    return { decision: String(decision), log: [`review:${decision}`] };
  };

  const apply = (state: Pick<ApprovalState, "amount">) => ({ status: `applied:${state.amount}`, log: ["apply"] });
  const cancel = () => ({ status: "rejected", log: ["cancel"] });

  return new StateGraph(State)
    .addNode("propose", propose)
    .addNode("humanReview", humanReview)
    .addNode("apply", apply)
    .addNode("cancel", cancel)
    .addEdge(START, "propose")
    .addEdge("propose", "humanReview")
    // 条件边按「人的决定」路由：等于 approveWord 才放行，否则拦截。
    .addConditionalEdges("humanReview", (state: Pick<ApprovalState, "decision">) =>
      state.decision === approveWord ? "apply" : "cancel",
    )
    .addEdge("apply", END)
    .addEdge("cancel", END)
    .compile({ checkpointer: new MemorySaver() }) as ApprovalGraph;
}

/**
 * 读取某 thread 当前暂停的 interrupt payload（没有暂停则返回 undefined）。
 *
 * WHY: interrupt 的 payload **不在 invoke 的返回值顶层**（`result.__interrupt__` 为 undefined），
 * 而要从 `getState(cfg).tasks[].interrupts[].value` 取——这是 0.2.x 的暴露位置（已 spike 实证）。
 * 封装成一个函数，调用方就不用记这条深路径。
 */
export async function readPendingInterrupt(
  graph: ApprovalGraph,
  cfg: { configurable: { thread_id: string } },
): Promise<unknown> {
  const snap = await graph.getState(cfg);
  const tasks = (snap.tasks ?? []) as ReadonlyArray<{ interrupts?: ReadonlyArray<{ value?: unknown }> }>;
  for (const task of tasks) {
    if (task.interrupts && task.interrupts.length > 0) {
      return task.interrupts[0]!.value;
    }
  }
  return undefined;
}
