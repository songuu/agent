// 每日 AI 资讯展示器（仿 ai.codefather.cn/news）。
//
// 读取由 news-collector 自动收集的服务器 PostgreSQL `news_items` 资源，
// 经同源 Content API 渲染为 codefather 风格的日期时间线 + 体系层筛选。
// 安全不变量：浏览器不直连 Supabase/PostgREST，也不持有任何数据库写入密钥。

import { FRONTIER_ECOSYSTEM_LAYERS } from "../../knowledge-graph/data/frontier-ecosystem-layers";
import type { FrontierEcosystemLayer } from "../../knowledge-graph/data/graph";
import {
  availableDates,
  buildCalendarMonth,
  filterByDate,
  shiftMonth,
  yearMonthOf,
  type YearMonth,
} from "./frontier-date-filter";
import { fetchPostgrestPage } from "./content-pagination";
import { createContentApiClient } from "./content-api-client";
import {
  currentRelativePath,
  positiveIntegerParam,
  rememberListDetailPosition,
  replaceCurrentSearch,
  restoreListDetailPosition,
  withReturnPath,
} from "./list-detail-return";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;
const DEFAULT_DATE_LABEL = "6月17日 · 周三";
const DEFAULT_NEWS_PAGE_SIZE = 10;
const NEWS_EXCERPT_MAX_LENGTH = 220;
const NEWS_DETAIL_MAX_LENGTH = 760;
const NEWS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const NEWS_TIME_ZONE = "Asia/Shanghai";
export const DAILY_NEWS_REQUEST_TIMEOUT_MS = 10_000;

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
  /** date-filter helper uses this field as the article date; it is sourced from collected_date. */
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
  title_zh?: unknown;
  summary_zh?: unknown;
  translation_status?: unknown;
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

export interface NewsFilterIndexItem {
  collectedDate: string;
  ecosystemLayer: FrontierEcosystemLayer;
  articleCount: number;
}

interface NewsSourceCount {
  readonly layer: LayerFilter;
  readonly count: number;
}

interface NewsFilterIndex {
  readonly items: NewsFilterIndexItem[];
  readonly sourceCounts: NewsSourceCount[];
}

type LayerFilter = FrontierEcosystemLayer | "all";

