import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");

function extractEntriesBlock(source) {
  const match = source.match(/var ENTRIES = \[(?<entries>[\s\S]*?)\n\s*\];/);
  assert.ok(match?.groups?.entries, "ENTRIES data source should remain readable");
  return match.groups.entries;
}

test("gateway keeps the existing destinations and adds Tech Persistence once", () => {
  const entries = extractEntriesBlock(html);
  const expectedPaths = [
    "/pipeline/",
    "/agent-build/",
    "/aicrew/",
    "/tech-persistence/",
  ];

  for (const path of expectedPaths) {
    assert.equal(
      [...entries.matchAll(new RegExp(`href:\\s*"${path.replaceAll("/", "\\/")}"`, "g"))].length,
      1,
      `${path} should appear exactly once in ENTRIES`,
    );
  }

  assert.match(entries, /title:\s*"Tech Persistence"/);
});

test("no-script navigation exposes every destination", () => {
  const noscript = html.match(/<noscript>(?<content>[\s\S]*?)<\/noscript>/);
  assert.ok(noscript?.groups?.content, "noscript fallback should exist");

  for (const path of [
    "/pipeline/",
    "/agent-build/",
    "/aicrew/",
    "/tech-persistence/",
  ]) {
    assert.match(noscript.groups.content, new RegExp(`href="${path}"`));
  }
});

test("even destination counts use a balanced two-column desktop layout", () => {
  assert.match(
    html,
    /feed\.dataset\.layout\s*=\s*ENTRIES\.length\s*%\s*2\s*===\s*0\s*\?\s*"balanced"\s*:\s*"featured"/,
  );
  assert.match(
    html,
    /\.feed\[data-layout="featured"\]\s+\.card:first-child\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1;/,
  );
  assert.doesNotMatch(html, /(?:^|\n)\s*\.card:first-child\s*\{/);
  assert.match(
    html,
    /\.feed\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  );
});

test("mobile layout remains a single column", () => {
  assert.match(
    html,
    /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.feed\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
  );
});
