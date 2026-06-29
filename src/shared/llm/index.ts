/**
 * LLM 工厂：根据 .env 的 LLM_PROVIDER 选择具体实现。
 *
 * 这是"防厂商锁定"的落点——课程代码统一写 `const llm = getLLM()`，
 * 想换厂商只改 .env 里的 LLM_PROVIDER，一行代码都不用动。
 */
import { getEnv } from "../util/env.ts";
import { createAnthropicClient } from "./anthropic.ts";
import { createOllamaClient, createOpenAIClient } from "./openai.ts";
import type { LLMClient } from "./types.ts";

export type ProviderName = "anthropic" | "openai" | "ollama";

export interface GetLLMOptions {
  readonly model?: string;
}

/**
 * 取得一个 LLMClient。
 * @param provider 显式指定厂商；不传则读 .env 的 LLM_PROVIDER（默认 anthropic）。
 */
export function getLLM(provider?: ProviderName, options: GetLLMOptions = {}): LLMClient {
  const name = (provider ?? getEnv("LLM_PROVIDER", "anthropic")) as ProviderName;
  switch (name) {
    case "anthropic":
      return createAnthropicClient({ model: options.model });
    case "openai":
      return createOpenAIClient({ model: options.model });
    case "ollama":
      return createOllamaClient({ model: options.model });
    default:
      throw new Error(
        `未知的 LLM_PROVIDER: "${name}"。支持的值：anthropic | openai | ollama。`,
      );
  }
}

export * from "./types.ts";
export { createAnthropicClient } from "./anthropic.ts";
export { createOllamaClient, createOpenAIClient } from "./openai.ts";
