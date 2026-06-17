/**
 * Anthropic (Claude) 的 LLMClient 实现。
 *
 * 关键转换点：
 *  - Claude 没有独立的 "tool" 角色——工具结果作为 user 消息里的 tool_result 内容块回传，
 *    且同一回合的多个工具结果要合并进同一条 user 消息。
 *  - assistant 调用工具时，content 是 [text?, tool_use...] 内容块数组。
 *  - system 提示是独立参数，不混在 messages 里。
 */
import Anthropic from "@anthropic-ai/sdk";
import { requireEnv, getEnv } from "../util/env";
import { emitDemoRunnerThinking } from "../util/demoRunnerProtocol";
import type {
  ChatOptions,
  ChatResult,
  LLMClient,
  Message,
  StopReason,
  StreamChunk,
  ToolCall,
} from "./types";

const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_MAX_TOKENS = 4096;

export interface AnthropicClientOptions {
  readonly model?: string;
}

/** 把统一 Message[] 拆成 Claude 需要的 system 字符串 + messages 数组。 */
function splitSystem(options: ChatOptions): {
  system: string | undefined;
  messages: Message[];
} {
  const systemParts = [
    options.system,
    ...options.messages.filter((m) => m.role === "system").map((m) => m.content),
  ].filter((s): s is string => Boolean(s));
  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages: options.messages.filter((m) => m.role !== "system"),
  };
}

/** 统一 Message[] → Claude MessageParam[]（处理 tool_use / tool_result 合并）。 */
function toAnthropicMessages(messages: Message[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  let i = 0;
  while (i < messages.length) {
    const m = messages[i]!;
    if (m.role === "assistant") {
      const blocks: Anthropic.ContentBlockParam[] = [];
      if (m.content) blocks.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls ?? []) {
        blocks.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.arguments });
      }
      out.push({ role: "assistant", content: blocks.length ? blocks : m.content });
      i++;
    } else if (m.role === "tool") {
      // 合并连续的 tool 结果到同一条 user 消息（Claude 的要求）
      const results: Anthropic.ToolResultBlockParam[] = [];
      while (i < messages.length && messages[i]!.role === "tool") {
        const t = messages[i]!;
        results.push({
          type: "tool_result",
          tool_use_id: t.toolCallId ?? "",
          content: t.content,
        });
        i++;
      }
      out.push({ role: "user", content: results });
    } else {
      out.push({ role: "user", content: m.content });
      i++;
    }
  }
  return out;
}

function mapStopReason(reason: string | null): StopReason {
  switch (reason) {
    case "tool_use":
      return "tool_use";
    case "max_tokens":
      return "max_tokens";
    case "end_turn":
    case "stop_sequence":
      return "stop";
    default:
      return "other";
  }
}

/** 把 Claude 的 Message 响应解析成统一 ChatResult。 */
function parseMessage(msg: Anthropic.Message): ChatResult {
  let text = "";
  const toolCalls: ToolCall[] = [];
  for (const block of msg.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: (block.input ?? {}) as Record<string, unknown>,
      });
    }
  }
  return {
    text,
    toolCalls,
    stopReason: mapStopReason(msg.stop_reason),
    usage: { inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens },
    raw: msg,
  };
}

function readAnthropicThinkingDelta(event: unknown): string {
  if (!event || typeof event !== "object") return "";
  const record = event as Record<string, unknown>;
  if (record.type !== "content_block_delta") return "";
  const delta = record.delta;
  if (!delta || typeof delta !== "object") return "";
  const deltaRecord = delta as Record<string, unknown>;
  if (deltaRecord.type !== "thinking_delta") return "";
  return typeof deltaRecord.thinking === "string" ? deltaRecord.thinking : "";
}

export function createAnthropicClient(options: AnthropicClientOptions = {}): LLMClient {
  const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  const model = options.model ?? getEnv("ANTHROPIC_MODEL", DEFAULT_MODEL)!;

  function buildParams(options: ChatOptions): Anthropic.MessageCreateParamsNonStreaming {
    const { system, messages } = splitSystem(options);
    return {
      model,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(system ? { system } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      messages: toAnthropicMessages(messages),
      ...(options.tools && options.tools.length
        ? {
            tools: options.tools.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.parameters as Anthropic.Tool.InputSchema,
            })),
          }
        : {}),
    };
  }

  return {
    provider: "anthropic",
    model,

    async chat(options) {
      emitDemoRunnerThinking(`LLM chat 正在生成完整回复：${model}`);
      const msg = await client.messages.create(
        buildParams(options),
        options.signal ? { signal: options.signal } : undefined,
      );
      return parseMessage(msg);
    },

    async *stream(options): AsyncIterable<StreamChunk> {
      emitDemoRunnerThinking(`LLM stream 已连接，等待首个 token：${model}`);
      const stream = client.messages.stream(
        buildParams(options),
        options.signal ? { signal: options.signal } : undefined,
      );
      for await (const event of stream) {
        const thinking = readAnthropicThinkingDelta(event);
        if (thinking) {
          emitDemoRunnerThinking(thinking);
          yield { type: "thinking", text: thinking };
        }
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "text", text: event.delta.text };
        }
      }
      const finalMessage = await stream.finalMessage();
      yield { type: "done", result: parseMessage(finalMessage) };
    },
  };
}
