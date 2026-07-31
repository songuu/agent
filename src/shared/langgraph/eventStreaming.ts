/**
 * 进阶 LangGraph · 第 06 章「Event streaming 与前端投影」共享运行时。
 *
 * WHY: LangGraph 的 stream 是运行时协议，不是 UI 协议。`values` 可能包含完整状态，
 * `updates` 面向调试，只有显式的产品事件才应展示给用户。本模块用安全默认的纯函数
 * normalizer 把 raw frame 投影成 user / debug / audit，避免前端直接依赖框架 chunk。
 */
import {
  Annotation,
  END,
  START,
  StateGraph,
  type CompiledStateGraph,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";

export const EVENT_STREAM_MODES = ["updates", "values", "custom"] as const;

export type ProjectionStreamMode = (typeof EVENT_STREAM_MODES)[number];
export type EventAudience = "user" | "debug" | "audit";
export type ProjectedEventKind = "progress" | "state-update" | "state-snapshot" | "unknown";
export type EventStreamingStatus = "idle" | "prepared" | "completed";
export type RawStreamFrame = readonly [string, unknown];

export interface EventStreamingState {
  input: string;
  normalizedInput: string;
  result: string;
  steps: string[];
  status: EventStreamingStatus;
}

export interface ProgressEvent {
  type: "progress";
  stage: string;
  message: string;
}

export interface ProjectedStreamEvent {
  sequence: number;
  mode: string;
  audience: EventAudience;
  kind: ProjectedEventKind;
  node?: string;
  payload: unknown;
}

export interface StreamProjection {
  events: ProjectedStreamEvent[];
  user: ProjectedStreamEvent[];
  debug: ProjectedStreamEvent[];
  audit: ProjectedStreamEvent[];
  /** 最后一份 values 快照；运行时边界先保留 unknown，由业务层决定 schema。 */
  finalState: unknown;
}

export interface CollectedEventStream {
  frames: RawStreamFrame[];
  projection: StreamProjection;
  finalState: EventStreamingState;
}

export type EventStreamingGraph = CompiledStateGraph<
  EventStreamingState,
  Partial<EventStreamingState>,
  string
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProgressEvent(value: unknown): ProgressEvent | undefined {
  if (
    !isRecord(value) ||
    value.type !== "progress" ||
    typeof value.stage !== "string" ||
    value.stage.trim().length === 0 ||
    typeof value.message !== "string" ||
    value.message.trim().length === 0
  ) {
    return undefined;
  }

  // WHY: custom payload comes from an execution boundary. Rebuild the public
  // event from an allowlist so future internal fields cannot leak into the UI.
  return {
    type: "progress",
    stage: value.stage,
    message: value.message,
  };
}

function unknownEvent(frame: unknown, sequence: number, mode = "unknown", payload: unknown = frame): ProjectedStreamEvent {
  return {
    sequence,
    mode,
    audience: "audit",
    kind: "unknown",
    payload,
  };
}

/**
 * 把一个 multi-mode frame 归一化为稳定事件。
 * 未知 mode 与畸形 payload 都默认进入 audit，永不意外升级为用户可见事件。
 */
export function normalizeStreamFrame(frame: unknown, sequence = 0): ProjectedStreamEvent {
  if (!Array.isArray(frame) || frame.length !== 2 || typeof frame[0] !== "string") {
    return unknownEvent(frame, sequence);
  }

  const [mode, payload] = frame;
  if (mode === "custom") {
    const progress = parseProgressEvent(payload);
    if (!progress) return unknownEvent(frame, sequence, mode, payload);
    return {
      sequence,
      mode,
      audience: "user",
      kind: "progress",
      node: progress.stage,
      payload: progress,
    };
  }

  if (mode === "updates") {
    const keys = isRecord(payload) ? Object.keys(payload) : [];
    if (keys.length !== 1) return unknownEvent(frame, sequence, mode, payload);
    return {
      sequence,
      mode,
      audience: "debug",
      kind: "state-update",
      node: keys.length === 1 ? keys[0] : undefined,
      payload,
    };
  }

  if (mode === "values") {
    if (!isRecord(payload)) return unknownEvent(frame, sequence, mode, payload);
    return {
      sequence,
      mode,
      audience: "audit",
      kind: "state-snapshot",
      payload,
    };
  }

  return unknownEvent(frame, sequence, mode, payload);
}

/** 保留全局 sequence，同时按 audience 分桶；每个桶内顺序与 raw frames 一致。 */
export function projectStreamFrames(frames: readonly unknown[]): StreamProjection {
  const events = frames.map((frame, sequence) => normalizeStreamFrame(frame, sequence));
  let finalState: unknown;
  for (const event of events) {
    if (event.mode === "values" && event.kind === "state-snapshot") finalState = event.payload;
  }
  return {
    events,
    user: events.filter((event) => event.audience === "user"),
    debug: events.filter((event) => event.audience === "debug"),
    audit: events.filter((event) => event.audience === "audit"),
    finalState,
  };
}

function prepareNode(
  state: Pick<EventStreamingState, "input">,
  config: LangGraphRunnableConfig,
): Partial<EventStreamingState> {
  const normalizedInput = state.input.trim().replace(/\s+/g, " ");
  config.writer?.({ type: "progress", stage: "prepare", message: "输入已归一化" } satisfies ProgressEvent);
  return { normalizedInput, steps: ["prepare"], status: "prepared" };
}

function finalizeNode(
  state: Pick<EventStreamingState, "normalizedInput">,
  config: LangGraphRunnableConfig,
): Partial<EventStreamingState> {
  const result = state.normalizedInput.length > 0 ? state.normalizedInput.toUpperCase() : "(empty)";
  config.writer?.({ type: "progress", stage: "finalize", message: "结果已生成" } satisfies ProgressEvent);
  return { result, steps: ["finalize"], status: "completed" };
}

/** 构建 START → prepare → finalize → END 的纯函数顺序图。 */
export function buildEventStreamingGraph(): EventStreamingGraph {
  const State = Annotation.Root({
    input: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
    normalizedInput: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
    result: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
    steps: Annotation<string[]>({ reducer: (old, next) => old.concat(next), default: () => [] }),
    status: Annotation<EventStreamingStatus>({ reducer: (_old, next) => next, default: () => "idle" }),
  });

  return new StateGraph(State)
    .addNode("prepare", prepareNode)
    .addNode("finalize", finalizeNode)
    .addEdge(START, "prepare")
    .addEdge("prepare", "finalize")
    .addEdge("finalize", END)
    .compile() as EventStreamingGraph;
}

function toRawFrame(chunk: unknown): RawStreamFrame {
  if (Array.isArray(chunk) && chunk.length === 2 && typeof chunk[0] === "string") {
    return [chunk[0], chunk[1]];
  }
  return ["unknown", chunk];
}

/** 运行真实 0.2.74 multi-mode stream，并返回 raw、投影与 invoke 终态供一致性核对。 */
export async function collectEventStream(input: string): Promise<CollectedEventStream> {
  const graph = buildEventStreamingGraph();
  const frames: RawStreamFrame[] = [];
  const stream = await graph.stream(
    { input },
    { streamMode: [...EVENT_STREAM_MODES] },
  );
  for await (const chunk of stream) frames.push(toRawFrame(chunk));

  const finalState = (await graph.invoke({ input })) as EventStreamingState;
  return { frames, projection: projectStreamFrames(frames), finalState };
}
