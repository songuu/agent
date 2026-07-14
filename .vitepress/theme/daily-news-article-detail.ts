// AI 资讯站内详情页：运行时按 ?id=<external_id> 读取 news_items 单行并渲染正文。
// 安全不变量：前端只用 Supabase anon 读；原文跳转是显式按钮。

import { fetchAllPostgrestRows } from "./postgrest-pagination";
import { cleanNewsSummary } from "./daily-news-feed";
import { safeReturnPathFromSearch, withReturnPath } from "./list-detail-return";

declare const __FRONTIER_SUPABASE_CONFIG__:
  | { url: string; anonKey: string; schema: string }
  | null
  | undefined;

interface NewsArticleRow {
  external_id?: unknown;
  title?: unknown;
  url?: unknown;
  summary?: unknown;
  content_text?: unknown;
  content_excerpt?: unknown;
  content_status?: unknown;
  source_name?: unknown;
  source_kind?: unknown;
  ecosystem_layer_label?: unknown;
  tags?: unknown;
  published_at?: unknown;
  published_date?: unknown;
}

interface NewsArticleNavigationItem {
  readonly externalId: string;
  readonly title: string;
}

interface NewsArticleNavigation {
  readonly previous: NewsArticleNavigationItem | null;
  readonly next: NewsArticleNavigationItem | null;
}

const DETAIL_COLUMNS = [
  "external_id",
  "title",
  "url",
  "summary",
  "content_text",
  "content_excerpt",
  "content_status",
  "source_name",
  "source_kind",
  "ecosystem_layer_label",
  "tags",
  "published_at",
  "published_date",
].join(",");

const NAVIGATION_COLUMNS = ["external_id", "title", "published_at", "published_date"].join(",");
const BASE = (import.meta.env?.BASE_URL ?? "/") as string;

const initialized = new WeakSet<HTMLElement>();
const renderedIdByRoot = new WeakMap<HTMLElement, string | null>();
const requestVersionByRoot = new WeakMap<HTMLElement, number>();
const NEWS_LOCATION_CHANGE_EVENT = "agent-build:news-locationchange";
let locationSyncInstalled = false;

if (typeof window !== "undefined") {
  installNewsArticleDetail();
}

function installNewsArticleDetail(): void {
  installLocationSync();
  scanNewsArticleDetail();
  const observer = new MutationObserver(() => scanNewsArticleDetail());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener(NEWS_LOCATION_CHANGE_EVENT, () => scanNewsArticleDetail());
}

