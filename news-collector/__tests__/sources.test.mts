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
    "techweb-it",
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

test("linuxdo latest feed stays registered but disabled while Cloudflare challenged", () => {
  const source = SOURCES.find((candidate) => candidate.key === "linuxdo-latest");

  assert.ok(source, "linuxdo-latest should remain documented in the source registry");
  assert.equal(source.enabled, false);
  assert.equal(enabledSources().some((candidate) => candidate.key === "linuxdo-latest"), false);
});
