// 面试题站内详情页：运行时按 ?id=<slug> 读取 interview_questions 单行并渲染正文。

import { INTERVIEW_QUESTIONS } from "../../knowledge-graph/data/interview-questions";
import { fetchAllPostgrestRows } from "./postgrest-pagination";
import { rankSimilarInterviewQuestions, type SimilarInterviewQuestion } from "./interview-similarity";
import { safeReturnPathFromSearch, withReturnPath } from "./list-detail-return";

interface InterviewFaq {
  question?: unknown;
  answer?: unknown;
}

declare const __FRONTIER_SUPABASE_CONFIG__:
  | { url: string; anonKey: string; schema: string }
  | null
  | undefined;

interface InterviewDetailRow {
  slug?: unknown;
  question?: unknown;
  answer_source?: unknown;
  category_label?: unknown;
  related_chapters?: unknown;
  collected_date?: unknown;
  tags?: unknown;
  metadata?: unknown;
}

interface InterviewMetadata {
  sourceTitles?: unknown;
  sourceUrls?: unknown;
  rationale?: unknown;
  plainTextDescription?: unknown;
  faqList?: unknown;
  answerVariants?: unknown;
  contentSections?: unknown;
  contentMarkdown?: unknown;
  sourceCreatedAt?: unknown;
  sourceUpdatedAt?: unknown;
}

interface InterviewAnswerVariant {
  title?: unknown;
  answer?: unknown;
  kind?: unknown;
}

interface InterviewContentSection {
  heading?: unknown;
  body?: unknown;
  level?: unknown;
}

const DETAIL_COLUMNS = [
  "slug",
  "question",
  "answer_source",
  "category_label",
  "related_chapters",
  "collected_date",
  "tags",
  "metadata",
].join(",");

const initialized = new WeakSet<HTMLElement>();
const mountedRoots = new Set<HTMLElement>();
const renderedSlugByRoot = new WeakMap<HTMLElement, string | null>();
const requestVersionByRoot = new WeakMap<HTMLElement, number>();
const LOCAL_QUESTION_BY_SLUG = new Map(INTERVIEW_QUESTIONS.map((question) => [question.slug, question]));
const CATEGORY_BY_LABEL = new Map(INTERVIEW_QUESTIONS.map((question) => [question.categoryLabel, question.category]));
const INTERVIEW_LOCATION_CHANGE_EVENT = "agent-build:interview-locationchange";
let locationSyncInstalled = false;

if (typeof window !== "undefined") {
  installInterviewArticleDetail();
}

function installInterviewArticleDetail(): void {
  installLocationSync();
  scanInterviewArticleDetail();
  const observer = new MutationObserver(() => scanInterviewArticleDetail());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener(INTERVIEW_LOCATION_CHANGE_EVENT, () => scanInterviewArticleDetail());
}

function scanInterviewArticleDetail(): void {
  const roots = document.querySelectorAll<HTMLElement>("[data-interview-article]");
  document.body.classList.toggle("interview-article-page", roots.length > 0);
  for (const root of Array.from(mountedRoots)) {
    if (!document.body.contains(root)) mountedRoots.delete(root);
  }
  roots.forEach((root) => {
    mountedRoots.add(root);
    if (!initialized.has(root)) {
      initialized.add(root);
      mount(root);
      return;
    }
    refreshRoot(root);
  });
}

function mount(root: HTMLElement): void {
  root.classList.add("news-article-detail");
  refreshRoot(root, true);
}

function refreshRoot(root: HTMLElement, force = false): void {
  const slug = interviewDetailSlugFromSearch(window.location.search);
  const renderedSlug = renderedSlugByRoot.get(root) ?? null;
  if (!force && !shouldRefreshInterviewDetail(renderedSlug, window.location.search)) return;

  const nextRequestVersion = (requestVersionByRoot.get(root) ?? 0) + 1;
  requestVersionByRoot.set(root, nextRequestVersion);
  renderedSlugByRoot.set(root, slug);
  if (!slug) {
    root.replaceChildren(status("缺少面试题 id。请从面试题库列表进入详情页。"));
    return;
  }

  root.replaceChildren(status("正在加载面试题详情..."));
  loadArticle(slug)
    .then((row) => {
      if (requestVersionByRoot.get(root) !== nextRequestVersion) return;
      if (!row) {
        root.replaceChildren(status("未找到该面试题，可能已下线或尚未同步。"));
        return;
      }
      render(root, row);
    })
    .catch((error: unknown) => {
      if (requestVersionByRoot.get(root) !== nextRequestVersion) return;
      root.replaceChildren(status(`加载失败：${error instanceof Error ? error.message : String(error)}`));
    });
}

