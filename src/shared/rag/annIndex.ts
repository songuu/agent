/**
 * 向量索引内部机制（纯函数、确定性、离线，无需任何 key）。
 *
 * WHY: 第 08 章的 MemoryVectorStore.search 是「暴力精确检索」——把 query 和库里**每一条**向量
 * 都算一次余弦，再排序取 top-k。库小没问题，但到了几十万、上百万条，每次查询都全扫一遍就太慢。
 * 生产向量库（pgvector / Qdrant / FAISS）因此改用 **ANN（近似最近邻）** 索引：用一点点「召回损失」
 * 换数量级的「比较次数下降」。这个模块用**合成的确定性向量**把这件事离线演示清楚：
 *
 *   - bruteForceSearch：精确基线，比较次数 = 全库条数 N，结果当作召回的「金标」。
 *   - buildIvfIndex / ivfSearch：IVF（倒排文件 / 粗量化）——先把向量聚类分桶，查询时只比「最近的
 *     nprobe 个桶」里的向量。比较次数 ≈ nlist（质心扫描）+ N·nprobe/nlist，远小于 N。
 *
 * 所有随机性都走**带种子的 PRNG**（mulberry32），因此同一组参数每次跑结果完全一致——
 * 教学结论（recall 随 nprobe 单调升、nprobe=nlist 时退化为精确）由构造保证、运行时可核对，绝不写死。
 */
import { cosineSimilarity } from "../llm/embeddings";

/** 索引里的一条向量（生成后不再修改，按只读语义使用）。 */
export interface IndexedVector {
  id: string;
  vector: number[];
}

/** 合成语料里的一条向量，额外带上它真实所属的簇（仅用于构造与诊断，索引本身不依赖它）。 */
export interface SyntheticVector extends IndexedVector {
  cluster: number;
}

export interface SyntheticCorpusOptions {
  /** 簇数量（每个簇是一个「语义话题」）。 */
  clusters: number;
  /** 每簇向量条数。 */
  perCluster: number;
  /** 向量维度。 */
  dim: number;
  /** 簇内抖动幅度：越小簇越紧、越好分。 */
  jitter: number;
  /** 随机种子：固定它即可复现整份语料。 */
  seed: number;
}

export interface SyntheticCorpus {
  /** 打乱后的全部向量（打乱是为了让 IVF 初始化不能靠「按簇排列」作弊）。 */
  vectors: SyntheticVector[];
  /** 每个簇的中心向量，用于构造「贴着某簇」的查询。 */
  centers: number[][];
}

/** 一次检索的结果：top-k 的 id（按相似度降序）+ 这次实际做了多少次「整条向量相似度」比较。 */
export interface SearchResult {
  ids: string[];
  /** 比较次数：把它当作「计算量 / 速度」的确定性代理指标（与机器快慢无关，可复现）。 */
  comparisons: number;
}

