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
