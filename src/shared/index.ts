/**
 * 共享代码统一出口（barrel）。课程里既可以从这里整体导入，也可以按子路径精确导入。
 * 为了让初学者看清"东西从哪来"，各 lesson 一般用更精确的子路径导入。
 */

// LLM 抽象与工厂
export * from "./llm/types";
export { getLLM, createAnthropicClient, createOpenAIClient } from "./llm";
export type { ProviderName } from "./llm";
export { embed, embedOne, cosineSimilarity } from "./llm/embeddings";

// Agent 标准库
export { defineTool, toToolSpec, ToolRegistry } from "./agent/tool";
export type { Tool } from "./agent/tool";
export { runAgent } from "./agent/loop";
export type { RunAgentOptions, RunAgentResult, AgentStep } from "./agent/loop";

// RAG（向量库 + 进阶检索：分块/BM25/混合/精排/查询改写/管线/评估）
export { MemoryVectorStore } from "./rag/vectorStore";
export type { VectorDoc, SearchHit, SearchOptions } from "./rag/vectorStore";
export {
  approxTokens,
  slidingWindowChunk,
  recursiveChunk,
  markdownChunk,
} from "./rag/chunk";
export type { Chunk, SlidingWindowOptions, RecursiveChunkOptions } from "./rag/chunk";
export { BM25Index, tokenize } from "./rag/bm25";
export type { Bm25Hit } from "./rag/bm25";
export { reciprocalRankFusion } from "./rag/fusion";
export type { FusionHit } from "./rag/fusion";
export { HybridRetriever } from "./rag/hybridRetriever";
export type { HybridIndexItem } from "./rag/hybridRetriever";
export type { Retriever, RetrievedChunk } from "./rag/types";
export { llmRerank } from "./rag/rerank";
export type { RerankOptions } from "./rag/rerank";
export { multiQuery, hyde } from "./rag/queryTransform";
export type { QueryTransformOptions } from "./rag/queryTransform";
export { answerWithRag, asRetriever, buildContextBlock } from "./rag/ragPipeline";
export type { RagAnswer, AnswerWithRagOptions } from "./rag/ragPipeline";
export { evaluateRag } from "./rag/evaluate";
export type { RagEvalScores, RagEvalInput } from "./rag/evaluate";

// 工具函数
export { getEnv, requireEnv } from "./util/env";
export { logger, color } from "./util/logger";
export { divider, printMessage, printStream, prompt } from "./util/ui";
