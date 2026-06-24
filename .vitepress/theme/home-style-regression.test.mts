import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(".vitepress/theme/custom.css", "utf8");

assert.doesNotMatch(
  css,
  /letter-spacing:\s*-/,
  "display typography must not use negative letter-spacing",
);

const mobileStart = css.indexOf("@media (max-width: 640px)");
assert.ok(mobileStart >= 0, "custom.css must contain a mobile max-width: 640px block");
const nextMedia = css.indexOf("@media ", mobileStart + 1);
const mobileBlock = css.slice(mobileStart, nextMedia === -1 ? undefined : nextMedia);

assert.match(
  mobileBlock,
  /\.VPHero \.name,\s*\n\s*\.VPHero \.text,\s*\n\s*\.VPHero \.tagline\s*\{[\s\S]*max-width:\s*calc\(100vw - 48px\)[\s\S]*overflow-wrap:\s*anywhere[\s\S]*word-break:\s*break-word/s,
  "mobile hero title/tagline must be constrained to the viewport and allowed to wrap",
);

assert.match(
  mobileBlock,
  /\.VPHero \.name \.clip,\s*\n\s*\.VPHero \.text > span,\s*\n\s*\.VPHero \.tagline > span\s*\{[\s\S]*white-space:\s*normal[\s\S]*word-break:\s*break-word/s,
  "mobile hero inline text wrappers must not force a single unbreakable line",
);

assert.match(
  mobileBlock,
  /\.VPHero \.name,\s*\n\s*\.VPHero \.text\s*\{[\s\S]*display:\s*block[\s\S]*font-size:\s*30px/s,
  "mobile hero title sizes must stay within the constrained column",
);

assert.match(
  mobileBlock,
  /\.VPHero \.action\s*\{[\s\S]*padding:\s*0/s,
  "mobile hero actions must not inherit extra default padding that pushes CTA buttons off-row",
);

console.log("home-style-regression.test.mts: ok");
