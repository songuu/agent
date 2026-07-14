// 每日 AI 资讯展示器（仿 ai.codefather.cn/news）。
//
// 读取由 news-collector 自动收集的 Supabase `news_items` 表，渲染为 codefather 风格的
// 日期时间线 + 体系层筛选。复用第 20 章「前沿文章库」的全套 frontier-* CSS 与 date-filter 纯逻辑。
//
// 安全不变量：仅使用公开 anon 配置只读；service_role 永不进前端 bundle。

import { FRONTIER_ECOSYSTEM_LAYERS } from "../../knowledge-graph/data/frontier-ecosystem-layers";
import type { FrontierEcosystemLayer } from "../../knowledge-graph/data/graph";
import {
  availableDates,
  buildCalendarMonth,
  filterByDate,
  pickDefaultDate,
  shiftMonth,
  yearMonthOf,
  type YearMonth,
} from "./frontier-date-filter";
import { fetchAllPostgrestRows, fetchPostgrestPage } from "./postgrest-pagination";
import { currentRelativePath, positiveIntegerParam, replaceCurrentSearch, withReturnPath } from "./list-detail-return";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;
const DEFAULT_DATE_LABEL = "6月17日 · 周三";
const DEFAULT_NEWS_PAGE_SIZE = 10;
const NEWS_EXCERPT_MAX_LENGTH = 220;
const NEWS_DETAIL_MAX_LENGTH = 760;
const NEWS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

declare const __FRONTIER_SUPABASE_CONFIG__:
  | { url: string; anonKey: string; schema: string }
  | null
  | undefined;

interface NewsItemView {
  externalId: string;
  title: string;
  url: string;
  summary: string;
  sourceName: string;
  sourceKind: string;
  contentExcerpt: string;
  ecosystemLayer: FrontierEcosystemLayer;
  ecosystemLayerLabel: string;
  /** date-filter helper uses this field as the article date; it is sourced from published_date. */
  collectedDate: string;
  publishedAt: string | null;
  publishedDate: string;
  collectionDate: string;
  readCount: number;
  tags: string[];
}

interface ReadableNewsInput {
  title: string;
  summary: string;
  sourceName: string;
  sourceKind: string;
  ecosystemLayerLabel: string;
  tags?: readonly string[];
}

interface NewsItemRow {
  external_id?: unknown;
  title?: unknown;
  url?: unknown;
  summary?: unknown;
  content_excerpt?: unknown;
  source_name?: unknown;
  source_kind?: unknown;
  ecosystem_layer?: unknown;
  ecosystem_layer_label?: unknown;
  collected_date?: unknown;
  published_date?: unknown;
  published_at?: unknown;
  read_count?: unknown;
  tags?: unknown;
}

interface NewsFilterIndexRow {
  published_date?: unknown;
  ecosystem_layer?: unknown;
  source_name?: unknown;
}

interface NewsFilterIndexItem {
  collectedDate: string;
  ecosystemLayer: FrontierEcosystemLayer;
  sourceName: string;
}

type LayerFilter = FrontierEcosystemLayer | "all";

interface NewsListQueryState {
  readonly layer: LayerFilter;
  readonly date: string | null;
  readonly hasDate: boolean;
  readonly page: number;
  readonly pageSize: number;
}

const NEWS_COLUMNS = [
  "external_id",
  "title",
  "url",
  "summary",
  "content_excerpt",
  "source_name",
  "source_kind",
  "ecosystem_layer",
  "ecosystem_layer_label",
  "collected_date",
  "published_date",
  "published_at",
  "read_count",
  "tags",
].join(",");

const NEWS_FILTER_INDEX_COLUMNS = ["published_date", "ecosystem_layer", "source_name"].join(",");
const BASE = (import.meta.env?.BASE_URL ?? "/") as string;

const initialized = new WeakSet<HTMLElement>();

if (typeof window !== "undefined") {
  installDailyNewsFeeds();
}

