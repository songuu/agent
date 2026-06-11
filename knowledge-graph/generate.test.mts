import assert from "node:assert/strict";
import { CHAPTERS } from "./data/graph.js";
import { buildChapterConceptGraph } from "./generate.js";

// 关系类型配色调色板（与 generate.ts 的 RELATION_COLOR 对齐）。
const RELATION_COLORS = new Set(["#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706", "#64748b"]);

let sawLR = false;
let sawTB = false;
let coloredChapters = 0;

for (const chapter of CHAPTERS) {
  const graph = buildChapterConceptGraph(chapter);
  if (graph === "") continue; // 本章尚无概念

  assert.match(graph, /^```mermaid\ngraph (LR|TB)\n/, `chapter ${chapter.id}: graph header`);
  assert.match(graph, /classDef own /, `chapter ${chapter.id}: needs own classDef`);
  assert.match(graph, /class .+ own;/, `chapter ${chapter.id}: must assign own class`);

  if (/graph LR/.test(graph)) sawLR = true;
  if (/graph TB/.test(graph)) sawTB = true;

  // linkStyle 序号必须从 0 连续、与边数一致，且只用调色板里的颜色。
  const linkStyles = [...graph.matchAll(/linkStyle (\d+) stroke:(#[0-9a-fA-F]{6}),/g)];
  const edgeCount = [...graph.matchAll(/-->\|/g)].length;
  assert.equal(
    linkStyles.length,
    edgeCount,
    `chapter ${chapter.id}: linkStyle count must equal edge count`,
  );
  linkStyles.forEach((match, index) => {
    assert.equal(Number(match[1]), index, `chapter ${chapter.id}: linkStyle index must be contiguous from 0`);
    assert.ok(RELATION_COLORS.has(match[2]!), `chapter ${chapter.id}: unexpected relation color ${match[2]}`);
  });
  if (linkStyles.length) coloredChapters++;
}

assert.ok(sawTB, "dense chapters should switch to TB layout");
assert.ok(sawLR, "sparse chapters should keep LR layout");
assert.ok(coloredChapters >= 10, "most chapters should have colored relations");

// 具体回归：第 07 章（截图章，10 节点）必须是 TB，首条边（前置）必须蓝色。
const ch07 = CHAPTERS.find((c) => c.id === "07");
assert.ok(ch07, "chapter 07 must exist");
const graph07 = buildChapterConceptGraph(ch07!);
assert.match(graph07, /graph TB/, "chapter 07 (dense) must render TB");
assert.match(graph07, /linkStyle 0 stroke:#2563eb,/, "chapter 07 first edge (前置) must be blue");

console.log("generate.test.mts: ok");
