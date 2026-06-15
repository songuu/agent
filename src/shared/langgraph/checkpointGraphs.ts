/**
 * 进阶 LangGraph · 第 03 章「Checkpointer 持久化与时间旅行」的可复用图与纯函数节点。
 *
 * WHY: 第 01/02 章的图每次 invoke 都从零开始——跑完即忘。真实 Agent 要「记住上次聊到哪」、
 * 「中断后能续上」、甚至「回到过去某一步重来」。LangGraph 用 **checkpointer**（这里用内存版
 * `MemorySaver`）把每个 super-step 的状态按 `thread_id` 持久化，于是：
 *   1) 持久化累积：同一 thread 多次 invoke，状态经 reducer 自动续上（无需手动回传历史）。
 *   2) 线程隔离：不同 thread_id 各自独立，互不影响。
 *   3) 状态快照 / 时间线：getState 取当前快照，getStateHistory 倒序遍历整条执行时间线。
 *   4) 时间旅行：updateState 人工改写某个 channel；invoke(null, 历史 checkpoint 的 config) 从过去某点重放。
 * **全部用纯函数节点离线演示**：节点不调模型，所以重放、累积、快照全部确定可回归。
 */
import {
  StateGraph,
  Annotation,
  START,
  END,
  MemorySaver,
  type CompiledStateGraph,
} from "@langchain/langgraph";

/** 账本状态的结构视图（运行时由 Annotation channels 承载）。 */
export interface LedgerState {
  /**
   * sum reducer：节点只声明「这一步加多少」(增量)，reducer 负责累加。
   * 正因为是累加 channel，跨 invoke 在同一 thread 上会**自动续上**——这就是持久化累积的关键。
   */
  total: number;
  /** append reducer：每一步的执行轨迹，跨 invoke 持续累积。 */
  trail: string[];
  /** replace reducer：节点不碰它，仅供 updateState 人工改写演示「精确覆盖单个 channel」。 */
  label: string;
}

export interface BuildLedgerOptions {
  /** 每个节点给 total 加的增量。默认 1。一次 invoke 走 debit→credit 两个节点，故净增 2×step。 */
  step?: number;
}

/** 已编译、且挂了 MemorySaver checkpointer 的账本图类型（对外暴露 invoke/getState/getStateHistory/updateState）。 */
export type CheckpointedLedger = CompiledStateGraph<LedgerState, Partial<LedgerState>, string>;

/**
 * 构建并编译一张挂了 `MemorySaver` 的线性账本图：START → debit → credit → END。
 *
 * 关键点：
 *  - `compile({ checkpointer })` 之后，每次 invoke 都必须带 `{ configurable: { thread_id } }`，
 *    checkpointer 会按 thread 持久化每个 super-step 的状态。
 *  - total 用 **sum reducer**：节点返回 `{ total: step }` 表示「加 step」，跨 invoke 自动累加。
 *  - 同一个编译好的图实例可被反复 invoke——这正是演示「状态在多次调用间存活」的载体。
 */
export function buildCheckpointedLedger(options: BuildLedgerOptions = {}): CheckpointedLedger {
  const step = options.step ?? 1;

  const State = Annotation.Root({
    total: Annotation<number>({ reducer: (old, next) => old + next, default: () => 0 }),
    trail: Annotation<string[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
    label: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
  });

  // 两个纯函数节点：各自只声明「给 total 加 step」+ 记一步 trail（partial 更新，不碰 label）。
  const debit = () => ({ total: step, trail: [`debit+${step}`] });
  const credit = () => ({ total: step, trail: [`credit+${step}`] });

  return new StateGraph(State)
    .addNode("debit", debit)
    .addNode("credit", credit)
    .addEdge(START, "debit")
    .addEdge("debit", "credit")
    .addEdge("credit", END)
    .compile({ checkpointer: new MemorySaver() }) as CheckpointedLedger;
}

/**
 * 构造一次 invoke 用的 thread 配置。checkpointer 靠 thread_id 区分会话——
 * 同 id 续上同一条状态时间线，不同 id 完全隔离。
 */
export function threadConfig(threadId: string): { configurable: { thread_id: string } } {
  return { configurable: { thread_id: threadId } };
}
