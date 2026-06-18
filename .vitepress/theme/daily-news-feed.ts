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
import { fetchPostgrestPage } from "./postgrest-pagination";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;
const DEFAULT_DATE_LABEL = "6月17日 · 周三";
const DEFAULT_NEWS_PAGE_SIZE = 10;
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

interface NewsItemRow {
  external_id?: unknown;
  title?: unknown;
  url?: unknown;
  summary?: unknown;
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

type LayerFilter = FrontierEcosystemLayer | "all";

const NEWS_COLUMNS = [
  "external_id",
  "title",
  "url",
  "summary",
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

async function renderFeed(root: HTMLElement): Promise<void> {
  root.replaceChildren();

  let selectedLayer: LayerFilter = "all";
  let selectedDate: string | null = null;
  let calendarMonth: YearMonth = { year: 2026, month: 6 };
  let items: NewsItemView[] = [];
  let totalCount: number | null = null;
  let currentPage = 1;
  let pageSize = DEFAULT_NEWS_PAGE_SIZE;
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

  function layerScoped(layer: LayerFilter = selectedLayer): NewsItemView[] {
    if (layer === "all") return items;
    return items.filter((item) => item.ecosystemLayer === layer);
  }

  function visible(): NewsItemView[] {
    return filterByDate(layerScoped(), selectedDate);
  }

  function layerCount(layer: LayerFilter): number {
    return filterByDate(layerScoped(layer), selectedDate).length;
  }

  function dateCount(date: string): number {
    return layerScoped().filter((item) => item.collectedDate.slice(0, 10) === date).length;
  }

  function selectedDateLabel(): string {
    if (selectedDate === null) return "全部日期";
    return formatChineseDateLabel(selectedDate);
  }

  function alignDateToLayer(): void {
    if (selectedDate === null) return;
    const dates = availableDates(layerScoped());
    if (dates.includes(selectedDate)) return;
    selectedDate = dates[0] ?? null;
    const nextMonth = yearMonthOf(selectedDate);
    if (nextMonth) calendarMonth = nextMonth;
  }

  function syncFilterState(): void {
    if (selectedDate === null) {
      selectedDate = pickDefaultDate(items);
    }
    alignDateToLayer();
    calendarMonth =
      yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(items)[0] ?? null) ?? calendarMonth;
  }

  function renderStatus(): void {
    const visibleCount = visible().length;
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
      statItem(String(availableDates(items).length), "日期"),
      statItem(String(new Set(items.map((i) => i.ecosystemLayer)).size), "体系层"),
      statItem(String(new Set(items.map((i) => i.sourceName)).size), "来源"),
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
        alignDateToLayer();
        renderAll();
      });
      filters.append(button);
    }
  }

  function renderCalendar(): void {
    calendar.replaceChildren();
    const contentDates = new Set(availableDates(layerScoped()));

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
    current.textContent = `${selectedDateLabel()} · ${visible().length} 篇`;

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
            const nextMonth = yearMonthOf(cell.date);
            if (nextMonth) calendarMonth = nextMonth;
            renderAll();
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
    all.textContent = `全部日期 (${layerScoped().length})`;
    if (selectedDate === null) all.dataset.active = "true";
    all.addEventListener("click", () => {
      selectedDate = null;
      renderAll();
    });

    calendar.append(head, current, weekdays, grid, all);
  }

  function renderTimeline(): void {
    timeline.replaceChildren();
    const rows = visible();
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
        list.append(newsCard(item, rank));
        rank += 1;
      }
      section.append(dateHeader, list);
      timeline.append(section);
    }
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
      const page = await fetchNewsPage((safeTargetPage - 1) * pageSize, pageSize);
      if (generation !== loadGeneration) return;
      currentPage = safeTargetPage;
      items = page.items;
      totalCount = page.totalCount;
      const totalPages = resolveTotalPages(totalCount, pageSize);
      if (totalPages > 0 && currentPage > totalPages) {
        currentPage = totalPages;
      }
      if (selectedDate === null) {
        selectedDate = pickDefaultDate(items);
      }
      renderAll();
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

  await loadPage(1);

  if (items.length === 0) {
    timeline.replaceChildren(
      statusBlock("每日资讯暂无数据。先运行 news-collector（pnpm news:collect）或导入 news_items seed。"),
    );
    timelineStatus.textContent = "";
    pagination.replaceChildren();
  }
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

function calNavButton(symbol: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "frontier-cal-navbtn";
  button.textContent = symbol;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function newsCard(item: NewsItemView, rankNumber: number): HTMLElement {
  const card = document.createElement("article");
  card.className = "frontier-timeline-item";
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `打开原文：${item.title}`);

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
  read.textContent = "原文";
  meta.append(source, layer, read);

  content.append(cardHead, title, excerpt, meta);
  card.append(marker, content);
  card.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) return;
    window.open(item.url, "_blank", "noopener,noreferrer");
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    window.open(item.url, "_blank", "noopener,noreferrer");
  });
  return card;
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
  return {
    externalId: stringValue(row.external_id, ""),
    title: stringValue(row.title, ""),
    url: stringValue(row.url, ""),
    summary: stringValue(row.summary, ""),
    sourceName: stringValue(row.source_name, "未知来源"),
    sourceKind: stringValue(row.source_kind, "news"),
    ecosystemLayer: layer,
    ecosystemLayerLabel: stringValue(row.ecosystem_layer_label, layerLabel(layer)),
    collectedDate: publishedDate,
    publishedAt,
    publishedDate,
    collectionDate,
    readCount: numberValue(row.read_count, 0),
    tags: stringArrayValue(row.tags),
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
