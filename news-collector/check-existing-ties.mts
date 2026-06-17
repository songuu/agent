import { classify } from "./src/classify.ts";

const src = {
  key: 't',
  name: 'T',
  url: 'https://example.com/feed',
  kind: 'en-media' as const,
  lang: 'en' as const,
  enabled: true,
};

// Check existing tests to see if any create tie-breaking scenarios:

// Existing test 1: "MCP gets a major update for interoperability"
// - MCP matches /\bMCP\b/ (protocol)
// - interoperability matches /interoperab/ (protocol)
// - Score: protocol=2, no others
// No tie

// Existing test 2: "LangGraph adds multi-agent orchestration"
// - LangGraph matches /langgraph/ (runtime)
// - multi-agent matches /multi-?agent/ (runtime)
// - orchestration matches /orchestrat/ (runtime)
// - Score: runtime=3
// No tie

// Existing test 3: "Anthropic releases a new Claude model"
// - Anthropic → ENTITY tag only, not a LAYER keyword
// - releases → /release/ (model-platform)
// - Claude → /\bclaude\b/ (model-platform)
// - model → /模型/ doesn't match English "model" alone; /release|launch|.../ matches
// - Score: model-platform=2
// No tie

// So existing tests DON'T cover tie-breaking scenarios!

console.log("✓ Existing tests do NOT exercise tie-breaking logic");
console.log("\nA real tie-breaking test would need:");
console.log("- 'MCP release' → protocol=1, model-platform=1 → tie-break to protocol");
console.log("- 'A2A release' → protocol=1, model-platform=1 → tie-break to protocol");

const tieTest1 = classify({ title: "MCP release" }, src);
const tieTest2 = classify({ title: "A2A release" }, src);

console.log(`\n✓ 'MCP release' → ${tieTest1.ecosystemLayer} (expected: protocol)`);
console.log(`✓ 'A2A release' → ${tieTest2.ecosystemLayer} (expected: protocol)`);

if (tieTest1.ecosystemLayer === "protocol" && tieTest2.ecosystemLayer === "protocol") {
  console.log("\n✓ Tie-breaking logic works correctly!");
}