function installDailyNewsFeeds(): void {
  scanDailyNewsFeeds();
  const observer = new MutationObserver(() => scanDailyNewsFeeds());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanDailyNewsFeeds(): void {
  document.querySelectorAll<HTMLElement>("[data-daily-news]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    createFeed(root);
  });
}

function createFeed(root: HTMLElement): void {
  root.classList.add("frontier-archive-shell");
  root.replaceChildren(statusBlock("正在读取每日资讯..."));
  void renderFeed(root).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    root.replaceChildren(statusBlock(`资讯读取失败：${message}`));
  });
}

async function fetchNewsPage(
  offset: number,
  filters: readonly string[],
  pageSize: number = DEFAULT_NEWS_PAGE_SIZE,
): Promise<{ items: NewsItemView[]; totalCount: number | null; hasMore: boolean }> {
  const config = __FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const page = await fetchPostgrestPage<NewsItemRow>({
    config: {
      url: config.url,
      anonKey: config.anonKey,
      schema: config.schema || "public",
    },
    table: "news_items",
    select: NEWS_COLUMNS,
    filters: [...filters],
    order: ["published_date.desc", "published_at.desc"],
    pageSize,
    offset,
  });

  return {
    items: page.rows.map(normalizeRow).filter((item) => item.title && item.url),
    totalCount: page.totalCount,
    hasMore: page.hasMore,
  };
}

async function fetchNewsFilterIndex(): Promise<NewsFilterIndexItem[]> {
  const config = __FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const rows = await fetchAllPostgrestRows<NewsFilterIndexRow>({
    config: {
      url: config.url,
      anonKey: config.anonKey,
      schema: config.schema || "public",
    },
    table: "news_items",
    select: NEWS_FILTER_INDEX_COLUMNS,
    order: ["published_date.desc"],
    pageSize: 1000,
  });

  return rows.map(normalizeFilterIndexRow);
}

