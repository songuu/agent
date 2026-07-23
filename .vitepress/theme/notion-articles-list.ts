// Notion 文章列表渲染器（运行时 anon 只读，mirror daily-news-feed.ts 模式）。
//
// 安全不变量：仅用公开 anon 配置；service_role 永不进前端 bundle。
// 只取卡片列（不含 body_markdown，避免列表 payload 膨胀）；status=eq.published（RLS 也兜底）。

import {
  availableDates,
  filterByDate,
  pickDefaultDate,
} from "./frontier-date-filter";
import { fetchAllPostgrestRows } from "./postgrest-pagination";
import {
  availableTags,
  filterArticles,
  type NotionArticleView,
  type TagFilter,
} from "./notion-articles-filter";
import {
  currentRelativePath,
  rememberListDetailPosition,
  replaceCurrentSearch,
  restoreListDetailPosition,
  shouldRememberListDetailClick,
  withReturnPath,
} from "./list-detail-return";

declare const __FRONTIER_SUPABASE_CONFIG__:
  | { url: string; anonKey: string; schema: string }
  | null
  | undefined;

interface NotionArticleRow {
  notion_page_id?: unknown;
  slug?: unknown;
  title?: unknown;
  summary?: unknown;
  tags?: unknown;
  status?: unknown;
  published_date?: unknown;
  cover_image_url?: unknown;
  read_count?: unknown;
}

const LIST_COLUMNS = [
  "notion_page_id",
  "slug",
  "title",
  "summary",
  "tags",
  "status",
  "published_date",
  "cover_image_url",
  "read_count",
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
  document.querySelectorAll<HTMLElement>("[data-notion-articles]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    mount(root);
  });
}

function mount(root: HTMLElement): void {
  root.classList.add("notion-articles");
  root.replaceChildren(status("正在读取 Notion 文章..."));
  restoreListDetailPosition(root);
  loadArticles()
    .then((articles) => render(root, articles))
    .catch((error: unknown) => {
      root.replaceChildren(
        status(`读取失败：${error instanceof Error ? error.message : String(error)}`),
      );
    });
}

