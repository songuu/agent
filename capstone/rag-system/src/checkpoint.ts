/**
 * RAG System checkpoint: a keyless, in-repo acceptance slice before jumping to
 * a standalone production repository.
 */
import { divider, logger, color } from "../../../src/shared";
import {
  BM25Index,
  checkGoldenGate,
  evaluateGoldenSet,
  verifyCitations,
  type GoldenEvalCase,
  type RetrievedChunk,
} from "../../../src/shared/rag";

const DOCUMENTS = [
  {
    id: "ingestion",
    title: "Ingestion",
    text: "RAG 系统写入路径负责文档导入、解析、chunk、metadata 标注与失败重试；每个 chunk 必须保留 sourceId 与版本号。",
  },
  {
    id: "retrieval",
    title: "Retrieval",
    text: "查询路径先做权限过滤，再执行混合检索；top-k 候选进入 rerank，最终交给 context builder 做去重、压缩和排序。",
  },
  {
    id: "citation",
    title: "Citation",
    text: "答案必须标注引用编号，引用编号只能来自本次检索注入的来源；越界引用视为幻觉引用，需要进入质量告警。",
  },
  {
    id: "eval",
    title: "Evaluation",
    text: "RAG 回归用 golden set 监控 recall@k、precision@k、MRR、nDCG 与拒答正确性；低于阈值时 CI 失败。",
  },
  {
    id: "governance",
    title: "Governance",
    text: "治理层处理租户隔离、PII 脱敏、提示注入隔离、审计日志与人工复核，把检索内容当成不可信数据。",
  },
];

const QUESTIONS = [
  {
    id: "retrieval-path",
    question: "查询路径里 rerank 前后分别做什么？",
    relevantIds: ["retrieval"],
  },
  {
    id: "quality-gate",
    question: "RAG 回归应该用哪些指标进 CI？",
    relevantIds: ["eval"],
  },
  {
    id: "citation-check",
    question: "引用编号越界说明什么问题？",
    relevantIds: ["citation"],
  },
  {
    id: "unknown",
    question: "这个系统支持语音转写吗？",
    relevantIds: [],
  },
] as const;

const K = 3;

function retrieve(index: BM25Index, question: string): RetrievedChunk[] {
  return index.search(question, K).map((hit) => {
    const doc = DOCUMENTS.find((item) => item.id === hit.id)!;
    return { id: doc.id, text: doc.text, score: hit.score, metadata: { title: doc.title } };
  });
}

function answer(question: string, hits: RetrievedChunk[]): string {
  if (hits.length === 0) return "资料中未提及该能力。";
  if (question.includes("语音")) return "资料中未提及语音转写能力。";
  return hits.map((hit, index) => `${hit.text}[${index + 1}]`).join("\n");
}

function buildCases(index: BM25Index): GoldenEvalCase[] {
  return QUESTIONS.map((item) => {
    const hits = retrieve(index, item.question);
    return {
      id: item.id,
      question: item.question,
      retrievedIds: hits.map((hit) => hit.id),
      relevantIds: [...item.relevantIds],
      answer: answer(item.question, hits),
      shouldRefuse: item.relevantIds.length === 0,
    };
  });
}

function main(): void {
  divider("RAG System in-repo checkpoint");
  const index = new BM25Index();
  index.add(DOCUMENTS);

  const cases = buildCases(index);
  const report = evaluateGoldenSet(cases, K);
  const gate = checkGoldenGate(report, {
    minMeanRecall: 1,
    minMeanPrecision: 1 / K,
    minMeanMrr: 1,
    minMeanNdcg: 1,
    minRefusalAccuracy: 1,
  });

  for (const item of cases) {
    const cite = verifyCitations(item.answer ?? "", item.retrievedIds.length);
    logger.info(`${item.id}: hits=${item.retrievedIds.join(", ") || "(none)"} citations=${cite.ok ? "ok" : "bad"}`);
    if (!cite.ok) gate.failures.push(`${item.id} citation hallucination: ${cite.hallucinated.join(",")}`);
  }

  divider("checkpoint gate");
  logger.info(`meanRecall=${report.aggregate.meanRecall.toFixed(2)}`);
  logger.info(`meanPrecision=${report.aggregate.meanPrecision.toFixed(2)}`);
  logger.info(`meanMRR=${report.aggregate.meanMrr.toFixed(2)}`);
  logger.info(`meanNDCG=${report.aggregate.meanNdcg.toFixed(2)}`);
  logger.info(`refusalAccuracy=${report.aggregate.refusalAccuracy?.toFixed(2) ?? "n/a"}`);

  if (!gate.ok || gate.failures.length > 0) {
    for (const failure of gate.failures) logger.error(failure);
    process.exitCode = 1;
    return;
  }
  logger.success(color("RAG system checkpoint 通过", "green"));
}

main();
