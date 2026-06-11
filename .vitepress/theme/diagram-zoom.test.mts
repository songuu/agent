import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateDiagramFit, calculateContainedFit } from "./diagram-zoom";

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
assert.match(source, /MIN_CONTAIN_SCALE = 0\.5/);
assert.match(source, /INITIAL_MAX_SCALE = 1\.8/);
assert.match(source, /MAX_SURFACE_HEIGHT = 520/);
assert.match(source, /fitDiagramToSurface/);
// 测量前归零 transform，防止 getBoundingClientRect 推导的边界被上一轮 scale 污染。
assert.match(source, /diagram\.style\.transform = "none"/);
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
assert.match(styles, /height:\s*clamp\(200px,\s*44vw,\s*520px\)/);
assert.match(styles, /display:\s*grid/);
assert.match(styles, /place-items:\s*center/);
assert.match(styles, /\.diagram-zoom-surface/);
assert.match(styles, /\.diagram-zoom-content\s+svg/);
assert.match(styles, /max-width:\s*none/);
assert.match(styles, /\.diagram-zoom-button/);
// 溢出渐隐提示（不静默裁切）。
assert.match(source, /updateOverflowAffordance/);
assert.match(source, /has-overflow-x/);
assert.match(source, /has-overflow-y/);
assert.match(styles, /\.diagram-zoom-surface\.has-overflow-y::after/);
// 单纯点击不锁定 hasUserTransform，仅真正位移后锁定 → 之后 resize 仍会自动 fit。
assert.match(source, /nextX !== state\.x \|\| nextY !== state\.y/);
// 字体就绪后补一次 fit，修正冷加载字体替换造成的初始偏差。
assert.match(source, /document\.fonts\?\.ready/);
// NaN 边界走兜底，不产出 scale\(NaN\)。
assert.match(source, /!\(surfaceWidth > 0\)/);
// 全屏弹层：展开/关闭按钮、遮罩、滚动锁、定宽高 contain。
assert.match(source, /createZoomButton\("⤢", "全屏查看"\)/);
assert.match(source, /createZoomButton\("✕", "关闭全屏"\)/);
assert.match(source, /openDiagramOverlay\(diagram\)/);
assert.match(source, /diagram-zoom-overlay/);
assert.match(source, /document\.body\.style\.overflow = "hidden"/);
assert.match(source, /calculateContainedFit/);
assert.match(styles, /\.diagram-zoom-overlay-panel/);
assert.match(styles, /\.diagram-zoom-overlay-surface/);
// 弹层加固：close 幂等守门 + Tab 焦点陷阱 + 移动端高度用双类提权盖过 @media。
assert.match(source, /if \(!overlay\.isConnected\) return;/);
assert.match(source, /focusables\.includes\(active\)/);
assert.match(styles, /\.diagram-zoom-overlay-panel \.diagram-zoom-overlay-surface/);

const compactFit = calculateDiagramFit({
  surfaceWidth: 688,
  bounds: { x: 40, y: 18, width: 360, height: 46 },
});
assert.ok(compactFit.scale > 1.3, "small Mermaid diagrams should be noticeably enlarged for legibility");
assert.ok(compactFit.surfaceHeight <= 180, "small Mermaid diagrams should not sit in a huge empty panel");
assert.equal(Math.round((compactFit.x + 40 * compactFit.scale) + (360 * compactFit.scale) / 2), 344);
assert.equal(Math.round((compactFit.y + 18 * compactFit.scale) + (46 * compactFit.scale) / 2), Math.round(compactFit.surfaceHeight / 2));

// Medium-wide diagram (the 图解学习地图 case): contain both axes so the whole map is
// visible at once — no horizontal clipping, centered. This is the "show as much content
// as possible" guarantee the previous open-at-100%-and-overflow policy violated.
const containFit = calculateDiagramFit({
  surfaceWidth: 720,
  bounds: { x: 24, y: 30, width: 900, height: 340 },
});
assert.ok(containFit.scale < 1.0, "a diagram wider than the surface must shrink to fit, not overflow");
assert.ok(containFit.scale >= 0.5, "contain must not shrink below the legibility floor");
const containLeft = containFit.x + 24 * containFit.scale;
const containRight = containFit.x + (24 + 900) * containFit.scale;
assert.ok(containLeft >= -0.5, "left edge of the contained diagram must stay inside the surface");
assert.ok(containRight <= 720 + 0.5, "right edge of the contained diagram must stay inside the surface (nothing clipped)");
assert.equal(
  Math.round(containFit.x + 24 * containFit.scale + (900 * containFit.scale) / 2),
  360,
  "a contained diagram is horizontally centered",
);

