/**
 * 极简内存向量库：add（向量化并存）→ search（按余弦相似度取 top-k）。
 *
 * 这是第 08/09 章"向量检索 / RAG"的成熟版，沉淀到 shared 供毕业项目与 rag-advanced 复用。
 * 真实项目会换成 pgvector / Pinecone / Qdrant 等；接口刻意保持一致，方便平滑替换。
 *
 * 进阶 RAG（rag-advanced）在此基础上增加三件生产化常用能力，全部向后兼容：
 *  - search 支持 metadata 过滤（filter 谓词）：先按元数据筛子集再排序，实现「按租户/权限/类别」检索。
 *  - upsert 按 id 增量更新：知识库变化时只重嵌变更项，而不是整库重建。
 *  - toJSON / fromJSON 持久化：把「已算好的向量」存盘再载入，避免重启后重新付费 embedding。
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

export interface SearchOptions {
  /** 仅在满足该谓词的文档里检索（基于 metadata 先过滤再排序取 top-k）。 */
  filter?: (doc: VectorDoc) => boolean;
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

  /**
   * 增量更新：按 id 覆盖已存在文档，不存在则插入。只会重新向量化传入项。
   * WHY: 真实知识库会持续变动，整库重嵌既慢又贵；按 id upsert 只为变更付费。
   */
  async upsert(
    items: { id: string; text: string; metadata?: Record<string, unknown> }[],
  ): Promise<void> {
    if (items.length === 0) return;
    const embeddings = await embed(items.map((it) => it.text));
    items.forEach((it, idx) => {
      const doc: VectorDoc = {
        id: it.id,
        text: it.text,
        ...(it.metadata ? { metadata: it.metadata } : {}),
        embedding: embeddings[idx]!,
      };
      const existing = this.docs.findIndex((d) => d.id === it.id);
      if (existing >= 0) this.docs[existing] = doc;
      else this.docs.push(doc);
    });
  }

  /** 检索与 query 最相近的 k 条；options.filter 可先按 metadata 缩小候选集。 */
  async search(query: string, k = 4, options: SearchOptions = {}): Promise<SearchHit[]> {
    const pool = options.filter ? this.docs.filter(options.filter) : this.docs;
    if (pool.length === 0) return [];
    const [queryEmbedding] = await embed([query]);
    if (!queryEmbedding) return [];
    return pool
      .map((doc) => ({ doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  /** 导出为 JSON 字符串（含向量），供持久化落盘。 */
  toJSON(): string {
    return JSON.stringify({ version: 1, docs: this.docs });
  }

  /** 从 toJSON 的产物重建（不重新向量化，省钱省时）。 */
  static fromJSON(json: string): MemoryVectorStore {
    const parsed = JSON.parse(json) as { version?: number; docs?: VectorDoc[] };
    const store = new MemoryVectorStore();
    if (Array.isArray(parsed.docs)) {
      for (const d of parsed.docs) store.docs.push(d);
    }
    return store;
  }

  /** 所有文档的只读快照（供构建 BM25 等并行索引）。 */
  all(): readonly VectorDoc[] {
    return this.docs;
  }

  get size(): number {
    return this.docs.length;
  }
}
