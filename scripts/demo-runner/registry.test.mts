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

assert.equal(registry.has("18"), false, "server.listen demo should be excluded");
assert.equal(registry.has("capstone"), false, "interactive capstone CLI should be excluded");

for (const demo of registry.values()) {
  assert.ok(
    demo.realpath.startsWith(repoRoot + sep),
    `${demo.id} must resolve inside repo root`,
  );
  assert.ok(demo.realpath.endsWith(`${sep}index.ts`), `${demo.id} must run index.ts`);
}

console.log("registry.test.mts: ok");
