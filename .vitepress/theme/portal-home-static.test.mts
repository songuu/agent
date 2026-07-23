import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const home = readFileSync("index.md", "utf8");
const css = readFileSync(".vitepress/theme/portal-home.css", "utf8");

test("home keeps a server-readable portal shell before client enhancement", () => {
  assert.match(home, /layout:\s*page/);
  assert.match(home, /sidebar:\s*false/);
  assert.match(home, /<main class="agent-portal-home" data-agent-portal-home>/);
  assert.match(home, /href="docs\/navigation"/);
  assert.match(home, /href="capstone\/"/);
  assert.match(home, /href="news\/"/);
  assert.match(home, /href="source-analysis\/repository-matrix"/);
  assert.doesNotMatch(home, /href="\/(?:docs|capstone|news|source-analysis|agent-basics|lessons|rag-advanced|langgraph-advanced)/);
  assert.match(home, /data-agent-portal-news/);
  assert.doesNotMatch(home, /情报列表正在同步/);
});

test("portal styles remain namespaced, responsive and motion-safe", () => {
  assert.match(css, /\.agent-portal-home\s*\{/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.agent-portal-home[\s\S]*\.agent-portal-news/s);
  assert.match(css, /:root:not\(\.dark\) \.agent-portal-home/);
  assert.match(css, /\.agent-portal-hero h1 em\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /\.agent-portal-news-item > a\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.agent-portal-text-link[\s\S]*min-height:\s*44px;/);
  assert.doesNotMatch(css, /(^|\n):not\(\.dark\) \.agent-portal-home/);
  assert.doesNotMatch(css, /(^|\n)\s*(body|html|\.VPDoc)\s*\{/);
});

test("portal theme text tokens keep WCAG AA contrast on their surfaces", () => {
  const dark = css.match(/\.agent-portal-home\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  const light = css.match(/:root:not\(\.dark\) \.agent-portal-home\s*\{([^}]*)\}/)?.[1] ?? "";

  assertThemeContrast(dark, "dark");
  assertThemeContrast(`${dark}\n${light}`, "light");
});

function assertThemeContrast(block: string, label: string): void {
  const surface = cssToken(block, "portal-surface");
  for (const token of ["portal-muted", "portal-dim", "portal-accent", "portal-mint", "portal-blue"]) {
    assert.ok(
      contrastRatio(cssToken(block, token), surface) >= 4.5,
      `${label} --${token} must reach 4.5:1 on --portal-surface`,
    );
  }

  assert.ok(
    contrastRatio(cssToken(block, "portal-on-accent"), cssToken(block, "portal-accent-fill")) >= 4.5,
    `${label} primary action text must reach 4.5:1`,
  );
}

function cssToken(block: string, name: string): string {
  const matches = [...block.matchAll(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "gi"))];
  const value = matches.at(-1)?.[1];
  assert.ok(value, `missing hex token --${name}`);
  return value;
}

function contrastRatio(left: string, right: string): number {
  const leftLuminance = relativeLuminance(left);
  const rightLuminance = relativeLuminance(right);
  return (
    (Math.max(leftLuminance, rightLuminance) + 0.05) /
    (Math.min(leftLuminance, rightLuminance) + 0.05)
  );
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