interface NewsListQueryState {
  readonly layer: LayerFilter;
  readonly date: string | null;
  readonly hasDate: boolean;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * The card request deliberately skips the database COUNT query. A calendar
 * response already carries the same date/layer aggregate needed for numbered
 * pagination, while `hasMore` remains the safe fallback until it arrives.
 */
export interface NewsPageRequest {
  readonly table: "news_items";
  readonly select: string;
  readonly filters: readonly string[];
  readonly order: readonly string[];
  readonly pageSize: number;
  readonly offset: number;
  readonly count: "none";
}

export interface NewsPaginationState {
  /** `null` means that the calendar aggregate has not become available yet. */
  readonly totalPages: number | null;
  readonly showControls: boolean;
  readonly showPageNumbers: boolean;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
}

export interface BoundedNewsRequest {
  readonly fetchImpl: typeof fetch;
  readonly timedOut: boolean;
  abort(): void;
  dispose(): void;
}

const NEWS_COLUMNS = [
  "external_id",
  "title",
  "title_zh",
  "summary_zh",
  "translation_status",
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

const BASE = (import.meta.env?.BASE_URL ?? "/") as string;

const initialized = new WeakSet<HTMLElement>();
const activeDailyNewsFeeds = new Map<HTMLElement, AbortController>();

if (typeof window !== "undefined") {
  installDailyNewsFeeds();
}

function installDailyNewsFeeds(): void {
  scanDailyNewsFeeds();
  const observer = new MutationObserver(() => scanDailyNewsFeeds());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanDailyNewsFeeds(): void {
  cancelDetachedDailyNewsFeeds();
  document.querySelectorAll<HTMLElement>("[data-daily-news]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    createFeed(root);
  });
}

function cancelDetachedDailyNewsFeeds(): void {
  for (const [root, controller] of activeDailyNewsFeeds) {
    if (root.isConnected) continue;
    controller.abort();
    activeDailyNewsFeeds.delete(root);
  }
}

function createFeed(root: HTMLElement): void {
  activeDailyNewsFeeds.get(root)?.abort();
  const lifecycleController = new AbortController();
  activeDailyNewsFeeds.set(root, lifecycleController);
  root.classList.add("frontier-archive-shell");
  root.replaceChildren(statusBlock("正在读取每日资讯..."));
  try {
    renderFeed(root, lifecycleController.signal);
  } catch (error: unknown) {
    if (!isActiveDailyNewsFeed(root, lifecycleController)) return;
    const message = error instanceof Error ? error.message : String(error);
    root.replaceChildren(statusBlock(`资讯读取失败：${message}`));
  }
}

function isActiveDailyNewsFeed(root: HTMLElement, controller: AbortController): boolean {
  return activeDailyNewsFeeds.get(root) === controller && !controller.signal.aborted && root.isConnected;
}

/**
 * Keeps a view-owned request bounded and lets a later interaction supersede it.
 * The wrapper is passed into existing Content API calls, so no alternate data
 * path or browser-side database fallback is introduced.
 */
export function createBoundedNewsRequest(
  parentSignal?: AbortSignal,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
  timeoutMs = DAILY_NEWS_REQUEST_TIMEOUT_MS,
): BoundedNewsRequest {
  const controller = new AbortController();
  let timedOut = false;
  let disposed = false;
  const abortFromParent = (): void => controller.abort();
  if (parentSignal?.aborted) abortFromParent();
  else parentSignal?.addEventListener("abort", abortFromParent, { once: true });

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    globalThis.clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", abortFromParent);
  };

  const boundedFetch: typeof fetch = (input, init) => {
    const requestSignal = init?.signal;
    const abortFromRequest = (): void => controller.abort();
    if (requestSignal?.aborted) abortFromRequest();
    else requestSignal?.addEventListener("abort", abortFromRequest, { once: true });

    const request = fetchImpl(input, { ...init, signal: controller.signal });
    if (!requestSignal || requestSignal === controller.signal) return request;
    return request.finally(() => requestSignal.removeEventListener("abort", abortFromRequest));
  };

  return {
    fetchImpl: boundedFetch,
    get timedOut() {
      return timedOut;
    },
    abort() {
      controller.abort();
      cleanup();
    },
    dispose: cleanup,
  };
}

async function fetchNewsPage(
  offset: number,
  filters: readonly string[],
  pageSize: number = DEFAULT_NEWS_PAGE_SIZE,
  fetchImpl?: typeof fetch,
): Promise<{ items: NewsItemView[]; hasMore: boolean }> {
  const page = await fetchPostgrestPage<NewsItemRow>({
    ...buildNewsPageRequest(offset, filters, pageSize),
    fetchImpl,
  });

  return {
    items: page.rows.map(normalizeRow).filter((item) => item.title && item.url),
    hasMore: page.hasMore,
  };
}

/** Builds the only page-read shape used by the daily news cards. */
export function buildNewsPageRequest(
  offset: number,
  filters: readonly string[],
  pageSize: number = DEFAULT_NEWS_PAGE_SIZE,
): NewsPageRequest {
  return {
    table: "news_items",
    select: NEWS_COLUMNS,
    filters: [...filters],
    order: ["collected_date.desc", "published_date.desc"],
    pageSize,
    offset,
    count: "none",
  };
}

/**
 * Calendar buckets are grouped by collection date and ecosystem layer, which
 * exactly matches the filters supported by the list request.
 */
export function inferNewsListTotalCount(
  index: readonly NewsFilterIndexItem[],
  layer: LayerFilter,
  date: string | null,
): number {
  return index.reduce((total, item) => {
    if (layer !== "all" && item.ecosystemLayer !== layer) return total;
    if (date !== null && item.collectedDate.slice(0, 10) !== date) return total;
    return total + item.articleCount;
  }, 0);
}

/**
 * Never manufacture a finite page count from a full page of rows. Before the
 * calendar is usable, navigation is limited to the API's directional hint.
 */
export function resolveNewsPagination(
  totalCount: number | null,
  currentPage: number,
  pageSize: number,
  hasMore: boolean,
): NewsPaginationState {
  const safeCurrentPage = Math.max(1, currentPage);
  if (totalCount === null) {
    return {
      totalPages: null,
      showControls: safeCurrentPage > 1 || hasMore,
      showPageNumbers: false,
      canGoPrevious: safeCurrentPage > 1,
      canGoNext: hasMore,
    };
  }

  const totalPages = resolveTotalPages(totalCount, pageSize);
  return {
    totalPages,
    showControls: totalPages > 1,
    showPageNumbers: totalPages > 1,
    canGoPrevious: safeCurrentPage > 1 && totalPages > 0,
    canGoNext: totalPages > 0 && safeCurrentPage < totalPages,
  };
}

async function fetchNewsFilterIndex(fetchImpl?: typeof fetch): Promise<NewsFilterIndex> {
  const calendar = await (await createContentApiClient({ fetchImpl })).fetchNewsCalendar();
  const items = calendar.buckets.map((bucket) => ({
    collectedDate: bucket.date,
    ecosystemLayer: layerValue(bucket.ecosystemLayer),
    articleCount: bucket.articleCount,
  }));
  const sourceCounts = calendar.sourceCounts.flatMap((entry): NewsSourceCount[] => {
    if (entry.ecosystemLayer === "all") return [{ layer: "all", count: entry.sourceCount }];
    if (!FRONTIER_ECOSYSTEM_LAYERS.some((layer) => layer.id === entry.ecosystemLayer)) return [];
    return [{ layer: entry.ecosystemLayer as FrontierEcosystemLayer, count: entry.sourceCount }];
  });
  return { items, sourceCounts };
}

function renderFeed(root: HTMLElement, lifecycleSignal: AbortSignal): void {
  root.replaceChildren();

  const initialState = readNewsListQueryState();
  let selectedLayer: LayerFilter = initialState.layer;
  let selectedDate: string | null = initialState.date;
  let selectedDateWasExplicit = initialState.hasDate;
  let calendarMonth: YearMonth = { year: 2026, month: 6 };
  let filterIndex: NewsFilterIndexItem[] = [];
  let sourceCounts: NewsSourceCount[] = [];
  let items: NewsItemView[] = [];
  let totalCount: number | null = null;
  // Calendar may resolve after an explicit-date card request. Keep its
  // availability separate from an empty (but valid) aggregate response.
  let hasCalendarIndex = false;
  let pageHasMore = false;
  let currentPage = initialState.page;
  let pageSize = initialState.pageSize;
  // With no URL date, calendar decides the first useful date before a list request starts.
  let hasStartedPageRequest = false;
  let loadingPage = false;
  let pageError: string | null = null;
  let loadGeneration = 0;
  let pageRequest: BoundedNewsRequest | null = null;
  let calendarLoading = false;
  let calendarError: string | null = null;
  let calendarGeneration = 0;
  let calendarRequest: BoundedNewsRequest | null = null;

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
    "由 news-collector 从多源 RSS 聚合；按采集日期与体系层筛选，每条保留来源、摘要与原文入口。";
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

  function articleCount(index: readonly NewsFilterIndexItem[]): number {
    return index.reduce((total, item) => total + item.articleCount, 0);
  }

  function layerCount(layer: LayerFilter): number {
    return articleCount(filterByDate(indexLayerScoped(layer), selectedDate));
  }

  function dateCount(date: string): number {
    return articleCount(indexLayerScoped().filter((item) => item.collectedDate.slice(0, 10) === date));
  }

  function calendarTotalCount(): number | null {
    return hasCalendarIndex
      ? inferNewsListTotalCount(filterIndex, selectedLayer, selectedDate)
      : null;
  }

  function sourceCount(layer: LayerFilter = selectedLayer): number {
    return sourceCounts.find((entry) => entry.layer === layer)?.count ?? 0;
  }

  function selectedDateLabel(): string {
    if (selectedDate === null) return "全部日期";
    return formatChineseDateLabel(selectedDate);
  }

  function alignDateToLayer(): void {
    // 仅显式日期会在切换体系层后回退；首屏隐式日期由 calendar 选最新有数据日。
    if (selectedDate === null || !selectedDateWasExplicit) return;
    const dates = availableDates(indexLayerScoped());
    if (dates.includes(selectedDate)) return;
    selectedDate = dates[0] ?? null;
    const nextMonth = yearMonthOf(selectedDate);
    if (nextMonth) calendarMonth = nextMonth;
  }

  function syncFilterState(): void {
    if (selectedDate === null && !selectedDateWasExplicit) {
      selectedDate = currentNewsDate();
    }
    alignDateToLayer();
    calendarMonth =
      yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(filterIndex)[0] ?? null) ?? calendarMonth;
    totalCount = calendarTotalCount();
    if (totalCount !== null) {
      const totalPages = resolveTotalPages(totalCount, pageSize);
      currentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
    }
  }

