/**
 * 求职指南「高频面试题」筛选的纯逻辑（无 DOM，可离线单测）。
 *
 * 面试题没有真实的历史时间维度（不编造日期），所以筛选轴是**分类**（原理/工程/项目深挖）
 * 与**章节**（relatedChapters）。逻辑抽出来离线测，渲染器只管画。
 */
import type {
  InterviewQuestion,
  InterviewQuestionCategory,
} from "../../knowledge-graph/data/interview-questions";
import { compareChapters } from "./interview-clinic-chapters.ts";

export type CategoryFilter = InterviewQuestionCategory | "all";
export type ChapterFilter = string | "all";

/** 按分类 + 章节过滤（任一为 "all" 表示不限）。 */
export function filterQuestions(
  questions: readonly InterviewQuestion[],
  category: CategoryFilter,
  chapter: ChapterFilter,
): InterviewQuestion[] {
  return questions.filter((question) => {
    const byCategory = category === "all" || question.category === category;
    const byChapter = chapter === "all" || question.relatedChapters.includes(chapter);
    return byCategory && byChapter;
  });
}

/** 各分类的题量（含 all 总量），用于 tab 上的计数。 */
export function categoryCounts(
  questions: readonly InterviewQuestion[],
): Record<CategoryFilter, number> {
  const counts: Record<CategoryFilter, number> = {
    all: questions.length,
    principle: 0,
    engineering: 0,
    project: 0,
  };
  for (const question of questions) counts[question.category] += 1;
  return counts;
}

/** 去重并按章节号升序排列的全部相关章节（用于章节下拉）。 */
export function availableChapters(questions: readonly InterviewQuestion[]): string[] {
  const set = new Set<string>();
  for (const question of questions) {
    for (const chapter of question.relatedChapters) set.add(chapter);
  }
  return [...set].sort(compareChapters);
}

