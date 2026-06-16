import { FRONTIER_ECOSYSTEM_LAYERS } from "../../knowledge-graph/data/frontier-ecosystem-layers";
import type { FrontierEcosystemLayer } from "../../knowledge-graph/data/graph";

declare const __FRONTIER_SUPABASE_CONFIG__:
  | {
      url: string;
      anonKey: string;
      schema: string;
    }
  | null
  | undefined;

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
const FRONTIER_CHAPTER_ID = "19";
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
  root.replaceChildren(statusBlock("正在从 Supabase 读取文章..."));

  loadFrontierArticlesFromSupabase()
    .then((articles) => renderArchive(root, articles))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      root.replaceChildren(statusBlock(`Supabase 读取失败：${message}`));
    });
}

async function loadFrontierArticlesFromSupabase(): Promise<FrontierArticle[]> {
  const config = __FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!config?.url || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const baseUrl = config.url.replace(/\/+$/, "");
  const endpoint =
    `${baseUrl}/rest/v1/frontier_ecosystem_articles` +
    `?select=${FRONTIER_COLUMNS}` +
    `&chapter_id=eq.${FRONTIER_CHAPTER_ID}` +
    "&order=sort_order.asc";
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
  if (!Array.isArray(rows)) {
    throw new Error("返回数据不是数组");
  }

  return rows.map(normalizeArticleRow).filter((article) => article.title && article.url);
}

function renderArchive(root: HTMLElement, articles: FrontierArticle[]): void {
  root.replaceChildren();

  if (articles.length === 0) {
    root.append(statusBlock("Supabase 暂无文章。"));
    return;
  }

  let selectedLayer: LayerFilter = "all";
  let selected = articles[0]!;
  const filters = document.createElement("nav");
  filters.className = "frontier-layer-tabs";
  filters.setAttribute("aria-label", "前沿与生态文章体系层");

  const detail = document.createElement("article");
  detail.className = "frontier-article-detail";

  const timeline = document.createElement("section");
  timeline.className = "frontier-article-timeline";
  timeline.setAttribute("aria-label", "前沿与生态文章时间线");

  const dateHeader = document.createElement("div");
  dateHeader.className = "frontier-timeline-date";
  const triangle = document.createElement("span");
  triangle.setAttribute("aria-hidden", "true");
  const dateText = document.createElement("strong");
  dateText.textContent = selected.displayDateLabel;
  dateHeader.append(triangle, dateText);

  const list = document.createElement("div");
  list.className = "frontier-timeline-list";

  function visibleArticles(): FrontierArticle[] {
    if (selectedLayer === "all") return articles;
    return articles.filter((article) => article.ecosystemLayer === selectedLayer);
  }

  function layerCount(layer: LayerFilter): number {
    if (layer === "all") return articles.length;
    return articles.filter((article) => article.ecosystemLayer === layer).length;
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
        const nextArticles = visibleArticles();
        selected = nextArticles.includes(selected) ? selected : nextArticles[0] ?? articles[0]!;
        renderDetail(selected);
        renderFilters();
        renderTimeline();
      });
      filters.append(button);
    }
  }

  function renderDetail(article: FrontierArticle): void {
    detail.replaceChildren();

    const title = document.createElement("h3");
    title.className = "frontier-detail-title";
    title.textContent = article.title;

    const meta = document.createElement("div");
    meta.className = "frontier-detail-meta";
    const source = document.createElement("a");
    source.href = article.url;
    source.target = "_blank";
    source.rel = "noreferrer";
    source.textContent = article.source;
    meta.append(
      source,
      metaSeparator(),
      textNode(article.ecosystemLayerLabel),
      metaSeparator(),
      textNode(article.collectedAt.replace("T", " ").slice(0, 16)),
      metaSeparator(),
      textNode(`阅读 ${article.readCount}`),
    );

    const body = document.createElement("div");
    body.className = "frontier-detail-body";
    for (const paragraph of article.detailParagraphs) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      body.append(p);
    }

    const actions = document.createElement("div");
    actions.className = "frontier-detail-actions";
    const original = document.createElement("a");
    original.href = article.url;
    original.target = "_blank";
    original.rel = "noreferrer";
    original.textContent = "查看原文";
    actions.append(original);

    detail.append(title, meta, body, actions);
  }

  function renderTimeline(): void {
    list.replaceChildren();
    const visible = visibleArticles();
    dateText.textContent = visible[0]?.displayDateLabel ?? selected.displayDateLabel;

    for (const article of visible) {
      const card = document.createElement("article");
      card.className = "frontier-timeline-item";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `查看 ${article.title}`);
      if (article.slug === selected.slug) card.dataset.active = "true";

      const marker = document.createElement("span");
      marker.className = "frontier-timeline-marker";
      marker.setAttribute("aria-hidden", "true");

      const content = document.createElement("div");
      content.className = "frontier-timeline-card";

      const title = document.createElement("a");
      title.className = "frontier-timeline-title";
      title.href = article.url;
      title.target = "_blank";
      title.rel = "noreferrer";
      title.textContent = article.title;

      const excerpt = document.createElement("p");
      excerpt.className = "frontier-timeline-excerpt";
      excerpt.textContent = article.summary;

      const meta = document.createElement("div");
      meta.className = "frontier-timeline-meta";
      const source = document.createElement("a");
      source.href = article.url;
      source.target = "_blank";
      source.rel = "noreferrer";
      source.textContent = article.source;
      meta.append(
        textNode("来源："),
        source,
        textNode(` · ${article.ecosystemLayerLabel} · ${article.kind}`),
      );

      content.append(title, excerpt, meta);
      card.append(marker, content);
      card.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) return;
        selectArticle(article);
      });
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        selectArticle(article);
      });
      list.append(card);
    }
  }

  function selectArticle(article: FrontierArticle): void {
    selected = article;
    renderDetail(article);
    renderTimeline();
  }

  renderFilters();
  renderDetail(selected);
  renderTimeline();
  timeline.append(dateHeader, list);
  root.append(filters, detail, timeline);
}

function normalizeArticleRow(row: FrontierArticleRow): FrontierArticle {
  const collectedDate = stringValue(row.collected_date, "2026-06-16");
  const collectedAt = stringValue(row.collected_at, `${collectedDate}T09:00:00+08:00`);
  const layer = layerValue(row.ecosystem_layer);
  const source = stringValue(row.source, "未知来源");
  const summary = stringValue(row.summary, "");
  const detailParagraphs = stringArrayValue(row.detail_paragraphs);

  return {
    id: stringValue(row.article_id, ""),
    slug: stringValue(row.slug, ""),
    chapterId: stringValue(row.chapter_id, FRONTIER_CHAPTER_ID),
    chapterSlug: stringValue(row.chapter_slug, "19-agent-ecosystem-and-frontier"),
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
            summary || "本条资料用于补充第 19 章 Agent 前沿与生态的选型与趋势判断。",
            `体系层：${layerLabel(layer)}。来源：${source}。`,
            "查看原文可以进一步核对发布日期、API 细节、协议术语与实现边界。",
          ],
  };
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

function textNode(value: string): Text {
  return document.createTextNode(value);
}

function metaSeparator(): HTMLSpanElement {
  const separator = document.createElement("span");
  separator.textContent = "|";
  separator.setAttribute("aria-hidden", "true");
  return separator;
}
