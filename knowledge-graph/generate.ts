/**
 * 知识图谱生成器：读取唯一数据源 data/graph.ts，产出三类产物：
 *   1) docs/knowledge-graph.md           —— 全局知识图谱（Mermaid 章级图 + 概念图 + 索引 + 文章）
 *   2) knowledge-graph/output/index.html —— 交互式图谱（"动图"，Cytoscape）
 *   3) 每章 README 注入「## 知识图谱与延伸阅读」（标记 <!-- KG:START/END --> 幂等替换）
 *
 * 运行：npm run kg   （= npx tsx knowledge-graph/generate.ts）
 *   --no-inject  仅生成全局 md 与 HTML，不改任何 README（数据未填满时用）。
 *
 * 设计原则：纯 Node fs、零第三方依赖；幂等（可反复运行）；数据非法立即 fail-fast。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CHAPTERS,
  CONCEPTS,
  RELATIONS,
  ARTICLES,
  type Chapter,
  type Concept,
  type Article,
} from "./data/graph";
import { buildHtml, type HtmlData, type HtmlNode } from "./templates/html";

const ROOT = join(import.meta.dirname, "..");
const MARK_START = "<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->";
const MARK_END = "<!-- KG:END -->";

// ── 工具函数 ────────────────────────────────────────────────────────────────

/** Mermaid 节点 id 只能用安全字符；把概念 id 映射成安全形式。 */
function safeId(id: string): string {
  return "n_" + id.replace(/[^a-zA-Z0-9]/g, "_");
}

