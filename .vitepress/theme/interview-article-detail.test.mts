import { test } from "node:test";
import assert from "node:assert/strict";
import { INTERVIEW_QUESTIONS } from "../../knowledge-graph/data/interview-questions";
import { rankSimilarInterviewQuestions } from "./interview-similarity";
import {
  interviewDetailHref,
  interviewReturnPathFromSearch,
  resolveInterviewDisplayDate,
  resolveInterviewSummary,
  shouldRefreshInterviewDetail,
} from "./interview-article-detail";

test("题目切换：首题仅展示下一题", () => {
  const index = INTERVIEW_QUESTIONS.findIndex((question) => question.slug === "llm-vs-agent-and-loop");
  assert.equal(index, 0);
  assert.equal(INTERVIEW_QUESTIONS[index - 1], undefined);
  assert.equal(INTERVIEW_QUESTIONS[index + 1]?.slug, "token-and-statelessness-memory");
});

test("题目切换：slug 变化时必须刷新详情", () => {
  assert.equal(shouldRefreshInterviewDetail(null, "?id=llm-vs-agent-and-loop"), true);
  assert.equal(shouldRefreshInterviewDetail("llm-vs-agent-and-loop", "?id=llm-vs-agent-and-loop"), false);
  assert.equal(shouldRefreshInterviewDetail("llm-vs-agent-and-loop", "?id=token-and-statelessness-memory"), true);
  assert.equal(shouldRefreshInterviewDetail("llm-vs-agent-and-loop", ""), true);
});

test("详情跳转：保留面试题库筛选返回路径", () => {
  assert.equal(
    interviewDetailHref("llm-vs-agent-and-loop", "/interview/?category=principle&chapter=agent-loop"),
    "/interview/article?id=llm-vs-agent-and-loop&from=%2Finterview%2F%3Fcategory%3Dprinciple%26chapter%3Dagent-loop",
  );
  assert.equal(
    interviewReturnPathFromSearch("?id=abc&from=%2Finterview%2F%3Fcategory%3Dproject"),
    "/interview/?category=project",
  );
  assert.equal(interviewReturnPathFromSearch("?id=abc&from=%2F%2Fevil.test"), "/interview/");
});

test("详情日期：优先显示来源更新时间，其次创建时间，最后回退同步日期", () => {
  assert.equal(resolveInterviewDisplayDate({ sourceUpdatedAt: "2026-07-20T06:55:47.000Z" }, "2026-07-14"), "2026-07-20");
  assert.equal(resolveInterviewDisplayDate({ sourceCreatedAt: "2026-06-29T01:09:47.000Z" }, "2026-07-14"), "2026-06-29");
  assert.equal(resolveInterviewDisplayDate({}, "2026-07-14"), "2026-07-14");
});

test("详情摘要：远端只有选题说明时必须回退本地真实答案", () => {
  const summary = resolveInterviewSummary(
    "",
    "本题覆盖 2026 新 memory benchmark 的核心口径变化，适合补齐记忆评测高频追问。",
    "长期记忆 agent 不能只测 recall，因为『记住了』不等于『会在正确时机把对的记忆拿出来并用对』。observation stream 测原始事件摄入，user feedback 测偏好/纠错更新，knowledge archive 测稳定知识沉淀，follow-up reuse 测后续任务中的真实调用效果；四段混在一起，你就分不清问题出在记忆写入、更新、检索还是使用。",
  );

  assert.match(summary, /不能只测 recall/);
  assert.doesNotMatch(summary, /^本题覆盖/);
});

test("相似题推荐：优先同主题，不只看同题型", () => {
  const current = INTERVIEW_QUESTIONS.find((question) => question.slug === "llm-vs-agent-and-loop");
  assert.ok(current);

  const ranked = rankSimilarInterviewQuestions(INTERVIEW_QUESTIONS, current, 5);

  assert.ok(ranked.length > 0);
  assert.equal(ranked[0]?.question.slug, "react-and-maxsteps");
  assert.match(ranked[0]?.reasons.join(" ") ?? "", /同主题/);
  assert.ok(ranked.every((item) => item.reasons.some((reason) => reason.startsWith("同主题"))));
});

test("相似题推荐：安全类题目优先匹配更窄的权限/护栏主题", () => {
  const current = INTERVIEW_QUESTIONS.find((question) => question.slug === "prevent-prompt-injection-guardrails");
  assert.ok(current);

  const ranked = rankSimilarInterviewQuestions(INTERVIEW_QUESTIONS, current, 5);

  assert.equal(ranked[0]?.question.slug, "pre-approval-tool-input-guardrails-vs-post-hoc-check");
  assert.ok((ranked[0]?.reasons.join(" ") ?? "").includes("审批/权限边界"));
});

test("相似题推荐：仅同章节同题型但无同主题时不应入选", () => {
  const current = INTERVIEW_QUESTIONS.find((question) => question.slug === "llm-vs-agent-and-loop");
  assert.ok(current);

  const ranked = rankSimilarInterviewQuestions(INTERVIEW_QUESTIONS, current, 10);
  const slugs = ranked.map((item) => item.question.slug);

  assert.ok(!slugs.includes("when-not-to-use-agent"));
});

