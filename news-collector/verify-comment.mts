// Let's verify the comment claims:
// Current comment (lines 6-8):
// "算法：对每层累计命中关键词数得分，取最高分层；平分时按 LAYER_MATCHERS 顺序（越靠前越具体）
// 决胜；零命中退回源的 layerHint 或 foundation。model-platform 的关键词最宽（含"发布/release"），
// 故排在末位，避免把"协议发布""评测发布"误吞为模型层。"

// The comment says:
// 1. "对每层累计命中关键词数得分，取最高分层" - Correct: accumulate keyword matches, pick highest score
// 2. "平分时按 LAYER_MATCHERS 顺序（越靠前越具体）决胜" - Says use LAYER_MATCHERS order, where earlier = more specific
// 3. "model-platform 的关键词最宽（含"发布/release"），故排在末位" - model-platform has broadest keywords, placed last

// Is the comment correct? Let me verify:
// - LAYER_MATCHERS order: protocol, security-governance, evaluation, data-memory, runtime, product-ui, model-platform
// - So model-platform IS last ✓
// - When there's a tie, we use PRIORITY.indexOf(a[0]) - PRIORITY.indexOf(b[0])
// - Lower index comes first in sort = wins = is more specific ✓

// So the CURRENT comment is ACCURATE and the code IS CORRECT.

// BUT the audit's concern is:
// "comment suggests the goal is to prevent model-platform from capturing 'protocol release' phrases, 
//  which the scoring alone doesn't guarantee - only the tie-breaking does"

// Let me check: Does the scoring alone prevent this?
// "protocol release" text:
// - protocol layer: matches /互操作|协议互通|协议/ for Chinese, but "protocol" in English... 
//   Actually looking at patterns, there's no /protocol/ pattern in protocol layer for English!
//   Only: /\bMCP\b/, /model context protocol/, /\bA2A\b/, /agent2agent/, /apps sdk/, /interoperab/, /互操作|协议互通|协议/
// - So "protocol release" only matches:
//   - model-platform: /release/ ✓
// - Result: model-platform wins 1-0, no tie needed!

// What about a title that's truly ambiguous like "released new protocol for communication"?
// - protocol layer: /互操作|协议互通|协议/ - NO, this is Chinese only, doesn't match English "protocol"
// - So "released new protocol" still only matches model-platform!

// The actual scenario that tests tie-breaking:
// "MCP release" or "A2A release" - here tie-breaking DOES matter
// - protocol: /\bMCP\b/ or /\bA2A\b/ ✓
// - model-platform: /release/ ✓
// - Tie → use PRIORITY → protocol wins ✓

console.log("Comment accuracy: MOSTLY CORRECT");
console.log("The comment accurately describes the mechanism.");
console.log("The audit's concern about 'scoring alone' is theoretically valid but:");
console.log("- Doesn't manifest in practice because English 'protocol' has no keyword");
console.log("- The tie-breaking IS the safety net when both layers match once");
