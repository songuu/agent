import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadInterviewClinicData,
  normalizeInterviewQuestionRow,
} from "./interview-clinic-data.ts";

test("normalizeInterviewQuestionRow：映射 Supabase 行到前端题目结构", () => {
  const question = normalizeInterviewQuestionRow({
    question_id: "iq-31",
    slug: "multi-tenant-agent-runtime-isolation-vs-dedicated-stack",
    category: "engineering",
    category_label: "工程类",
    question: "为什么共享基础设施的多租户 agent runtime 不能只靠逻辑上分 tenant？",
    related_chapters: ["16", "17", "19"],
    answer_source: "标准答案来源：第 16/17/19 章 README。",
    collected_date: "2026-06-24",
    collected_at: "2026-06-24T09:00:00+08:00",
    sort_order: 31,
    tags: ["engineering", "observability"],
    metadata: {
      sourceTitles: ["AWS multi-tenancy"],
      sourceUrls: ["https://example.com/aws"],
      confidence: "high",
      rationale: "official runtime isolation practice",
      sourceUpdatedAt: "2026-07-20T06:55:47.000Z",
    },
  });

  assert.equal(question.category, "engineering");
  assert.equal(question.categoryLabel, "工程类");
  assert.deepEqual(question.relatedChapters, ["16", "17", "19"]);
  assert.deepEqual(question.sourceTitles, ["AWS multi-tenancy"]);
  assert.deepEqual(question.sourceUrls, ["https://example.com/aws"]);
  assert.equal(question.confidence, "high");
  assert.equal(question.collectedDate, "2026-07-20");
});

test("loadInterviewClinicData：缺少配置时回退本地 bundle", async () => {
  const holder = globalThis as { __FRONTIER_SUPABASE_CONFIG__?: unknown };
  const original = holder.__FRONTIER_SUPABASE_CONFIG__;
  delete holder.__FRONTIER_SUPABASE_CONFIG__;

  const result = await loadInterviewClinicData();

  assert.equal(result.source, "bundle");
  assert.match(result.note, /本地题库/);
  assert.ok(result.questions.length > 0);

  holder.__FRONTIER_SUPABASE_CONFIG__ = original;
});

test("loadInterviewClinicData：Supabase 读取成功时优先使用远端数据", async () => {
  const holder = globalThis as { __FRONTIER_SUPABASE_CONFIG__?: unknown };
  const original = holder.__FRONTIER_SUPABASE_CONFIG__;
  holder.__FRONTIER_SUPABASE_CONFIG__ = {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
    schema: "public",
  };

  const result = await loadInterviewClinicData(async () => {
    return new Response(
      JSON.stringify([
        {
          question_id: "iq-01",
          slug: "demo-slug",
          category: "principle",
          category_label: "原理类",
          question: "demo question",
          related_chapters: ["01"],
          answer_source: "chapter readme",
          collected_date: "2026-06-24",
          collected_at: "2026-06-24T09:00:00+08:00",
          sort_order: 1,
          tags: ["principle"],
          metadata: {},
        },
      ]),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });

  assert.equal(result.source, "supabase");
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0]?.slug, "demo-slug");

  holder.__FRONTIER_SUPABASE_CONFIG__ = original;
});


test("normalizeInterviewQuestionRow：远端缺答案时回退本地 bundle 摘要", () => {
  const question = normalizeInterviewQuestionRow({
    question_id: "iq-local",
    slug: "llm-vs-agent-and-loop",
    category: "principle",
    category_label: "原理类",
    question: "LLM 和 Agent 有什么区别？请画出 Agent 的执行循环。",
    answer_source: "第 01 章 README",
    metadata: {
      plainTextDescription: "标准答案来源：第 01 章 README 的 面试会问。",
    },
  });

  assert.match(question.summaryExcerpt ?? "", /LLM 只负责基于上下文生成下一段文本/);
});


test("normalizeInterviewQuestionRow：远端只有选题说明时优先使用本地真实答案", () => {
  const question = normalizeInterviewQuestionRow({
    question_id: "iq-20",
    slug: "memory-agent-recall-vs-reuse-evaluation",
    category: "engineering",
    category_label: "工程类",
    question: "长期记忆 agent 为何不能只测 recall？为什么 observation stream、user feedback、knowledge archive 与 follow-up reuse 要分开评估？",
    answer_source: "第 07/15/19 章 README",
    metadata: {
      rationale: "本题覆盖 2026 新 memory benchmark 的核心口径变化，适合补齐记忆评测高频追问。",
    },
  });

  assert.match(question.summaryExcerpt ?? "", /不能只测 recall/);
  assert.doesNotMatch(question.summaryExcerpt ?? "", /^本题覆盖/);
});
