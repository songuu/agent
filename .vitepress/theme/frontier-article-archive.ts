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
import { fetchAllPostgrestRows } from "./postgrest-pagination";
import { getSupabaseRuntimeConfig } from "./supabase-runtime-config";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;

interface FrontierArticle {
  id: string;
  slug: string;
  chapterId: string;
  chapterSlug: string;
  title: string;
  source: string;
  url: string;
  kind: "paper" | "doc" | "blog" | "video" | "internal";
  ecosystemLayer: FrontierEcosystemLayer;
  ecosystemLayerLabel: string;
  summary: string;
  collectedDate: string;
  collectedAt: string;
  displayDateLabel: string;
  readCount: number;
  sortOrder: number;
  tags: string[];
  detailParagraphs: string[];
}

interface FrontierArticleRow {
  article_id?: unknown;
  slug?: unknown;
  chapter_id?: unknown;
  chapter_slug?: unknown;
  title?: unknown;
  source?: unknown;
  source_url?: unknown;
  kind?: unknown;
  ecosystem_layer?: unknown;
  ecosystem_layer_label?: unknown;
  summary?: unknown;
  collected_date?: unknown;
  collected_at?: unknown;
  read_count?: unknown;
  sort_order?: unknown;
  tags?: unknown;
  detail_paragraphs?: unknown;
  metadata?: unknown;
}

type LayerFilter = FrontierEcosystemLayer | "all";

const initialized = new WeakSet<HTMLElement>();
const FRONTIER_CHAPTER_ID = "20";
const DEFAULT_DATE_LABEL = "6月16日 · 周二";
const FRONTIER_COLUMNS = [
  "article_id",
  "slug",
  "chapter_id",
  "chapter_slug",
  "title",
  "source",
  "source_url",
  "kind",
  "ecosystem_layer",
  "ecosystem_layer_label",
  "summary",
  "collected_date",
  "collected_at",
  "read_count",
  "sort_order",
  "tags",
  "detail_paragraphs",
  "metadata",
].join(",");

if (typeof window !== "undefined") {
  installFrontierArticleArchives();
}

function installFrontierArticleArchives(): void {
  scanFrontierArticleArchives();
  const observer = new MutationObserver(() => scanFrontierArticleArchives());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanFrontierArticleArchives(): void {
  document.querySelectorAll<HTMLElement>("[data-frontier-articles]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    createArchive(root);
  });
}

function createArchive(root: HTMLElement): void {
  root.classList.add("frontier-archive-shell");
  root.replaceChildren(statusBlock("正在读取前沿文章库..."));

  loadFrontierArticlesFromSupabase()
    .then((articles) => renderArchive(root, articles))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      root.replaceChildren(statusBlock(`文章库读取失败：${message}`));
    });
}

async function loadFrontierArticlesFromSupabase(): Promise<FrontierArticle[]> {
  const config = await getSupabaseRuntimeConfig();
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const rows = await fetchAllPostgrestRows<FrontierArticleRow>({
    config: {
      url: config.url,
      anonKey: config.anonKey,
      schema: config.schema || "public",
    },
    table: "frontier_ecosystem_articles",
    select: FRONTIER_COLUMNS,
    filters: [`chapter_id=eq.${FRONTIER_CHAPTER_ID}`],
    order: ["sort_order.asc"],
    pageSize: 100,
  });

  return rows.map(normalizeArticleRow).filter((article) => article.title && article.url);
}

