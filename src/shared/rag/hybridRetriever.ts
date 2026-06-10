/**
 * 混合检索器：同一份语料同时建「向量索引」与「BM25 关键词索引」，检索时两路各召回一批，
 * 再用 RRF 融合成最终 top-k。
 *
 * WHY 混合：向量擅长语义近似（汽车≈轿车），BM25 擅长精确词/专名/型号（"text-embedding-3-small"）。
 * 单用任一路都有盲区，融合后召回更全——这是生产 RAG 的默认起手式。
 */
import { MemoryVectorStore } from "./vectorStore";
import { BM25Index } from "./bm25";
import { reciprocalRankFusion } from "./fusion";
import type { Retriever, RetrievedChunk } from "./types";

export interface HybridIndexItem {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export class HybridRetriever implements Retriever {
  private store = new MemoryVectorStore();
  private bm25 = new BM25Index();
  private byId = new Map<string, HybridIndexItem>();
  private readonly rrfK: number;
  private readonly pool: number;

  /**
   * @param opts.rrfK RRF 常数（默认 60）。
   * @param opts.pool 每一路进入融合的候选数（默认 20）；越大召回越全但越慢。
   */
  constructor(opts: { rrfK?: number; pool?: number } = {}) {
    this.rrfK = opts.rrfK ?? 60;
    this.pool = opts.pool ?? 20;
  }

  /** 建索引：同时写入向量库与 BM25（向量库内部会调 embedding）。 */
  async index(items: HybridIndexItem[]): Promise<void> {
    if (items.length === 0) return;
    for (const it of items) this.byId.set(it.id, it);
    await this.store.add(
      items.map((it) => ({
        id: it.id,
        text: it.text,
        ...(it.metadata ? { metadata: it.metadata } : {}),
      })),
    );
    this.bm25.add(items.map((it) => ({ id: it.id, text: it.text })));
  }

  async retrieve(query: string, k = 4): Promise<RetrievedChunk[]> {
    if (this.byId.size === 0) return [];
    const vecHits = await this.store.search(query, this.pool);
    const bmHits = this.bm25.search(query, this.pool);
    const fused = reciprocalRankFusion(
      [vecHits.map((h) => h.doc.id), bmHits.map((h) => h.id)],
      { k: this.rrfK },
    );
    return fused.slice(0, k).map((f) => {
      const item = this.byId.get(f.id)!;
      return {
        id: f.id,
        text: item.text,
        score: f.score,
        ...(item.metadata ? { metadata: item.metadata } : {}),
      };
    });
  }
}
