import { classify } from "./src/classify.ts";

const src = {
  key: 't',
  name: 'T',
  url: 'https://example.com/feed',
  kind: 'en-media' as const,
  lang: 'en' as const,
  enabled: true,
};

// Manual scoring to verify tie-breaking logic
// Test: "MCP release protocol"
// protocol patterns: /\bMCP\b/, /model context protocol/, /\bA2A\b/, /agent2agent/, /apps sdk/, /interoperab/, /互操作|协议互通|协议/
// "MCP release protocol" matches:
//   - /\bMCP\b/ ✓
//   - /protocol/ (part of "protocol") - wait, there's /互操作|协议互通|协议/ which matches "protocol"? Let me check...
//   - Actually /互操作|协议互通|协议/ matches Chinese, not English "protocol"

// model-platform patterns: ... /发布|launch|release|上线|开源|open-?source/i
// "MCP release protocol" matches:
//   - /release/ ✓

// So: protocol=1, model-platform=1 → TIE
// PRIORITY order: [protocol, security-governance, evaluation, data-memory, runtime, product-ui, model-platform]
// PRIORITY.indexOf(protocol) = 0
// PRIORITY.indexOf(model-platform) = 6
// When a[0]=model-platform (index 6) and b[0]=protocol (index 0)
// return PRIORITY.indexOf(a[0]) - PRIORITY.indexOf(b[0]) = 6 - 0 = 6 > 0
// So 'a' comes after 'b', meaning protocol wins (it was sorted first)

// Let me test scoring logic more explicitly
const testCases = [
  { title: "MCP release", expected: "protocol", reason: "Both match once, protocol wins tie" },
  { title: "claude release security", expected: "security-governance", reason: "security-governance=1, model-platform=2, higher score wins" },
  { title: "claude release", expected: "model-platform", reason: "Only model-platform matches" },
];

testCases.forEach(({ title, expected, reason }) => {
  const result = classify({ title }, src);
  const match = result.ecosystemLayer === expected ? "✓" : "✗";
  console.log(`${match} "${title}"`);
  console.log(`   Expected: ${expected}, Got: ${result.ecosystemLayer}`);
  console.log(`   Reason: ${reason}`);
  console.log();
});
