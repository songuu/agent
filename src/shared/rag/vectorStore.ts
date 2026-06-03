/**
 * 极简内存向量库：add（向量化并存）→ search（按余弦相似度取 top-k）。
 *
 * 这是第 08/09 章"向量检索 / RAG"的成熟版，沉淀到 shared 供毕业项目复用。
 * 真实项目会换成 pgvector / Pinecone / Qdrant 等；接口刻意保持一致，方便平滑替换。
 */
import { cosineSimilarity, embed } from "../llm/embeddings";

export interface VectorDoc {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
  embedding: number[];
}

export interface SearchHit {
  doc: VectorDoc;
  score: number;
}

export class MemoryVectorStore {
  private docs: VectorDoc[] = [];

  /** 批量加入文档（会自动向量化）。 */
  async add(
    items: { id?: string; text: string; metadata?: Record<string, unknown> }[],
  ): Promise<void> {
    if (items.length === 0) return;
    const embeddings = await embed(items.map((it) => it.text));
    items.forEach((it, idx) => {
      this.docs.push({
        id: it.id ?? `doc-${this.docs.length + idx}`,
        text: it.text,
        ...(it.metadata ? { metadata: it.metadata } : {}),
        embedding: embeddings[idx]!,
      });
    });
  }

  /** 检索与 query 最相近的 k 条。 */
  async search(query: string, k = 4): Promise<SearchHit[]> {
    if (this.docs.length === 0) return [];
    const [queryEmbedding] = await embed([query]);
    if (!queryEmbedding) return [];
    return this.docs
      .map((doc) => ({ doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  get size(): number {
    return this.docs.length;
  }
}
