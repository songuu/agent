/**
 * 术语表「可筛 + 可搜」渲染器（No-Vue：vanilla TS + 挂载 div）。
 *
 * 挂载点：docs/glossary.md 里的 `<div data-glossary></div>`。
 * 数据源：knowledge-graph/data/glossary.ts（构建期 bundle，无网络；精确镜像 interview-clinic）。
 * 交互：按主题（8 个）tab + 搜索框（中/英全文）过滤；纯前端，逻辑见 glossary-filter.ts。
 */
import { GLOSSARY_TERMS, type GlossaryTerm } from "../../knowledge-graph/data/glossary";
import {
  TOPIC_OPTIONS,
  filterTerms,
  topicCounts,
  type TopicFilter,
} from "./glossary-filter";

const initialized = new WeakSet<HTMLElement>();

if (typeof window !== "undefined") {
  installGlossaryExplorers();
}

function installGlossaryExplorers(): void {
  scanGlossaryExplorers();
  const observer = new MutationObserver(() => scanGlossaryExplorers());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanGlossaryExplorers(): void {
  document.querySelectorAll<HTMLElement>("[data-glossary]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    renderExplorer(root, GLOSSARY_TERMS);
  });
}

function renderExplorer(root: HTMLElement, terms: readonly GlossaryTerm[]): void {
  root.classList.add("glossary-explorer");
  root.replaceChildren();

  let selectedTopic: TopicFilter = "all";
  let query = "";

  const counts = topicCounts(terms);

  // 搜索框
  const searchWrap = document.createElement("div");
  searchWrap.className = "glossary-search";
  const search = document.createElement("input");
  search.type = "search";
  search.className = "glossary-search-input";
  search.placeholder = "搜索术语（中文 / 英文，如 RAG、幻觉、向量数据库）";
  search.setAttribute("aria-label", "搜索术语");
  search.addEventListener("input", () => {
    query = search.value;
    renderList();
  });
  searchWrap.append(search);

  // 主题 tab
  const tabs = document.createElement("nav");
  tabs.className = "glossary-tabs";
  tabs.setAttribute("aria-label", "术语主题");

  const summary = document.createElement("p");
  summary.className = "glossary-summary";

  const list = document.createElement("dl");
  list.className = "glossary-list";

  function renderTabs(): void {
    tabs.replaceChildren();
    for (const option of TOPIC_OPTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "glossary-tab";
      if (option.id === selectedTopic) button.dataset.active = "true";
      button.textContent = `${option.label} ${counts[option.id]}`;
      button.addEventListener("click", () => {
        selectedTopic = option.id;
        renderTabs();
        renderList();
      });
      tabs.append(button);
    }
  }

  function renderList(): void {
    const filtered = filterTerms(terms, selectedTopic, query);
    const trimmed = query.trim();
    summary.textContent = trimmed
      ? `匹配 ${filtered.length} 条 · 关键词「${trimmed}」`
      : `共 ${filtered.length} 条术语`;
    list.replaceChildren();

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "glossary-empty";
      empty.textContent = "没找到匹配的术语，换个关键词或主题试试。";
      list.append(empty);
      return;
    }

    for (const term of filtered) {
      const dt = document.createElement("dt");
      dt.className = "glossary-term";
      const name = document.createElement("span");
      name.className = "glossary-term-name";
      name.textContent = term.term;
      const topicBadge = document.createElement("span");
      topicBadge.className = "glossary-topic-badge";
      topicBadge.dataset.topic = term.topic;
      topicBadge.textContent = term.topicLabel;
      dt.append(name, topicBadge);

      const dd = document.createElement("dd");
      dd.className = "glossary-definition";
      const def = document.createElement("span");
      def.className = "glossary-definition-text";
      def.textContent = term.definition;
      dd.append(def);
      for (const chapter of term.relatedChapters) {
        const tag = document.createElement("span");
        tag.className = "glossary-chapter-tag";
        tag.textContent = `→ ${chapterDisplay(chapter)}`;
        dd.append(tag);
      }

      list.append(dt, dd);
    }
  }

  renderTabs();
  renderList();
  root.append(searchWrap, tabs, summary, list);
}

/** 章节标签展示：数字章节加「第 N 章」，毕设等非数字原样。 */
function chapterDisplay(chapter: string): string {
  return /^\d+$/.test(chapter) ? `第 ${chapter} 章` : chapter;
}
