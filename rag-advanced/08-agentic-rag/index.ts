/**
 * 进阶 RAG · 第 08 章：Agentic RAG
 *
 * 用确定性状态机演示 gated retrieve → grade → rewrite → re-retrieve。
 */
import { divider, logger, color } from "../../src/shared";
import {
  makeAgenticRagCorpus,
  makeBm25Retriever,
  rewriteForAgenticRetrieval,
  runAgenticRetrieval,
} from "../../src/shared/rag";

function invariant(name: string, condition: boolean, detail = ""): void {
  if (!condition) throw new Error(`${name}${detail ? `：${detail}` : ""}`);
  logger.success(name);
}

function main(): void {
  const docs = makeAgenticRagCorpus();
  const retrieve = makeBm25Retriever(docs, 2);
  const initialQuery = "坏了咋办";
  const expectedRelevantIds = ["sla-compensation"];

  divider("语料");
  for (const doc of docs) logger.info(`${doc.id}: ${doc.text}`);

  divider("Agentic RAG loop");
  const result = runAgenticRetrieval({
    initialQuery,
    expectedRelevantIds,
    retrieve,
    rewrite: rewriteForAgenticRetrieval,
    maxAttempts: 2,
  });

  for (const step of result.steps) {
    logger.info(
      `attempt ${step.attempt}: query=${color(step.query, "cyan")} hits=${step.retrievedIds.join(", ") || "(none)"} ` +
        `decision=${step.grade.decision} reason=${step.grade.reason}`,
    );
  }

  divider("运行时核对");
  invariant("① 首轮口语查询没有命中 SLA 证据", result.steps[0]!.grade.decision === "retry");
  invariant("② retry query 被改写成 SLA/补偿检索词", result.steps[1]!.query.includes("SLA") && result.steps[1]!.query.includes("补偿"));
  invariant("③ 二轮命中 SLA 证据并允许回答", result.finalDecision === "answer" && result.finalRetrievedIds.includes("sla-compensation"));

  divider("拒答分支");
  const noAnswer = runAgenticRetrieval({
    initialQuery: "支持语音转写吗",
    expectedRelevantIds: [],
    retrieve,
    rewrite: rewriteForAgenticRetrieval,
    maxAttempts: 2,
  });
  logger.info(`no-answer decision=${noAnswer.finalDecision}`);
  invariant("④ golden set 标注无答案时直接拒答", noAnswer.finalDecision === "refuse");

  divider("结论");
  logger.info("Agentic RAG 的关键是把检索后判断显式化：证据不足就改写重试，无答案就拒答，而不是一次 top-k 后硬答。");
}

main();
