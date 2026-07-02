import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterQuestions,
  categoryCounts,
  availableChapters,
} from "./interview-clinic-filter.ts";
import type { InterviewQuestion } from "../../knowledge-graph/data/interview-questions.ts";

const q = (
  id: string,
  category: InterviewQuestion["category"],
  relatedChapters: string[],
): InterviewQuestion => ({
  id,
  slug: id,
  category,
  categoryLabel: category,
  question: `Q-${id}`,
  relatedChapters,
  answerSource: "",
  collectedDate: "2026-06-16",
  collectedAt: "2026-06-16T09:00:00+08:00",
  sortOrder: 0,
  tags: [],
});

const sample: InterviewQuestion[] = [
  q("a", "principle", ["01"]),
  q("b", "principle", ["07", "02"]),
  q("c", "engineering", ["13"]),
  q("d", "project", ["capstone", "09"]),
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

test("categoryCounts 含总量", () => {
  const counts = categoryCounts(sample);
  assert.equal(counts.all, 4);
  assert.equal(counts.principle, 2);
  assert.equal(counts.engineering, 1);
  assert.equal(counts.project, 1);
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
