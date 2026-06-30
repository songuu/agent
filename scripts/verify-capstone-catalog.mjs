import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CAPSTONE_PROJECTS, CAPSTONE_PROJECT_COUNT } from "../capstone/project-catalog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function expect(condition, message) {
  if (!condition) errors.push(message);
}

expect(CAPSTONE_PROJECT_COUNT === 20, `expected 20 new capstone projects, got ${CAPSTONE_PROJECT_COUNT}`);

const requiredSections = [
  "## 最终交付",
  "## 核心流程",
  "## 数据与接口",
  "## 护栏与人工确认",
  "## 里程碑",
  "## 验收清单",
  "## 如何写进简历",
  "<!-- KG:START",
];

const hub = read("capstone/README.md");
const readme = read("README.md");
const navigation = read("docs/navigation.md");
const curriculum = read("docs/curriculum.md");
const guides = read("docs/agent-learning-guides.md");
const graph = read("knowledge-graph/data/graph.ts");
const pkg = JSON.parse(read("package.json"));

expect(Boolean(pkg.scripts?.["capstone:catalog:smoke"]), "package.json missing capstone:catalog:smoke script");
expect(pkg.scripts?.["capstone:smoke"]?.includes("capstone:catalog:smoke"), "capstone:smoke does not include capstone:catalog:smoke");

for (const project of CAPSTONE_PROJECTS) {
  const rel = `capstone/${project.slug}/README.md`;
  const abs = join(ROOT, rel);
  expect(existsSync(abs), `${rel} missing`);
  if (!existsSync(abs)) continue;

  const content = read(rel);
  for (const section of requiredSections) {
    expect(content.includes(section), `${rel} missing ${section}`);
  }
  expect(content.includes(project.title), `${rel} missing title`);
  expect(content.includes(project.resume), `${rel} missing resume pitch`);

  for (const [name, text] of [
    ["capstone hub", hub],
    ["README", readme],
    ["navigation", navigation],
    ["curriculum", curriculum],
    ["learning guides", guides],
    ["knowledge graph", graph],
  ]) {
    expect(text.includes(project.slug), `${name} missing ${project.slug}`);
  }
}

if (errors.length > 0) {
  throw new Error(`capstone catalog smoke failed:\n- ${errors.join("\n- ")}`);
}

console.log(`capstone catalog smoke passed: ${CAPSTONE_PROJECTS.length} projects`);
