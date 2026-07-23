import assert from "node:assert/strict";
import { test } from "node:test";
import { SOURCES, enabledSources } from "../src/sources.ts";
import { ECOSYSTEM_LAYERS } from "../src/types.ts";

test("source registry keys are unique and enabled sources are well-formed", () => {
  const keys = new Set<string>();
  const layerSet = new Set(ECOSYSTEM_LAYERS);

  for (const source of SOURCES) {
    assert.match(source.key, /^[a-z0-9-]+$/);
    assert.equal(keys.has(source.key), false, `duplicate source key: ${source.key}`);
    keys.add(source.key);
    assert.match(source.url, /^https?:\/\//);
    if (source.layerHint) assert.equal(layerSet.has(source.layerHint), true);
  }

  assert.deepEqual(
    enabledSources().map((source) => source.key),
    SOURCES.filter((source) => source.enabled).map((source) => source.key),
    "enabledSources should only return feeds marked enabled",
  );
  assert.ok(enabledSources().length >= 15, "expanded collector should keep broad coverage");
});

test("expanded article sources stay enabled", () => {
  const enabled = new Set(enabledSources().map((source) => source.key));

  for (const key of [
    "vercel-ai-releases",
    "mcp-typescript-sdk-releases",
    "mcp-python-sdk-releases",
    "mastra-releases",
    "pydantic-ai-releases",
    "browser-use-releases",
    "stagehand-releases",
    "openhands-releases",
    "swe-agent-releases",
    "aider-releases",
    "mem0-releases",
    "graphiti-releases",
    "humanlayer-releases",
    "langfuse-releases",
    "phoenix-releases",
    "llamaindex-python-releases",
    "dspy-releases",
    "ithome",
    "sspai",
    "deepmind",
    "arxiv-cs-lg",
    "hn-frontpage",
    "github-engineering",
    "github-changelog",
    "microsoft-ai-source",
    "aws-ml",
    "nvidia-deep-learning",
    "infoq-ai",
    "venturebeat-ai",
    "mit-tr",
    "ahead-of-ai",
  ]) {
    assert.ok(enabled.has(key), `${key} should be enabled`);
  }
});


test("2026-07-21 live-probed official feeds stay enabled at their verified URLs", () => {
  const expectedSources = {
    "langchain-changelog": "https://docs.langchain.com/oss/python/releases/changelog/rss.xml",
    "cloudflare-ai": "https://blog.cloudflare.com/tag/ai/rss/",
    "openai-codex-releases": "https://github.com/openai/codex/releases.atom",
    "claude-code-releases": "https://github.com/anthropics/claude-code/releases.atom",
    "together-ai-blog": "https://www.together.ai/blog/rss.xml",
    "gemini-cli-releases": "https://github.com/google-gemini/gemini-cli/releases.atom",
    "weaviate-blog": "https://weaviate.io/blog/rss.xml",
    "redhat-ai": "https://www.redhat.com/en/rss/blog/channel/artificial-intelligence",
    "microsoft-agent-framework-releases": "https://github.com/microsoft/agent-framework/releases.atom",
    "owasp-genai": "https://genai.owasp.org/feed/",
  } as const;
  const enabled = new Map(enabledSources().map((source) => [source.key, source]));

  for (const [key, url] of Object.entries(expectedSources)) {
    const source = enabled.get(key);
    assert.ok(source, key + " should remain enabled");
    assert.equal(source.url, url);
  }
});

test("high-value sources have independent fallbacks for transient upstream failures", () => {
  const expectedFallbacks = {
    "hn-ai": "https://hnrss.org/newest?q=AI+OR+LLM+OR+agent&count=30",
    "llamaindex-python-releases": "https://github.com/run-llama/llama_index/tags.atom",
    huggingface: "https://github.com/huggingface/transformers/releases.atom",
    openai: "https://github.com/openai/openai-cookbook/commits/main.atom",
  } as const;

  for (const [key, fallbackUrl] of Object.entries(expectedFallbacks)) {
    const source = SOURCES.find((candidate) => candidate.key === key);
    assert.ok(source, `missing source: ${key}`);
    assert.equal(source.critical, true, `${key} should retry as a critical source`);
    const urls = [
      ...(source.fallbackUrls ?? []),
      ...(source.fallbacks ?? []).map((fallback) => fallback.url),
    ];
    assert.ok(urls.includes(fallbackUrl), `${key} should retain fallback ${fallbackUrl}`);
  }
});
test("challenge-protected sources stay documented but disabled", () => {
  for (const key of ["linuxdo-latest", "36kr-feed", "techweb-it"]) {
    const source = SOURCES.find((candidate) => candidate.key === key);

    assert.ok(source, `${key} should remain documented in the source registry`);
    assert.equal(source.enabled, false);
    assert.equal(enabledSources().some((candidate) => candidate.key === key), false);
  }
});
