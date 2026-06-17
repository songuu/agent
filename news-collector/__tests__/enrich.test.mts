import assert from "node:assert/strict";
import { test } from "node:test";
import { enrichItems, enrichmentAvailable } from "../src/enrich.ts";
import type { NewsItem } from "../src/types.ts";

const item: NewsItem = {
  externalId: "abc123456789",
  sourceKey: "test",
  sourceName: "Test Feed",
  sourceKind: "vendor-blog",
  title: "OpenAI releases a new eval tool",
  url: "https://example.com/news",
  summary: "Original summary",
  ecosystemLayer: "model-platform",
  ecosystemLayerLabel: "模型与托管平台",
  tags: ["OpenAI"],
  lang: "en",
  publishedAt: "2026-06-17T00:00:00.000Z",
  publishedDate: "2026-06-17",
  collectedAt: "2026-06-17T01:00:00.000Z",
  collectedDate: "2026-06-17",
  enriched: false,
  metadata: {},
};

test("selected provider credentials control enrichment availability", () => {
  assert.equal(enrichmentAvailable("anthropic", { ANTHROPIC_API_KEY: "" }), false);
  assert.equal(
    enrichmentAvailable("anthropic", { ANTHROPIC_API_KEY: "test-anthropic-key" }),
    true,
  );
  assert.equal(enrichmentAvailable("openai", { OPENAI_API_KEY: "" }), false);
  assert.equal(enrichmentAvailable("openai", { OPENAI_API_KEY: "test-openai-key" }), true);
});

test("enrichItems uses the provider-independent LLM client contract", async () => {
  const [enriched] = await enrichItems([item], {
    maxItems: 1,
    provider: "openai",
    client: {
      async chat() {
        return {
          text: '{"summary":"OpenAI 发布评测工具","layer":"evaluation"}',
          toolCalls: [],
          stopReason: "stop",
          usage: { inputTokens: 10, outputTokens: 8 },
        };
      },
    },
  });

  assert.equal(enriched.summary, "OpenAI 发布评测工具");
  assert.equal(enriched.ecosystemLayer, "evaluation");
  assert.equal(enriched.ecosystemLayerLabel, "评测与基准");
  assert.equal(enriched.enriched, true);
});

test("missing provider key keeps the rule result untouched", async () => {
  const [unchanged] = await enrichItems([item], {
    maxItems: 1,
    provider: "openai",
    env: { OPENAI_API_KEY: "" },
  });

  assert.deepEqual(unchanged, item);
});
