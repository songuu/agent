/**
 * 进阶 LangGraph 标准库统一出口（barrel）。
 * 各章用纯函数节点 + StateGraph 把 LangGraph 的核心机制离线讲透（无需 LLM、确定可回归）。
 */

// 第 01 章：手写 StateGraph —— State/channels+reducers / 纯函数节点 / 线性边
export {
  normalizeNode,
  tokenizeNode,
  countNode,
  buildTextPipeline,
} from "./textPipeline";
export type {
  PipelineState,
  BuildPipelineOptions,
  TextPipeline,
} from "./textPipeline";

// 第 02 章：条件边与路由 —— 分支 / 循环 / recursionLimit 安全阀 / Send 扇出(map-reduce)
export {
  buildHalvingGraph,
  buildRunawayGraph,
  buildFanoutGraph,
} from "./routingGraphs";
export type {
  LoopState,
  BuildHalvingOptions,
  FanoutState,
} from "./routingGraphs";

// 第 03 章：Checkpointer 持久化与时间旅行 —— MemorySaver + thread_id / 跨 invoke 累积 / getState / getStateHistory / updateState 时间旅行
export {
  buildCheckpointedLedger,
  threadConfig,
} from "./checkpointGraphs";
export type {
  LedgerState,
  BuildLedgerOptions,
  CheckpointedLedger,
} from "./checkpointGraphs";

// 第 04 章：Human-in-the-Loop —— interrupt 暂停 + Command(resume) 续跑 / 审批门 / interrupt payload 读取
export {
  buildApprovalGraph,
  readPendingInterrupt,
} from "./hitlGraphs";
export type {
  ApprovalState,
  BuildApprovalOptions,
  ApprovalGraph,
} from "./hitlGraphs";

// 第 05 章：多 Agent 编排 —— supervisor 中心化调度循环 / 并行异构 team(fork→多角色→join)
export {
  buildSupervisorGraph,
  buildTeamGraph,
  computeTaskResult,
  TEAM_ROLES,
} from "./multiAgentGraphs";
export type {
  SupervisorState,
  SupervisorGraph,
  TeamState,
  TeamGraph,
} from "./multiAgentGraphs";
