/**
 * 术语表筛选/搜索纯逻辑离线测。
 * 跑法：npx tsx --test .vitepress/theme/glossary-filter.test.mts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { GLOSSARY_TERMS } from "../../knowledge-graph/data/glossary";
import {
  TOPIC_OPTIONS,
  filterTerms,
  matchesQuery,
  normalizeQuery,
  topicCounts,
} from "./glossary-filter";

test("TOPIC_OPTIONS 首项为全部，且覆盖全部 8 主题", () => {
  assert.equal(TOPIC_OPTIONS[0].id, "all");
  assert.equal(TOPIC_OPTIONS.length, 9); // all + 8 topics
  const topics = new Set(GLOSSARY_TERMS.map((t) => t.topic));
  for (const topic of topics) {
    assert.ok(
      TOPIC_OPTIONS.some((opt) => opt.id === topic),
      `主题 ${topic} 应出现在筛选项中`,
    );
  }
});

test("filterTerms：主题为 all + 空搜索返回全部", () => {
  const result = filterTerms(GLOSSARY_TERMS, "all", "");
  assert.equal(result.length, GLOSSARY_TERMS.length);
});

test("filterTerms：按主题过滤只留该主题词条", () => {
  const result = filterTerms(GLOSSARY_TERMS, "embeddings-rag", "");
  assert.ok(result.length > 0);
  assert.ok(result.every((t) => t.topic === "embeddings-rag"));
  // RAG / Embedding 应在该主题内
  assert.ok(result.some((t) => t.slug === "rag"));
  assert.ok(result.some((t) => t.slug === "embedding"));
});

test("matchesQuery：英文别名大小写不敏感命中", () => {
  const rag = GLOSSARY_TERMS.find((t) => t.slug === "rag");
  assert.ok(rag);
  assert.ok(matchesQuery(rag!, normalizeQuery("RAG")));
  assert.ok(matchesQuery(rag!, normalizeQuery("rag")));
  assert.ok(matchesQuery(rag!, normalizeQuery("retrieval-augmented")));
});

test("matchesQuery：中文命中 term/definition", () => {
  const injection = GLOSSARY_TERMS.find((t) => t.slug === "prompt-injection");
  assert.ok(injection);
  assert.ok(matchesQuery(injection!, normalizeQuery("注入")));
  assert.ok(matchesQuery(injection!, normalizeQuery("恶意指令")));
});

test("filterTerms：主题 + 搜索复合", () => {
  // 「向量」在 embeddings-rag 主题里有多条，但限定搜索词收窄
  const result = filterTerms(GLOSSARY_TERMS, "embeddings-rag", "余弦");
  assert.equal(result.length, 1);
  assert.equal(result[0].slug, "cosine-similarity");
});

test("filterTerms：跨主题搜索词被主题约束过滤掉", () => {
  // 「幻觉」词条在 prompt-engineering，限定到 safety 主题应为空
  const inSafety = filterTerms(GLOSSARY_TERMS, "safety-guardrails", "幻觉");
  assert.equal(inSafety.length, 0);
  const inPrompt = filterTerms(GLOSSARY_TERMS, "prompt-engineering", "幻觉");
  assert.ok(inPrompt.some((t) => t.slug === "hallucination"));
});

test("topicCounts：all 等于总量，各主题之和等于总量", () => {
  const counts = topicCounts(GLOSSARY_TERMS);
  assert.equal(counts.all, GLOSSARY_TERMS.length);
  const sum = (Object.keys(counts) as Array<keyof typeof counts>)
    .filter((k) => k !== "all")
    .reduce((acc, k) => acc + counts[k], 0);
  assert.equal(sum, GLOSSARY_TERMS.length);
});

test("normalizeQuery：去空白 + 小写", () => {
  assert.equal(normalizeQuery("  ReAct  "), "react");
  assert.equal(normalizeQuery(""), "");
});

test("空搜索词不过滤（matchesQuery 命中所有）", () => {
  for (const term of GLOSSARY_TERMS) {
    assert.ok(matchesQuery(term, normalizeQuery("")));
  }
});
