/**
 * 进阶 RAG 的统一检索抽象。
 *
 * 不同检索器（纯向量、混合、未来的真实向量 DB）形状各异，但下游的「精排 / 增强 / 评估」
 * 只关心「给个查询、返回若干带分数的片段」。把这一契约抽成 Retriever，下游就能与具体
 * 检索实现解耦——这正是面向接口编程在 RAG 链路里的体现。
 */

/** 一条被检索到的片段（已归一形状，便于在精排/增强/评估间流转）。 */
export interface RetrievedChunk {
  id: string;
  text: string;
  /** 相关性分数（具体含义随检索器而定：余弦相似度 / RRF 融合分等，仅用于排序展示）。 */
  score: number;
  metadata?: Record<string, unknown>;
}

/** 检索器统一接口：输入查询与条数，输出按相关性排序的片段。 */
export interface Retriever {
  retrieve(query: string, k: number): Promise<RetrievedChunk[]>;
}
