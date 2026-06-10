/**
 * BM25 关键词检索。向量检索擅长「语义相近」，但对**精确词、专有名词、型号、代码标识**
 * 反而常不如老牌的词频检索。BM25 是工业界最常用的稀疏检索打分函数，和向量检索互补，
 * 二者融合（见 fusion.ts / hybridRetriever.ts）就是「混合检索」。
 *
 * 本实现零依赖、可读优先；中文用相邻二元组（bigram）近似分词，让 BM25 在中文上也能用。
 */

/** 把文本切成检索词元：英文/数字按词，CJK 既出单字也出相邻二元组，提升中文召回。 */
export function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens: string[] = [];
  const wordRe = /[a-z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(lower)) !== null) tokens.push(m[0]);
  const cjk = lower.match(/[一-鿿぀-ヿ가-힯]/g) ?? [];
  for (let i = 0; i < cjk.length; i++) {
    tokens.push(cjk[i]!);
    if (i + 1 < cjk.length) tokens.push(cjk[i]! + cjk[i + 1]!);
  }
  return tokens;
}

interface Bm25Doc {
  id: string;
  len: number;
  tf: Map<string, number>;
}

export interface Bm25Hit {
  id: string;
  score: number;
}

/** BM25 倒排打分索引。add 入库、search 出 top-k。 */
export class BM25Index {
  private docs: Bm25Doc[] = [];
  private df = new Map<string, number>();
  private avgdl = 0;
  private readonly k1: number;
  private readonly b: number;

  constructor(opts: { k1?: number; b?: number } = {}) {
    this.k1 = opts.k1 ?? 1.5;
    this.b = opts.b ?? 0.75;
  }

  add(items: { id: string; text: string }[]): void {
    for (const it of items) {
      const tokens = tokenize(it.text);
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      this.docs.push({ id: it.id, len: tokens.length, tf });
      for (const term of tf.keys()) this.df.set(term, (this.df.get(term) ?? 0) + 1);
    }
    const total = this.docs.reduce((s, d) => s + d.len, 0);
    this.avgdl = this.docs.length ? total / this.docs.length : 0;
  }

  search(query: string, k = 4): Bm25Hit[] {
    if (this.docs.length === 0) return [];
    const qTokens = [...new Set(tokenize(query))];
    const n = this.docs.length;
    const hits: Bm25Hit[] = this.docs.map((doc) => {
      let score = 0;
      for (const qt of qTokens) {
        const f = doc.tf.get(qt);
        if (!f) continue;
        const dfi = this.df.get(qt) ?? 0;
        // 带平滑的 IDF：稀有词权重更高。
        const idf = Math.log(1 + (n - dfi + 0.5) / (dfi + 0.5));
        const denom = f + this.k1 * (1 - this.b + (this.b * doc.len) / (this.avgdl || 1));
        score += idf * ((f * (this.k1 + 1)) / denom);
      }
      return { id: doc.id, score };
    });
    return hits
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  get size(): number {
    return this.docs.length;
  }
}
