import assert from "node:assert/strict";
import { getLLM, createOllamaClient } from "./index.js";
import { createOpenAICompatibleClient } from "./openaiCompatible.js";

const originalEnv = { ...process.env };

function restoreEnv(): void {
  process.env = { ...originalEnv };
}

try {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OLLAMA_API_KEY;
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_MODEL;

  const injectedClient = createOpenAICompatibleClient({
    apiKeyEnv: "MISSING_API_KEY_FOR_TEST",
    apiKeyFallback: "fallback-key",
    baseURL: "http://127.0.0.1:11434/v1",
  });
  assert.equal(injectedClient.apiKey, "fallback-key");
  assert.equal(injectedClient.baseURL, "http://127.0.0.1:11434/v1");

  const ollama = createOllamaClient();
  assert.equal(ollama.provider, "ollama");
  assert.equal(ollama.model, "llama3.2");

  process.env.LLM_PROVIDER = "ollama";
  const fromFactory = getLLM();
  assert.equal(fromFactory.provider, "ollama");
  assert.equal(fromFactory.model, "llama3.2");
} finally {
  restoreEnv();
}

console.log("openaiCompatible.test.mts: ok");