  function renderStatus(): void {
    const visibleCount = currentPageItems().length;
    timelineStatus.replaceChildren();
    if (waitingForInitialCalendar()) {
      timelineStatus.textContent = "正在确认最近有数据的日期…";
      return;
    }
    if (loadingPage) {
      timelineStatus.textContent = `正在加载第 ${currentPage} 页… 当前页 ${items.length} 篇${totalCount === null ? "" : ` / 总计 ${totalCount} 篇`}`;
      return;
    }
    if (pageError) {
      const message = document.createElement("span");
      message.textContent = `资讯列表暂不可用：${pageError}`;
      const retry = pageButton("重试", false, () => {
        void loadPage(currentPage);
      });
      retry.setAttribute("aria-label", "重试加载资讯列表");
      timelineStatus.append(message, " ", retry);
      return;
    }
    const paginationState = resolveNewsPagination(totalCount, currentPage, pageSize, pageHasMore);
    if (paginationState.totalPages !== null && paginationState.totalPages > 0) {
      timelineStatus.textContent = `第 ${currentPage} / ${paginationState.totalPages} 页 · 当前页 ${items.length} 篇${visibleCount !== items.length ? ` · 当前筛选命中 ${visibleCount} 篇` : ""} · 总计 ${totalCount} 篇`;
      return;
    }
    if (totalCount === null) {
      timelineStatus.textContent = `第 ${currentPage} 页 · 当前页 ${items.length} 篇${visibleCount !== items.length ? ` · 当前筛选命中 ${visibleCount} 篇` : ""}`;
      return;
    }
    timelineStatus.textContent = "当前筛选暂无文章";
  }


