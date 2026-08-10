/**
 * Mini Agent Harness 的稳定边界。
 *
 * WHY：编排器不应知道 MCP、Docker 或 checkpoint 的具体实现；这些小接口让
 * 本地 demo、远程 MCP 和真实 LLM adapter 可以独立替换、独立测试。
 */

export type AgentState =
  | "IDLE"
  | "THINKING"
  | "TOOL_CALLING"
  | "WAITING_FOR_SANDBOX"
  | "EVALUATING"
  | "COMPLETE"
  | "ERROR";

export type SandboxRuntime = "node" | "python" | "bash";

export interface SandboxRequest {
  runtime: SandboxRuntime;
  code: string;
  timeoutMs?: number;
  /** 仅供运行日志展示，不把完整 prompt 或 secret 写入日志。 */
  label?: string;
}

export interface SandboxResult {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  isolation: "docker" | "development-node" | "fake";
  error?: string;
}

export interface ToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface ToolResult {
  isError: boolean;
  text: string;
  structured?: unknown;
}

export interface McpToolGateway {
  discoverTools(): Promise<ToolDescriptor[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
  close?(): Promise<void>;
}

export interface CheckpointRef {
  id: string;
  label: string;
  createdAt: string;
  strategy: "git" | "file" | "fake";
}

export interface CheckpointGateway {
  create(label: string): Promise<CheckpointRef>;
  rollback(checkpoint: CheckpointRef): Promise<void>;
  dispose?(): Promise<void>;
}

export interface SandboxGateway {
  run(request: SandboxRequest, workspacePath: string): Promise<SandboxResult>;
}

export interface PlannerObservation {
  kind: "tool" | "sandbox" | "system";
  ok: boolean;
  summary: string;
}

export interface ContextMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface ContextPreparation {
  messages: readonly ContextMessage[];
  totalTokens: number;
  stablePrefixTokens: number;
  inputBudgetTokens: number;
  strategy: "full" | "summary" | "sliding-window";
  droppedMessages: number;
  summaryUsed: boolean;
  summaryError?: string;
}

export interface ContextGateway {
  add(message: ContextMessage): void;
  prepare(): Promise<ContextPreparation>;
}

export interface PlannerInput {
  task: string;
  tools: readonly ToolDescriptor[];
  observations: readonly PlannerObservation[];
  context?: ContextPreparation;
  correctionCount: number;
  actionCount: number;
}

export type AgentAction =
  | {
      kind: "tool";
      name: string;
      args: Record<string, unknown>;
      summary: string;
    }
  | {
      kind: "sandbox";
      request: SandboxRequest;
      summary: string;
    }
  | {
      kind: "complete";
      summary: string;
    };

/**
 * LLM provider 的最小 adapter。生产接入只需实现这个接口，AgentLoop 本身不依赖
 * 某个模型供应商，也不会记录模型的隐藏推理。
 */
export interface AgentPlanner {
  next(input: PlannerInput): Promise<AgentAction>;
}

export type AgentEvent =
  | { type: "state"; state: AgentState; at: string }
  | { type: "tools_discovered"; tools: ToolDescriptor[] }
  | { type: "context"; preparation: ContextPreparation }
  | { type: "action"; action: AgentAction }
  | { type: "tool_result"; name: string; result: ToolResult }
  | { type: "sandbox_result"; result: SandboxResult }
  | { type: "checkpoint"; phase: "before" | "after"; checkpoint: CheckpointRef }
  | { type: "correction"; attempt: number; reason: string }
  | { type: "rollback"; checkpoint: CheckpointRef }
  | { type: "error"; message: string };

export interface AgentRunResult {
  ok: boolean;
  finalState: AgentState;
  summary: string;
  events: AgentEvent[];
  tools: ToolDescriptor[];
  rollbackCheckpoint?: CheckpointRef;
  error?: string;
}
