/**
 * 求职指南「高频面试题」可筛渲染器（No-Vue：vanilla TS + 挂载 div）。
 *
 * 挂载点：career-guide.md 里的 `<div data-interview-clinic></div>`。
 * 数据源：优先读 Supabase `public.interview_questions`；失败时回退本地 bundle。
 * 交互：按分类（原理/工程/项目深挖）tab + 按章节下拉过滤；纯前端，逻辑见 interview-clinic-filter.ts。
 */
import type { InterviewQuestion } from "../../knowledge-graph/data/interview-questions";
import { loadInterviewClinicData } from "./interview-clinic-data";
import {
  filterQuestions,
  categoryCounts,
  availableChapters,
  type CategoryFilter,
  type ChapterFilter,
} from "./interview-clinic-filter";
import {
  clampPageIndex,
  nearestPagedIndex,
  nextPagedIndex,
} from "./interview-clinic-paging";

const initialized = new WeakSet<HTMLElement>();
const WHEEL_PAGE_LOCK_MS = 380;
const WHEEL_PAGE_THRESHOLD = 24;

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "principle", label: "原理类" },
  { id: "engineering", label: "工程类" },
  { id: "project", label: "项目深挖类" },
];

if (typeof window !== "undefined") {
  installInterviewClinics();
}

function installInterviewClinics(): void {
  scanInterviewClinics();
  const observer = new MutationObserver(() => scanInterviewClinics());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanInterviewClinics(): void {
  document.querySelectorAll<HTMLElement>("[data-interview-clinic]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    createClinic(root);
  });
}

function createClinic(root: HTMLElement): void {
  root.classList.add("interview-clinic");
  root.replaceChildren(statusBlock("正在读取面试题题库..."));

  loadInterviewClinicData()
    .then((result) => renderClinic(root, result.questions, result.note))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      root.replaceChildren(statusBlock(`面试题读取失败：${message}`));
    });
}

