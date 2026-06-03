/**
 * Provider 无关的 LLM 抽象。这是整个课程的"地基契约"——所有 lesson 都通过这套类型
 * 与大模型交互，而不直接耦合 Anthropic / OpenAI 的 SDK 形状。
 *
 * WHY: 不同厂商的消息格式、工具调用格式、流式事件各不相同。把它们收敛到一套统一接口，
 * 换厂商只改 .env（见 ./index.ts 的 getLLM 工厂），课程代码一行不动。这正是真实项目里
 * "防厂商锁定"的标准做法。
 */

export type Role = "system" | "user" | "assistant" | "tool";

/** 模型发起的一次工具调用（已把厂商各异的格式归一）。 */
export interface ToolCall {
  /** 本次调用的唯一 id，回传工具结果时要用它对应。 */
  id: string;
  /** 工具名。 */
  name: string;
  /** 已解析为对象的调用参数（OpenAI 原始是 JSON 字符串，这里统一成对象）。 */
  arguments: Record<string, unknown>;
}

/** 统一的对话消息。 */
export interface Message {
  role: Role;
  content: string;
  /** 仅 assistant：模型本回合要调用的工具。 */
  toolCalls?: ToolCall[];
  /** 仅 tool：本条是哪次 ToolCall 的执行结果（对应 ToolCall.id）。 */
  toolCallId?: string;
  /** 可选工具名（tool 消息可携带，便于调试展示）。 */
  name?: string;
}

/** JSON Schema 对象（工具参数）。课程中用 zod 生成，见 ../agent/tool.ts。 */
export type JSONSchema = Record<string, unknown>;

/** 暴露给模型的工具描述（不含执行逻辑，那是 Tool 的事）。 */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: JSONSchema;
}

export interface ChatOptions {
  messages: Message[];
  /** 系统提示（也可在 messages 里放 system 角色，二者会合并）。 */
  system?: string;
  /** 本轮可用工具。 */
  tools?: ToolSpec[];
  temperature?: number;
  maxTokens?: number;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

/** 归一后的停止原因。 */
export type StopReason = "stop" | "tool_use" | "max_tokens" | "other";

export interface ChatResult {
  /** 模型输出的文本（可能为空，若本回合只调用工具）。 */
  text: string;
  /** 本回合的工具调用（无则空数组）。 */
  toolCalls: ToolCall[];
  stopReason: StopReason;
  usage: Usage;
  /** 厂商原始响应，便于调试/进阶使用。 */
  raw?: unknown;
}

/** 流式输出的一个增量块。 */
export interface StreamChunk {
  type: "text" | "done";
  /** type==="text" 时的文本增量。 */
  text?: string;
  /** type==="done" 时给出本次完整结果。 */
  result?: ChatResult;
}

/** 所有 provider 实现都满足的统一接口。 */
export interface LLMClient {
  readonly provider: string;
  readonly model: string;
  /** 一次性返回完整结果。 */
  chat(options: ChatOptions): Promise<ChatResult>;
  /** 流式返回：先逐块 text，最后一块 type==="done" 带完整 ChatResult。 */
  stream(options: ChatOptions): AsyncIterable<StreamChunk>;
}
