/**
 * LLM 工厂：根据 .env 的 LLM_PROVIDER 选择具体实现。
 *
 * 这是"防厂商锁定"的落点——课程代码统一写 `const llm = getLLM()`，
 * 想换厂商只改 .env 里的 LLM_PROVIDER，一行代码都不用动。
 */
import { getEnv } from "../util/env";
import { createAnthropicClient } from "./anthropic";
import { createOllamaClient, createOpenAIClient } from "./openai";
import type { LLMClient } from "./types";

export type ProviderName = "anthropic" | "openai" | "ollama";

/**
 * 取得一个 LLMClient。
 * @param provider 显式指定厂商；不传则读 .env 的 LLM_PROVIDER（默认 anthropic）。
 */
export function getLLM(provider?: ProviderName): LLMClient {
  const name = (provider ?? getEnv("LLM_PROVIDER", "anthropic")) as ProviderName;
  switch (name) {
    case "anthropic":
      return createAnthropicClient();
    case "openai":
      return createOpenAIClient();
    case "ollama":
      return createOllamaClient();
    default:
      throw new Error(
        `未知的 LLM_PROVIDER: "${name}"。支持的值：anthropic | openai | ollama。`,
      );
  }
}

export * from "./types";
export { createAnthropicClient } from "./anthropic";
export { createOllamaClient, createOpenAIClient } from "./openai";