async function loadArticles(): Promise<NotionArticleView[]> {
  const config = __FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const rows = await fetchAllPostgrestRows<NotionArticleRow>({
    config: { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" },
    table: "notion_articles",
    select: LIST_COLUMNS,
    filters: ["status=eq.published"],
    order: ["published_date.desc"],
    pageSize: 100,
  });
  return rows.map(normalizeRow).filter((a) => a.title && a.slug);
}

function normalizeRow(row: NotionArticleRow): NotionArticleView {
  const publishedDate = asString(row.published_date) || "1970-01-01";
  return {
    notionPageId: asString(row.notion_page_id),
    slug: asString(row.slug),
    title: asString(row.title),
    summary: asString(row.summary),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    status: asString(row.status),
    publishedDate,
    collectedDate: publishedDate,
    coverImageUrl: row.cover_image_url ? asString(row.cover_image_url) : null,
    readCount: typeof row.read_count === "number" ? row.read_count : 0,
  };
}

function render(root: HTMLElement, articles: NotionArticleView[]): void {
  root.replaceChildren();
  if (articles.length === 0) {
    root.append(
      status("Notion 文章暂无数据。配置 notion-sources.ts 并运行 pnpm notion:sync，或导入 seed。"),
    );
    return;
  }

  const initialState = readNotionListQueryState();
  let selectedTag: TagFilter = initialState.tag;
  let selectedDate: string | null = initialState.date; // null = 全部日期
  let query = initialState.query;

  const hero = el("header", "notion-hero");
  hero.append(
    el("p", "notion-eyebrow", "Notion · 全文同步"),
    el("h2", "notion-title", "Notion 文章"),
    el("p", "notion-desc", "由 notion-sync 从 Notion 数据库全文同步；按标签、日期与关键词筛选，点击进入站内全文阅读。"),
  );

  const controls = el("div", "notion-controls");
  const search = document.createElement("input");
  search.type = "search";
  search.className = "notion-search";
  search.placeholder = "搜索标题 / 摘要 / 标签…";
  search.value = query;
  search.addEventListener("input", () => {
    query = search.value;
    update();
  });

  const dateSelect = document.createElement("select");
  dateSelect.className = "notion-date-select";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "全部日期";
  dateSelect.append(allOpt);
  const dates = availableDates(articles);
  if (selectedDate && !dates.includes(selectedDate)) selectedDate = null;
  for (const date of dates) {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = date;
    dateSelect.append(opt);
  }
  dateSelect.value = selectedDate ?? "";
  dateSelect.addEventListener("change", () => {
    selectedDate = dateSelect.value || null;
    update();
  });

  controls.append(search, dateSelect);

  const tabs = el("nav", "notion-tag-tabs");
  tabs.setAttribute("aria-label", "标签筛选");
  const tags: TagFilter[] = ["all", ...availableTags(articles)];
  if (selectedTag !== "all" && !tags.includes(selectedTag)) selectedTag = "all";
  const tabButtons = new Map<TagFilter, HTMLButtonElement>();
  for (const tag of tags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "notion-tag-tab";
    button.textContent = tag === "all" ? "全部" : tag;
    button.addEventListener("click", () => {
      selectedTag = tag;
      update();
    });
    tabButtons.set(tag, button);
    tabs.append(button);
  }

  const grid = el("section", "notion-card-grid");
  grid.setAttribute("aria-label", "文章列表");

  function visible(): NotionArticleView[] {
    const byTagQuery = filterArticles(articles, { tag: selectedTag, query });
    return filterByDate(byTagQuery, selectedDate);
  }

  function update(): void {
    replaceNotionListState();
    for (const [tag, button] of tabButtons) {
      button.classList.toggle("is-active", tag === selectedTag);
    }
    const items = visible();
    grid.replaceChildren();
    if (items.length === 0) {
      grid.append(status("没有匹配的文章。"));
      return;
    }
    for (const article of items) grid.append(card(article, currentRelativePath()));
  }

  // 默认选中最新日期可让首屏更聚焦；这里保留"全部"以展示完整列表。
  void pickDefaultDate;
  root.append(hero, controls, tabs, grid);
  update();

  function replaceNotionListState(): void {
    const params = new URLSearchParams(window.location.search);
    params.set("tag", selectedTag);
    params.set("date", selectedDate ?? "all");
    const cleanQuery = query.trim();
    if (cleanQuery) {
      params.set("q", cleanQuery);
    } else {
      params.delete("q");
    }
    replaceCurrentSearch(params);
  }
}

function readNotionListQueryState(search = typeof window === "undefined" ? "" : window.location.search): {
  tag: TagFilter;
  date: string | null;
  query: string;
} {
  const params = new URLSearchParams(search);
  const tag = params.get("tag")?.trim() || "all";
  const rawDate = params.get("date")?.trim() || "";
  const date = rawDate === "all" || rawDate === "" ? null : rawDate;
  const query = params.get("q")?.trim() || "";
  return { tag, date, query };
}

function card(article: NotionArticleView, returnPath: string): HTMLElement {
  const link = document.createElement("a");
  link.className = "notion-card";
  link.dataset.listDetailKey = article.slug;
  link.href = notionArticleHref(article.slug, returnPath);
  link.addEventListener("click", (event) => {
    if (!shouldRememberListDetailClick(event)) return;
    rememberListDetailPosition(returnPath, article.slug, link);
  });

  if (article.coverImageUrl) {
    const cover = document.createElement("img");
    cover.className = "notion-card-cover";
    cover.src = article.coverImageUrl;
    cover.alt = "";
    cover.loading = "lazy";
    link.append(cover);
  }

  const body = el("div", "notion-card-body");
  body.append(el("h3", "notion-card-title", article.title));
  if (article.summary) body.append(el("p", "notion-card-summary", article.summary));

  const meta = el("div", "notion-card-meta");
  meta.append(el("span", "notion-card-date", article.publishedDate));
  for (const tag of article.tags.slice(0, 4)) {
    meta.append(el("span", "notion-card-tag", tag));
  }
  body.append(meta);
  link.append(body);
  return link;
}

export function notionArticleHref(slug: string, returnPath?: string): string {
  return withReturnPath(`${BASE}notion/article?slug=${encodeURIComponent(slug)}`, returnPath);
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
