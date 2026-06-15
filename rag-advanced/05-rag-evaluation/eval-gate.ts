/**
 * 第 05 章 · golden-set CI gate（离线、确定、无 key）。
 *
 * 运行：
 *   npm run rag:eval
 *
 * 改坏检索、指标阈值或拒答规则时，本脚本 exit 1，适合放进 CI。
 */
import { divider, logger, color } from "../../src/shared";
import {
  BM25Index,
  checkGoldenGate,
  evaluateGoldenSet,
  type GoldenEvalCase,
  type GoldenGateThresholds,
} from "../../src/shared/rag";

const CORPUS = [
  {
    id: "fact-price",
    text: "云笺笔记专业版定价为每用户每月 42 元，按年付可享 8 折；团队版另需每席位每月 18 元的协作附加费。",
  },
  {
    id: "fact-quota",
    text: "免费版每个账户的云端存储配额为 5 GB，单个附件上限 100 MB；专业版配额提升至 200 GB。",
  },
  {
    id: "fact-sync",
    text: "云笺笔记同步采用增量差量算法，断网时可继续编辑，联网后自动合并冲突并保留双版本供人工选择。",
  },
  {
    id: "noise-history",
    text: "云笺笔记最早源于 2019 年的 Markdown 编辑器项目，后来重写了渲染引擎。",
  },
];

const QUESTIONS = [
  {
    id: "price",
    question: "云笺笔记专业版每月多少钱，团队版还要加钱吗？",
    relevantIds: ["fact-price"],
    answer: "专业版每用户每月 42 元；团队版另需每席位每月 18 元协作附加费。",
    shouldRefuse: false,
  },
  {
    id: "quota",
    question: "免费版和专业版的存储配额分别是多少？",
    relevantIds: ["fact-quota"],
    answer: "免费版 5 GB，专业版 200 GB；单个附件上限 100 MB。",
    shouldRefuse: false,
  },
  {
    id: "sync",
    question: "断网编辑后同步冲突怎么处理？",
    relevantIds: ["fact-sync"],
    answer: "断网时本地可继续编辑，联网后自动合并冲突；冲突保留双版本供人工选择。",
    shouldRefuse: false,
  },
  {
    id: "no-answer",
    question: "云笺笔记支持 Excel 批量导入吗？",
    relevantIds: [],
    answer: "资料中未提及云笺笔记是否支持 Excel 批量导入。",
    shouldRefuse: true,
  },
] as const;

const K = 3;
const THRESHOLDS: GoldenGateThresholds = {
  minMeanRecall: 1,
  minMeanPrecision: 1 / K,
  minMeanMrr: 1,
  minMeanNdcg: 1,
  minRefusalAccuracy: 1,
};

function buildCases(): GoldenEvalCase[] {
  const bm25 = new BM25Index();
  bm25.add(CORPUS);
  return QUESTIONS.map((item) => ({
    id: item.id,
    question: item.question,
    relevantIds: [...item.relevantIds],
    retrievedIds: bm25.search(item.question, K).map((hit) => hit.id),
    answer: item.answer,
    shouldRefuse: item.shouldRefuse,
  }));
}

function main(): void {
  divider("第 05 章 golden-set eval gate");
  const report = evaluateGoldenSet(buildCases(), K);
  for (const item of report.cases) {
    logger.info(
      `${item.id}: recall=${item.recall.toFixed(2)} precision=${item.precision.toFixed(2)} ` +
        `MRR=${item.mrr.toFixed(2)} nDCG=${item.ndcg.toFixed(2)} refusal=${item.refusalCorrect ?? "n/a"}`,
    );
  }

  const gate = checkGoldenGate(report, THRESHOLDS);
  divider("CI gate");
  logger.info(`meanRecall=${report.aggregate.meanRecall.toFixed(2)}`);
  logger.info(`meanPrecision=${report.aggregate.meanPrecision.toFixed(2)}`);
  logger.info(`meanMRR=${report.aggregate.meanMrr.toFixed(2)}`);
  logger.info(`meanNDCG=${report.aggregate.meanNdcg.toFixed(2)}`);
  logger.info(`refusalAccuracy=${report.aggregate.refusalAccuracy?.toFixed(2) ?? "n/a"}`);

  if (!gate.ok) {
    for (const failure of gate.failures) logger.error(failure);
    process.exitCode = 1;
    return;
  }
  logger.success(color("golden-set gate 通过", "green"));
}

main();