async function loadArticle(slug: string): Promise<InterviewDetailRow | null> {
  const config = __FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const rows = await fetchAllPostgrestRows<InterviewDetailRow>({
    config: { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" },
    table: "interview_questions",
    select: DETAIL_COLUMNS,
    filters: [`slug=eq.${slug}`],
    pageSize: 1,
    maxPages: 2,
  });
  return rows[0] ?? null;
}

function render(root: HTMLElement, row: InterviewDetailRow): void {
  const title = asString(row.question) || "未命名面试题";
  const slug = asString(row.slug);
  const returnPath = interviewReturnPathFromSearch(window.location.search);
  const metadata = metadataValue(row.metadata);
  const localFallback = LOCAL_QUESTION_BY_SLUG.get(slug);
  const remoteSummary = normalizeText(asString(metadata.plainTextDescription));
  const remoteRationale = normalizeText(asString(metadata.rationale));
  const remoteFaqList = faqListValue(metadata.faqList);
  const summary = resolveInterviewSummary(remoteSummary, remoteRationale, localFallback?.summaryExcerpt ?? "");
  const displayRationale = resolveInterviewDisplayRationale(remoteRationale, localFallback?.rationale ?? "");
  const faqList = remoteFaqList.length > 0 ? remoteFaqList : (localFallback?.faqList ?? []);
  const answerVariants = answerVariantValue(metadata.answerVariants, faqList, summary);
  const contentSections = contentSectionValue(metadata.contentSections, metadata.contentMarkdown, displayRationale, summary);
  const url = firstString(metadata.sourceUrls) || localFallback?.sourceUrls?.[0] || "";
  const sourceTitle =
    firstString(metadata.sourceTitles) ||
    asString(row.answer_source) ||
    localFallback?.answerSource ||
    "面试题详情";
  const layer = asString(row.category_label) || localFallback?.categoryLabel || "未分类";
  const tags = [
    ...stringArray(row.related_chapters),
    ...stringArray(row.tags).slice(0, 6),
    ...(localFallback?.tags ?? []),
  ].filter((tag, index, list) => tag && list.indexOf(tag) === index);
  const paragraphs = buildInterviewParagraphs({
    summary,
    rationale: displayRationale,
    faqList,
  });
  const currentQuestion = similarityInputFromRow(row, localFallback, tags);
  const navigation = buildQuestionNavigation(slug, returnPath);
  const recommendations = recommendSimilarQuestions(currentQuestion, returnPath);

  const article = el("article", "news-detail-card");
  const header = el("header", "news-detail-header");
  header.append(el("p", "news-detail-eyebrow", "面试题库 · 站内详情"));
  header.append(el("h1", "news-detail-title", title));

  const meta = el("div", "news-detail-meta");
  meta.append(el("span", "news-detail-chip", layer));
  const date = resolveInterviewDisplayDate(metadata, asString(row.collected_date));
  if (date) meta.append(el("span", "news-detail-chip", date));
  header.append(meta);

  if (tags.length > 0) {
    const tagList = el("div", "news-detail-tags");
    for (const tag of tags) tagList.append(el("span", "news-detail-tag", tag));
    header.append(tagList);
  }

  header.append(el("p", "interview-detail-source", sourceTitle));

  const body = el("div", "news-detail-body vp-doc");
  const leadParagraphs = answerVariants.length > 0 || contentSections.length > 0 ? [] : paragraphs;
  for (const paragraph of leadParagraphs) {
    body.append(el("p", "news-detail-paragraph", paragraph));
  }
  if (answerVariants.length > 0) body.append(buildAnswerSection(answerVariants));
  if (contentSections.length > 0) {
    body.append(buildAnalysisSection(contentSections));
  } else {
    for (const paragraph of paragraphs.slice(leadParagraphs.length)) body.append(el("p", "news-detail-paragraph", paragraph));
  }

  const actions = el("div", "news-detail-actions");
  const back = document.createElement("a");
  back.className = "news-detail-original";
  back.href = returnPath;
  back.textContent = "返回题库";
  actions.append(back);
  if (url) {
    const original = document.createElement("a");
    original.className = "news-detail-original";
    original.href = url;
    original.target = "_blank";
    original.rel = "noreferrer";
    original.textContent = "打开原文";
    actions.append(original);
  }

  article.append(header, body, actions);
  if (navigation) article.append(navigation);
  if (recommendations) article.append(recommendations);
  root.replaceChildren(article);
  document.title = `${title} | 面试题库`;
}

function buildInterviewParagraphs(input: {
  summary: string;
  rationale: string;
  faqList: Array<{ question: string; answer: string }>;
}): string[] {
  const paragraphs: string[] = [];
  const summary = normalizeText(input.summary);
  const rationale = normalizeText(input.rationale);
  if (summary) paragraphs.push(summary);
  if (rationale && rationale !== summary) paragraphs.push(rationale);
  for (const faq of input.faqList.slice(0, 6)) {
    paragraphs.push(`问：${faq.question}\n答：${faq.answer}`);
  }
  if (paragraphs.length > 0) return paragraphs;
  return ["当前仅同步到题干，请结合原文和课程标准答案继续阅读。"];
}

function similarityInputFromRow(
  row: InterviewDetailRow,
  localFallback: (typeof INTERVIEW_QUESTIONS)[number] | undefined,
  tags: string[],
): SimilarInterviewQuestion {
  return {
    slug: asString(row.slug),
    category: localFallback?.category || CATEGORY_BY_LABEL.get(asString(row.category_label)) || "principle",
    categoryLabel: asString(row.category_label) || localFallback?.categoryLabel || "未分类",
    question: asString(row.question) || localFallback?.question || "",
    relatedChapters: stringArray(row.related_chapters).length > 0 ? stringArray(row.related_chapters) : (localFallback?.relatedChapters ?? []),
    tags,
    sortOrder: localFallback?.sortOrder ?? Number.MAX_SAFE_INTEGER,
    rationale: asString(metadataValue(row.metadata).rationale) || localFallback?.rationale || "",
    summaryExcerpt:
      asString(metadataValue(row.metadata).plainTextDescription) || localFallback?.summaryExcerpt || "",
  };
}

function buildQuestionNavigation(currentSlug: string, returnPath: string): HTMLElement | null {
  const index = INTERVIEW_QUESTIONS.findIndex((question) => question.slug === currentSlug);
  if (index < 0) return null;

  const previous = INTERVIEW_QUESTIONS[index - 1];
  const next = INTERVIEW_QUESTIONS[index + 1];
  if (!previous && !next) return null;

  const section = el("section", "interview-detail-section interview-detail-nav");
  section.append(sectionHeading("题目切换"));

  const grid = el("div", "interview-detail-nav-grid");
  if (previous) grid.append(navigationCard("上一题", previous.slug, previous.question, returnPath));
  if (next) grid.append(navigationCard("下一题", next.slug, next.question, returnPath));
  section.append(grid);
  return section;
}

function navigationCard(label: string, slug: string, title: string, returnPath: string): HTMLElement {
  const link = document.createElement("a");
  link.className = "interview-detail-nav-card";
  link.href = interviewDetailHref(slug, returnPath);
  link.append(el("span", "interview-detail-nav-label", label));
  link.append(el("strong", "interview-detail-nav-title", title));
  return link;
}

function recommendSimilarQuestions(currentQuestion: SimilarInterviewQuestion, returnPath: string): HTMLElement | null {
  const items = rankSimilarInterviewQuestions(INTERVIEW_QUESTIONS, currentQuestion, 3);
  if (items.length === 0) return null;

  const section = el("section", "interview-detail-section interview-detail-related");
  section.append(sectionHeading("相似题目推荐"));
  const grid = el("div", "interview-detail-related-grid");
  for (const item of items) {
    const card = document.createElement("a");
    card.className = "interview-detail-related-card";
    card.href = interviewDetailHref(item.question.slug, returnPath);
    card.append(el("span", "interview-detail-related-kind", item.question.categoryLabel));
    card.append(el("strong", "interview-detail-related-title", item.question.question));
    const excerpt = item.question.summaryExcerpt || item.question.rationale || "";
    if (excerpt) card.append(el("p", "interview-detail-related-summary", excerpt));
    const metaText = item.reasons.join(" · ");
    if (metaText) card.append(el("span", "interview-detail-related-meta", metaText));
    grid.append(card);
  }
  section.append(grid);
  return section;
}

function sectionHeading(text: string): HTMLElement {
  return el("h2", "interview-detail-section-title", text);
}

function buildAnswerSection(items: Array<{ title: string; answer: string; kind: string }>): HTMLElement {
  const section = el("section", "interview-detail-section interview-answer-section");
  const details = document.createElement("details");
  details.className = "interview-answer-disclosure";
  details.open = true;
  const summary = document.createElement("summary");
  summary.className = "interview-answer-summary";
  summary.append(sectionHeading("直接可背的答案"));
  summary.append(el("span", "interview-answer-toggle-label interview-answer-toggle-label-closed", "展开答案"));
  summary.append(el("span", "interview-answer-toggle-label interview-answer-toggle-label-open", "收起答案"));
  details.append(summary);

  const grid = el("div", "interview-answer-grid");
  for (const item of items) {
    const card = el("article", "interview-answer-card");
    card.append(el("span", "interview-answer-kind", answerKindLabel(item.kind)));
    card.append(el("h3", "interview-answer-title", item.title));
    card.append(el("p", "interview-answer-body", item.answer));
    grid.append(card);
  }
  details.append(grid);
  section.append(details);
  return section;
}

function buildAnalysisSection(items: Array<{ heading: string; body: string; level: number }>): HTMLElement {
  const section = el("section", "interview-detail-section interview-analysis-section");
  section.append(sectionHeading("完整解析"));
  for (const item of items) {
    const block = el("article", "interview-analysis-block");
    const headingTag = item.level >= 3 ? "h3" : "h2";
    block.append(el(headingTag, "interview-analysis-heading", item.heading));
    for (const paragraph of splitSectionParagraphs(item.body)) {
      if (paragraph.startsWith("```") && paragraph.endsWith("```")) {
        const pre = el("pre", "interview-analysis-pre");
        const code = document.createElement("code");
        code.textContent = paragraph.slice(3, -3).trim();
        pre.append(code);
        block.append(pre);
      } else {
        block.append(el("p", "interview-analysis-body", paragraph));
      }
    }
    section.append(block);
  }
  return section;
}

function splitSectionParagraphs(body: string): string[] {
  return body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

function answerKindLabel(kind: string): string {
  if (kind === "faq") return "追问回答";
  if (kind === "section") return "分层拆解";
  return "速答版";
}

function answerVariantValue(value: unknown, faqList: Array<{ question: string; answer: string }>, summary: string): Array<{ title: string; answer: string; kind: string }> {
  const fromMetadata = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const record = item as InterviewAnswerVariant;
          const title = asString(record.title).trim();
          const answer = normalizeText(asString(record.answer));
          const kind = asString(record.kind).trim() || "summary";
          if (!title || !answer) return null;
          return { title, answer, kind };
        })
        .filter((item): item is { title: string; answer: string; kind: string } => item !== null)
    : [];
  if (fromMetadata.length > 0) return fromMetadata;
  const fallback: Array<{ title: string; answer: string; kind: string }> = [];
  const cleanSummary = normalizeText(summary);
  if (cleanSummary && !looksLikeAnswerSource(cleanSummary)) fallback.push({ title: "这道题怎么答", answer: cleanSummary, kind: "summary" });
  for (const item of faqList.slice(0, 6)) fallback.push({ title: item.question, answer: normalizeText(item.answer), kind: "faq" });
  return fallback;
}

