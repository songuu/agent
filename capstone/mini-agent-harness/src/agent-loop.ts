import {
  type AgentAction,
  type AgentEvent,
  type AgentPlanner,
  type AgentRunResult,
  type AgentState,
  type CheckpointGateway,
  type CheckpointRef,
  type ContextGateway,
  type McpToolGateway,
  type PlannerObservation,
  type SandboxGateway,
} from "./types";

export interface AgentLoopOptions {
  planner: AgentPlanner;
  mcp: McpToolGateway;
  sandbox: SandboxGateway;
  checkpoints: CheckpointGateway;
  workspacePath: string;
  maxActions?: number;
  maxCorrections?: number;
  context?: ContextGateway;
  onEvent?: (event: AgentEvent) => void;
}

const ALLOWED_TRANSITIONS: Readonly<Record<AgentState, readonly AgentState[]>> = {
  IDLE: ["THINKING", "ERROR"],
  THINKING: ["TOOL_CALLING", "WAITING_FOR_SANDBOX", "COMPLETE", "ERROR"],
  TOOL_CALLING: ["EVALUATING", "ERROR"],
  WAITING_FOR_SANDBOX: ["EVALUATING", "ERROR"],
  EVALUATING: ["THINKING", "COMPLETE", "ERROR"],
  COMPLETE: [],
  ERROR: [],
};

/**
 * 负责状态机、工具回调和可恢复执行；模型决策留在 AgentPlanner，隔离执行留在
 * SandboxGateway，避免把安全策略混进控制流。
 */
export class AgentLoop {
  private state: AgentState = "IDLE";
  private lastRollbackCheckpoint: CheckpointRef | undefined;

  public constructor(private readonly options: AgentLoopOptions) {}

  public async run(task: string): Promise<AgentRunResult> {
    const events: AgentEvent[] = [];
    const emit = (event: AgentEvent): void => {
      events.push(event);
      this.options.onEvent?.(event);
    };

    const maxActions = this.options.maxActions ?? 12;
    const maxCorrections = this.options.maxCorrections ?? 2;
    const observations: PlannerObservation[] = [];
    let correctionCount = 0;
    let actionCount = 0;
    let tools: Awaited<ReturnType<McpToolGateway["discoverTools"]>> = [];

    try {
      this.transition("THINKING", emit);
      this.options.context?.add({ role: "user", content: task });
      tools = await this.options.mcp.discoverTools();
      emit({ type: "tools_discovered", tools: [...tools] });

      while (actionCount < maxActions) {
        this.ensureState("THINKING");
        const context = await this.options.context?.prepare();
        if (context) emit({ type: "context", preparation: context });
        const action = await this.options.planner.next({
          task,
          tools,
          observations: [...observations],
          context,
          correctionCount,
          actionCount,
        });
        actionCount += 1;
        emit({ type: "action", action });

        if (action.kind === "complete") {
          this.transition("COMPLETE", emit);
          return {
            ok: true,
            finalState: this.state,
            summary: action.summary,
            events,
            tools: [...tools],
            rollbackCheckpoint: this.lastRollbackCheckpoint,
          };
        }

        if (action.kind === "tool") {
          await this.executeTool(action, tools, observations, emit);
          this.transition("THINKING", emit);
          continue;
        }

        const sandboxOk = await this.executeSandbox(action, observations, emit);
        if (!sandboxOk) {
          correctionCount += 1;
          if (correctionCount > maxCorrections) {
            throw new Error(`SANDBOX_CORRECTION_EXHAUSTED: reached ${maxCorrections} correction attempts`);
          }
          emit({
            type: "correction",
            attempt: correctionCount,
            reason: observations.at(-1)?.summary ?? "sandbox execution failed",
          });
        }
        this.transition("THINKING", emit);
      }

      throw new Error(`AGENT_ACTION_LIMIT: reached ${maxActions} actions without completion`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.state !== "ERROR" && this.state !== "COMPLETE") {
        this.transition("ERROR", emit);
      }
      emit({ type: "error", message });
      return {
        ok: false,
        finalState: this.state,
        summary: "Agent run failed",
        events,
        tools: [...tools],
        rollbackCheckpoint: this.lastRollbackCheckpoint,
        error: message,
      };
    } finally {
      await this.options.mcp.close?.();
    }
  }

