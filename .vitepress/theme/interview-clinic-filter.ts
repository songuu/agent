/**
 * 求职指南「高频面试题」筛选的纯逻辑（无 DOM，可离线单测）。
 *
 * 面试题没有真实的历史时间维度（不编造日期），所以筛选轴是**分类**（原理/工程/项目深挖）、
 * **章节**（relatedChapters）与**难度**（简单/中等/复杂）。逻辑抽出来离线测，渲染器只管画。
 */
import type {
  InterviewQuestion,
  InterviewQuestionCategory,
  InterviewQuestionDifficulty,
} from "../../knowledge-graph/data/interview-questions";
import { compareChapters } from "./interview-clinic-chapters.ts";

export type CategoryFilter = InterviewQuestionCategory | "all";
export type ChapterFilter = string | "all";
export type DifficultyFilter = InterviewQuestionDifficulty | "all";

/** 按分类 + 章节 + 难度过滤（任一为 "all" 表示不限）。 */
export function filterQuestions(
  questions: readonly InterviewQuestion[],
  category: CategoryFilter,
  chapter: ChapterFilter,
  difficulty: DifficultyFilter = "all",
): InterviewQuestion[] {
  return questions.filter((question) => {
    const byCategory = category === "all" || question.category === category;
    const byChapter = chapter === "all" || question.relatedChapters.includes(chapter);
    const byDifficulty = difficulty === "all" || question.difficulty === difficulty;
    return byCategory && byChapter && byDifficulty;
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

/** 各难度的题量（含 all 总量），用于筛选器计数。 */
export function difficultyCounts(
  questions: readonly InterviewQuestion[],
): Record<DifficultyFilter, number> {
  const counts: Record<DifficultyFilter, number> = {
    all: questions.length,
    simple: 0,
    medium: 0,
    complex: 0,
  };
  for (const question of questions) counts[question.difficulty] += 1;
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