  function renderAll(): void {
    syncFilterState();
    stats.replaceChildren(
      statItem(String(totalCount ?? items.length), "文章"),
      statItem(String(availableDates(indexLayerScoped()).length), "日期"),
      statItem(String(new Set(indexLayerScoped().map((i) => i.ecosystemLayer)).size), "体系层"),
      statItem(String(sourceCount()), "来源"),
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
    current.textContent = `${selectedDateLabel()} · ${selectedDate === null ? totalCount ?? articleCount(indexLayerScoped()) : dateCount(selectedDate)} 篇`;

    const calendarStatus = document.createElement("div");
    calendarStatus.className = "frontier-timeline-status";
    if (calendarLoading) {
      calendarStatus.textContent = "正在加载可用日期…";
    } else if (calendarError) {
      const message = document.createElement("span");
      message.textContent = `日期筛选暂不可用：${calendarError}`;
      const retry = pageButton("重试", false, () => {
        void loadCalendar();
      });
      retry.setAttribute("aria-label", "重试加载资讯日期筛选");
      calendarStatus.append(message, " ", retry);
    }

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
    all.textContent = `全部日期 (${articleCount(indexLayerScoped())})`;
    if (selectedDate === null) all.dataset.active = "true";
    all.addEventListener("click", () => {
      selectedDate = null;
      selectedDateWasExplicit = true;
      currentPage = 1;
      void loadPage(1);
    });

    calendar.append(head, current);
    if (calendarStatus.childNodes.length > 0) calendar.append(calendarStatus);
    calendar.append(weekdays, grid, all);
  }

  function renderTimeline(): void {
    timeline.replaceChildren();
    const rows = currentPageItems();
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "frontier-timeline-empty";
      empty.textContent = waitingForInitialCalendar()
        ? "正在确认最近有数据的日期…"
        : loadingPage
          ? "正在读取资讯…"
        : pageError
          ? "资讯列表暂不可用，可重试加载。"
          : "该筛选条件下当前页暂无文章，可切换页码或调整筛选条件。";
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
            (card) => openArticleDetail(item, card),
          ),
        );
        rank += 1;
      }
      section.append(dateHeader, list);
      timeline.append(section);
    }
  }

  function openArticleDetail(item: NewsItemView, anchor: HTMLElement): void {
    const returnPath = currentRelativePath();
    rememberListDetailPosition(returnPath, item.externalId, anchor);
    window.location.href = newsArticleHref(item.externalId, returnPath);
  }

  function activeQueryFilters(): string[] {
    return buildNewsFilters(selectedLayer, selectedDate);
  }

  function waitingForInitialCalendar(): boolean {
    return calendarLoading && !calendarError && !selectedDateWasExplicit && !hasStartedPageRequest;
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
    const paginationState = resolveNewsPagination(totalCount, currentPage, pageSize, pageHasMore);
    if (!paginationState.showControls) return;

    const controls = document.createElement("div");
    controls.className = "frontier-pagination-controls";

    const prev = pageButton("‹", loadingPage || !paginationState.canGoPrevious, () => {
      void loadPage(currentPage - 1);
    });
    prev.setAttribute("aria-label", "上一页");
    controls.append(prev);

    if (paginationState.showPageNumbers && paginationState.totalPages !== null) {
      for (const token of buildPaginationTokens(paginationState.totalPages, currentPage)) {
        if (token === "...") {
          const ellipsis = document.createElement("span");
          ellipsis.className = "frontier-pagination-ellipsis";
          ellipsis.textContent = "…";
          controls.append(ellipsis);
          continue;
        }

        const button = pageButton(String(token), loadingPage || token === currentPage, () => {
          void loadPage(token);
        });
        if (token === currentPage) button.dataset.active = "true";
        controls.append(button);
      }
    } else {
      // An unknown total has no safe numeric page range. Keep the current page
      // visible but expose only the API-provided previous/next direction.
      const current = document.createElement("span");
      current.className = "frontier-pagination-ellipsis";
      current.textContent = `第 ${currentPage} 页`;
      controls.append(current);
    }

    const next = pageButton("›", loadingPage || !paginationState.canGoNext, () => {
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
    const knownTotalCount = calendarTotalCount();
    const knownTotalPages = resolveTotalPages(knownTotalCount, pageSize);
    const safeTargetPage = knownTotalCount === null
      ? Math.max(1, targetPage)
      : knownTotalPages > 0
        ? Math.min(Math.max(1, targetPage), knownTotalPages)
        : 1;
    hasStartedPageRequest = true;
    const generation = ++loadGeneration;
    pageRequest?.abort();
    const request = createBoundedNewsRequest(lifecycleSignal);
    pageRequest = request;
    const requestedFilters = activeQueryFilters();
    const requestedPageSize = pageSize;
    currentPage = safeTargetPage;
    loadingPage = true;
    pageError = null;
    // A filter/page switch must not leave cards from the previous query visible.
    items = [];
    totalCount = calendarTotalCount();
    pageHasMore = false;
    renderAll();

    try {
      const page = await fetchNewsPage(
        (safeTargetPage - 1) * requestedPageSize,
        requestedFilters,
        requestedPageSize,
        request.fetchImpl,
      );
      if (generation !== loadGeneration || lifecycleSignal.aborted) return;
      currentPage = safeTargetPage;
      items = page.items;
      pageHasMore = page.hasMore;
      totalCount = calendarTotalCount();
      const totalPages = resolveTotalPages(totalCount, requestedPageSize);
      if (totalPages > 0 && currentPage > totalPages) {
        void loadPage(totalPages);
        return;
      }
      renderAll();
      replaceNewsListState();
    } catch (error: unknown) {
      if (generation !== loadGeneration || lifecycleSignal.aborted) return;
      pageError = newsRequestFailureMessage(error, request);
      renderAll();
    } finally {
      request.dispose();
      if (pageRequest === request) pageRequest = null;
      if (generation === loadGeneration && !lifecycleSignal.aborted) {
        loadingPage = false;
        renderAll();
      }
    }
  }

  async function loadCalendar(): Promise<void> {
    const generation = ++calendarGeneration;
    calendarRequest?.abort();
    const request = createBoundedNewsRequest(lifecycleSignal);
    calendarRequest = request;
    calendarLoading = true;
    calendarError = null;
    renderAll();

    try {
      const calendarIndex = await fetchNewsFilterIndex(request.fetchImpl);
      if (generation !== calendarGeneration || lifecycleSignal.aborted) return;

      filterIndex = calendarIndex.items;
      sourceCounts = calendarIndex.sourceCounts;
      hasCalendarIndex = true;
      const dateBeforeCalendar = selectedDate;
      const pageBeforeCalendar = currentPage;
      selectedDate = resolveInitialNewsDate(selectedDate, selectedDateWasExplicit, indexLayerScoped());
      // A calendar response can also invalidate an explicit URL date for its selected layer.
      // Compare after this correction so cards never retain the old date's response.
      if (selectedDateWasExplicit) alignDateToLayer();
      renderAll();
      const shouldLoadAfterCalendar = shouldLoadNewsPageAfterCalendar(
        dateBeforeCalendar,
        selectedDate,
        selectedDateWasExplicit,
        indexLayerScoped(),
        hasStartedPageRequest,
      );
      if (shouldLoadAfterCalendar) {
        void loadPage(1);
      } else if (currentPage !== pageBeforeCalendar) {
        void loadPage(currentPage);
      }
    } catch (error: unknown) {
      if (generation !== calendarGeneration || lifecycleSignal.aborted) return;
      const shouldStartFallbackPage = shouldLoadNewsPageAfterCalendarFailure(
        selectedDateWasExplicit,
        hasStartedPageRequest,
      );
      calendarError = newsRequestFailureMessage(error, request);
      renderAll();
      if (shouldStartFallbackPage) void loadPage(1);
    } finally {
      request.dispose();
      if (calendarRequest === request) calendarRequest = null;
      if (generation === calendarGeneration && !lifecycleSignal.aborted) {
        calendarLoading = false;
        renderAll();
      }
    }
  }

  layerFilterGroup.append(layerTitle, filters);
  filterBoard.append(layerFilterGroup, calendar);
  listPanel.append(filterBoard, timeline, timelineStatus, pagination);
  layout.append(listPanel);
  root.append(overview, layout);
  restoreListDetailPosition(root);

  if (!selectedDateWasExplicit) {
    selectedDate = currentNewsDate();
  }
  calendarMonth = yearMonthOf(selectedDate) ?? calendarMonth;
  renderAll();
  // 日历只接收服务端按日期与体系层聚合后的分桶，不再把文章明细下载到浏览器。
  void loadCalendar();
  // An explicit URL date is independently actionable. Otherwise wait for the
  // calendar to select the latest actual collection date before querying cards.
  if (selectedDateWasExplicit) void loadPage(currentPage);
}

function readNewsListQueryState(search = typeof window === "undefined" ? "" : window.location.search): NewsListQueryState {
  const params = new URLSearchParams(search);
  const layer = layerFilterValue(params.get("layer"));
  const hasDate = params.has("date");
  const rawDate = params.get("date")?.trim() || "";
  const date = rawDate === "all" ? null : normalizeNewsDate(rawDate, "") || null;
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
  if (date !== null) filters.push(`collected_date=eq.${date}`);
  return filters;
}

/**
 * The first load starts with today's date so it can render immediately. Once
 * the calendar index arrives, prefer the newest actual collection date instead
 * of presenting a normal no-collection day as a backend failure.
 */
export function resolveInitialNewsDate(
  selectedDate: string | null,
  selectedDateWasExplicit: boolean,
  index: readonly { collectedDate: string }[],
): string | null {
  if (selectedDateWasExplicit) return selectedDate;
  return availableDates(index)[0] ?? selectedDate;
}

/**
 * Calendar completion starts one implicit first page only when it found data.
 * Explicit dates already start independently; they reload only after calendar
 * correction changes their final date.
 */
export function shouldLoadNewsPageAfterCalendar(
  dateBeforeCalendar: string | null,
  dateAfterCalendar: string | null,
  selectedDateWasExplicit: boolean,
  index: readonly { collectedDate: string }[],
  hasStartedPageRequest: boolean,
): boolean {
  if (selectedDateWasExplicit) return dateAfterCalendar !== dateBeforeCalendar;
  return !hasStartedPageRequest && availableDates(index).length > 0;
}

/**
 * A failed initial calendar must not strand the page in a loading state. The
 * current date is still a valid list query; until calendar recovery, that
 * request uses only the API's `hasMore` signal for directional pagination.
 */
export function shouldLoadNewsPageAfterCalendarFailure(
  selectedDateWasExplicit: boolean,
  hasStartedPageRequest: boolean,
): boolean {
  return !selectedDateWasExplicit && !hasStartedPageRequest;
}

function newsRequestFailureMessage(error: unknown, request: BoundedNewsRequest): string {
  if (request.timedOut) return "请求超时（10 秒），请重试。";
  if (isAbortError(error)) return "请求已取消，请重试。";

  const message = error instanceof Error ? error.message : String(error);
  if (/Content API HTTP 50[234]\b|content_backend_unavailable/i.test(message)) {
    return "内容服务暂不可用，请稍后重试。";
  }
  return message || "请求失败，请重试。";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
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
  onSelect: (card: HTMLElement) => void,
): HTMLElement {
  const card = document.createElement("article");
  card.className = "frontier-timeline-item";
  card.dataset.listDetailKey = item.externalId;
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
    onSelect(card);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(card);
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

export function preferTranslatedNewsText(original: unknown, translated: unknown, status: unknown): string {
  const originalText = stringValue(original, "");
  return stringValue(status, "") === "translated"
    ? stringValue(translated, originalText)
    : originalText;
}
function normalizeRow(row: NewsItemRow): NewsItemView {
  const collectionDate = normalizeNewsDate(row.collected_date, "2026-06-17");
  const publishedAt = typeof row.published_at === "string" ? row.published_at : null;
  const publishedDate = normalizeNewsDate(row.published_date, publishedAt?.slice(0, 10) ?? collectionDate);
  const layer = layerValue(row.ecosystem_layer);
  const translationReady = stringValue(row.translation_status, "") === "translated";
  const originalTitle = stringValue(row.title, "");
  const title = preferTranslatedNewsText(originalTitle, row.title_zh, row.translation_status);
  const sourceName = stringValue(row.source_name, "未知来源");
  const sourceKind = stringValue(row.source_kind, "news");
  const ecosystemLayerLabel = stringValue(row.ecosystem_layer_label, layerLabel(layer));
  const originalSummary = stringValue(row.summary, "");
  const rawSummary = preferTranslatedNewsText(originalSummary, row.summary_zh, row.translation_status);
  const rawContentExcerpt = translationReady ? "" : stringValue(row.content_excerpt, "");
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
    collectedDate: collectionDate,
    publishedAt,
    publishedDate,
    collectionDate,
    readCount: numberValue(row.read_count, 0),
    tags,
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

export function normalizeNewsDate(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const instant = new Date(raw);
  if (Number.isNaN(instant.getTime())) return fallback;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NEWS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");
  return year && month && day ? `${year}-${month}-${day}` : fallback;
}

export function currentNewsDate(now: Date = new Date()): string {
  return normalizeNewsDate(now.toISOString(), "2026-06-17");
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