async function renderFeed(root: HTMLElement): Promise<void> {
  root.replaceChildren();

  const initialState = readNewsListQueryState();
  let selectedLayer: LayerFilter = initialState.layer;
  let selectedDate: string | null = initialState.date;
  let selectedDateWasExplicit = initialState.hasDate;
  let calendarMonth: YearMonth = { year: 2026, month: 6 };
  let filterIndex: NewsFilterIndexItem[] = [];
  let items: NewsItemView[] = [];
  let totalCount: number | null = null;
  let currentPage = initialState.page;
  let pageSize = initialState.pageSize;
  let loadingPage = false;
  let pageError: string | null = null;
  let loadGeneration = 0;

  const overview = document.createElement("header");
  overview.className = "frontier-news-hero";
  const titleGroup = document.createElement("div");
  titleGroup.className = "frontier-news-title";
  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Agent Frontier News · 自动收集";
  const title = document.createElement("h2");
  title.textContent = "AI 前沿文章";
  const description = document.createElement("p");
  description.textContent =
    "由 news-collector 从多源 RSS 聚合；按发布时间与体系层筛选，每条保留来源、摘要与原文入口。";
  titleGroup.append(eyebrow, title, description);

  const stats = document.createElement("div");
  stats.className = "frontier-news-stats";
  stats.append(
    statItem(String(items.length), "文章"),
    statItem(String(availableDates(items).length), "日期"),
    statItem(String(new Set(items.map((i) => i.ecosystemLayer)).size), "体系层"),
    statItem(String(new Set(items.map((i) => i.sourceName)).size), "来源"),
  );
  overview.append(titleGroup, stats);

  const filters = document.createElement("nav");
  filters.className = "frontier-layer-tabs";
  filters.setAttribute("aria-label", "资讯体系层");

  const calendar = document.createElement("section");
  calendar.className = "frontier-calendar";
  calendar.setAttribute("aria-label", "按日期筛选文章");

  const timeline = document.createElement("section");
  timeline.className = "frontier-article-timeline";
  timeline.setAttribute("aria-label", "文章列表");

  const layerTitle = document.createElement("strong");
  layerTitle.className = "frontier-filter-title";
  layerTitle.textContent = "按体系层筛选";
  const layerFilterGroup = document.createElement("div");
  layerFilterGroup.className = "frontier-filter-group";

  const filterBoard = document.createElement("section");
  filterBoard.className = "frontier-filter-board";

  const listPanel = document.createElement("section");
  listPanel.className = "frontier-news-list-panel";

  const layout = document.createElement("div");
  layout.className = "frontier-news-layout";
  const timelineStatus = document.createElement("div");
  timelineStatus.className = "frontier-timeline-status";
  const pagination = document.createElement("div");
  pagination.className = "frontier-news-pagination";

  function indexLayerScoped(layer: LayerFilter = selectedLayer): NewsFilterIndexItem[] {
    if (layer === "all") return filterIndex;
    return filterIndex.filter((item) => item.ecosystemLayer === layer);
  }

  function currentPageItems(): NewsItemView[] {
    return items;
  }

  function layerCount(layer: LayerFilter): number {
    return filterByDate(indexLayerScoped(layer), selectedDate).length;
  }

  function dateCount(date: string): number {
    return indexLayerScoped().filter((item) => item.collectedDate.slice(0, 10) === date).length;
  }

  function selectedDateLabel(): string {
    if (selectedDate === null) return "全部日期";
    return formatChineseDateLabel(selectedDate);
  }

  function alignDateToLayer(): void {
    if (selectedDate === null) return;
    const dates = availableDates(indexLayerScoped());
    if (dates.includes(selectedDate)) return;
    selectedDate = dates[0] ?? null;
    const nextMonth = yearMonthOf(selectedDate);
    if (nextMonth) calendarMonth = nextMonth;
  }

  function syncFilterState(): void {
    if (selectedDate === null && !selectedDateWasExplicit) {
      selectedDate = pickDefaultDate(filterIndex);
    }
    alignDateToLayer();
    calendarMonth =
      yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(filterIndex)[0] ?? null) ?? calendarMonth;
  }

  function renderStatus(): void {
    const visibleCount = currentPageItems().length;
    if (loadingPage) {
      timelineStatus.textContent = `正在加载第 ${currentPage} 页… 当前页 ${items.length} 篇${totalCount ? ` / 总计 ${totalCount} 篇` : ""}`;
      return;
    }
    if (pageError) {
      timelineStatus.textContent = `分页加载失败：${pageError}`;
      return;
    }
    const totalPages = resolveTotalPages(totalCount, pageSize);
    timelineStatus.textContent =
      totalPages > 0
        ? `第 ${currentPage} / ${totalPages} 页 · 当前页 ${items.length} 篇${visibleCount !== items.length ? ` · 当前筛选命中 ${visibleCount} 篇` : ""}${totalCount ? ` · 总计 ${totalCount} 篇` : ""}`
        : `当前页 ${items.length} 篇${visibleCount !== items.length ? ` · 当前筛选命中 ${visibleCount} 篇` : ""}`;
  }


  function renderAll(): void {
    syncFilterState();
    stats.replaceChildren(
      statItem(String(totalCount ?? items.length), "文章"),
      statItem(String(availableDates(indexLayerScoped()).length), "日期"),
      statItem(String(new Set(indexLayerScoped().map((i) => i.ecosystemLayer)).size), "体系层"),
      statItem(String(new Set(indexLayerScoped().map((i) => i.sourceName)).size), "来源"),
    );
    renderFilters();
    renderCalendar();
    renderTimeline();
    renderStatus();
    renderPagination();
  }

  function renderFilters(): void {
    filters.replaceChildren();
    const entries: Array<{ id: LayerFilter; label: string }> = [
      { id: "all", label: "全部体系" },
      ...FRONTIER_ECOSYSTEM_LAYERS.map((layer) => ({ id: layer.id, label: layer.label })),
    ];
    for (const entry of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "frontier-layer-tab";
      if (entry.id === selectedLayer) button.dataset.active = "true";
      button.textContent = `${entry.label} ${layerCount(entry.id)}`;
      button.addEventListener("click", () => {
        selectedLayer = entry.id;
        selectedDateWasExplicit = true;
        alignDateToLayer();
        currentPage = 1;
        void loadPage(1);
      });
      filters.append(button);
    }
  }

  function renderCalendar(): void {
    calendar.replaceChildren();
    const contentDates = new Set(availableDates(indexLayerScoped()));

    const head = document.createElement("div");
    head.className = "frontier-cal-head";
    const calTitle = document.createElement("strong");
    calTitle.className = "frontier-cal-title";
    calTitle.textContent = "按日期筛选文章";
    const nav = document.createElement("div");
    nav.className = "frontier-cal-nav";
    const prev = calNavButton("‹", "上个月", () => {
      calendarMonth = shiftMonth(calendarMonth.year, calendarMonth.month, -1);
      renderCalendar();
    });
    const label = document.createElement("span");
    label.className = "frontier-cal-label";
    label.textContent = `${calendarMonth.year}年 ${calendarMonth.month}月`;
    const next = calNavButton("›", "下个月", () => {
      calendarMonth = shiftMonth(calendarMonth.year, calendarMonth.month, 1);
      renderCalendar();
    });
    nav.append(prev, label, next);
    head.append(calTitle, nav);

    const current = document.createElement("p");
    current.className = "frontier-cal-current";
    current.textContent = `${selectedDateLabel()} · ${selectedDate === null ? totalCount ?? filterIndex.length : dateCount(selectedDate)} 篇`;

    const weekdays = document.createElement("div");
    weekdays.className = "frontier-cal-weekdays";
    for (const weekday of WEEKDAY_LABELS) {
      const span = document.createElement("span");
      span.textContent = weekday;
      weekdays.append(span);
    }

    const grid = document.createElement("div");
    grid.className = "frontier-cal-grid";
    for (const week of buildCalendarMonth(calendarMonth.year, calendarMonth.month, contentDates)) {
      for (const cell of week) {
        const button = document.createElement("button");
        const count = dateCount(cell.date);
        button.type = "button";
        button.className = "frontier-cal-cell";
        button.textContent = String(cell.day);
        if (!cell.inMonth) button.dataset.outside = "true";
        if (cell.hasContent) {
          button.dataset.hasContent = "true";
          button.title = `${cell.date} · ${count} 篇`;
          button.setAttribute("aria-label", `查看 ${cell.date} 的 ${count} 篇文章`);
          button.addEventListener("click", () => {
            selectedDate = cell.date;
            selectedDateWasExplicit = true;
            const nextMonth = yearMonthOf(cell.date);
            if (nextMonth) calendarMonth = nextMonth;
            currentPage = 1;
            void loadPage(1);
          });
        } else {
          button.disabled = true;
        }
        if (cell.date === selectedDate) button.dataset.active = "true";
        grid.append(button);
      }
    }

    const all = document.createElement("button");
    all.type = "button";
    all.className = "frontier-cal-all";
    all.textContent = `全部日期 (${indexLayerScoped().length})`;
    if (selectedDate === null) all.dataset.active = "true";
    all.addEventListener("click", () => {
      selectedDate = null;
      selectedDateWasExplicit = true;
      currentPage = 1;
      void loadPage(1);
    });

    calendar.append(head, current, weekdays, grid, all);
  }

  function renderTimeline(): void {
    timeline.replaceChildren();
    const rows = currentPageItems();
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "frontier-timeline-empty";
      empty.textContent = "该筛选条件下当前页暂无文章，可切换页码或调整筛选条件。";
      timeline.append(empty);
      return;
    }

    const groups = groupByDate(rows);
    let rank = 1;
    for (const group of groups) {
      const section = document.createElement("section");
      section.className = "frontier-date-section";
      const dateHeader = document.createElement("div");
      dateHeader.className = "frontier-timeline-date";
      const triangle = document.createElement("span");
      triangle.setAttribute("aria-hidden", "true");
      const dateText = document.createElement("strong");
      dateText.textContent = group.label;
      const count = document.createElement("em");
      count.textContent = `${group.items.length} 篇`;
      dateHeader.append(triangle, dateText, count);

      const list = document.createElement("div");
      list.className = "frontier-timeline-list";
      for (const item of group.items) {
        list.append(
          newsCard(
            item,
            rank,
            false,
            () => openArticleDetail(item),
          ),
        );
        rank += 1;
      }
      section.append(dateHeader, list);
      timeline.append(section);
    }
  }

  function openArticleDetail(item: NewsItemView): void {
    window.location.href = newsArticleHref(item.externalId, currentRelativePath());
  }

  function activeQueryFilters(): string[] {
    return buildNewsFilters(selectedLayer, selectedDate);
  }

  function replaceNewsListState(): void {
    const params = new URLSearchParams(window.location.search);
    params.set("layer", selectedLayer);
    params.set("date", selectedDate ?? "all");
    params.set("page", String(currentPage));
    params.set("pageSize", String(pageSize));
    replaceCurrentSearch(params);
  }

  function renderPagination(): void {
    pagination.replaceChildren();
    const totalPages = resolveTotalPages(totalCount, pageSize);
    if (totalPages <= 1 && totalCount !== null && totalCount <= pageSize) return;

    const controls = document.createElement("div");
    controls.className = "frontier-pagination-controls";

    const prev = pageButton("‹", currentPage <= 1, () => {
      void loadPage(currentPage - 1);
    });
    prev.setAttribute("aria-label", "上一页");
    controls.append(prev);

    for (const token of buildPaginationTokens(totalPages, currentPage)) {
      if (token === "...") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "frontier-pagination-ellipsis";
        ellipsis.textContent = "…";
        controls.append(ellipsis);
        continue;
      }

      const button = pageButton(String(token), token === currentPage, () => {
        void loadPage(token);
      });
      if (token === currentPage) button.dataset.active = "true";
      controls.append(button);
    }

    const next = pageButton("›", totalPages > 0 && currentPage >= totalPages, () => {
      void loadPage(currentPage + 1);
    });
    next.setAttribute("aria-label", "下一页");
    controls.append(next);

    const pageSizeWrap = document.createElement("label");
    pageSizeWrap.className = "frontier-page-size";
    const pageSizeLabel = document.createElement("span");
    pageSizeLabel.textContent = "每页";
    const pageSizeSelect = document.createElement("select");
    pageSizeSelect.className = "frontier-page-size-select";
    for (const optionValue of NEWS_PAGE_SIZE_OPTIONS) {
      const option = document.createElement("option");
      option.value = String(optionValue);
      option.textContent = `${optionValue} 条`;
      if (optionValue === pageSize) option.selected = true;
      pageSizeSelect.append(option);
    }
    pageSizeSelect.addEventListener("change", () => {
      const nextSize = Number(pageSizeSelect.value);
      if (!Number.isInteger(nextSize) || nextSize <= 0 || nextSize === pageSize) return;
      pageSize = nextSize;
      currentPage = 1;
      void loadPage(1);
    });
    pageSizeWrap.append(pageSizeLabel, pageSizeSelect);

    pagination.append(controls, pageSizeWrap);
  }

  async function loadPage(targetPage: number): Promise<void> {
    if (loadingPage) return;
    const safeTargetPage = Math.max(1, targetPage);
    loadingPage = true;
    pageError = null;
    renderStatus();
    renderPagination();

    const generation = ++loadGeneration;
    try {
      const page = await fetchNewsPage((safeTargetPage - 1) * pageSize, activeQueryFilters(), pageSize);
      if (generation !== loadGeneration) return;
      currentPage = safeTargetPage;
      items = page.items;
      totalCount = page.totalCount;
      const totalPages = resolveTotalPages(totalCount, pageSize);
      if (totalPages > 0 && currentPage > totalPages) {
        currentPage = totalPages;
      }
      renderAll();
      replaceNewsListState();
    } catch (error: unknown) {
      if (generation !== loadGeneration) return;
      pageError = error instanceof Error ? error.message : String(error);
      renderStatus();
      renderPagination();
    } finally {
      if (generation === loadGeneration) {
        loadingPage = false;
        renderStatus();
        renderPagination();
      }
    }
  }

  layerFilterGroup.append(layerTitle, filters);
  filterBoard.append(layerFilterGroup, calendar);
  listPanel.append(filterBoard, timeline, timelineStatus, pagination);
  layout.append(listPanel);
  root.append(overview, layout);

  filterIndex = await fetchNewsFilterIndex();
  if (!selectedDateWasExplicit) {
    selectedDate = pickDefaultDate(filterIndex);
  } else {
    alignDateToLayer();
  }
  calendarMonth = yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(filterIndex)[0] ?? null) ?? calendarMonth;
  await loadPage(currentPage);

  if (items.length === 0) {
    timeline.replaceChildren(
      statusBlock("每日资讯暂无数据。先运行 news-collector（pnpm news:collect）或导入 news_items seed。"),
    );
    timelineStatus.textContent = "";
    pagination.replaceChildren();
  }
}

