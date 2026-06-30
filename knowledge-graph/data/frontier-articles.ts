import { ARTICLES, CHAPTERS, type Article, type FrontierEcosystemLayer } from "./graph.ts";
import { FRONTIER_ECOSYSTEM_LAYERS } from "./frontier-ecosystem-layers.ts";
export { FRONTIER_ECOSYSTEM_LAYERS } from "./frontier-ecosystem-layers.ts";

export interface FrontierArticle {
  id: string;
  slug: string;
  chapterId: string;
  chapterSlug: string;
  title: string;
  source: string;
  url: string;
  kind: Article["kind"];
  ecosystemLayer: FrontierEcosystemLayer;
  ecosystemLayerLabel: string;
  summary: string;
  collectedDate: string;
  collectedAt: string;
  displayDateLabel: string;
  publishedAt?: string;
  author?: string;
  institution?: string;
  readCount: number;
  sortOrder: number;
  tags: string[];
  applicableModules: string[];
  confidence?: "high" | "medium" | "low";
  credibilityNote?: string;
  detailParagraphs: string[];
}

// 第 20 章是文章库承载页；资料集合沿用第 19 章生态资料，避免复制 70 篇文章清单。
const FRONTIER_SOURCE_CHAPTER_ID = "19";
const FRONTIER_CHAPTER_ID = "20";
const FRONTIER_COLLECTED_DATE = "2026-06-30";
const FRONTIER_COLLECTED_AT = `${FRONTIER_COLLECTED_DATE}T09:00:00+08:00`;
const FRONTIER_DISPLAY_DATE_LABEL = "6月30日 · 星期二";
const READ_COUNT_BASE = 73;

const chapter = CHAPTERS.find((item) => item.id === FRONTIER_CHAPTER_ID);

if (!chapter) {
  throw new Error(`Missing frontier chapter: ${FRONTIER_CHAPTER_ID}`);
}

function articleSource(article: Article): string {
  if (article.source) return article.source;
  try {
    return new URL(article.url).hostname.replace(/^www\./, "");
  } catch {
    return "local";
  }
}

function slugify(value: string, index: number): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || `frontier-article-${index + 1}`;
}

function articleTags(article: Article): string[] {
  const text = `${article.title} ${article.source ?? ""} ${article.note ?? ""}`.toLowerCase();
  const tags = new Set<string>([article.kind]);
  if (text.includes("mcp") || text.includes("model context protocol")) tags.add("mcp");
  if (text.includes("a2a") || text.includes("agent2agent")) tags.add("a2a");
  if (text.includes("guardrail") || text.includes("sandbox") || text.includes("computer use")) tags.add("governance");
  if (text.includes("eval") || text.includes("observability") || text.includes("testing") || text.includes("agent-diff")) tags.add("eval");
  if (text.includes("vercel") || text.includes("chatbot") || /\bui\b/.test(text)) tags.add("ui");
  if (text.includes("langgraph") || text.includes("crewai") || text.includes("autogen") || text.includes("semantic kernel") || text.includes("bedrock") || text.includes("adk")) {
    tags.add("runtime");
  }
  if (text.includes("llamaindex") || text.includes("file search") || text.includes("context")) tags.add("data");
  if (text.includes("openai") || text.includes("anthropic")) tags.add("model-platform");
  return [...tags];
}

function articleLayer(article: Article, tags: string[]): FrontierEcosystemLayer {
  if (article.ecosystemLayer) return article.ecosystemLayer;
  const text = `${article.title} ${article.source ?? ""} ${article.note ?? ""}`.toLowerCase();
  if (tags.includes("eval") || text.includes("benchmark") || text.includes("testing")) return "evaluation";
  if (tags.includes("governance") || text.includes("owasp") || text.includes("security") || text.includes("authorization")) return "security-governance";
  if (tags.includes("mcp") || tags.includes("a2a") || text.includes("protocol") || text.includes("apps sdk")) return "protocol";
  if (tags.includes("ui") || text.includes("operator") || text.includes("deep research") || text.includes("codex")) return "product-ui";
  if (tags.includes("runtime")) return "runtime";
  if (tags.includes("data") || text.includes("memory") || text.includes("context")) return "data-memory";
  if (tags.includes("model-platform")) return "model-platform";
  return "foundation";
}

function articleLayerLabel(layer: FrontierEcosystemLayer): string {
  return FRONTIER_ECOSYSTEM_LAYERS.find((item) => item.id === layer)?.label ?? layer;
}

function applicableModules(article: Article): string[] {
  if (article.applicableModules && article.applicableModules.length > 0) {
    return article.applicableModules;
  }
  return [
    "lessons/19-agent-ecosystem-and-frontier",
    "lessons/20-agent-frontier-news",
  ];
}

function buildDetailParagraphs(article: Article, source: string, layerLabel: string): string[] {
  const summary = article.note?.trim() || "本条资料用于补充第 20 章 Agent 前沿文章库的选型与趋势判断。";
  const publishBits = [
    article.publishedAt ? `发布时间：${article.publishedAt}` : "发布时间：待原文复核",
    article.author ? `作者：${article.author}` : undefined,
    article.institution ? `机构：${article.institution}` : undefined,
  ].filter(Boolean);
  const confidence = article.confidence ? `可信度：${article.confidence}` : undefined;
  return [
    summary,
    `${publishBits.join("。")}。体系层：${layerLabel}。来源：${source}。${confidence ? `${confidence}。` : ""}${article.credibilityNote ?? "保留原文入口供读者自行复核。"} `,
    `适用模块：${applicableModules(article).join("、")}。选择依据：按仓库现有课程结构，把这条资料挂到最直接会消费它的章节或项目模块。`,
    `查看原文可以进一步核对发布日期、API 细节、协议术语与实现边界；课程页只保留可追溯摘要，不复制原文全文。`,
  ];
}

const usedSlugs = new Set<string>();

export const FRONTIER_ARTICLES: FrontierArticle[] = ARTICLES
  .filter((article) => article.chapters.includes(FRONTIER_SOURCE_CHAPTER_ID))
  .map((article, index) => {
    const source = articleSource(article);
    const baseTags = articleTags(article);
    const ecosystemLayer = articleLayer(article, baseTags);
    const ecosystemLayerLabel = articleLayerLabel(ecosystemLayer);
    const baseSlug = slugify(article.title, index);
    const slug = usedSlugs.has(baseSlug) ? `${baseSlug}-${index + 1}` : baseSlug;
    usedSlugs.add(slug);
    return {
      id: `frontier-${String(index + 1).padStart(2, "0")}`,
      slug,
      chapterId: FRONTIER_CHAPTER_ID,
      chapterSlug: chapter.slug,
      title: article.title,
      source,
      url: article.url,
      kind: article.kind,
      ecosystemLayer,
      ecosystemLayerLabel,
      summary: article.note?.trim() || "",
      collectedDate: FRONTIER_COLLECTED_DATE,
      collectedAt: FRONTIER_COLLECTED_AT,
      displayDateLabel: FRONTIER_DISPLAY_DATE_LABEL,
      publishedAt: article.publishedAt,
      author: article.author,
      institution: article.institution,
      readCount: READ_COUNT_BASE + index * 7,
      sortOrder: index + 1,
      tags: [...new Set([...baseTags, ecosystemLayer])],
      applicableModules: applicableModules(article),
      confidence: article.confidence,
      credibilityNote: article.credibilityNote,
      detailParagraphs: buildDetailParagraphs(article, source, ecosystemLayerLabel),
    };
  });