/** Mermaid 节点 label 里不能出现裸 " [ ]，做一次温和转义。 */
function safeLabel(label: string): string {
  return label.replace(/"/g, "'").replace(/\[/g, "【").replace(/\]/g, "】");
}

/**
 * 概念图谱关系类型 → 连线配色。
 * WHY 固定 hex 而非主题变量：Mermaid linkStyle 不读 CSS 变量；这些中间饱和度色
 * 在明暗双主题的图表画布上都清晰，相当于一张内嵌图例。
 */
const RELATION_COLOR: Record<string, string> = {
  前置: "#2563eb", // 蓝：学它前要先会
  深化: "#7c3aed", // 紫：更深一层
  对比: "#db2777", // 玫红：同类对照
  应用: "#059669", // 绿：落地用法
  组成: "#d97706", // 橙：构成部件
};
const RELATION_COLOR_FALLBACK = "#64748b";

/** 概念图谱节点数超过该值时，从 LR 切到 TB（思维导图式自上而下），降低横向拥挤。 */
const CONCEPT_GRAPH_DENSE_NODES = 8;

/** 从某章目录指向仓库内某目标文件的相对链接（统一正斜杠）。 */
function relLink(fromChapterDir: string, toRepoPath: string): string {
  const fromDir = join(ROOT, fromChapterDir);
  const to = join(ROOT, toRepoPath);
  return relative(fromDir, to).split("\\").join("/");
}

function articleSource(article: Article): string {
  if (article.source) return article.source;
  try {
    return new URL(article.url).hostname.replace(/^www\./, "");
  } catch {
    return "local";
  }
}

// ── 数据校验（fail-fast）────────────────────────────────────────────────────

function validate(): void {
  const chapterIds = new Set(CHAPTERS.map((c) => c.id));
  const conceptIds = new Set<string>();
  const errors: string[] = [];

  for (const c of CONCEPTS) {
    if (conceptIds.has(c.id)) errors.push(`概念 id 重复：${c.id}`);
    conceptIds.add(c.id);
    if (!chapterIds.has(c.chapter)) errors.push(`概念 ${c.id} 的章节不存在：${c.chapter}`);
  }
  for (const r of RELATIONS) {
    if (!conceptIds.has(r.from)) errors.push(`关系 from 不存在的概念：${r.from}`);
    if (!conceptIds.has(r.to)) errors.push(`关系 to 不存在的概念：${r.to}`);
  }
  for (const a of ARTICLES) {
    for (const ch of a.chapters) {
      if (!chapterIds.has(ch)) errors.push(`文章「${a.title}」关联了不存在的章节：${ch}`);
    }
  }
  if (errors.length) {
    throw new Error("知识图谱数据校验失败：\n  - " + errors.join("\n  - "));
  }
}

// ── 全局图谱 docs/knowledge-graph.md ────────────────────────────────────────

function buildGlobalMd(): string {
  const lines: string[] = [];
  lines.push("# 🗺️ 全局知识图谱");
  lines.push("");
  lines.push("> 本文件由 `npm run kg` 自动生成（数据源 [`knowledge-graph/data/graph.ts`](../knowledge-graph/data/graph.ts)）。**请勿手改**，改数据源后重跑即可。");
  lines.push("");
  lines.push("交互式（可缩放/筛选/点节点看关联文章）版本：[`knowledge-graph/output/index.html`](../knowledge-graph/output/index.html)（下载到本地用浏览器打开）。");
  lines.push("");
  lines.push(`共 **${CHAPTERS.length}** 个单元、**${CONCEPTS.length}** 个概念、**${RELATIONS.length}** 条关系、**${ARTICLES.length}** 篇关联文章。`);
  lines.push("");

  // 1) 章节地图（按部分聚类 + 顺序流）
  lines.push("## 章节地图");
  lines.push("");
  lines.push("```mermaid");
  lines.push("flowchart LR");
  const parts = [...new Set(CHAPTERS.map((c) => c.part))];
  parts.forEach((part, pi) => {
    lines.push(`  subgraph P${pi}["${safeLabel(part)}"]`);
    for (const ch of CHAPTERS.filter((c) => c.part === part)) {
      lines.push(`    C_${ch.id}["${ch.id} ${safeLabel(ch.title)}"]`);
    }
    lines.push("  end");
  });
  for (let i = 0; i < CHAPTERS.length - 1; i++) {
    const a = CHAPTERS[i]!;
    const b = CHAPTERS[i + 1]!;
    lines.push(`  C_${a.id} --> C_${b.id}`);
  }
  lines.push("```");
  lines.push("");

  // 2) 概念图谱（按部分 subgraph + 关系边）
  lines.push("## 概念图谱");
  lines.push("");
  lines.push("> 关系类型：`前置`（学它前要先会）· `深化`（更深一层）· `对比`（同类对照）· `应用`（落地用法）· `组成`（构成部件）。");
  lines.push("");
  lines.push("```mermaid");
  lines.push("graph LR");
  parts.forEach((part, pi) => {
    const partChapterIds = new Set(CHAPTERS.filter((c) => c.part === part).map((c) => c.id));
    const partConcepts = CONCEPTS.filter((c) => partChapterIds.has(c.chapter));
    if (partConcepts.length === 0) return;
    lines.push(`  subgraph G${pi}["${safeLabel(part)}"]`);
    for (const c of partConcepts) {
      lines.push(`    ${safeId(c.id)}["${safeLabel(c.label)}"]`);
    }
    lines.push("  end");
  });
  for (const r of RELATIONS) {
    lines.push(`  ${safeId(r.from)} -->|${r.type}| ${safeId(r.to)}`);
  }
  lines.push("```");
  lines.push("");

  // 3) 概念索引
  lines.push("## 概念索引");
  lines.push("");
  lines.push("| 概念 | 章节 | 说明 |");
  lines.push("| --- | --- | --- |");
  const chapterById = new Map(CHAPTERS.map((c) => [c.id, c]));
  for (const c of CONCEPTS) {
    const ch = chapterById.get(c.chapter);
    const chLink = ch ? `[${ch.id} ${ch.title}](../${ch.dir}/README.md)` : c.chapter;
    lines.push(`| ${c.label} | ${chLink} | ${c.summary ?? ""} |`);
  }
  lines.push("");

  // 4) 关联文章索引
  lines.push("## 关联文章");
  lines.push("");
  lines.push("> 想新增文章？在 `knowledge-graph/data/graph.ts` 的 `ARTICLES` 加一条，跑 `npm run kg` 即可。外部链接请自行核实有效性。");
  lines.push("");
  lines.push("| 文章 | 来源 | 类型 | 关联章节 | 说明 |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const a of ARTICLES) {
    const chs = a.chapters.join(", ");
    lines.push(`| [${a.title}](${a.url}) | ${articleSource(a)} | ${a.kind} | ${chs} | ${a.note ?? ""} |`);
  }
  lines.push("");
  return lines.join("\n");
}

// ── 交互式 HTML 数据 ────────────────────────────────────────────────────────

function buildHtmlData(): HtmlData {
  const chapterById = new Map(CHAPTERS.map((c) => [c.id, c]));
  const articlesByChapter = new Map<string, { title: string; url: string; source: string }[]>();
  for (const a of ARTICLES) {
    for (const ch of a.chapters) {
      const list = articlesByChapter.get(ch) ?? [];
      list.push({ title: a.title, url: a.url, source: articleSource(a) });
      articlesByChapter.set(ch, list);
    }
  }
  const nodes: HtmlNode[] = CONCEPTS.map((c) => {
    const ch = chapterById.get(c.chapter);
    return {
      id: c.id,
      label: c.label,
      chapter: c.chapter,
      chapterTitle: ch ? ch.title : c.chapter,
      part: ch ? ch.part : "其他",
      summary: c.summary ?? "",
      articles: articlesByChapter.get(c.chapter) ?? [],
    };
  });
  const edges = RELATIONS.map((r) => ({ source: r.from, target: r.to, type: r.type }));
  const parts = [...new Set(CHAPTERS.map((c) => c.part))];
  return { parts, nodes, edges };
}

// ── 每章注入段 ──────────────────────────────────────────────────────────────

/**
 * 构建某章「本章概念图谱」的 Mermaid 代码块（纯函数，可单测）。
 * - 本章概念用 `own` classDef 高亮（橙框），关联的他章概念用 `cross`（蓝框弱化）。
 * - 连线按关系类型 linkStyle 配色。
 * - 节点数超过 CONCEPT_GRAPH_DENSE_NODES 时切到 TB，降低密集章节的横向拥挤。
 * 本章无概念时返回空串。
 */
export function buildChapterConceptGraph(ch: Chapter): string {
  const own = CONCEPTS.filter((c) => c.chapter === ch.id);
  if (own.length === 0) return "";

  const conceptById = new Map(CONCEPTS.map((c) => [c.id, c]));
  const ownIds = new Set(own.map((c) => c.id));
  const edges = RELATIONS.filter((r) => ownIds.has(r.from) || ownIds.has(r.to));
  const shownIds = new Set<string>(ownIds);
  for (const e of edges) {
    shownIds.add(e.from);
    shownIds.add(e.to);
  }

  const direction = shownIds.size > CONCEPT_GRAPH_DENSE_NODES ? "TB" : "LR";
  const lines: string[] = [];
  lines.push("```mermaid");
  lines.push(`graph ${direction}`);
  lines.push("  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;");
  lines.push("  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;");

  const crossIds: string[] = [];
  for (const id of shownIds) {
    const c = conceptById.get(id);
    if (!c) continue;
    const isOwn = ownIds.has(id);
    const label = isOwn ? c.label : `${c.label}（第${c.chapter}章）`;
    lines.push(`  ${safeId(id)}["${safeLabel(label)}"]`);
    if (!isOwn) crossIds.push(safeId(id));
  }

  // 连线 + 按关系类型着色（linkStyle 序号必须与边的生成顺序严格对齐）。
  const linkStyles: string[] = [];
  edges.forEach((e, index) => {
    lines.push(`  ${safeId(e.from)} -->|${e.type}| ${safeId(e.to)}`);
    const color = RELATION_COLOR[e.type] ?? RELATION_COLOR_FALLBACK;
    linkStyles.push(`  linkStyle ${index} stroke:${color},stroke-width:2px;`);
  });

  lines.push(`  class ${own.map((c) => safeId(c.id)).join(",")} own;`);
  if (crossIds.length) lines.push(`  class ${crossIds.join(",")} cross;`);
  lines.push(...linkStyles);
  lines.push("```");
  return lines.join("\n");
}

function buildChapterSection(ch: Chapter): string {
  const own = CONCEPTS.filter((c) => c.chapter === ch.id);
  const conceptById = new Map(CONCEPTS.map((c) => [c.id, c]));
  const chapterById = new Map(CHAPTERS.map((c) => [c.id, c]));
  const ownIds = new Set(own.map((c) => c.id));

  // 与本章概念相关的边（任一端在本章），供下方「跨章关系列表」使用。
  // 图谱本体（节点/方向/配色）已下放到 buildChapterConceptGraph 纯函数。
  const edges = RELATIONS.filter((r) => ownIds.has(r.from) || ownIds.has(r.to));

  const lines: string[] = [];
  lines.push(MARK_START);
  lines.push("");
  lines.push("## 知识图谱与延伸阅读");
  lines.push("");
  lines.push("> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。");
  lines.push("");

  if (own.length === 0) {
    lines.push("_本章概念尚未录入图谱（可在 `graph.ts` 的 `CONCEPTS` 中补充）。_");
    lines.push("");
  } else {
    lines.push("### 本章概念图谱");
    lines.push("");
    lines.push(
      "> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。",
    );
    lines.push("");
    lines.push(buildChapterConceptGraph(ch));
    lines.push("");
  }

  // 跨章关系列表
  const crossRels = edges.filter((e) => {
    const a = conceptById.get(e.from);
    const b = conceptById.get(e.to);
    return a && b && a.chapter !== b.chapter;
  });
  if (crossRels.length) {
    lines.push("### 与其他章节的关系");
    lines.push("");
    for (const e of crossRels) {
      const a = conceptById.get(e.from)!;
      const b = conceptById.get(e.to)!;
      lines.push(`- \`${a.label}\` —**${e.type}**→ \`${b.label}\`（第 ${a.chapter === ch.id ? b.chapter : a.chapter} 章）`);
    }
    lines.push("");
  }

  // 延伸阅读
  const arts: Article[] = ARTICLES.filter((a) => a.chapters.includes(ch.id));
  lines.push("### 延伸阅读");
  lines.push("");
  if (arts.length) {
    const showArticleSource = ch.id === "19";
    if (showArticleSource) {
      lines.push("> 标题可点击查看原文；来源为发布方或官方文档站。");
      lines.push("");
    }
    for (const a of arts) {
      const prefix = showArticleSource ? `来源：${articleSource(a)} · ` : "";
      lines.push(`- ${prefix}[${a.title}](${a.url})${a.note ? " — " + a.note : ""} \`${a.kind}\``);
    }
  } else {
    lines.push("_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_");
  }
  lines.push("");

  const globalLink = relLink(ch.dir, "docs/knowledge-graph.md");
  const htmlLink = relLink(ch.dir, "knowledge-graph/output/index.html");
  lines.push(`> 🗺️ 在[全局知识图谱](${globalLink}) / [交互式图谱](${htmlLink}) 中查看本章位置。`);
  lines.push("");
  lines.push(MARK_END);
  return lines.join("\n");
}

/** 把注入段写进某章 README（幂等）。返回是否发生改动。 */
function injectChapter(ch: Chapter): "updated" | "unchanged" | "missing" {
  const readmePath = join(ROOT, ch.dir, "README.md");
  if (!existsSync(readmePath)) return "missing";
  const original = readFileSync(readmePath, "utf8");
  const section = buildChapterSection(ch);

  let next: string;
  const startIdx = original.indexOf(MARK_START);
  const endIdx = original.indexOf(MARK_END);
  if (startIdx >= 0 && endIdx > startIdx) {
    // 替换标记区
    next = original.slice(0, startIdx) + section + original.slice(endIdx + MARK_END.length);
  } else {
    // 首次：插在「## 五、小结与延伸」前；找不到则文末追加
    const anchor = "## 五、小结与延伸";
    const anchorIdx = original.indexOf(anchor);
    if (anchorIdx >= 0) {
      next = original.slice(0, anchorIdx) + section + "\n\n" + original.slice(anchorIdx);
    } else {
      next = original.replace(/\s*$/, "") + "\n\n" + section + "\n";
    }
  }
  if (next === original) return "unchanged";
  writeFileSync(readmePath, next, "utf8");
  return "updated";
}

// ── 主流程 ──────────────────────────────────────────────────────────────────

function main(): void {
  const noInject = process.argv.includes("--no-inject");
  validate();

  // 1) 全局 md
  const globalMdPath = join(ROOT, "docs", "knowledge-graph.md");
  writeFileSync(globalMdPath, buildGlobalMd(), "utf8");
  console.log(`✓ 全局图谱 → ${relative(ROOT, globalMdPath).split("\\").join("/")}`);

  // 2) 交互 HTML
  const outDir = join(ROOT, "knowledge-graph", "output");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, "index.html");
  writeFileSync(htmlPath, buildHtml(buildHtmlData()), "utf8");
  console.log(`✓ 交互图谱 → ${relative(ROOT, htmlPath).split("\\").join("/")}`);

  // 3) 每章注入
  if (noInject) {
    console.log("· 跳过 README 注入（--no-inject）");
  } else {
    let updated = 0;
    let unchanged = 0;
    let missing = 0;
    for (const ch of CHAPTERS) {
      const r = injectChapter(ch);
      if (r === "updated") updated++;
      else if (r === "unchanged") unchanged++;
      else missing++;
    }
    console.log(`✓ README 注入：更新 ${updated} · 未变 ${unchanged} · 缺失 ${missing}`);
  }

  console.log(
    `完成：${CHAPTERS.length} 单元 / ${CONCEPTS.length} 概念 / ${RELATIONS.length} 关系 / ${ARTICLES.length} 文章`,
  );
}

// 仅作为入口脚本（npm run kg）时执行；被测试 import 时不触发文件写入。
const invokedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]!).href;
if (invokedDirectly) main();