function readNewsListQueryState(search = typeof window === "undefined" ? "" : window.location.search): NewsListQueryState {
  const params = new URLSearchParams(search);
  const layer = layerFilterValue(params.get("layer"));
  const hasDate = params.has("date");
  const rawDate = params.get("date")?.trim() || "";
  const date = rawDate === "all" ? null : dateStringValue(rawDate, "") || null;
  const page = positiveIntegerParam(params, "page", 1);
  const rawPageSize = positiveIntegerParam(params, "pageSize", DEFAULT_NEWS_PAGE_SIZE);
  const pageSize = NEWS_PAGE_SIZE_OPTIONS.includes(rawPageSize as (typeof NEWS_PAGE_SIZE_OPTIONS)[number])
    ? rawPageSize
    : DEFAULT_NEWS_PAGE_SIZE;
  return { layer, date, hasDate, page, pageSize };
}

function layerFilterValue(value: string | null): LayerFilter {
  if (value === "all") return "all";
  if (typeof value === "string" && FRONTIER_ECOSYSTEM_LAYERS.some((layer) => layer.id === value)) {
    return value as FrontierEcosystemLayer;
  }
  return "all";
}
function pageButton(label: string, disabled: boolean, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "frontier-pagination-button";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function resolveTotalPages(totalCount: number | null, pageSize: number): number {
  if (totalCount === null || totalCount <= 0) return 0;
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export function buildPaginationTokens(
  totalPages: number,
  currentPage: number,
): Array<number | "..."> {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) {
    tokens.add(2);
    tokens.add(3);
    tokens.add(4);
  }
  if (currentPage >= totalPages - 2) {
    tokens.add(totalPages - 1);
    tokens.add(totalPages - 2);
    tokens.add(totalPages - 3);
  }

  const pages = [...tokens]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const result: Array<number | "..."> = [];
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) {
      result.push("...");
    }
    result.push(page);
  }
  return result;
}