function contentSectionValue(value: unknown, markdown: unknown, rationale: string, summary: string): Array<{ heading: string; body: string; level: number }> {
  const fromMetadata = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const record = item as InterviewContentSection;
          const heading = asString(record.heading).trim();
          const body = normalizeText(asString(record.body));
          const level = Number(record.level);
          if (!heading || !body) return null;
          return { heading, body, level: Number.isFinite(level) && level > 0 ? level : 2 };
        })
        .filter((item): item is { heading: string; body: string; level: number } => item !== null)
    : [];
  if (fromMetadata.length > 0) return fromMetadata;
  const text = asString(markdown).trim();
  if (text) {
    const sections = text
      .split(/\n(?=##\s+)/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const match = chunk.match(/^(#{2,4})\s+(.+)\n([\s\S]*)$/);
        if (!match) return null;
        return { heading: match[2].trim(), body: normalizeText(match[3]), level: match[1].length };
      })
      .filter((item): item is { heading: string; body: string; level: number } => item !== null && item.body.length > 0);
    if (sections.length > 0) return sections;
  }
  const fallback: Array<{ heading: string; body: string; level: number }> = [];
  const cleanSummary = normalizeText(summary);
  const cleanRationale = normalizeText(rationale);
  if (cleanSummary && !looksLikeAnswerSource(cleanSummary)) fallback.push({ heading: "概览", body: cleanSummary, level: 2 });
  if (cleanRationale && cleanRationale !== cleanSummary) fallback.push({ heading: "解析", body: cleanRationale, level: 2 });
  return fallback;
}