function renderArchive(root: HTMLElement, articles: FrontierArticle[]): void {
  root.replaceChildren();

  if (articles.length === 0) {
    root.append(statusBlock("文章库暂无文章。"));
    return;
  }

  let selectedLayer: LayerFilter = "all";
  let selectedDate: string | null = pickDefaultDate(articles);
  let calendarMonth: YearMonth =
    yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(articles)[0] ?? null) ?? { year: 2026, month: 6 };

  const filters = document.createElement("nav");
  filters.className = "frontier-layer-tabs";
  filters.setAttribute("aria-label", "前沿文章体系层");

  const filterBoard = document.createElement("section");
  filterBoard.className = "frontier-filter-board";
  filterBoard.setAttribute("aria-label", "文章筛选器");

  const layerFilterGroup = document.createElement("div");
  layerFilterGroup.className = "frontier-filter-group";
  const layerTitle = document.createElement("strong");
  layerTitle.className = "frontier-filter-title";
  layerTitle.textContent = "按体系层筛选";

  const calendar = document.createElement("section");
  calendar.className = "frontier-calendar";
  calendar.setAttribute("aria-label", "按日期筛选前沿文章");

  const timeline = document.createElement("section");
  timeline.className = "frontier-article-timeline";
  timeline.setAttribute("aria-label", "前沿文章列表");

  const overview = document.createElement("header");
  overview.className = "frontier-news-hero";
  overview.setAttribute("aria-label", "前沿文章库概览");

  const titleGroup = document.createElement("div");
  titleGroup.className = "frontier-news-title";
  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Agent Frontier News";
  const title = document.createElement("h2");
  title.textContent = "前沿文章库";
  const description = document.createElement("p");
  description.textContent = "按日期和体系层筛选 agent 前沿资料；每条文章保留摘要、来源、体系层和原文入口。";
  titleGroup.append(eyebrow, title, description);

  const stats = document.createElement("div");
  stats.className = "frontier-news-stats";
  stats.append(
    statItem(String(articles.length), "资料"),
    statItem(String(groupArticlesByDate(articles).length), "日期"),
    statItem(String(new Set(articles.map((article) => article.ecosystemLayer)).size), "体系层"),
  );
  overview.append(titleGroup, stats);

  const layout = document.createElement("div");
  layout.className = "frontier-news-layout";
  const listPanel = document.createElement("section");
  listPanel.className = "frontier-news-list-panel";
  listPanel.setAttribute("aria-label", "文章列表");

  function layerScopedArticles(layer: LayerFilter = selectedLayer): FrontierArticle[] {
    if (layer === "all") return articles;
    return articles.filter((article) => article.ecosystemLayer === layer);
  }

  function visibleArticles(): FrontierArticle[] {
    return filterByDate(layerScopedArticles(), selectedDate);
  }

  function layerCount(layer: LayerFilter): number {
    return filterByDate(layerScopedArticles(layer), selectedDate).length;
  }

  function selectedDateLabel(): string {
    if (selectedDate === null) return "全部日期";
    const hit = articles.find((article) => article.collectedDate.slice(0, 10) === selectedDate);
    return hit?.displayDateLabel ?? formatChineseDateLabel(selectedDate);
  }

  function dateCount(date: string): number {
    return layerScopedArticles().filter((article) => article.collectedDate.slice(0, 10) === date).length;
  }

  function alignDateToLayer(): void {
    if (selectedDate === null) return;
    const dates = availableDates(layerScopedArticles());
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
    const filterEntries: Array<{ id: LayerFilter; label: string }> = [
      { id: "all", label: "全部体系" },
      ...FRONTIER_ECOSYSTEM_LAYERS.map((layer) => ({ id: layer.id, label: layer.label })),
    ];

    for (const filter of filterEntries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "frontier-layer-tab";
      if (filter.id === selectedLayer) button.dataset.active = "true";
      button.textContent = `${filter.label} ${layerCount(filter.id)}`;
      button.addEventListener("click", () => {
        selectedLayer = filter.id;
        alignDateToLayer();
        renderAll();
      });
      filters.append(button);
    }
  }

  function renderCalendar(): void {
    calendar.replaceChildren();

    const contentDates = new Set(availableDates(layerScopedArticles()));
    const head = document.createElement("div");
    head.className = "frontier-cal-head";
    const title = document.createElement("strong");
    title.className = "frontier-cal-title";
    title.textContent = "按日期筛选文章";
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
    head.append(title, nav);

    const current = document.createElement("p");
    current.className = "frontier-cal-current";
    current.textContent = `${selectedDateLabel()} · ${visibleArticles().length} 篇`;

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
        } else {
          button.disabled = true;
        }
        if (cell.date === selectedDate) button.dataset.active = "true";
        if (cell.hasContent) {
          button.addEventListener("click", () => {
            selectedDate = cell.date;
            const nextMonth = yearMonthOf(cell.date);
            if (nextMonth) calendarMonth = nextMonth;
            renderAll();
          });
        }
        grid.append(button);
      }
    }

    const all = document.createElement("button");
    all.type = "button";
    all.className = "frontier-cal-all";
    all.textContent = `全部日期 (${layerScopedArticles().length})`;
    if (selectedDate === null) all.dataset.active = "true";
    all.addEventListener("click", () => {
      selectedDate = null;
      renderAll();
    });

    calendar.append(head, current, weekdays, grid, all);
  }

  function renderTimeline(): void {
    timeline.replaceChildren();
    const visible = visibleArticles();

    if (visible.length === 0) {
      const empty = document.createElement("p");
      empty.className = "frontier-timeline-empty";
      empty.textContent = "该筛选条件下暂无文章。";
      timeline.append(empty);
      return;
    }

    let rank = 1;
    for (const group of groupArticlesByDate(visible)) {
      const section = document.createElement("section");
      section.className = "frontier-date-section";

      const dateHeader = document.createElement("div");
      dateHeader.className = "frontier-timeline-date";
      const triangle = document.createElement("span");
      triangle.setAttribute("aria-hidden", "true");
      const dateText = document.createElement("strong");
      dateText.textContent = group.label;
      const count = document.createElement("em");
      count.textContent = `${group.articles.length} 篇`;
      dateHeader.append(triangle, dateText, count);

      const list = document.createElement("div");
      list.className = "frontier-timeline-list";
      for (const article of group.articles) {
        list.append(articleCard(article, rank));
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

function articleCard(article: FrontierArticle, rankNumber: number): HTMLElement {
  const card = document.createElement("article");
  card.className = "frontier-timeline-item";
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `打开原文：${article.title}`);

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
  kind.textContent = article.kind;
  cardHead.append(rank, kind);

  const title = document.createElement("h3");
  title.className = "frontier-timeline-title";
  title.textContent = article.title;

  const excerpt = document.createElement("p");
  excerpt.className = "frontier-timeline-excerpt";
  excerpt.textContent = article.summary;

  const meta = document.createElement("div");
  meta.className = "frontier-timeline-meta";
  const source = document.createElement("span");
  source.className = "frontier-timeline-source";
  source.textContent = article.source;
  const layer = document.createElement("span");
  layer.className = "frontier-timeline-layer";
  layer.textContent = article.ecosystemLayerLabel;
  const readCount = document.createElement("span");
  readCount.className = "frontier-timeline-count";
  readCount.textContent = `阅读 ${article.readCount}`;
  const read = document.createElement("a");
  read.className = "frontier-timeline-read";
  read.href = article.url;
  read.target = "_blank";
  read.rel = "noreferrer";
  read.textContent = "原文";
  meta.append(source, layer, readCount, read);

  content.append(cardHead, title, excerpt, meta);
  card.append(marker, content);
  card.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) return;
    window.open(article.url, "_blank", "noopener,noreferrer");
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    window.open(article.url, "_blank", "noopener,noreferrer");
  });

  return card;
}

