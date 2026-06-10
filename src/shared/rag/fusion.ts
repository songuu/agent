/**
 * Reciprocal Rank Fusion (RRF)：把多路检索的排序结果融合成一个综合排序。
 *
 * WHY 不直接把不同检索器的分数相加？因为向量的余弦相似度（约 0~1）和 BM25 的分数（可到几十）
 * **量纲不可比**，相加会被大数支配。RRF 只看「名次」不看「分值」：每个结果贡献 1/(k+rank)，
 * 名次越靠前贡献越大；既无需归一化，又对异常分值鲁棒，是混合检索最常用的融合法。
 */

export interface FusionHit {
  id: string;
  score: number;
}

/**
 * @param rankings 多路排序结果，每路是「按相关性降序的 id 列表」。
 * @param options.k RRF 常数，默认 60（越大则越平滑、名次差异影响越小）。
 */
export function reciprocalRankFusion(
  rankings: string[][],
  options: { k?: number } = {},
): FusionHit[] {
  const k = options.k ?? 60;
  const scores = new Map<string, number>();
  for (const ranking of rankings) {
    ranking.forEach((id, rank) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank + 1));
    });
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}
