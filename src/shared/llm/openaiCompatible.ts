/**
 * OpenAI-compatible client factory.
 *
 * WHY: Many providers, including SiliconFlow, expose the OpenAI Chat/Embeddings
 * shape behind a custom base URL. Keeping that switch here prevents lesson code
 * from learning vendor-specific details.
 */
import OpenAI from "openai";
import { getEnv } from "../util/env.ts";

export interface OpenAICompatibleClientOptions {
  apiKeyEnv?: string;
  apiKeyFallback?: string;
  baseURL?: string;
  baseURLEnv?: string;
}

export function createOpenAICompatibleClient(
  options: OpenAICompatibleClientOptions = {},
): OpenAI {
  const apiKeyEnv = options.apiKeyEnv ?? "OPENAI_API_KEY";
  const baseURLEnv = options.baseURLEnv ?? "OPENAI_BASE_URL";
  const apiKey = getEnv(apiKeyEnv, options.apiKeyFallback);
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      `缺少环境变量 ${apiKeyEnv}。请复制 .env.example 为 .env 并填入你的 key（参考文件内注释）。`,
    );
  }
  const baseURL = options.baseURL ?? getEnv(baseURLEnv);
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}