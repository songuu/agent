/**
 * 进阶 RAG · 第 07 章：Contextual Retrieval
 *
 * 本 demo 不调 LLM、不调 embedding。用 BM25 构造一个确定性场景：孤立 chunk 里没有足够上下文，
 * 会被字面更像的干扰项抢走；给 chunk 补上「文档标题 + 章节路径」后，目标片段回到 top1。
 */
import { divider, logger, color } from "../../src/shared";
import {
  compareContextualRetrieval,
  contextualizeChunks,
  makeContextualRetrievalCorpus,
} from "../../src/shared/rag";

function invariant(name: string, condition: boolean, detail = ""): void {
  if (!condition) throw new Error(`${name}${detail ? `：${detail}` : ""}`);
  logger.success(name);
}

function main(): void {
  const query = "云笺 数据生命周期 删除规则";
  const expectedId = "target-retention";
  const corpus = makeContextualRetrievalCorpus();

  divider("语料：孤立 chunk vs 带上下文 chunk");
  for (const chunk of contextualizeChunks(corpus)) {
    logger.info(`${chunk.id}: ${color(chunk.documentTitle, "cyan")} / ${chunk.sectionPath}`);
    console.log(`  raw: ${chunk.text}`);
    console.log(`  contextual: ${chunk.contextualText.replace(/\n/g, " | ")}`);
  }

  divider("检索对照");
  const comparison = compareContextualRetrieval(query, corpus, expectedId, 1);
  logger.info(`query: ${query}`);
  logger.info(`raw top1: ${comparison.rawTopIds.join(", ")}`);
  logger.info(`contextual top1: ${comparison.contextualTopIds.join(", ")}`);

  divider("运行时核对");
  invariant("① 原始 chunk 会被账号删除干扰项抢走", !comparison.rawHit && comparison.rawTopIds[0] === "distractor-account");
  invariant("② 补文档上下文后命中目标生命周期片段", comparison.contextualHit && comparison.contextualTopIds[0] === expectedId);
  invariant("③ contextualized text 保留原文，不改写事实", contextualizeChunks(corpus).every((chunk) => chunk.contextualText.includes(chunk.text)));

  divider("结论");
  logger.info("Contextual Retrieval 的关键不是把答案写进 chunk，而是把原本丢失的文档/章节背景补回检索字段。");
}

main();
