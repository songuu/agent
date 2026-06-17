import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, detectLang } from "../src/classify.ts";
import type { NewsSource } from "../src/types.ts";

function src(overrides: Partial<NewsSource> = {}): NewsSource {
  return {
    key: "t",
    name: "T",
    url: "https://example.com/feed",
    kind: "en-media",
    lang: "en",
    enabled: true,
    ...overrides,
  };
}

test("MCP / interoperability → protocol", () => {
  assert.equal(
    classify({ title: "MCP gets a major update for interoperability" }, src()).ecosystemLayer,
    "protocol",
  );
});

test("LangGraph multi-agent orchestration → runtime", () => {
  assert.equal(
    classify({ title: "LangGraph adds multi-agent orchestration" }, src()).ecosystemLayer,
    "runtime",
  );
});

test("SWE-bench benchmark → evaluation", () => {
  assert.equal(
    classify({ title: "New SWE-bench benchmark evaluates agents" }, src()).ecosystemLayer,
    "evaluation",
  );
});

test("prompt injection / guardrails / OWASP → security-governance", () => {
  assert.equal(
    classify({ title: "Prompt injection bypasses guardrails, OWASP warns" }, src()).ecosystemLayer,
    "security-governance",
  );
});

test("RAG / retrieval / memory → data-memory", () => {
  assert.equal(
    classify({ title: "RAG retrieval and vector memory deep dive" }, src()).ecosystemLayer,
    "data-memory",
  );
});

test("Cursor copilot → product-ui", () => {
  assert.equal(
    classify({ title: "Cursor ships an agentic copilot" }, src()).ecosystemLayer,
    "product-ui",
  );
});

test("Claude model release → model-platform", () => {
  assert.equal(
    classify({ title: "Anthropic releases a new Claude model" }, src()).ecosystemLayer,
    "model-platform",
  );
});

test("no keyword → foundation fallback", () => {
  assert.equal(
    classify({ title: "A general overview of the landscape" }, src()).ecosystemLayer,
    "foundation",
  );
});

test("no keyword + layerHint → uses hint", () => {
  assert.equal(
    classify({ title: "general overview" }, src({ layerHint: "model-platform" })).ecosystemLayer,
    "model-platform",
  );
});

test("deterministic: same input → same output", () => {
  const a = classify({ title: "MCP protocol update" }, src());
  const b = classify({ title: "MCP protocol update" }, src());
  assert.deepEqual(a, b);
});

test("tags include matched entity and layer label", () => {
  const result = classify({ title: "Anthropic releases a new Claude model" }, src());
  assert.ok(result.tags.includes("Anthropic"), "should tag Anthropic");
  assert.ok(result.tags.includes("模型与托管平台"), "should tag layer label");
});

test("lang comes from source", () => {
  assert.equal(classify({ title: "anything" }, src({ lang: "zh" })).lang, "zh");
});

test("detectLang distinguishes zh / en / empty", () => {
  assert.equal(detectLang("OpenAI 发布新一代模型"), "zh");
  assert.equal(detectLang("SpaceX bets big on Cursor"), "en");
  assert.equal(detectLang("", "zh"), "zh");
});
