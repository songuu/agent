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

  assert.ok(enabledSources().length >= 15, "expanded collector should keep broad coverage");
});

test("expanded article sources stay enabled", () => {
  const enabled = new Set(enabledSources().map((source) => source.key));

  for (const key of [
    "deepmind",
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
