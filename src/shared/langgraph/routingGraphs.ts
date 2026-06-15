/**
 * 进阶 LangGraph · 第 02 章「条件边与路由」的可复用图与纯函数节点。
 *
 * WHY: 第 01 章是【线性】图（每个节点的下一个固定）。真正让状态机图强大的是
 * `addConditionalEdges`——在运行时根据 State 决定下一个走哪个节点。它支撑三种模式：
 *   1) 分支（branch）：按 State 路由到不同 handler 节点。
 *   2) 循环（loop）：条件边指回更早的节点，直到满足终止条件——这正是 ReAct「反复行动直到完成」的骨架。
 *   3) 扇出（Send / map-reduce）：动态把一批项分发给同一节点的多个并行实例，再 reduce 合并。
 * 全部用【纯函数节点】演示，离线确定、可单测。还演示 `recursionLimit` 安全阀（循环不收敛时的断路器）。
 */
import { StateGraph, Annotation, START, END, Send } from "@langchain/langgraph";

// ── 图 1：条件分支 + 循环（不断减半直到 ≤ 阈值，再按奇偶分支）─────────────────────

export interface LoopState {
  value: number;
  /** append：每一步的执行轨迹。 */
  log: string[];
  /** replace：最终走了哪个分支（even / odd）。 */
  route: string;
}

export interface BuildHalvingOptions {
  /** 减半到 ≤ 该阈值就停止循环，转入奇偶分支。默认 5。 */
  threshold?: number;
}

/**
 * 构建「减半循环 + 奇偶分支」图：START → halve →(条件边)→ {还大就回 halve(循环) / 否则按奇偶去 report*}。
 * 终止由构造保证：value 每步严格减半（向下取整），单调递减，必在有限步内 ≤ 阈值。
 */
export function buildHalvingGraph(options: BuildHalvingOptions = {}) {
  const threshold = options.threshold ?? 5;

  const State = Annotation.Root({
    value: Annotation<number>({ reducer: (_old, next) => next, default: () => 0 }),
    log: Annotation<string[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
    route: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
  });

  const halve = (state: Pick<LoopState, "value">) => {
    const value = Math.floor(state.value / 2);
    return { value, log: [`halve->${value}`] };
  };

  return new StateGraph(State)
    .addNode("halve", halve)
    .addNode("reportEven", () => ({ route: "even", log: ["reportEven"] }))
    .addNode("reportOdd", () => ({ route: "odd", log: ["reportOdd"] }))
    .addEdge(START, "halve")
    // 条件边：一个 router 函数读 State，返回下一个节点名——这就是「图在运行时自己决定走向」。
    .addConditionalEdges("halve", (state: Pick<LoopState, "value">) => {
      if (state.value > threshold) return "halve"; // 循环：指回自己
      return state.value % 2 === 0 ? "reportEven" : "reportOdd"; // 分支：按奇偶
    })
    .addEdge("reportEven", END)
    .addEdge("reportOdd", END)
    .compile();
}

// ── 图 2：recursionLimit 安全阀（循环不收敛时的断路器）──────────────────────────

/**
 * 构建一个【永不终止】的循环图（节点恒指回自己），用于演示 LangGraph 的 `recursionLimit`：
 * 跑到上限仍没到 END 就抛 GraphRecursionError——这是图版的「maxSteps 安全阀」，防止无限循环烧资源。
 */
export function buildRunawayGraph() {
  const State = Annotation.Root({
    ticks: Annotation<number>({ reducer: (old, next) => old + next, default: () => 0 }),
  });
  return new StateGraph(State)
    .addNode("tick", () => ({ ticks: 1 }))
    .addEdge(START, "tick")
    .addConditionalEdges("tick", () => "tick") // 恒循环，永远到不了 END
    .compile();
}

// ── 图 3：Send 扇出（map-reduce）──────────────────────────────────────────────

export interface FanoutState {
  items: number[];
  /** append：各 worker 各自 push 自己的结果，reducer 合并（与完成顺序无关）。 */
  results: number[];
  /** replace：reduce 节点算出的汇总。 */
  total: number;
}

/**
 * 构建 map-reduce 图：START →(Send 扇出)→ worker×N（每个 worker 处理一项）→ reduce（汇总）→ END。
 * `Send("worker", { item })` 为每一项动态生成一个 worker 实例并行跑；结果经 append reducer 合并，
 * 再由 reduce 节点求和。汇总值与 worker 完成顺序无关（reducer 合并的好处）。
 */
export function buildFanoutGraph() {
  const State = Annotation.Root({
    items: Annotation<number[]>({ reducer: (_old, next) => next, default: () => [] }),
    results: Annotation<number[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
    total: Annotation<number>({ reducer: (_old, next) => next, default: () => 0 }),
  });

  // worker 经 Send 调用，输入是 Send 的第二参数 { item }；它把「item×2」push 进 results。
  const worker = (payload: { item: number }) => ({ results: [payload.item * 2] });
  const reduce = (state: Pick<FanoutState, "results">) => ({
    total: state.results.reduce((sum, value) => sum + value, 0),
  });

  return new StateGraph(State)
    .addNode("worker", worker)
    .addNode("reduce", reduce)
    // 条件边从 START 返回一组 Send：每项一个 worker 实例（动态扇出）。
    .addConditionalEdges(START, (state: Pick<FanoutState, "items">) =>
      state.items.map((item) => new Send("worker", { item })),
    )
    .addEdge("worker", "reduce") // 多个 worker 汇入同一个 reduce（fan-in：reduce 等所有 worker 完成后跑一次）
    .addEdge("reduce", END)
    .compile();
}
