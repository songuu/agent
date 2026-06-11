import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateDiagramFit } from "./diagram-zoom";

const source = readFileSync(".vitepress/theme/diagram-zoom.ts", "utf8");
const themeEntry = readFileSync(".vitepress/theme/index.ts", "utf8");
const styles = readFileSync(".vitepress/theme/custom.css", "utf8");

assert.match(source, /querySelectorAll<HTMLElement>\("\.vp-doc \.mermaid"\)/);
assert.match(source, /querySelector\("svg"\)/);
assert.match(source, /MAX_RENDER_ATTEMPTS = 30/);
assert.match(source, /pendingDiagrams = new WeakMap/);
assert.match(source, /scheduleDiagramRetry\(diagram\)/);
assert.match(source, /window\.setTimeout/);
assert.match(source, /diagram-zoom-viewport/);
assert.match(source, /diagram-zoom-toolbar/);
assert.match(source, /可缩放流程图或思维导图/);
assert.match(source, /INITIAL_FIT_PADDING = 28/);
assert.match(source, /READABLE_INITIAL_SCALE = 1\.0/);
assert.match(source, /INITIAL_MAX_SCALE = 1\.8/);
assert.match(source, /MAX_SURFACE_HEIGHT = 460/);
assert.match(source, /fitDiagramToSurface/);
assert.match(source, /normalizeDiagramSvgSize\(diagram\)/);
assert.match(source, /viewBox\.width/);
assert.match(source, /svg\.style\.width/);
assert.match(source, /getDiagramBounds/);
assert.match(source, /ResizeObserver/);
assert.match(source, /contentRect/);
assert.match(source, /addEventListener\("wheel"/);
assert.match(source, /addEventListener\("pointerdown"/);
assert.match(source, /addEventListener\("pointermove"/);
assert.match(source, /createZoomButton\("−", "缩小"\)/);
assert.match(source, /createZoomButton\("\+", "放大"\)/);
assert.match(source, /createZoomButton\("100%", "重置缩放"\)/);
assert.match(themeEntry, /import "\.\/diagram-zoom"/);
assert.match(styles, /\.diagram-zoom-viewport/);
assert.match(styles, /height:\s*clamp\(180px,\s*40vw,\s*460px\)/);
assert.match(styles, /display:\s*grid/);
assert.match(styles, /place-items:\s*center/);
assert.match(styles, /\.diagram-zoom-surface/);
assert.match(styles, /\.diagram-zoom-content\s+svg/);
assert.match(styles, /max-width:\s*none/);
assert.match(styles, /\.diagram-zoom-button/);

const compactFit = calculateDiagramFit({
  surfaceWidth: 688,
  bounds: { x: 40, y: 18, width: 360, height: 46 },
});
assert.ok(compactFit.scale > 1.3, "small Mermaid diagrams should be noticeably enlarged for legibility");
assert.ok(compactFit.surfaceHeight <= 180, "small Mermaid diagrams should not sit in a huge empty panel");
assert.equal(Math.round((compactFit.x + 40 * compactFit.scale) + (360 * compactFit.scale) / 2), 344);
assert.equal(Math.round((compactFit.y + 18 * compactFit.scale) + (46 * compactFit.scale) / 2), Math.round(compactFit.surfaceHeight / 2));

const largeFit = calculateDiagramFit({
  surfaceWidth: 688,
  bounds: { x: 120, y: 80, width: 1600, height: 820 },
});
assert.ok(largeFit.scale >= 1.0, "large Mermaid diagrams should open at full readable scale, not shrunk");
assert.equal(Math.round(largeFit.x + 120 * largeFit.scale), 28, "wide Mermaid diagrams should open at the reading start");
assert.ok(largeFit.surfaceHeight <= 460, "large Mermaid diagrams should keep a bounded panel height");

console.log("diagram-zoom.test.mts: ok");
