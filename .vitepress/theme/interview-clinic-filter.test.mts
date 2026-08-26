import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterQuestions,
  categoryCounts,
  difficultyCounts,
  availableChapters,
} from "./interview-clinic-filter.ts";
import type { InterviewQuestion } from "../../knowledge-graph/data/interview-questions.ts";

const q = (
  id: string,
  category: InterviewQuestion["category"],
  relatedChapters: string[],
  difficulty: "simple" | "medium" | "complex" = "medium",
): InterviewQuestion => ({
  id,
  slug: id,
  category,
  categoryLabel: category,
  difficulty,
  difficultyLabel: ({ simple: "简单", medium: "中等", complex: "复杂" } as const)[difficulty],
  question: `Q-${id}`,
  relatedChapters,
  answerSource: "",
  collectedDate: "2026-06-16",
  collectedAt: "2026-06-16T09:00:00+08:00",
  sortOrder: 0,
  tags: [],
});

const sample: InterviewQuestion[] = [
  q("a", "principle", ["01"], "simple"),
  q("b", "principle", ["07", "02"], "medium"),
  q("c", "engineering", ["13"], "medium"),
  q("d", "project", ["capstone", "09"], "complex"),
];

test("filterQuestions：分类过滤", () => {
  assert.equal(filterQuestions(sample, "principle", "all").length, 2);
  assert.equal(filterQuestions(sample, "engineering", "all").length, 1);
});

test("filterQuestions：章节过滤", () => {
  assert.equal(filterQuestions(sample, "all", "07").length, 1);
  assert.equal(filterQuestions(sample, "all", "99").length, 0);
});

test("filterQuestions：分类 + 章节复合", () => {
  assert.equal(filterQuestions(sample, "principle", "02").length, 1);
  assert.equal(filterQuestions(sample, "engineering", "02").length, 0);
});

test("filterQuestions：all/all 返回全部", () => {
  assert.equal(filterQuestions(sample, "all", "all").length, 4);
});

test("filterQuestions：难度可单独或与分类/章节组合过滤", () => {
  assert.deepEqual(filterQuestions(sample, "all", "all", "simple").map((item) => item.id), ["a"]);
  assert.deepEqual(filterQuestions(sample, "principle", "02", "medium").map((item) => item.id), ["b"]);
  assert.equal(filterQuestions(sample, "engineering", "all", "complex").length, 0);
});

test("categoryCounts 含总量", () => {
  const counts = categoryCounts(sample);
  assert.equal(counts.all, 4);
  assert.equal(counts.principle, 2);
  assert.equal(counts.engineering, 1);
  assert.equal(counts.project, 1);
});

test("difficultyCounts 含总量与三级难度", () => {
  assert.deepEqual(difficultyCounts(sample), {
    all: 4,
    simple: 1,
    medium: 2,
    complex: 1,
  });
});

test("availableChapters 去重 + 数值升序，非数字章节(capstone)排末尾", () => {
  assert.deepEqual(availableChapters(sample), ["01", "02", "07", "09", "13", "capstone"]);
});
test("availableChapters：专题章节排在课程章节后，external-codefather 显示为独立专题", () => {
  const withSpecial: InterviewQuestion[] = [
    ...sample,
    q("e", "engineering", ["external-codefather"]),
  ];
  assert.deepEqual(availableChapters(withSpecial), [
    "01",
    "02",
    "07",
    "09",
    "13",
    "capstone",
    "external-codefather",
  ]);
});