function groupArticlesByDate(articles: FrontierArticle[]): Array<{
  date: string;
  label: string;
  articles: FrontierArticle[];
}> {
  const groups = new Map<string, { date: string; label: string; articles: FrontierArticle[] }>();

  for (const article of articles) {
    const date = article.collectedDate.slice(0, 10);
    const key = date || "unknown";
    const existing = groups.get(key);
    if (existing) {
      existing.articles.push(article);
      continue;
    }

    groups.set(key, {
      date: key,
      label: article.displayDateLabel || formatChineseDateLabel(key),
      articles: [article],
    });
  }

  return [...groups.values()].sort((left, right) => right.date.localeCompare(left.date));
}

function normalizeArticleRow(row: FrontierArticleRow): FrontierArticle {
  const collectedDate = stringValue(row.collected_date, "2026-06-17");
  const collectedAt = stringValue(row.collected_at, `${collectedDate}T09:00:00+08:00`);
  const layer = layerValue(row.ecosystem_layer);
  const source = stringValue(row.source, "未知来源");
  const summary = stringValue(row.summary, "");
  const detailParagraphs = stringArrayValue(row.detail_paragraphs);

  return {
    id: stringValue(row.article_id, ""),
    slug: stringValue(row.slug, ""),
    chapterId: stringValue(row.chapter_id, FRONTIER_CHAPTER_ID),
    chapterSlug: stringValue(row.chapter_slug, "20-agent-frontier-news"),
    title: stringValue(row.title, ""),
    source,
    url: stringValue(row.source_url, ""),
    kind: kindValue(row.kind),
    ecosystemLayer: layer,
    ecosystemLayerLabel: stringValue(row.ecosystem_layer_label, layerLabel(layer)),
    summary,
    collectedDate,
    collectedAt,
    displayDateLabel: displayDateLabel(row.metadata, collectedDate),
    readCount: numberValue(row.read_count, 0),
    sortOrder: numberValue(row.sort_order, 0),
    tags: stringArrayValue(row.tags),
    detailParagraphs:
      detailParagraphs.length > 0
        ? detailParagraphs
        : [
            summary || "本条资料用于补充第 20 章 Agent 前沿文章库的选型与趋势判断。",
            `体系层：${layerLabel(layer)}。来源：${source}。`,
            "查看原文可以进一步核对发布日期、API 细节、协议术语与实现边界。",
          ],
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

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArrayValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function kindValue(value: unknown): FrontierArticle["kind"] {
  if (value === "paper" || value === "doc" || value === "blog" || value === "video" || value === "internal") {
    return value;
  }
  return "doc";
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

function displayDateLabel(metadata: unknown, collectedDate: string): string {
  if (metadata && typeof metadata === "object" && "displayDateLabel" in metadata) {
    const label = (metadata as { displayDateLabel?: unknown }).displayDateLabel;
    if (typeof label === "string" && label.trim()) return label;
  }
  return formatChineseDateLabel(collectedDate);
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