function renderClinic(root: HTMLElement, questions: readonly InterviewQuestion[], sourceNote: string): void {
  root.classList.add("interview-clinic");
  root.replaceChildren();

  let selectedCategory: CategoryFilter = "all";
  let selectedChapter: ChapterFilter = "all";

  const counts = categoryCounts(questions);
  const chapters = availableChapters(questions);

  const tabs = document.createElement("nav");
  tabs.className = "interview-clinic-tabs";
  tabs.setAttribute("aria-label", "面试题分类");

  const controls = document.createElement("div");
  controls.className = "interview-clinic-controls";
  const chapterLabel = document.createElement("label");
  chapterLabel.className = "interview-clinic-chapter";
  chapterLabel.append(document.createTextNode("按章节："));
  const select = document.createElement("select");
  select.className = "interview-clinic-select";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "全部章节";
  select.append(allOption);
  for (const chapter of chapters) {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapterDisplay(chapter);
    select.append(option);
  }
  select.addEventListener("change", () => {
    selectedChapter = select.value === "all" ? "all" : select.value;
    renderList();
  });
  chapterLabel.append(select);
  controls.append(chapterLabel);

  const summary = document.createElement("p");
  summary.className = "interview-clinic-summary";

  const viewport = document.createElement("section");
  viewport.className = "interview-clinic-viewport";
  viewport.tabIndex = 0;
  viewport.setAttribute("aria-label", "面试题滚动翻页区");

  const list = document.createElement("ol");
  list.className = "interview-clinic-list";

  const pager = document.createElement("p");
  pager.className = "interview-clinic-pager";

  let currentPage = 0;
  let wheelLocked = false;
  let scrollSyncToken = 0;

  function listItems(): HTMLElement[] {
    return Array.from(list.querySelectorAll<HTMLElement>(".interview-clinic-item"));
  }

  function syncPager(total: number): void {
    if (total <= 0) {
      pager.textContent = "暂无可翻页题目";
      return;
    }
    pager.textContent = `第 ${currentPage + 1} / ${total} 页 · 可用滚轮、方向键、PageUp/PageDown 翻页`;
  }

  function scrollToPage(index: number, behavior: ScrollBehavior = "smooth"): void {
    const items = listItems();
    if (items.length === 0) return;
    currentPage = clampPageIndex(index, items.length);
    syncPager(items.length);
    items[currentPage]?.scrollIntoView({ block: "start", inline: "nearest", behavior });
  }

  function renderTabs(): void {
    tabs.replaceChildren();
    for (const tab of CATEGORY_TABS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "interview-clinic-tab";
      if (tab.id === selectedCategory) button.dataset.active = "true";
      button.textContent = `${tab.label} ${counts[tab.id]}`;
      button.addEventListener("click", () => {
        selectedCategory = tab.id;
        renderTabs();
        renderList();
      });
      tabs.append(button);
    }
  }

  function renderList(): void {
    const filtered = filterQuestions(questions, selectedCategory, selectedChapter);
    currentPage = 0;
    summary.textContent =
      `共 ${filtered.length} 题${selectedChapter === "all" ? "" : ` · 章节 ${chapterDisplay(selectedChapter)}`}` +
      ` · ${sourceNote}`;
    list.replaceChildren();

    if (filtered.length === 0) {
      const empty = document.createElement("li");
      empty.className = "interview-clinic-empty";
      empty.textContent = "该筛选条件下暂无面试题。";
      list.append(empty);
      syncPager(0);
      return;
    }

    for (const question of filtered) {
      const item = document.createElement("li");
      item.className = "interview-clinic-item";

      const text = document.createElement("span");
      text.className = "interview-clinic-question";
      text.textContent = question.question;

      const meta = document.createElement("span");
      meta.className = "interview-clinic-meta";
      const cat = document.createElement("span");
      cat.className = "interview-clinic-badge";
      cat.dataset.category = question.category;
      cat.textContent = question.categoryLabel;
      meta.append(cat);
      for (const chapter of question.relatedChapters) {
        const tag = document.createElement("span");
        tag.className = "interview-clinic-chapter-tag";
        tag.textContent = `→ ${chapterDisplay(chapter)}`;
        meta.append(tag);
      }
      if (question.sourceUrls.length > 0) {
        const link = document.createElement("a");
        link.className = "interview-clinic-source-link";
        link.href = question.sourceUrls[0];
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = question.sourceTitles[0] ? "原文" : "来源";
        meta.append(link);
      }

      item.append(text, meta);
      list.append(item);
    }

    syncPager(filtered.length);
    requestAnimationFrame(() => scrollToPage(0, "auto"));
  }

  viewport.addEventListener(
    "wheel",
    (event) => {
      const items = listItems();
      if (items.length <= 1) return;
      if (Math.abs(event.deltaY) < WHEEL_PAGE_THRESHOLD) return;
      event.preventDefault();
      if (wheelLocked) return;

      wheelLocked = true;
      scrollToPage(nextPagedIndex(currentPage, event.deltaY, items.length));
      window.setTimeout(() => {
        wheelLocked = false;
      }, WHEEL_PAGE_LOCK_MS);
    },
    { passive: false },
  );

  viewport.addEventListener("keydown", (event) => {
    const items = listItems();
    if (items.length <= 1) return;

    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      scrollToPage(currentPage + 1);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      scrollToPage(currentPage - 1);
    }
  });

  list.addEventListener(
    "scroll",
    () => {
      const token = window.setTimeout(() => {
        if (token !== scrollSyncToken) return;
        const items = listItems();
        currentPage = nearestPagedIndex(
          list.scrollTop,
          items.map((item) => item.offsetTop),
        );
        syncPager(items.length);
      }, 80);
      scrollSyncToken = token;
    },
    { passive: true },
  );

  renderTabs();
  renderList();
  viewport.append(list);
  root.append(tabs, controls, summary, viewport, pager);
}

/** 章节标签展示：数字章节加「第 N 章」，毕设等非数字原样。 */
function chapterDisplay(chapter: string): string {
  return /^\d+$/.test(chapter) ? `第 ${chapter} 章` : chapter;
}

function statusBlock(message: string): HTMLDivElement {
  const status = document.createElement("div");
  status.className = "frontier-archive-status";
  status.textContent = message;
  return status;
}
