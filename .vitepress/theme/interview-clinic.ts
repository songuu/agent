/**
 * 面试题库列表页：按分类 / 章节筛选后展示卡片列表，点击进入独立详情页。
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
import { chapterDisplay, chapterGroup } from "./interview-clinic-chapters.ts";

const initialized = new WeakSet<HTMLElement>();
const BASE = (import.meta.env?.BASE_URL ?? "/") as string;

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
  const courseGroup = document.createElement("optgroup");
  courseGroup.label = "课程章节";
  const specialGroup = document.createElement("optgroup");
  specialGroup.label = "专题章节";
  for (const chapter of chapters) {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapterDisplay(chapter);
    if (chapterGroup(chapter) === "special") {
      specialGroup.append(option);
    } else {
      courseGroup.append(option);
    }
  }
  if (courseGroup.childElementCount > 0) select.append(courseGroup);
  if (specialGroup.childElementCount > 0) select.append(specialGroup);
  select.addEventListener("change", () => {
    selectedChapter = select.value === "all" ? "all" : select.value;
    renderList();
  });
  chapterLabel.append(select);
  controls.append(chapterLabel);

  const summary = document.createElement("p");
  summary.className = "interview-clinic-summary";

  const list = document.createElement("section");
  list.className = "interview-clinic-card-list";
  list.setAttribute("aria-label", "面试题列表");

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
    summary.textContent =
      `共 ${filtered.length} 题${selectedChapter === "all" ? "" : ` · 章节 ${chapterDisplay(selectedChapter)}`}` +
      ` · ${sourceNote}`;
    list.replaceChildren();

    if (filtered.length === 0) {
      list.append(statusBlock("该筛选条件下暂无面试题。"));
      return;
    }

    for (const question of filtered) {
      list.append(buildInterviewCard(question));
    }
  }

  renderTabs();
  renderList();
  root.append(tabs, controls, summary, list);
}

function buildInterviewCard(question: InterviewQuestion): HTMLElement {
  const article = document.createElement("article");
  article.className = "interview-clinic-card";
  article.tabIndex = 0;
  article.setAttribute("role", "link");
  article.setAttribute("aria-label", `打开面试题详情：${question.question}`);
  article.addEventListener("click", () => {
    window.location.href = interviewArticleHref(question.slug);
  });
  article.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = interviewArticleHref(question.slug);
    }
  });

  const title = document.createElement("h3");
  title.className = "interview-clinic-card-title";
  title.textContent = question.question;
  article.append(title);

  const excerpt = bestInterviewCardText(question);
  if (excerpt) {
    const body = document.createElement("p");
    body.className = "interview-clinic-card-excerpt";
    body.textContent = excerpt;
    article.append(body);
  }

  const actions = document.createElement("div");
  actions.className = "interview-clinic-card-actions";
  const detailLink = document.createElement("a");
  detailLink.className = "interview-clinic-card-link";
  detailLink.href = interviewArticleHref(question.slug);
  detailLink.textContent = "查看全文";
  detailLink.addEventListener("click", (event) => event.stopPropagation());
  actions.append(detailLink);
  article.append(actions);

  const source = document.createElement("div");
  source.className = "interview-clinic-card-source";
  source.textContent = question.sourceTitles[0] || question.answerSource || "课程标准答案";
  article.append(source);

  const tags = document.createElement("div");
  tags.className = "interview-clinic-card-tags";
  tags.append(chip(question.categoryLabel, "interview-clinic-badge"));
  for (const tag of buildTagList(question)) {
    tags.append(chip(tag, "interview-clinic-chapter-tag"));
  }
  article.append(tags);

  return article;
}

function buildTagList(question: InterviewQuestion): string[] {
  const chapterTags = question.relatedChapters.slice(0, 2).map((chapter) => chapterDisplay(chapter));
  const topicTags = question.tags.filter((tag) => tag !== "codefather").slice(0, Math.max(0, 4 - chapterTags.length));
  return [...chapterTags, ...topicTags];
}

function interviewArticleHref(slug: string): string {
  return `${BASE}interview/article?id=${encodeURIComponent(slug)}`;
}

function bestInterviewCardText(question: InterviewQuestion): string | undefined {
  if (question.summaryExcerpt) return question.summaryExcerpt;
  if (question.rationale) return question.rationale;
  if (question.answerSource) return `标准答案来源：${question.answerSource}`;
  return undefined;
}

function chip(text: string, className: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function statusBlock(message: string): HTMLDivElement {
  const status = document.createElement("div");
  status.className = "frontier-archive-status";
  status.textContent = message;
  return status;
}
