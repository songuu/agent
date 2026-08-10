import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDemoRegistry } from "./registry.mjs";

const repoRoot = realpathSync(dirname(fileURLToPath(import.meta.url)) + "/../..");
const registry = buildDemoRegistry(repoRoot);

assert.ok(registry.has("01"), "lesson 01 should be runnable");
assert.equal(registry.get("01")?.needsKey, "llm");

assert.ok(registry.has("rag-chunk"), "offline RAG chunk demo should be runnable");
assert.equal(registry.get("rag-chunk")?.needsKey, "none");

assert.ok(registry.has("08"), "embedding lesson should be runnable when key is present");
assert.equal(registry.get("08")?.needsKey, "embedding");

assert.ok(registry.has("19"), "keyless ecosystem demo should be runnable");
assert.equal(registry.get("19")?.needsKey, "none");

for (const id of [
  "ae-run",
  "ae-context",
  "ae-prompt",
  "ae-runtime",
  "ae-evidence",
  "ae-memory",
  "ae-multi",
  "ae-capstone",
] as const) {
  assert.ok(registry.has(id), `${id} should be discovered as a runnable offline demo`);
  assert.equal(registry.get(id)?.needsKey, "none");
  assert.equal(registry.get(id)?.entry, `${registry.get(id)?.dir}/index.ts`);
}

assert.equal(registry.has("18"), false, "server.listen demo should be excluded");
assert.equal(registry.has("20"), false, "article-library chapter should not expose a terminal demo");
assert.equal(registry.has("capstone"), false, "interactive capstone CLI should be excluded");
assert.ok(registry.has("cap-support"), "explicit capstone CLI should be runnable");
assert.equal(registry.get("cap-support")?.entry, "capstone/support-copilot/src/cli.ts");

for (const demo of registry.values()) {
  assert.ok(
    demo.realpath.startsWith(repoRoot + sep),
    `${demo.id} must resolve inside repo root`,
  );
  assert.ok(demo.realpath.endsWith(".ts"), `${demo.id} must run TypeScript`);
  if (demo.entry === `${demo.dir}/index.ts`) {
    assert.ok(demo.realpath.endsWith(`${sep}index.ts`), `${demo.id} default entry must be index.ts`);
  }
}

console.log("registry.test.mts: ok");
