import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig } from "../src/config.ts";

test("blank LLM keys disable enrichment instead of failing config parsing", () => {
  const config = loadConfig({
    LLM_PROVIDER: "anthropic",
    ANTHROPIC_API_KEY: "",
    NEWS_ENRICH_MAX: "3",
  });

  assert.equal(config.enrichProvider, "anthropic");
  assert.equal(config.enrichMax, 0);
});

test("OpenAI provider uses the same external config names as the root app", () => {
  const config = loadConfig({
    LLM_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-4o-mini",
    OPENAI_BASE_URL: "https://api.example.com/v1",
    NEWS_ENRICH_MAX: "2",
  });

  assert.equal(config.enrichProvider, "openai");
  assert.equal(config.enrichMax, 2);
});

test("legacy NEWS_ENRICH_MODEL remains an explicit collector override", () => {
  const config = loadConfig({
    LLM_PROVIDER: "anthropic",
    ANTHROPIC_API_KEY: "test-anthropic-key",
    ANTHROPIC_MODEL: "claude-sonnet-test",
    NEWS_ENRICH_MODEL: "claude-haiku-test",
    NEWS_ENRICH_MAX: "1",
  });

  assert.equal(config.enrichModel, "claude-haiku-test");
  assert.equal(config.enrichMax, 1);
});
