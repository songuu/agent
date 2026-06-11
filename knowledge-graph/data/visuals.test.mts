import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CHAPTERS } from "./graph.js";
import {
  CONCEPT_VISUALS,
  getConceptHighlights,
  getConceptReferences,
  renderConceptVisualHtml,
} from "./visuals.js";

const chapterIds = new Set(CHAPTERS.map((chapter) => chapter.id));
const seenChapters = new Set<string>();

assert.equal(
  CONCEPT_VISUALS.length,
  CHAPTERS.length,
  "every course chapter should have exactly one animated visual explainer",
);

for (const visual of CONCEPT_VISUALS) {
  assert.ok(chapterIds.has(visual.chapter), `unknown visual chapter: ${visual.chapter}`);
  assert.ok(!seenChapters.has(visual.chapter), `duplicate visual chapter: ${visual.chapter}`);
  seenChapters.add(visual.chapter);

  assert.ok(visual.title.trim().length > 0, `visual ${visual.chapter} needs a title`);
  assert.ok(visual.summary.trim().length > 0, `visual ${visual.chapter} needs a summary`);
  assert.ok(visual.takeaway.trim().length > 0, `visual ${visual.chapter} needs a takeaway`);
  assert.ok(
    visual.steps.length >= 3 && visual.steps.length <= 6,
    `visual ${visual.chapter} should stay scannable`,
  );

  const html = renderConceptVisualHtml(visual);
  assert.match(html, /class="concept-visual concept-visual--/);
  assert.match(html, new RegExp(`concept-visual-${visual.chapter}`));
  assert.match(html, /class="concept-highlight concept-highlight--core"/);
  assert.match(html, /class="concept-highlight concept-highlight--warning"/);
  assert.match(html, /class="concept-references"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /<svg class="concept-visual-canvas/);
  assert.match(html, /<tspan /, `visual ${visual.chapter} should wrap SVG labels with tspans`);
  assert.match(html, /data-codex-drawn-image="true"/);
  assert.doesNotMatch(html, /…<\/text>/, `visual ${visual.chapter} should not truncate SVG labels with ellipsis`);
  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /<script/i);

  // 每个 kind 必须渲染它专属的场景画布，不得退化到通用 flow（loop/pipeline/fusion 曾共用）。
  const expectedCanvas = visual.kind === "shield" ? "layers" : visual.kind;
  assert.match(
    html,
    new RegExp(`concept-visual-canvas--${expectedCanvas}\\b`),
    `visual ${visual.chapter} should render its own ${expectedCanvas} scene`,
  );
  assert.doesNotMatch(
    html,
    /concept-visual-canvas--flow\b/,
    `visual ${visual.chapter} must not fall back to the generic flow scene`,
  );

  // 每个场景都要有它的标志性元素（同时保证带动画的图形真的被渲染出来）。
  const sceneSignature: Record<string, RegExp> = {
    loop: /class="concept-svg-ring"/,
    pipeline: /class="concept-svg-belt"/,
    fusion: /class="concept-svg-flowarrow"/,
    space: /concept-svg-cluster/,
    compare: /concept-svg-card/,
    stream: /concept-svg-stream-path/,
    layers: /concept-svg-layer/,
    shield: /concept-svg-layer/,
  };
  assert.match(
    html,
    sceneSignature[visual.kind]!,
    `visual ${visual.chapter} (${visual.kind}) is missing its scene signature element`,
  );
}

for (const chapter of CHAPTERS) {
  assert.ok(seenChapters.has(chapter.id), `missing visual explainer for ${chapter.id} ${chapter.title}`);
  const highlights = getConceptHighlights(chapter.id);
  const references = getConceptReferences(chapter.id);

  assert.equal(highlights.length, 2, `chapter ${chapter.id} needs core + warning highlights`);
  assert.ok(
    highlights.some((highlight) => highlight.tone === "core"),
    `chapter ${chapter.id} needs a core highlight`,
  );
  assert.ok(
    highlights.some((highlight) => highlight.tone === "warning"),
    `chapter ${chapter.id} needs a warning highlight`,
  );
  for (const highlight of highlights) {
    assert.ok(highlight.label.trim().length > 0, `chapter ${chapter.id} highlight needs a label`);
    assert.ok(highlight.body.trim().length > 0, `chapter ${chapter.id} highlight needs a body`);
  }

  assert.ok(references.length >= 1, `chapter ${chapter.id} needs at least one external reference`);
  for (const reference of references) {
    assert.match(reference.url, /^https?:\/\//, `chapter ${chapter.id} reference needs an external URL`);
    assert.ok(reference.title.trim().length > 0, `chapter ${chapter.id} reference needs a title`);
    assert.ok(reference.note.trim().length > 0, `chapter ${chapter.id} reference needs a note`);
  }

  const readmePath = `${chapter.dir}/README.md`;
  assert.ok(existsSync(readmePath), `missing README for ${chapter.id}: ${readmePath}`);
  const readme = readFileSync(readmePath, "utf8");
  assert.match(
    readme,
    /```mermaid\s*(flowchart|graph|mindmap)/,
    `missing Mermaid flowchart or mindmap for ${chapter.id}: ${readmePath}`,
  );
}

console.log("visuals.test.mts: ok");