// Oversized diagram: contain would drop below the legibility floor, so it clamps to
// MIN_CONTAIN_SCALE and overflows horizontally (drag to pan); panel height stays bounded.
const largeFit = calculateDiagramFit({
  surfaceWidth: 688,
  bounds: { x: 120, y: 80, width: 1600, height: 820 },
});
assert.equal(largeFit.scale, 0.5, "oversized diagrams clamp to the contain floor");
assert.equal(Math.round(largeFit.x + 120 * largeFit.scale), 28, "an overflowing diagram pins to the reading start");
assert.ok(largeFit.surfaceHeight <= 520, "large Mermaid diagrams should keep a bounded panel height");

// Viewport cap: a small-screen height budget shrinks the panel so it never eats the page.
const cappedFit = calculateDiagramFit({
  surfaceWidth: 720,
  bounds: { x: 0, y: 0, width: 600, height: 900 },
  maxSurfaceHeight: 320,
});
const uncappedFit = calculateDiagramFit({
  surfaceWidth: 720,
  bounds: { x: 0, y: 0, width: 600, height: 900 },
});
assert.ok(cappedFit.surfaceHeight <= 320, "maxSurfaceHeight caps the panel height on small viewports");
assert.ok(uncappedFit.surfaceHeight > cappedFit.surfaceHeight, "the viewport cap actually reduces panel height");

// Tall diagram that DOES fit vertically (height-driven contain): whole diagram visible and
// vertically centered — the height axis of calculateAxisOffset, previously untested.
const tallFit = calculateDiagramFit({
  surfaceWidth: 720,
  bounds: { x: 0, y: 20, width: 300, height: 560 },
});
assert.ok(tallFit.scale < 1.0, "a height-bound diagram is driven by heightScale, not width");
const tallTop = tallFit.y + 20 * tallFit.scale;
const tallBottom = tallFit.y + (20 + 560) * tallFit.scale;
assert.ok(tallTop >= -0.5, "top edge of a vertically-fitting diagram stays inside the panel");
assert.ok(tallBottom <= tallFit.surfaceHeight + 0.5, "bottom edge of a vertically-fitting diagram stays inside the panel");
assert.equal(
  Math.round(tallFit.y + 20 * tallFit.scale + (560 * tallFit.scale) / 2),
  Math.round(tallFit.surfaceHeight / 2),
  "a vertically-fitting diagram is vertically centered",
);

// Tall diagram whose height-contain scale falls below the legibility floor: clamps to
// MIN_CONTAIN_SCALE and overflows vertically, pinned to the reading start (top). Matches the
// horizontal largeFit contract on the vertical axis (overflow handled by drag + fade cue).
const tallOverflow = calculateDiagramFit({
  surfaceWidth: 720,
  bounds: { x: 0, y: 10, width: 300, height: 2000 },
});
assert.equal(tallOverflow.scale, 0.5, "a too-tall diagram clamps to the contain floor");
assert.equal(Math.round(tallOverflow.y + 10 * tallOverflow.scale), 28, "an overflowing tall diagram pins to the reading start (top)");
assert.ok(tallOverflow.surfaceHeight <= 520, "an overflowing tall diagram keeps a bounded panel height");

// Fullscreen overlay contain into a FIXED big box. Small diagram: clamps to the overlay max
// scale and centers (fills the modal); doesn't auto-resize the box.
const containedSmall = calculateContainedFit({
  surfaceWidth: 1200,
  surfaceHeight: 800,
  bounds: { x: 0, y: 0, width: 300, height: 120 },
  minScale: 0.45,
  maxScale: 2.5,
});
assert.equal(containedSmall.scale, 2.5, "a small diagram fills the overlay up to the overlay max scale");
assert.equal(Math.round(containedSmall.x + (300 * containedSmall.scale) / 2), 600, "overlay small diagram centered horizontally");
assert.equal(Math.round(containedSmall.y + (120 * containedSmall.scale) / 2), 400, "overlay small diagram centered vertically");

// Large diagram in the overlay: the lower overlay floor (0.45) lets the WHOLE diagram fit
// (no forced overflow), centered both axes — that is the point of opening fullscreen.
const containedLarge = calculateContainedFit({
  surfaceWidth: 1200,
  surfaceHeight: 800,
  bounds: { x: 0, y: 0, width: 2400, height: 1600 },
  minScale: 0.45,
  maxScale: 2.5,
});
assert.ok(containedLarge.scale > 0.45 && containedLarge.scale < 0.5, "a large diagram contains fully in the overlay, below the inline 0.5 floor");
assert.ok(containedLarge.x >= -0.5, "overlay large diagram left edge inside the box");
assert.ok(containedLarge.x + 2400 * containedLarge.scale <= 1200 + 0.5, "overlay large diagram right edge inside the box (nothing clipped)");
assert.ok(containedLarge.y >= -0.5, "overlay large diagram top edge inside the box");
assert.ok(containedLarge.y + 1600 * containedLarge.scale <= 800 + 0.5, "overlay large diagram bottom edge inside the box");

console.log("diagram-zoom.test.mts: ok");
