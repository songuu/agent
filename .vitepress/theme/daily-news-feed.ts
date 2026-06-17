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

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;
const DEFAULT_DATE_LABEL = "6月17日 · 周三";

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

  loadNewsFromSupabase()
    .then((items) => renderFeed(root, items))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      root.replaceChildren(statusBlock(`资讯读取失败：${message}`));
    });
}

async function loadNewsFromSupabase(): Promise<NewsItemView[]> {
  const config = __FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const baseUrl = config.url.replace(/\/+$/, "");
  const endpoint =
    `${baseUrl}/rest/v1/news_items` +
    `?select=${NEWS_COLUMNS}` +
    "&order=published_date.desc,published_at.desc" +
    "&limit=500";
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Accept-Profile": config.schema || "public",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`HTTP ${response.status} ${detail.slice(0, 180)}`);
  }

  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows)) throw new Error("返回数据不是数组");

  return rows.map(normalizeRow).filter((item) => item.title && item.url);
}

function renderFeed(root: HTMLElement, items: NewsItemView[]): void {
  root.replaceChildren();

  if (items.length === 0) {
    root.append(
      statusBlock("每日资讯暂无数据。先运行 news-collector（pnpm news:collect）或导入 news_items seed。"),
    );
    return;
  }

  let selectedLayer: LayerFilter = "all";
  let selectedDate: string | null = pickDefaultDate(items);
  let calendarMonth: YearMonth =
    yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(items)[0] ?? null) ?? { year: 2026, month: 6 };

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

  function renderAll(): void {
    renderFilters();
    renderCalendar();
    renderTimeline();
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
      empty.textContent = "该筛选条件下暂无文章。";
      timeline.append(empty);
      return;
    }

    let rank = 1;
    for (const group of groupByDate(rows)) {
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

  renderAll();
  layerFilterGroup.append(layerTitle, filters);
  filterBoard.append(layerFilterGroup, calendar);
  listPanel.append(filterBoard, timeline);
  layout.append(listPanel);
  root.append(overview, layout);
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