function faqListValue(value: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as InterviewFaq;
      const question = asString(record.question).trim();
      const answer = asString(record.answer).trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => item !== null);
}

function metadataValue(value: unknown): InterviewMetadata {
  return value && typeof value === "object" ? (value as InterviewMetadata) : {};
}

function firstString(value: unknown): string {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeText(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function looksLikeAnswerSource(text: string): boolean {
  return /^(标准答案来源|答案来源|来源)[:：]/.test(text.trim());
}

function looksLikeSelectionRationale(text: string): boolean {
  return /^(本题(?:直接)?来自|本题覆盖|本题对应)/.test(text.trim());
}

export function resolveInterviewSummary(remoteSummary: string, remoteRationale: string, localSummary: string): string {
  const cleanRemoteSummary = normalizeText(remoteSummary);
  const cleanRemoteRationale = normalizeText(remoteRationale);
  const cleanLocalSummary = normalizeText(localSummary);

  if (cleanRemoteSummary && !looksLikeAnswerSource(cleanRemoteSummary) && !looksLikeSelectionRationale(cleanRemoteSummary) && cleanRemoteSummary !== cleanRemoteRationale) {
    return cleanRemoteSummary;
  }
  if (cleanLocalSummary && !looksLikeAnswerSource(cleanLocalSummary) && !looksLikeSelectionRationale(cleanLocalSummary)) {
    return cleanLocalSummary;
  }
  return cleanRemoteSummary || cleanLocalSummary || cleanRemoteRationale;
}

function resolveInterviewDisplayRationale(remoteRationale: string, localRationale: string): string {
  const candidates = [normalizeText(remoteRationale), normalizeText(localRationale)];
  for (const candidate of candidates) {
    if (candidate && !looksLikeSelectionRationale(candidate)) return candidate;
  }
  return "";
}

export function resolveInterviewDisplayDate(metadata: InterviewMetadata, fallbackDate: string): string {
  const candidates = [asString(metadata.sourceUpdatedAt), asString(metadata.sourceCreatedAt), fallbackDate];
  for (const candidate of candidates) {
    const normalized = normalizeInterviewDisplayDateValue(candidate);
    if (normalized) return normalized;
  }
  return "";
}

function normalizeInterviewDisplayDateValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (match) return match[1];
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function interviewDetailSlugFromSearch(search: string): string | null {
  const slug = new URLSearchParams(search).get("id")?.trim() || "";
  return slug || null;
}

export function shouldRefreshInterviewDetail(renderedSlug: string | null | undefined, search: string): boolean {
  return (renderedSlug ?? null) !== interviewDetailSlugFromSearch(search);
}

export function interviewDetailHref(slug: string, returnPath?: string): string {
  const base = import.meta.env?.BASE_URL || "/";
  return withReturnPath(`${base}interview/article?id=${encodeURIComponent(slug)}`, returnPath);
}

export function interviewReturnPathFromSearch(search: string): string {
  const base = import.meta.env?.BASE_URL || "/";
  return safeReturnPathFromSearch(search, `${base}interview/`);
}

function installLocationSync(): void {
  if (locationSyncInstalled) return;
  locationSyncInstalled = true;

  const emitLocationChange = () => window.dispatchEvent(new Event(INTERVIEW_LOCATION_CHANGE_EVENT));
  patchHistoryMethod("pushState", emitLocationChange);
  patchHistoryMethod("replaceState", emitLocationChange);
  window.addEventListener("popstate", emitLocationChange);
  window.addEventListener("hashchange", emitLocationChange);
}

function patchHistoryMethod(
  method: "pushState" | "replaceState",
  onChange: () => void,
): void {
  const original = window.history[method];
  window.history[method] = function patchedHistoryMethod(this: History, ...args: Parameters<History[typeof method]>) {
    const result = original.apply(this, args);
    onChange();
    return result;
  };
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function status(message: string): HTMLElement {
  return el("div", "news-detail-status", message);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}


