import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function readRepositoryFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function sectionBetween(document: string, startHeading: string, endHeading: string): string {
  const start = document.indexOf(startHeading);
  const end = document.indexOf(endHeading, start + startHeading.length);
  assert.notEqual(start, -1, `missing heading: ${startHeading}`);
  assert.notEqual(end, -1, `missing heading: ${endHeading}`);
  return document.slice(start, end);
}

const blueprint = readRepositoryFile("docs/agent-trends-architecture.md");
const lesson = readRepositoryFile("lessons/19-agent-ecosystem-and-frontier/README.md");
const graphSource = readRepositoryFile("knowledge-graph/data/graph.ts");

test("public trend sources use the reviewed 2026-07-31 A2A and AI SDK baselines", () => {
  const publicSources = `${blueprint}\n${lesson}\n${graphSource}`;

  assert.doesNotMatch(
    publicSources,
    /A2A (?:Protocol )?(?:0\.3|v0\.3)|a2a-protocol\.org\/v0\.3\.0/,
  );
  assert.match(blueprint, /A2A v1\.0 specification/);
  assert.match(lesson, /A2A v1\.0/);
  assert.match(publicSources, /https:\/\/a2a-protocol\.org\/latest\/specification\//);
  assert.doesNotMatch(publicSources, /AI SDK 5|ai-sdk-5/);
  assert.match(publicSources, /AI SDK 7/);
  assert.match(publicSources, /https:\/\/vercel\.com\/changelog\/ai-sdk-7/);
});

test("course 19 keeps standard maturity and completion policy in the right evidence buckets", () => {
  const verifiedFacts = sectionBetween(lesson, "### 已验证事实", "### 工程推断");
  const engineeringInferences = sectionBetween(lesson, "### 工程推断", "### 未知项");

  assert.match(verifiedFacts, /Initial Public Draft|概念草案/);
  assert.doesNotMatch(verifiedFacts, /身份标准|production complete/);
  assert.match(engineeringInferences, /完成态/);
  assert.match(engineeringInferences, /state|状态/);
});

test("course 19 attributes only persistent poisoning claims to the cited OWASP article", () => {
  const memoryTrend = sectionBetween(
    lesson,
    "### 2. Session、Context、Memory、Artifact 开始分离",
    "### 3. 上下文工程从“写 prompt”变成运行时调度",
  );

  assert.match(memoryTrend, /持久化.*投毒|投毒.*跨会话/);
  assert.doesNotMatch(memoryTrend, /过期|泄露/);
});

test("canonical articles separate the repository AI SDK 4 API from the current v7 baseline", () => {
  assert.match(graphSource, /AI SDK 4→5 migration/);
  assert.match(graphSource, /migration-guide-5-0/);
  assert.match(graphSource, /maxSteps.*stopWhen/);
  assert.doesNotMatch(
    graphSource,
    /chapters: \["12","19"\].*maxSteps/,
  );
});

test("canonical A2A article supports the v1 stable and migration claims", () => {
  assert.match(
    graphSource,
    /https:\/\/a2a-protocol\.org\/latest\/announcing-1\.0\//,
  );
  assert.doesNotMatch(graphSource, /developers\.googleblog\.com\/en\/a2a-a-new-era/);
});
