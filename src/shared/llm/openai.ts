/**
 * OpenAI 的 LLMClient 实现（与 anthropic.ts 等价，便于对照两家差异）。
 *
 * 关键差异（相对 Claude）：
 *  - 有独立的 "tool" 角色，工具结果用 { role:"tool", tool_call_id, content } 回传。
 *  - 工具参数在响应里是 JSON 字符串（function.arguments），这里统一 parse 成对象。
 *  - system 就是一条 role:"system" 的普通消息。
 */
import OpenAI from "openai";
import { getEnv } from "../util/env";
import {
  createOpenAICompatibleClient,
  type OpenAICompatibleClientOptions,
} from "./openaiCompatible";
import type {
  ChatOptions,
  ChatResult,
  LLMClient,
  Message,
  StopReason,
  StreamChunk,
  ToolCall,
} from "./types";

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_OLLAMA_MODEL = "llama3.2";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434/v1";

interface OpenAIStyleClientOptions {
  provider: "openai" | "ollama";
  modelEnv: string;
  defaultModel: string;
  compatibleClient: OpenAICompatibleClientOptions;
}

/** 统一 Message[] → OpenAI ChatCompletionMessageParam[]。 */
function toOpenAIMessages(
  options: ChatOptions,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (options.system) out.push({ role: "system", content: options.system });
  for (const m of options.messages) {
    if (m.role === "system") {
      out.push({ role: "system", content: m.content });
    } else if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      out.push({
        role: "assistant",
        content: m.content || null,
        ...(m.toolCalls && m.toolCalls.length
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              })),
            }
          : {}),
      });
    } else {
      // role === "tool"
      out.push({ role: "tool", tool_call_id: m.toolCallId ?? "", content: m.content });
    }
  }
  return out;
}

function mapStopReason(reason: string | null | undefined): StopReason {
  switch (reason) {
    case "tool_calls":
    case "function_call":
      return "tool_use";
    case "length":
      return "max_tokens";
    case "stop":
      return "stop";
    default:
      return "other";
  }
}

function safeParseArgs(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function createOpenAIStyleClient(options: OpenAIStyleClientOptions): LLMClient {
  const client = createOpenAICompatibleClient(options.compatibleClient);
  const model = getEnv(options.modelEnv, options.defaultModel)!;

  function buildParams(
    options: ChatOptions,
  ): OpenAI.Chat.ChatCompletionCreateParamsNonStreaming {
    return {
      model,
      messages: toOpenAIMessages(options),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
      ...(options.tools && options.tools.length
        ? {
            tools: options.tools.map((t) => ({
              type: "function" as const,
              function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              },
            })),
          }
        : {}),
    };
  }

  return {
    provider: options.provider,
    model,

    async chat(options) {
      const res = await client.chat.completions.create(buildParams(options));
      const choice = res.choices[0];
      if (!choice) throw new Error("OpenAI 返回了空的 choices");
      const message = choice.message;
      const toolCalls: ToolCall[] = (message.tool_calls ?? [])
        .filter((c) => c.type === "function")
        .map((c) => ({
          id: c.id,
          name: c.function.name,
          arguments: safeParseArgs(c.function.arguments),
        }));
      return {
        text: message.content ?? "",
        toolCalls,
        stopReason: mapStopReason(choice.finish_reason),
        usage: {
          inputTokens: res.usage?.prompt_tokens ?? 0,
          outputTokens: res.usage?.completion_tokens ?? 0,
        },
        raw: res,
      };
    },

    async *stream(options): AsyncIterable<StreamChunk> {
      const stream = await client.chat.completions.create({
        ...buildParams(options),
        stream: true,
        stream_options: { include_usage: true },
      });
      let text = "";
      let usage = { inputTokens: 0, outputTokens: 0 };
      let finishReason: string | null = null;
      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        const delta = choice?.delta?.content;
        if (delta) {
          text += delta;
          yield { type: "text", text: delta };
        }
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        if (chunk.usage) {
          usage = {
            inputTokens: chunk.usage.prompt_tokens,
            outputTokens: chunk.usage.completion_tokens,
          };
        }
      }
      yield {
        type: "done",
        result: {
          text,
          toolCalls: [],
          stopReason: mapStopReason(finishReason),
          usage,
        },
      };
    },
  };
}

export function createOpenAIClient(): LLMClient {
  return createOpenAIStyleClient({
    provider: "openai",
    modelEnv: "OPENAI_MODEL",
    defaultModel: DEFAULT_MODEL,
    compatibleClient: {},
  });
}

export function createOllamaClient(): LLMClient {
  return createOpenAIStyleClient({
    provider: "ollama",
    modelEnv: "OLLAMA_MODEL",
    defaultModel: DEFAULT_OLLAMA_MODEL,
    compatibleClient: {
      apiKeyEnv: "OLLAMA_API_KEY",
      apiKeyFallback: "ollama",
      baseURLEnv: "OLLAMA_BASE_URL",
      baseURL: getEnv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL),
    },
  });
}
