import { classify } from "./src/classify.ts";

const src = {
  key: 't',
  name: 'T',
  url: 'https://example.com/feed',
  kind: 'en-media' as const,
  lang: 'en' as const,
  enabled: true,
};

// Audit suggests:
// "verify 'released new protocol' scores protocol > model-platform even though both match 'release'"

console.log("Testing audit's suggested case: 'released new protocol'");
const result = classify({ title: "released new protocol" }, src);
console.log(`Result: ${result.ecosystemLayer}`);
console.log(`Expected by audit: protocol`);

// Analysis:
// Text: "released new protocol"
// protocol layer patterns:
//   /\bMCP\b/ - NO
//   /model context protocol/ - NO (needs "model context")
//   /\bA2A\b/ - NO
//   /agent2agent/ - NO
//   /apps sdk/ - NO
//   /interoperab/ - NO
//   /互操作|协议互通|协议/ - NO (Chinese only, no match in English text)
//   Score: 0
//
// model-platform patterns:
//   /发布|launch|release|上线|开源|open-?source/i - YES (matches "released")
//   Score: 1
//
// Result: model-platform wins (1 > 0)

console.log("\nAnalysis: The audit's test case doesn't create a tie!");
console.log("Reason: 'protocol' word has no English keyword pattern");
console.log("So 'released new protocol' → model-platform (1 point vs 0 for protocol)");