/**
 * mulberry32：极小的带种子 PRNG。给定 seed，输出一串确定的 [0,1) 伪随机数。
 * WHY 用它而不是 Math.random：教学 demo 的结论必须可复现，Math.random 每次都不同会让 recall 漂移。
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 生成一个随机方向的单位向量（各分量 [-1,1] 后归一化）。 */
function randomUnitVector(dim: number, rand: () => number): number[] {
  const v = Array.from({ length: dim }, () => rand() * 2 - 1);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

/** 在 base 向量上叠加确定性抖动，得到「同一话题但不完全相同」的新向量。 */
export function jitterVector(base: readonly number[], jitter: number, seed: number): number[] {
  const rand = mulberry32(seed);
  return base.map((x) => x + jitter * (rand() * 2 - 1));
}

/**
 * 构造带簇结构的合成语料：clusters 个随机中心，每个中心抖动出 perCluster 条向量。
 * 簇内向量余弦相近、跨簇相远——这正是真实 embedding 空间的简化模型，让「分桶能省比较」成立。
 */
export function makeSyntheticCorpus(options: SyntheticCorpusOptions): SyntheticCorpus {
  const { clusters, perCluster, dim, jitter, seed } = options;
  const rand = mulberry32(seed);

  const centers = Array.from({ length: clusters }, () => randomUnitVector(dim, rand));

  const vectors: SyntheticVector[] = [];
  for (let c = 0; c < clusters; c++) {
    const center = centers[c]!;
    for (let i = 0; i < perCluster; i++) {
      vectors.push({
        id: `c${c}-${i}`,
        cluster: c,
        vector: center.map((x) => x + jitter * (rand() * 2 - 1)),
      });
    }
  }

  // 确定性 Fisher-Yates 打乱：拆散「按簇排列」，否则 IVF 的均匀初始化会恰好踩中每个簇 = 作弊。
  for (let i = vectors.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = vectors[i]!;
    vectors[i] = vectors[j]!;
    vectors[j] = tmp;
  }

  return { vectors, centers };
}

/** 按相似度降序、id 升序兜底地取 top-k id（兜底排序保证结果完全确定，不受引擎排序细节影响）。 */
function topKIds(scored: { id: string; sim: number }[], k: number): string[] {
  return scored
    .sort((a, b) => (b.sim - a.sim) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, k)
    .map((s) => s.id);
}

/**
 * 暴力精确检索：query 与全库每一条算余弦，取 top-k。比较次数恒等于全库条数 N。
 * 它的结果是「真正的最近邻」，被当作衡量 ANN 召回的金标。
 */
export function bruteForceSearch(
  vectors: readonly IndexedVector[],
  query: number[],
  k: number,
): SearchResult {
  const scored = vectors.map((v) => ({ id: v.id, sim: cosineSimilarity(query, v.vector) }));
  return { ids: topKIds(scored, k), comparisons: vectors.length };
}

/** IVF 索引：nlist 个质心 + 每个质心对应一个桶（桶里放向量在 vectors 中的下标）。 */
export interface IvfIndex {
  centroids: number[][];
  buckets: number[][];
  vectors: readonly IndexedVector[];
  nlist: number;
}

export interface BuildIvfOptions {
  /** 桶（质心）数量。nlist 越大桶越细，单桶越小但越可能把一个簇拆散。 */
  nlist: number;
  /** k-means 迭代轮数。 */
  iterations: number;
}

/** 把 query 分到余弦最近的质心下标。 */
function nearestCentroid(query: number[], centroids: number[][]): number {
  let best = 0;
  let bestSim = -Infinity;
  for (let j = 0; j < centroids.length; j++) {
    const sim = cosineSimilarity(query, centroids[j]!);
    if (sim > bestSim) {
      bestSim = sim;
      best = j;
    }
  }
  return best;
}

/**
 * 构建 IVF 索引：确定性 k-means（Lloyd 算法）。
 *  - 初始化：在「已打乱」的向量上按均匀间隔取 nlist 个当初始质心（确定、无需再掷随机）。
 *  - 每轮：把每条向量分到最近质心 → 用簇内均值更新质心；空簇保留旧质心避免 NaN。
 * WHY 离线可跑：聚类只用余弦，没有任何 LLM/网络调用。
 */
export function buildIvfIndex(
  vectors: readonly IndexedVector[],
  options: BuildIvfOptions,
): IvfIndex {
  const { nlist, iterations } = options;
  if (nlist <= 0) throw new Error("nlist 必须为正");
  if (vectors.length < nlist) throw new Error(`向量数 ${vectors.length} 少于 nlist ${nlist}`);

  const dim = vectors[0]!.vector.length;
  // 均匀间隔初始化：打乱后的语料上等距取点，等价于「随机但可复现」地撒下 nlist 个初始质心。
  let centroids: number[][] = Array.from({ length: nlist }, (_unused, j) =>
    vectors[Math.floor((j * vectors.length) / nlist)]!.vector.slice(),
  );

  let assignment: number[] = new Array(vectors.length).fill(0);
  for (let iter = 0; iter < iterations; iter++) {
    assignment = vectors.map((v) => nearestCentroid(v.vector, centroids));

    const sums = Array.from({ length: nlist }, () => new Array<number>(dim).fill(0));
    const counts = new Array<number>(nlist).fill(0);
    vectors.forEach((v, i) => {
      const a = assignment[i]!;
      counts[a]! += 1;
      const sum = sums[a]!;
      for (let d = 0; d < dim; d++) sum[d]! += v.vector[d]!;
    });

    centroids = centroids.map((old, j) => {
      const count = counts[j]!;
      if (count === 0) return old; // 空簇：保留旧质心，避免除零
      return sums[j]!.map((s) => s / count);
    });
  }

  const buckets: number[][] = Array.from({ length: nlist }, () => []);
  assignment.forEach((a, i) => buckets[a]!.push(i));

  return { centroids, buckets, vectors, nlist };
}

/**
 * IVF 近似检索：先比 query 与 nlist 个质心（粗筛），只在最近的 nprobe 个桶里做精确比较。
 * 比较次数 = nlist（质心扫描）+ 这 nprobe 个桶里的向量总数。
 *
 * 关键性质（构造保证）：
 *  - nprobe 越大 → 候选集合单调变大 → 比较次数单调升、召回单调升；
 *  - nprobe ≥ nlist → 探遍所有桶 → 候选 = 全库 → 结果与暴力精确**完全一致**（recall=1），
 *    但比 query 多扫了 nlist 个质心，所以只有 nprobe ≪ nlist 时 ANN 才真正省算。
 */
export function ivfSearch(
  index: IvfIndex,
  query: number[],
  k: number,
  nprobe: number,
): SearchResult {
  const { centroids, buckets, vectors } = index;
  const probe = Math.max(1, Math.min(nprobe, index.nlist));

  const centroidScores = centroids.map((c, j) => ({ j, sim: cosineSimilarity(query, c) }));
  centroidScores.sort((a, b) => (b.sim - a.sim) || (a.j - b.j));
  const probed = centroidScores.slice(0, probe).map((c) => c.j);

  let comparisons = centroids.length; // 质心扫描也是实打实的相似度比较，计入成本
  const scored: { id: string; sim: number }[] = [];
  for (const j of probed) {
    for (const idx of buckets[j]!) {
      const v = vectors[idx]!;
      scored.push({ id: v.id, sim: cosineSimilarity(query, v.vector) });
      comparisons += 1;
    }
  }

  return { ids: topKIds(scored, k), comparisons };
}
