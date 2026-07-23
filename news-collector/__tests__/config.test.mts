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

test("article content extraction config defaults to enabled with bounded limits", () => {
  const config = loadConfig({});

  assert.equal(config.articleContentEnabled, true);
  assert.equal(config.articleContentTimeoutMs, 12000);
  assert.equal(config.articleContentMaxItems, 80);
});

test("article content extraction can be disabled", () => {
  const config = loadConfig({ NEWS_ARTICLE_CONTENT_ENABLED: "false" });

  assert.equal(config.articleContentEnabled, false);
});

test("feed concurrency defaults to a conservative four workers and accepts overrides", () => {
  assert.equal(loadConfig({}).feedConcurrency, 4);
  assert.equal(loadConfig({ NEWS_FEED_CONCURRENCY: "2" }).feedConcurrency, 2);
});