  /** 回退到上一个会修改工作区的动作之前；只由受控 checkpoint 后端执行。 */
  public async rollbackLastStep(onEvent?: (event: AgentEvent) => void): Promise<CheckpointRef> {
    const checkpoint = this.lastRollbackCheckpoint;
    if (!checkpoint) {
      throw new Error("NO_ROLLBACK_CHECKPOINT: no sandbox action has created a rollback point");
    }
    await this.options.checkpoints.rollback(checkpoint);
    onEvent?.({ type: "rollback", checkpoint });
    return checkpoint;
  }

  private async executeTool(
    action: Extract<AgentAction, { kind: "tool" }>,
    tools: readonly { name: string }[],
    observations: PlannerObservation[],
    emit: (event: AgentEvent) => void,
  ): Promise<void> {
    this.transition("TOOL_CALLING", emit);
    if (!tools.some((tool) => tool.name === action.name)) {
      const summary = `unknown MCP tool: ${action.name}`;
      observations.push({ kind: "tool", ok: false, summary });
      emit({ type: "tool_result", name: action.name, result: { isError: true, text: summary } });
      this.transition("EVALUATING", emit);
      return;
    }

    const before = await this.options.checkpoints.create(`before-tool-${action.name}`);
    emit({ type: "checkpoint", phase: "before", checkpoint: before });
    const result = await this.options.mcp.callTool(action.name, action.args);
    emit({ type: "tool_result", name: action.name, result });
    const after = await this.options.checkpoints.create(`after-tool-${action.name}`);
    emit({ type: "checkpoint", phase: "after", checkpoint: after });
    observations.push({
      kind: "tool",
      ok: !result.isError,
      summary: result.isError ? `MCP ${action.name} failed: ${result.text}` : `MCP ${action.name}: ${result.text}`,
    });
    this.options.context?.add({
      role: "tool",
      content: observations.at(-1)?.summary ?? `MCP ${action.name} completed`,
    });
    this.transition("EVALUATING", emit);
  }

  private async executeSandbox(
    action: Extract<AgentAction, { kind: "sandbox" }>,
    observations: PlannerObservation[],
    emit: (event: AgentEvent) => void,
  ): Promise<boolean> {
    this.transition("WAITING_FOR_SANDBOX", emit);
    const before = await this.options.checkpoints.create(`before-sandbox-${action.request.runtime}`);
    this.lastRollbackCheckpoint = before;
    emit({ type: "checkpoint", phase: "before", checkpoint: before });

    const result = await this.options.sandbox.run(action.request, this.options.workspacePath);
    emit({ type: "sandbox_result", result });

    const after = await this.options.checkpoints.create(`after-sandbox-${action.request.runtime}`);
    emit({ type: "checkpoint", phase: "after", checkpoint: after });
    observations.push({
      kind: "sandbox",
      ok: result.ok,
      summary: result.ok
        ? `sandbox succeeded: ${truncate(result.stdout || "no stdout")}`
        : `sandbox failed: ${truncate((result.error ?? result.stderr) || "unknown error")}`,
    });
    this.options.context?.add({
      role: "tool",
      content: observations.at(-1)?.summary ?? "sandbox completed",
    });
    this.transition("EVALUATING", emit);
    return result.ok;
  }

  private transition(next: AgentState, emit: (event: AgentEvent) => void): void {
    if (!ALLOWED_TRANSITIONS[this.state].includes(next)) {
      throw new Error(`INVALID_STATE_TRANSITION: ${this.state} -> ${next}`);
    }
    this.state = next;
    emit({ type: "state", state: next, at: new Date().toISOString() });
  }

  private ensureState(expected: AgentState): void {
    if (this.state !== expected) {
      throw new Error(`INVALID_AGENT_STATE: expected ${expected}, got ${this.state}`);
    }
  }
}

function truncate(value: string, maxLength = 360): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}…`;
}
