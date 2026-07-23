// Notion 文章详情渲染器（运行时按 ?slug= 取单行 + 全文 markdown 渲染）。
//
// 安全不变量：anon 只读 + status=eq.published；body_markdown 经 markdown-it(html:false)+DOMPurify 渲染。

import { fetchAllPostgrestRows } from "./postgrest-pagination";
import { renderNotionMarkdown } from "./notion-markdown";
import { safeReturnPathFromSearch, withReturnPath } from "./list-detail-return";
import { getSupabaseRuntimeConfig } from "./supabase-runtime-config";

interface DetailRow {
  slug?: unknown;
  title?: unknown;
  summary?: unknown;
  body_markdown?: unknown;
  tags?: unknown;
  published_date?: unknown;
  cover_image_url?: unknown;
  notion_url?: unknown;
}

const DETAIL_COLUMNS = [
  "slug",
  "title",
  "summary",
  "body_markdown",
  "tags",
  "published_date",
  "cover_image_url",
  "notion_url",
].join(",");

const BASE = (import.meta.env?.BASE_URL ?? "/") as string;
const initialized = new WeakSet<HTMLElement>();

if (typeof window !== "undefined") {
  install();
}

function install(): void {
  scan();
  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scan(): void {
  document.querySelectorAll<HTMLElement>("[data-notion-article]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    mount(root);
  });
}

function mount(root: HTMLElement): void {
  root.classList.add("notion-article-detail");
  const slug = notionArticleSlugFromSearch(window.location.search);
  if (!slug) {
    root.replaceChildren(status("缺少文章 slug（应通过列表页卡片进入）。"));
    return;
  }
  root.replaceChildren(status("正在加载文章..."));
  loadArticle(slug)
    .then((row) => {
      if (!row) {
        root.replaceChildren(status("未找到该文章（可能未发布或已下线）。"));
        return;
      }
      return render(root, row);
    })
    .catch((error: unknown) => {
      root.replaceChildren(
        status(`加载失败：${error instanceof Error ? error.message : String(error)}`),
      );
    });
}

async function loadArticle(slug: string): Promise<DetailRow | null> {
  const config = await getSupabaseRuntimeConfig();
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const rows = await fetchAllPostgrestRows<DetailRow>({
    config: { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" },
    table: "notion_articles",
    select: DETAIL_COLUMNS,
    filters: [`slug=eq.${slug}`, "status=eq.published"],
    pageSize: 1,
    maxPages: 2,
  });
  return rows[0] ?? null;
}

async function render(root: HTMLElement, row: DetailRow): Promise<void> {
  const title = asString(row.title);
  const returnPath = notionArticleReturnPathFromSearch(window.location.search);
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];

  const article = document.createElement("article");
  article.className = "notion-detail";

  const header = el("header", "notion-detail-header");
  header.append(el("h1", "notion-detail-title", title));
  const meta = el("div", "notion-detail-meta");
  meta.append(el("span", "notion-detail-date", asString(row.published_date)));
  const back = document.createElement("a");
  back.className = "notion-detail-source";
  back.href = returnPath;
  back.textContent = "返回列表";
  meta.append(back);
  for (const tag of tags) meta.append(el("span", "notion-card-tag", tag));
  if (row.notion_url) {
    const link = document.createElement("a");
    link.className = "notion-detail-source";
    link.href = asString(row.notion_url);
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "在 Notion 打开";
    meta.append(link);
  }
  header.append(meta);

  if (row.cover_image_url) {
    const cover = document.createElement("img");
    cover.className = "notion-detail-cover";
    cover.src = asString(row.cover_image_url);
    cover.alt = "";
    header.append(cover);
  }

  const bodyContainer = el("div", "notion-detail-body vp-doc");
  bodyContainer.textContent = "正在渲染正文...";
  article.append(header, bodyContainer);
  root.replaceChildren(article);

  if (typeof document !== "undefined") {
    document.title = title || "Notion 文章";
  }

  const html = await renderNotionMarkdown(asString(row.body_markdown));
  bodyContainer.textContent = "";
  bodyContainer.innerHTML = html;
}

export function notionArticleSlugFromSearch(search: string): string | null {
  const slug = new URLSearchParams(search).get("slug")?.trim() || "";
  return slug || null;
}

export function notionArticleHref(slug: string, returnPath?: string): string {
  return withReturnPath(`${BASE}notion/article?slug=${encodeURIComponent(slug)}`, returnPath);
}

export function notionArticleReturnPathFromSearch(search: string): string {
  return safeReturnPathFromSearch(search, `${BASE}notion/`);
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function status(message: string): HTMLElement {
  return el("div", "notion-status", message);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
