/**
 * 进阶 LangGraph · 第 05 章「多 Agent 编排：supervisor 调度 / 并行异构 team」的可复用图与纯函数节点。
 *
 * WHY: 前四章把单张图讲透了。真实系统常把**多个专职 agent**编排进一张图，两种最常见拓扑：
 *   1) supervisor（中心化调度）：一个调度节点用条件边把每个任务分给对应的 worker，worker 干完回到
 *      supervisor，循环直到队列空——「一个大脑指挥多个专才」。
 *   2) parallel team（并行异构）：从一个 fork 点同时触发多个**不同角色**的 agent 并行干活，结果经
 *      append reducer 汇集，再由 join 聚合——「多个专才并行协作，最后合稿」。
 * 全部用【纯函数节点】当 agent（不调模型、用确定规则），离线确定、可单测、可回归。
 */
import { StateGraph, Annotation, START, END, type CompiledStateGraph } from "@langchain/langgraph";

// ── 图 1：supervisor 中心化调度循环 ──────────────────────────────────────────────

/** supervisor 调度流的状态。 */
export interface SupervisorState {
  /** replace：剩余任务队列；worker 每处理一条就返回去掉队首的新队列。 */
  pending: string[];
  /** append：各 worker 的输出，按处理顺序累积。 */
  results: string[];
  /** append：调度轨迹（supervise / 各 worker 名）。 */
  log: string[];
}

export type SupervisorGraph = CompiledStateGraph<SupervisorState, Partial<SupervisorState>, string>;

// 三个专职「agent」的纯函数核（worker 节点与下面的 computeTaskResult 都复用，保证零漂移）。
function mathResult(payload: string): string {
  const [a, b] = payload.split("+").map(Number);
  return `math=${(a ?? 0) + (b ?? 0)}`;
}
function upperResult(payload: string): string {
  return `upper=${payload.toUpperCase()}`;
}
function echoResult(payload: string): string {
  return `echo=${payload}`;
}

/** 把 "type:payload" 拆成 [type, payload]（payload 里允许再含冒号）。 */
function parseTask(task: string): { type: string; payload: string } {
  const idx = task.indexOf(":");
  if (idx < 0) return { type: "echo", payload: task };
  return { type: task.slice(0, idx), payload: task.slice(idx + 1) };
}

/**
 * 纯函数：一条任务应得的结果（供 demo/smoke 旋钮无关地核对 supervisor 输出）。
 * 与 worker 节点共用同一批 *Result 核，保证「期望」与「实际」永不漂移。
 */
export function computeTaskResult(task: string): string {
  const { type, payload } = parseTask(task);
  if (type === "math") return mathResult(payload);
  if (type === "upper") return upperResult(payload);
  return echoResult(payload);
}

/**
 * 构建 supervisor 调度图：START → supervisor →(条件边: 看队首任务类型)→ mathAgent/echoAgent/upperAgent
 * → 回 supervisor（循环）；队列空时 supervisor 路由到 END。
 * 终止由构造保证：每个 worker 都让 pending 长度 -1，单调递减必然清空。
 */
export function buildSupervisorGraph(): SupervisorGraph {
  const State = Annotation.Root({
    pending: Annotation<string[]>({ reducer: (_old, next) => next, default: () => [] }),
    results: Annotation<string[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
    log: Annotation<string[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
  });

  // supervisor 本身不改业务状态，只记一步轨迹；真正的「调度」在它后面的条件边里。
  const supervisor = () => ({ log: ["supervise"] });

  const makeWorker = (name: string) => (state: Pick<SupervisorState, "pending">) => {
    const task = state.pending[0]!;
    return { results: [computeTaskResult(task)], pending: state.pending.slice(1), log: [name] };
  };

  return new StateGraph(State)
    .addNode("supervisor", supervisor)
    .addNode("mathAgent", makeWorker("mathAgent"))
    .addNode("echoAgent", makeWorker("echoAgent"))
    .addNode("upperAgent", makeWorker("upperAgent"))
    .addEdge(START, "supervisor")
    // 条件边 = supervisor 的「调度大脑」：看队首任务类型，分给对应 worker；队列空就收工。
    .addConditionalEdges("supervisor", (state: Pick<SupervisorState, "pending">) => {
      if (state.pending.length === 0) return END;
      const { type } = parseTask(state.pending[0]!);
      if (type === "math") return "mathAgent";
      if (type === "upper") return "upperAgent";
      return "echoAgent";
    })
    .addEdge("mathAgent", "supervisor")
    .addEdge("echoAgent", "supervisor")
    .addEdge("upperAgent", "supervisor")
    .compile() as SupervisorGraph;
}

// ── 图 2：并行异构 team（fork → 多角色并行 → join 聚合）──────────────────────────

/** 并行 team 的状态。 */
export interface TeamState {
  /** replace：本次协作的主题。 */
  topic: string;
  /** append：各角色 agent 的产出，并行写入，顺序无关（靠 reducer 合并）。 */
  contributions: string[];
  /** replace：join 节点把各产出排序后聚合成的最终报告（确定）。 */
  report: string;
}

/** 本图固定的三个异构角色 agent。 */
export const TEAM_ROLES = ["research", "critique", "summary"] as const;

export type TeamGraph = CompiledStateGraph<TeamState, Partial<TeamState>, string>;

/**
 * 构建并行 team 图：START → fork →(并行)→ research/critique/summary →(汇入)→ join → END。
 * 三个角色在同一 super-step 并行执行，各自把 `${role}:${topic}` push 进 contributions(append reducer)；
 * join 把它们**排序后**聚合成 report。**关键**：contributions 的原始顺序不保证（与完成顺序有关），
 * 所以 join 先排序——这样 report 对任意调度顺序都确定（同第 02 章 Send 扇出的「顺序无关」教训）。
 */
export function buildTeamGraph(): TeamGraph {
  const State = Annotation.Root({
    topic: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
    contributions: Annotation<string[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
    report: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
  });

  const fork = () => ({});
  const research = (state: Pick<TeamState, "topic">) => ({ contributions: [`research:${state.topic}`] });
  const critique = (state: Pick<TeamState, "topic">) => ({ contributions: [`critique:${state.topic}`] });
  const summary = (state: Pick<TeamState, "topic">) => ({ contributions: [`summary:${state.topic}`] });
  // join 在 fan-in 处跑一次：把并行产出排序聚合 → 与各 agent 完成顺序无关。
  const join = (state: Pick<TeamState, "contributions">) => ({
    report: [...state.contributions].sort().join(" | "),
  });

  return new StateGraph(State)
    .addNode("fork", fork)
    .addNode("research", research)
    .addNode("critique", critique)
    .addNode("summary", summary)
    .addNode("join", join)
    .addEdge(START, "fork")
    // fork 一次连出三条边 → 三个角色在同一 super-step 并行执行。
    .addEdge("fork", "research")
    .addEdge("fork", "critique")
    .addEdge("fork", "summary")
    // 三条边汇入 join（fan-in：join 等三个角色都完成后跑一次）。
    .addEdge("research", "join")
    .addEdge("critique", "join")
    .addEdge("summary", "join")
    .addEdge("join", END)
    .compile() as TeamGraph;
}
