/**
 * RAG 标准库统一出口（barrel）。第 08/09 章打地基，rag-advanced 各章用这里的进阶能力。
 * 章节可从这里整体导入，也可按子路径精确导入（课程示例多用精确子路径，便于看清来源）。
 */

// 向量库（含 metadata 过滤、增量 upsert、JSON 持久化）
export { MemoryVectorStore } from "./vectorStore";
export type { VectorDoc, SearchHit, SearchOptions } from "./vectorStore";

// 分块策略
export {
  approxTokens,
  slidingWindowChunk,
  recursiveChunk,
  markdownChunk,
} from "./chunk";
export type {
  Chunk,
  SlidingWindowOptions,
  RecursiveChunkOptions,
} from "./chunk";

// BM25 关键词检索
export { BM25Index, tokenize } from "./bm25";
export type { Bm25Hit } from "./bm25";

// 融合 / 混合检索
export { reciprocalRankFusion } from "./fusion";
export type { FusionHit } from "./fusion";
export { HybridRetriever } from "./hybridRetriever";
export type { HybridIndexItem } from "./hybridRetriever";

// 统一检索抽象
export type { Retriever, RetrievedChunk } from "./types";

// 精排 / 查询改写
export { llmRerank } from "./rerank";
export type { RerankOptions } from "./rerank";
export { multiQuery, hyde } from "./queryTransform";
export type { QueryTransformOptions } from "./queryTransform";

// 端到端管线
export { answerWithRag, asRetriever, buildContextBlock } from "./ragPipeline";
export type { RagAnswer, AnswerWithRagOptions } from "./ragPipeline";

// 评估
export { evaluateRag } from "./evaluate";
export type { RagEvalScores, RagEvalInput } from "./evaluate";

// 检索质量指标（纯函数：recall/precision/F1/hitRate/MRR/nDCG）
export {
  recallAtK,
  precisionAtK,
  f1AtK,
  hitRateAtK,
  reciprocalRank,
  ndcgAtK,
  retrievalMetricsAtK,
} from "./metrics";
export type { RelevanceSet, RetrievalMetrics } from "./metrics";

// 安全护栏（纯函数：注入检测 / PII 脱敏 / 引用核验）
export {
  detectInjection,
  quarantineInjectedChunks,
  redactPii,
  verifyCitations,
} from "./security";
export type {
  InjectionPattern,
  InjectionFinding,
  InjectionScanResult,
  ScannableChunk,
  QuarantineResult,
  PiiType,
  PiiMatch,
  RedactionResult,
  CitationCheck,
} from "./security";

// 向量索引内部机制（纯函数：合成确定向量 / 暴力精确 vs IVF 分桶 ANN / 比较次数计量）
export {
  makeSyntheticCorpus,
  jitterVector,
  bruteForceSearch,
  buildIvfIndex,
  ivfSearch,
} from "./annIndex";
export type {
  IndexedVector,
  SyntheticVector,
  SyntheticCorpusOptions,
  SyntheticCorpus,
  SearchResult,
  IvfIndex,
  BuildIvfOptions,
} from "./annIndex";

// 检索后上下文工程（纯函数：近重复去重 / 抽取式压缩 / 预算内打包 / 位置注意力重排，全离线确定）
export {
  makeContextCorpus,
  dedupeChunks,
  jaccardSimilarity,
  compressChunk,
  positionalWeights,
  effectiveRelevance,
  reorderForAttention,
  packWithinBudget,
} from "./contextAssembly";
export type {
  ContextChunk,
  DedupeOptions,
  DroppedDuplicate,
  DedupeResult,
  CompressResult,
  PackOptions,
  PackResult,
} from "./contextAssembly";
