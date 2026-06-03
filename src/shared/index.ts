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

// RAG
export { MemoryVectorStore } from "./rag/vectorStore";
export type { VectorDoc, SearchHit } from "./rag/vectorStore";

// 工具函数
export { getEnv, requireEnv } from "./util/env";
export { logger, color } from "./util/logger";
export { divider, printMessage, printStream, prompt } from "./util/ui";
