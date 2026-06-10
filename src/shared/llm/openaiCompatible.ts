/**
 * OpenAI-compatible client factory.
 *
 * WHY: Many providers, including SiliconFlow, expose the OpenAI Chat/Embeddings
 * shape behind a custom base URL. Keeping that switch here prevents lesson code
 * from learning vendor-specific details.
 */
import OpenAI from "openai";
import { getEnv, requireEnv } from "../util/env";

export function createOpenAICompatibleClient(): OpenAI {
  const baseURL = getEnv("OPENAI_BASE_URL");
  return new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
    ...(baseURL ? { baseURL } : {}),
  });
}