function scanNewsArticleDetail(): void {
  document.querySelectorAll<HTMLElement>("[data-news-article]").forEach((root) => {
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
  const id = newsArticleIdFromSearch(window.location.search);
  const renderedId = renderedIdByRoot.get(root) ?? null;
  if (!force && !shouldRefreshNewsArticleDetail(renderedId, window.location.search)) return;

  const nextRequestVersion = (requestVersionByRoot.get(root) ?? 0) + 1;
  requestVersionByRoot.set(root, nextRequestVersion);
  renderedIdByRoot.set(root, id);
  if (!id) {
    root.replaceChildren(status("缺少文章 id。请从 AI 资讯列表进入文章详情。"));
    return;
  }

  root.replaceChildren(status("正在加载文章正文..."));
  Promise.all([loadArticle(id), loadArticleNavigation(id)])
    .then(([row, navigation]) => {
      if (requestVersionByRoot.get(root) !== nextRequestVersion) return;
      if (!row) {
        root.replaceChildren(status("未找到该文章，可能已下线或尚未同步。"));
        return;
      }
      render(root, row, navigation);
    })
    .catch((error: unknown) => {
      if (requestVersionByRoot.get(root) !== nextRequestVersion) return;
      root.replaceChildren(status(`加载失败：${error instanceof Error ? error.message : String(error)}`));
    });
}

function requireSupabaseConfig(): { url: string; anonKey: string; schema: string } {
  const config = __FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" };
}

async function loadArticle(id: string): Promise<NewsArticleRow | null> {
  const config = requireSupabaseConfig();

  const rows = await fetchAllPostgrestRows<NewsArticleRow>({
    config,
    table: "news_items",
    select: DETAIL_COLUMNS,
    filters: [`external_id=eq.${encodeURIComponent(id)}`],
    pageSize: 1,
    maxPages: 2,
  });
  return rows[0] ?? null;
}

async function loadArticleNavigation(id: string): Promise<NewsArticleNavigation | null> {
  const config = requireSupabaseConfig();
  const rows = await fetchAllPostgrestRows<NewsArticleRow>({
    config,
    table: "news_items",
    select: NAVIGATION_COLUMNS,
    order: ["published_date.desc", "published_at.desc"],
    pageSize: 1000,
  });
  return resolveArticleNavigation(rows, id);
}

function render(root: HTMLElement, row: NewsArticleRow, navigation: NewsArticleNavigation | null): void {
  const returnPath = newsArticleReturnPathFromSearch(window.location.search);
  const title = asString(row.title) || "未命名文章";
  const url = asString(row.url);
  const sourceName = asString(row.source_name) || "未知来源";
  const layer = asString(row.ecosystem_layer_label) || "未分类";
  const tags = stringArray(row.tags);
  const paragraphs = buildNewsArticleParagraphs({
    title,
    contentText: asString(row.content_text),
    contentExcerpt: asString(row.content_excerpt),
    summary: asString(row.summary),
  });

  const article = el("article", "news-detail-card");
  const header = el("header", "news-detail-header");
  header.append(el("p", "news-detail-eyebrow", "AI 资讯 · 站内详情"));
  header.append(el("h1", "news-detail-title", title));

  const meta = el("div", "news-detail-meta");
  meta.append(el("span", "news-detail-chip", sourceName));
  meta.append(el("span", "news-detail-chip", layer));
  const date = formatDate(asString(row.published_at), asString(row.published_date));
  if (date) meta.append(el("span", "news-detail-chip", date));
  header.append(meta);

  if (tags.length > 0) {
    const tagList = el("div", "news-detail-tags");
    for (const tag of tags.slice(0, 8)) tagList.append(el("span", "news-detail-tag", tag));
    header.append(tagList);
  }

  const body = el("div", "news-detail-body vp-doc");
  for (const paragraph of paragraphs) {
    body.append(el("p", "news-detail-paragraph", paragraph));
  }

  const actions = el("div", "news-detail-actions");
  const back = document.createElement("a");
  back.className = "news-detail-original";
  back.href = returnPath;
  back.textContent = "返回列表";
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
  const navigationSection = buildArticleNavigation(navigation, returnPath);
  root.replaceChildren(...(navigationSection ? [article, navigationSection] : [article]));
  document.title = `${title} | AI 资讯`;
}

export interface BuildNewsArticleParagraphsInput {
  readonly title: string;
  readonly contentText: string;
  readonly contentExcerpt: string;
  readonly summary: string;
}

export function buildNewsArticleParagraphs(input: BuildNewsArticleParagraphsInput): string[] {
  const content = normalizeText(input.contentText);
  if (content) return splitArticleParagraphs(content);

  const excerpt = normalizeText(input.contentExcerpt) || cleanNewsSummary(input.summary);
  if (excerpt) {
    return [excerpt, "该条资讯暂未抓取到更完整的站内正文，请使用下方按钮打开原文查看全文。"];
  }

  return [`文章主题：${input.title}`, "该条资讯暂未抓取到可展示正文，请使用下方按钮打开原文查看全文。"];
}

export function splitArticleParagraphs(text: string): string[] {
  const byBreaks = text
    .split(/\n{2,}/)
    .map((part) => normalizeText(part))
    .filter(Boolean);
  if (byBreaks.length > 0) return byBreaks;
  return [normalizeText(text)].filter(Boolean);
}

export function resolveArticleNavigation(
  rows: readonly NewsArticleRow[],
  currentId: string,
): NewsArticleNavigation | null {
  const items = rows
    .map((row) => ({
      externalId: asString(row.external_id),
      title: asString(row.title),
    }))
    .filter((item) => item.externalId && item.title);

  const index = items.findIndex((item) => item.externalId === currentId);
  if (index < 0) return null;

  const previous = items[index - 1] ?? null;
  const next = items[index + 1] ?? null;
  if (!previous && !next) return null;
  return { previous, next };
}

function buildArticleNavigation(navigation: NewsArticleNavigation | null, returnPath: string): HTMLElement | null {
  if (!navigation?.previous && !navigation?.next) return null;

  const section = el("section", "interview-detail-section interview-detail-nav");
  section.append(el("h2", "interview-detail-section-title", "文章切换"));

  const grid = el("div", "interview-detail-nav-grid");
  if (navigation.previous) grid.append(navigationCard("上一篇", navigation.previous.externalId, navigation.previous.title, returnPath));
  if (navigation.next) grid.append(navigationCard("下一篇", navigation.next.externalId, navigation.next.title, returnPath));
  section.append(grid);
  return section;
}

function navigationCard(label: string, externalId: string, title: string, returnPath: string): HTMLElement {
  const link = document.createElement("a");
  link.className = "interview-detail-nav-card";
  link.href = newsArticleHref(externalId, returnPath);
  link.append(el("span", "interview-detail-nav-label", label));
  link.append(el("strong", "interview-detail-nav-title", title));
  return link;
}

export function newsArticleHref(externalId: string, returnPath?: string): string {
  return withReturnPath(`${BASE}news/article?id=${encodeURIComponent(externalId)}`, returnPath);
}

export function newsArticleReturnPathFromSearch(search: string): string {
  return safeReturnPathFromSearch(search, `${BASE}news/`);
}

export function newsArticleIdFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get("id")?.trim() || "";
  return id || null;
}

export function shouldRefreshNewsArticleDetail(
  renderedId: string | null | undefined,
  search: string,
): boolean {
  return (renderedId ?? null) !== newsArticleIdFromSearch(search);
}

function installLocationSync(): void {
  if (locationSyncInstalled) return;
  locationSyncInstalled = true;

  const emitLocationChange = () => window.dispatchEvent(new Event(NEWS_LOCATION_CHANGE_EVENT));
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

function normalizeText(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function formatDate(publishedAt: string, publishedDate: string): string {
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return publishedDate;
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

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