export function buildNewsFilters(layer: LayerFilter, date: string | null): string[] {
  const filters: string[] = [];
  if (layer !== "all") filters.push(`ecosystem_layer=eq.${layer}`);
  if (date !== null) filters.push(`published_date=eq.${date}`);
  return filters;
}

export function cleanNewsSummary(summary: string): string {
  return summary
    .replace(/\bArticle URL:\s*https?:\/\/\S+/gi, " ")
    .replace(/\bComments URL:\s*https?:\/\/\S+/gi, " ")
    .replace(/\bPoints:\s*\d+/gi, " ")
    .replace(/#\s*Comments:\s*\d+/gi, " ")
    .replace(/\bComments:\s*\d+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildReadableNewsSummary(input: ReadableNewsInput): string {
  const cleaned = cleanNewsSummary(input.summary);
  if (cleaned) return truncateNewsText(cleaned, NEWS_EXCERPT_MAX_LENGTH);

  const title = input.title.trim();
  if (title) return truncateNewsText(`文章主题：${title}`, NEWS_EXCERPT_MAX_LENGTH);

  return `来自 ${input.sourceName || "未知来源"} 的 AI 资讯条目。`;
}

export function buildNewsDetailParagraphs(input: ReadableNewsInput): string[] {
  const cleaned = cleanNewsSummary(input.summary);
  const body = cleaned || input.title.trim();
  const primary = truncateNewsText(body, NEWS_DETAIL_MAX_LENGTH);
  const paragraphs = primary ? splitDetailText(primary) : [buildReadableNewsSummary(input)];
  const tags = input.tags?.filter((tag) => tag.trim()).slice(0, 5) ?? [];
  const context = [
    input.sourceName ? `来源：${input.sourceName}` : "",
    input.ecosystemLayerLabel ? `体系层：${input.ecosystemLayerLabel}` : "",
    tags.length > 0 ? `标签：${tags.join("、")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return context ? [...paragraphs, context] : paragraphs;
}

function splitDetailText(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= 260) return [normalized];

  const paragraphs: string[] = [];
  let buffer = "";
  for (const segment of normalized.split(/(?<=[。！？.!?])\s+/u)) {
    const next = buffer ? `${buffer} ${segment}` : segment;
    if (next.length > 280 && buffer) {
      paragraphs.push(buffer);
      buffer = segment;
    } else {
      buffer = next;
    }
  }
  if (buffer) paragraphs.push(buffer);
  return paragraphs.length > 0 ? paragraphs : [normalized];
}

function truncateNewsText(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function formatArticleDate(item: Pick<NewsItemView, "publishedAt" | "publishedDate">): string {
  if (item.publishedAt) {
    const date = new Date(item.publishedAt);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return item.publishedDate;
}


function calNavButton(symbol: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "frontier-cal-navbtn";
  button.textContent = symbol;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function newsCard(
  item: NewsItemView,
  rankNumber: number,
  active: boolean,
  onSelect: () => void,
): HTMLElement {
  const card = document.createElement("article");
  card.className = "frontier-timeline-item";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `阅读站内详情：${item.title}`);
  if (active) card.dataset.active = "true";

  const marker = document.createElement("span");
  marker.className = "frontier-timeline-marker";
  marker.setAttribute("aria-hidden", "true");

  const content = document.createElement("div");
  content.className = "frontier-timeline-card";

  const cardHead = document.createElement("div");
  cardHead.className = "frontier-timeline-head";
  const rank = document.createElement("span");
  rank.className = "frontier-timeline-rank";
  rank.textContent = String(rankNumber).padStart(2, "0");
  const kind = document.createElement("span");
  kind.className = "frontier-timeline-kind";
  kind.textContent = item.sourceKind;
  cardHead.append(rank, kind);

  const title = document.createElement("h3");
  title.className = "frontier-timeline-title";
  title.textContent = item.title;

  const excerpt = document.createElement("p");
  excerpt.className = "frontier-timeline-excerpt";
  excerpt.textContent = item.summary;

  const meta = document.createElement("div");
  meta.className = "frontier-timeline-meta";
  const source = document.createElement("span");
  source.className = "frontier-timeline-source";
  source.textContent = item.sourceName;
  const layer = document.createElement("span");
  layer.className = "frontier-timeline-layer";
  layer.textContent = item.ecosystemLayerLabel;
  const read = document.createElement("a");
  read.className = "frontier-timeline-read";
  read.href = item.url;
  read.target = "_blank";
  read.rel = "noreferrer";
  read.textContent = "打开原文";
  read.setAttribute("aria-label", `打开原文：${item.title}`);
  meta.append(source, layer, read);

  content.append(cardHead, title, excerpt, meta);
  card.append(marker, content);
  card.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) return;
    onSelect();
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect();
  });
  return card;
}

function newsArticleHref(externalId: string, returnPath?: string): string {
  return withReturnPath(`${BASE}news/article?id=${encodeURIComponent(externalId)}`, returnPath);
}

function groupByDate(items: NewsItemView[]): Array<{ date: string; label: string; items: NewsItemView[] }> {
  const groups = new Map<string, { date: string; label: string; items: NewsItemView[] }>();
  for (const item of items) {
    const key = item.collectedDate.slice(0, 10) || "unknown";
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    groups.set(key, { date: key, label: formatChineseDateLabel(key), items: [item] });
  }
  return [...groups.values()].sort((left, right) => right.date.localeCompare(left.date));
}

function normalizeRow(row: NewsItemRow): NewsItemView {
  const collectionDate = stringValue(row.collected_date, "2026-06-17");
  const publishedAt = typeof row.published_at === "string" ? row.published_at : null;
  const publishedDate = dateStringValue(row.published_date, publishedAt?.slice(0, 10) ?? collectionDate);
  const layer = layerValue(row.ecosystem_layer);
  const title = stringValue(row.title, "");
  const sourceName = stringValue(row.source_name, "未知来源");
  const sourceKind = stringValue(row.source_kind, "news");
  const ecosystemLayerLabel = stringValue(row.ecosystem_layer_label, layerLabel(layer));
  const rawSummary = stringValue(row.summary, "");
  const rawContentExcerpt = stringValue(row.content_excerpt, "");
  const tags = stringArrayValue(row.tags);
  const readableInput: ReadableNewsInput = {
    title,
    summary: rawContentExcerpt || rawSummary,
    sourceName,
    sourceKind,
    ecosystemLayerLabel,
    tags,
  };
  return {
    externalId: stringValue(row.external_id, ""),
    title,
    url: stringValue(row.url, ""),
    summary: buildReadableNewsSummary(readableInput),
    contentExcerpt: buildReadableNewsSummary(readableInput),
    sourceName,
    sourceKind,
    ecosystemLayer: layer,
    ecosystemLayerLabel,
    collectedDate: publishedDate,
    publishedAt,
    publishedDate,
    collectionDate,
    readCount: numberValue(row.read_count, 0),
    tags,
  };
}

function normalizeFilterIndexRow(row: NewsFilterIndexRow): NewsFilterIndexItem {
  const publishedDate = dateStringValue(row.published_date, "2026-06-17");
  const ecosystemLayer = layerValue(row.ecosystem_layer);
  return {
    collectedDate: publishedDate,
    ecosystemLayer,
    sourceName: stringValue(row.source_name, "未知来源"),
  };
}

function statItem(value: string, label: string): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "frontier-news-stat";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  return item;
}

function detailChip(text: string): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.className = "frontier-news-detail-chip";
  chip.textContent = text;
  return chip;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function dateStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArrayValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function layerValue(value: unknown): FrontierEcosystemLayer {
  if (typeof value === "string" && FRONTIER_ECOSYSTEM_LAYERS.some((layer) => layer.id === value)) {
    return value as FrontierEcosystemLayer;
  }
  return "foundation";
}

function layerLabel(layer: FrontierEcosystemLayer): string {
  return FRONTIER_ECOSYSTEM_LAYERS.find((item) => item.id === layer)?.label ?? layer;
}

function formatChineseDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return DEFAULT_DATE_LABEL;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return DEFAULT_DATE_LABEL;
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ];
  return `${month}月${day}日 · ${weekday}`;
}

function statusBlock(message: string): HTMLDivElement {
  const status = document.createElement("div");
  status.className = "frontier-archive-status";
  status.textContent = message;
  return status;
}
