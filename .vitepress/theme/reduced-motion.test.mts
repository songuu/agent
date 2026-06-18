import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * 不变量守门：凡是给 concept 视觉元素（concept-svg-* / concept-visual-*）挂了真实
 * `animation`（非 `animation: none`）的选择器，都必须同时出现在
 * `@media (prefers-reduced-motion: reduce)` 的关停列表里。
 *
 * WHY：动画分散在多个规则块，新增场景时极易"加了动画却忘了加减动关停"
 * （本测试因 2026-06-11 sprint 漏掉 `.concept-svg-node rect` 而新增）。
 * tsc / 结构化 HTML 测试都测不到 CSS 减动行为，必须单独守。
 */
// 先剥离 CSS 注释，避免注释文本被 [^{}] 规则正则粘进选择器。
const css = readFileSync(".vitepress/theme/custom.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

// 1) 提取 prefers-reduced-motion 块（文件末尾、闭合括号在第 0 列）。
const reducedMotion = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);
assert.ok(reducedMotion, "custom.css must contain a prefers-reduced-motion: reduce block");
const reducedMotionBlock = reducedMotion[1]!;

// 2) 扫描所有"带真实 animation"的规则，收集其中的 concept 选择器。
//    [^{}] 只匹配最内层规则块，天然跳过 @media / @keyframes 外壳。
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
const animatedSelectors = new Set<string>();
for (let match = ruleRe.exec(css); match; match = ruleRe.exec(css)) {
  const selectorGroup = match[1]!;
  const body = match[2]!;
  if (!/animation\s*:/.test(body) || /animation\s*:\s*none/.test(body)) continue;
  for (const selector of selectorGroup.split(",").map((s) => s.trim())) {
    if (/concept-(svg|visual)/.test(selector)) animatedSelectors.add(selector);
  }
}

assert.ok(
  animatedSelectors.size >= 8,
  `expected several animated concept selectors to guard, got ${animatedSelectors.size}`,
);

// 3) 每个带动画的 concept 选择器都必须被减动关停列表覆盖。
const missing = [...animatedSelectors].filter((selector) => !reducedMotionBlock.includes(selector));
assert.deepEqual(
  missing,
  [],
  `prefers-reduced-motion must disable animation for these selectors: ${missing.join(" | ")}`,
);

// 4) 具体回归：本 sprint 漏过的 .concept-svg-node rect 必须在列表里。
assert.ok(
  reducedMotionBlock.includes(".concept-svg-node rect"),
  "loop/pipeline/fusion rect nodes must be silenced under prefers-reduced-motion",
);

// 5) 首页运动化（2026-06-18 home-motion sprint）：hero 入场 / 流动渐变 / 辉光呼吸是 hero 区的真
//    animation（非 concept 选择器，步骤 2 的 concept 过滤不覆盖），单独守门，防后续 sprint 漏镜像。
const heroAnimatedSelectors = [
  ".VPHero .name",
  ".VPHero .text",
  ".VPHero .tagline",
  ".VPHero .actions",
  ".dark .VPHero .name .clip",
];
const heroMissing = heroAnimatedSelectors.filter(
  (selector) => !reducedMotionBlock.includes(selector),
);
assert.deepEqual(
  heroMissing,
  [],
  `prefers-reduced-motion must disable hero motion for these selectors: ${heroMissing.join(" | ")}`,
);

console.log("reduced-motion.test.mts: ok");
