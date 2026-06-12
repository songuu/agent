/**
 * RAG 检索质量指标（纯函数，离线确定，无需任何 key）。
 *
 * WHY: 「换了分块 / 检索 / 精排到底变好没有」不能靠肉眼看排名，要用可计算、可回归的指标。
 * 这些都是信息检索（IR）的经典指标，只依赖「检索出的有序 id 列表」与「哪些 id 是相关的（人工标注的
 * golden set）」，因此完全离线、确定、可进 smoke 冒烟与 CI 阈值门——正是把「感觉变好了」变成
 * 「实测变好了」的地基（第 03/05 章严谨化与第 05 章 CI 门都建在这上面）。
 *
 * 约定：`retrieved` 是按相关性【降序】的 id 列表；`relevant` 是被标注为相关的 id 集合（golden set）。
 */

export type RelevanceSet = ReadonlySet<string> | readonly string[];

function toSet(relevant: RelevanceSet): Set<string> {
  return relevant instanceof Set ? relevant : new Set(relevant as readonly string[]);
}

/** 取前 k；k<=0 视为「取全部」。 */
function topK(retrieved: readonly string[], k: number): readonly string[] {
  return k > 0 ? retrieved.slice(0, k) : retrieved.slice();
}

/** top-k 里命中的相关项个数。 */
function hitsAtK(retrieved: readonly string[], relevant: RelevanceSet, k: number): number {
  const rel = toSet(relevant);
  const seen = new Set<string>();
  let hits = 0;
  for (const id of topK(retrieved, k)) {
    if (rel.has(id) && !seen.has(id)) {
      seen.add(id);
      hits += 1;
    }
  }
  return hits;
}

/**
 * recall@k：top-k 命中的相关项 / 全部相关项。
 * relevant 为空时约定为 1（没有可漏的）。衡量「该捞的有没有漏」。
 */
export function recallAtK(retrieved: readonly string[], relevant: RelevanceSet, k: number): number {
  const rel = toSet(relevant);
  if (rel.size === 0) return 1;
  return hitsAtK(retrieved, relevant, k) / rel.size;
}

/**
 * precision@k：top-k 里相关项占比。k<=0 时用 retrieved 的实际长度。
 * 衡量「捞上来的有多少是对的」（信噪比）。检索为空时约定为 0。
 */
export function precisionAtK(retrieved: readonly string[], relevant: RelevanceSet, k: number): number {
  const denom = k > 0 ? k : retrieved.length;
  if (denom === 0) return 0;
  return hitsAtK(retrieved, relevant, k) / denom;
}

/** F1@k：recall@k 与 precision@k 的调和平均；两者皆 0 时为 0。 */
export function f1AtK(retrieved: readonly string[], relevant: RelevanceSet, k: number): number {
  const r = recallAtK(retrieved, relevant, k);
  const p = precisionAtK(retrieved, relevant, k);
  return r + p === 0 ? 0 : (2 * r * p) / (r + p);
}

/** hitRate@k：top-k 是否至少命中一个相关项（0 或 1）。 */
export function hitRateAtK(retrieved: readonly string[], relevant: RelevanceSet, k: number): number {
  return hitsAtK(retrieved, relevant, k) > 0 ? 1 : 0;
}

/**
 * MRR（Mean Reciprocal Rank 的单条形式）：第一个相关项的倒数排名（rank 从 1 起）。
 * 都没命中则 0。衡量「第一个对的排得多靠前」，对「只需一条正确答案」的场景尤其敏感。
 */
export function reciprocalRank(retrieved: readonly string[], relevant: RelevanceSet): number {
  const rel = toSet(relevant);
  for (let i = 0; i < retrieved.length; i++) {
    if (rel.has(retrieved[i]!)) return 1 / (i + 1);
  }
  return 0;
}

/**
 * nDCG@k：归一化折损累计增益，支持二元或分级相关性。
 *  - DCG = Σ gain_i / log2(rank_i + 1)，rank 从 1 起（越靠前折损越小）。
 *  - IDCG = 按增益从大到小理想排序的 DCG。nDCG = DCG / IDCG，范围 [0,1]。
 * gains 可给每个 id 指定增益（如 0/1/2/3 的分级相关）；缺省时「相关=1、不相关=0」。
 * 比 precision/recall 更细：既看「命中没」也看「排得够不够靠前」。
 */
export function ndcgAtK(
  retrieved: readonly string[],
  relevant: RelevanceSet,
  k: number,
  gains?: Readonly<Record<string, number>>,
): number {
  const rel = toSet(relevant);
  const gainOf = (id: string): number => {
    if (gains) return gains[id] ?? 0;
    return rel.has(id) ? 1 : 0;
  };

  const list = topK(retrieved, k);
  let dcg = 0;
  list.forEach((id, i) => {
    const gain = gainOf(id);
    if (gain !== 0) dcg += gain / Math.log2(i + 2); // rank=i+1 → log2(rank+1)=log2(i+2)
  });

  // 理想 DCG：把所有候选（retrieved ∪ relevant）的增益从大到小排，取前 k 计算。
  const universe = new Set<string>(retrieved);
  for (const id of rel) universe.add(id);
  const idealGains = [...universe]
    .map((id) => gainOf(id))
    .filter((g) => g > 0)
    .sort((a, b) => b - a)
    .slice(0, k > 0 ? k : undefined);
  let idcg = 0;
  idealGains.forEach((gain, i) => {
    idcg += gain / Math.log2(i + 2);
  });

  return idcg === 0 ? 0 : dcg / idcg;
}

/** 一组指标的汇总（便于一次性打印 / 比较两个检索配置）。 */
export interface RetrievalMetrics {
  recall: number;
  precision: number;
  f1: number;
  hitRate: number;
  mrr: number;
  ndcg: number;
}

/** 一次算齐所有指标。 */
export function retrievalMetricsAtK(
  retrieved: readonly string[],
  relevant: RelevanceSet,
  k: number,
  gains?: Readonly<Record<string, number>>,
): RetrievalMetrics {
  return {
    recall: recallAtK(retrieved, relevant, k),
    precision: precisionAtK(retrieved, relevant, k),
    f1: f1AtK(retrieved, relevant, k),
    hitRate: hitRateAtK(retrieved, relevant, k),
    mrr: reciprocalRank(retrieved, relevant),
    ndcg: ndcgAtK(retrieved, relevant, k, gains),
  };
}
