import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");

function extractEntriesBlock(source) {
  const match = source.match(/var ENTRIES = \[(?<entries>[\s\S]*?)\n\s*\];/);
  assert.ok(match?.groups?.entries, "ENTRIES data source should remain readable");
  return match.groups.entries;
}

function extractEntryPaths(entries) {
  return [...entries.matchAll(/href:\s*"(?<path>[^"\n]+)"/g)].map((match) => match.groups.path);
}

test("gateway exposes every destination, including Essay, exactly once", () => {
  const entries = extractEntriesBlock(html);
  const expectedPaths = [
    "/pipeline/",
    "/agent-build/",
    "/aicrew/",
    "/tech-persistence/",
    "/essay/",
  ];

  assert.deepEqual(extractEntryPaths(entries), expectedPaths);
  assert.match(entries, /node:\s*"01"/);
  assert.match(entries, /node:\s*"05"/);
  assert.match(entries, /title:\s*"折页"/);
});

test("no-script navigation mirrors every destination", () => {
  const entries = extractEntriesBlock(html);
  const noscript = html.match(/<noscript>(?<content>[\s\S]*?)<\/noscript>/);
  assert.ok(noscript?.groups?.content, "noscript fallback should exist");

  const fallbackPaths = [...noscript.groups.content.matchAll(/href="(?<path>[^"\n]+)"/g)].map(
    (match) => match.groups.path,
  );
  assert.deepEqual(fallbackPaths, extractEntryPaths(entries));
});

test("five routes use a balanced matrix and only an explicit priority can be featured", () => {
  assert.doesNotMatch(html, /ENTRIES\.length\s*%\s*2/);
  assert.match(html, /var featuredEntry = ENTRIES\.find/);
  assert.match(html, /return entry\.featured === true/);
  assert.match(
    html,
    /feed\.dataset\.layout\s*=\s*featuredEntry\s*\?\s*"featured"\s*:\s*ENTRIES\.length\s*===\s*5\s*\?\s*"matrix-5"\s*:\s*"matrix"/,
  );
  assert.match(html, /a\.dataset\.node\s*=\s*entry\.node/);
  assert.match(html, /if \(entry\.featured === true\) a\.dataset\.featured = "true"/);
  assert.match(
    html,
    /\.feed\[data-layout="matrix-5"\]\s+\.card:nth-child\(4\)\s*\{[\s\S]*?grid-column:\s*2\s*\/\s*span\s*2;/,
  );
  assert.match(
    html,
    /\.feed\[data-layout="featured"\]\s+\.card\[data-featured="true"\]\s*\{[\s\S]*?grid-column:\s*span\s*6;/,
  );
});

test("mobile layout collapses route cards into one column", () => {
  assert.match(
    html,
    /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.feed\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
  );
});

test("motion enhancements remain reversible", () => {
  assert.match(html, /\.card\.reveal\s*\{[\s\S]*?opacity:\s*0;/);
  assert.match(html, /\.card\.reveal\.in\s*\{[\s\S]*?opacity:\s*1;/);
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("desktop briefing keeps the title to deliberate lines and the signal mark secondary", () => {
  assert.match(
    html,
    /@media\s*\(min-width:\s*761px\)\s*\{[\s\S]*?\.core-panel\s*\{[\s\S]*?align-self:\s*start;[\s\S]*?min-height:\s*0;/,
  );
  assert.match(
    html,
    /\.core-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+120px;[\s\S]*?min-height:\s*0;/,
  );
  assert.match(
    html,
    /\.title\s*\{[\s\S]*?font-size:\s*clamp\(52px,\s*4vw,\s*68px\);[\s\S]*?white-space:\s*nowrap;[\s\S]*?text-wrap:\s*nowrap;/,
  );
  assert.match(html, /\.core-visual\s*\{[\s\S]*?width:\s*120px;[\s\S]*?opacity:\s*0\.42;/);
  assert.match(
    html,
    /@media\s*\(min-width:\s*1181px\)\s*and\s*\(max-width:\s*1280px\)\s*\{[\s\S]*?\.core-visual\s*\{\s*display:\s*none;/,
  );
});
test("gateway boot is a nonblocking, reduced-motion-safe enhancement", () => {
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/);
  assert.match(html, /@keyframes\s+gateway-arrive\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?translate3d/);
  assert.match(html, /@keyframes\s+gateway-scan\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?translate3d/);
  assert.match(
    html,
    /\.gateway-enter\s+\.topbar,[\s\S]*?\.gateway-enter\s+\.core-panel,[\s\S]*?\.gateway-enter\s+\.route-panel\s*\{[\s\S]*?animation:\s*gateway-arrive/,
  );
  assert.match(html, /\.gateway-enter\s+\.core-panel::after,[\s\S]*?pointer-events:\s*none;/);
  assert.match(html, /if\s*\(!reduceMql\.matches\)\s*\{[\s\S]*?root\.classList\.add\("gateway-enter"\)/);
  assert.match(html, /root\.classList\.remove\("gateway-enter"\)[\s\S]*?\},\s*920\)/);
  assert.match(
    html,
    /feed\.appendChild\(frag\);[\s\S]*?routeCounter\.textContent\s*=\s*routeTotal;[\s\S]*?root\.classList\.add\("gateway-enter"\)/,
  );
});