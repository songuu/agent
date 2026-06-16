import {
  FRONTIER_ARTICLES,
  FRONTIER_ECOSYSTEM_LAYERS,
  type FrontierArticle,
} from "../../knowledge-graph/data/frontier-articles";
import type { FrontierEcosystemLayer } from "../../knowledge-graph/data/graph";

const initialized = new WeakSet<HTMLElement>();

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
  root.replaceChildren();

  if (FRONTIER_ARTICLES.length === 0) {
    root.textContent = "暂无文章。";
    return;
  }

  type LayerFilter = FrontierEcosystemLayer | "all";

  let selectedLayer: LayerFilter = "all";
  let selected = FRONTIER_ARTICLES[0]!;
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
  dateText.textContent = FRONTIER_ARTICLES[0]!.displayDateLabel;
  dateHeader.append(triangle, dateText);

  const list = document.createElement("div");
  list.className = "frontier-timeline-list";

  function visibleArticles(): FrontierArticle[] {
    if (selectedLayer === "all") return FRONTIER_ARTICLES;
    return FRONTIER_ARTICLES.filter((article) => article.ecosystemLayer === selectedLayer);
  }

  function layerCount(layer: LayerFilter): number {
    if (layer === "all") return FRONTIER_ARTICLES.length;
    return FRONTIER_ARTICLES.filter((article) => article.ecosystemLayer === layer).length;
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
        selected = nextArticles.includes(selected) ? selected : nextArticles[0] ?? FRONTIER_ARTICLES[0]!;
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
    const articles = visibleArticles();
    dateText.textContent = articles[0]?.displayDateLabel ?? selected.displayDateLabel;

    for (const article of articles) {
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
      meta.textContent = `来源：${article.source} · ${article.ecosystemLayerLabel} · ${article.kind}`;

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

function textNode(value: string): Text {
  return document.createTextNode(value);
}

function metaSeparator(): HTMLSpanElement {
  const separator = document.createElement("span");
  separator.textContent = "|";
  separator.setAttribute("aria-hidden", "true");
  return separator;
}
