/**
 * 进阶 RAG · 第 10 章 demo：向量索引内部机制 —— 暴力精确 vs IVF 分桶 ANN
 *
 * 这个 demo 演示什么？
 *   构造一份带簇结构的【合成确定向量】语料（无需任何 API key、不联网），对同一批查询分别用：
 *     1) bruteForceSearch —— 和全库每条比，结果是「真正的最近邻」，当作召回金标。
 *     2) ivfSearch(nprobe) —— 先聚类分桶，只比最近的 nprobe 个桶；扫不同 nprobe 看「速度↔召回」曲线。
 *
 * WHY（为什么要讲索引内部）？
 *   第 08 章的 MemoryVectorStore.search 就是暴力线性扫描：每次查询 = 全库一次余弦。库一大就扛不住。
 *   生产向量库改用 ANN 索引，用「一点点召回损失」换「数量级的比较次数下降」。本章把这件事离线讲透。
 *
 * 教学结论由【构造 + 运行时核对】保证，绝不写死：
 *   - 比较次数是确定的整数（按构造计量），不靠机器快慢；
 *   - 召回（recall@k）用暴力结果当金标【现场计算】，再用 invariant() 核对趋势：
 *       · nprobe 增大 → 比较次数单调升、召回单调升；
 *       · nprobe = nlist → 退化为暴力精确（recall=1，但比较数 > 暴力，多了质心扫描）。
 *   固定种子 → 每次运行结果一致；构造一旦被改坏，demo 立即报错而非给假结论。
 *
 * 运行：npx tsx rag-advanced/10-index-internals/index.ts
 */
import {
  makeSyntheticCorpus,
  jitterVector,
  bruteForceSearch,
  buildIvfIndex,
  ivfSearch,
  recallAtK,
} from "../../src/shared/rag";
import { divider, logger, color } from "../../src/shared";

/** 运行时断言：构造保证的结论必须真成立，否则 demo 失败（防止教学结论悄悄腐烂）。 */
function invariant(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

// ── 实验参数（固定种子 → 完全可复现）────────────────────────────────────────────
const CLUSTERS = 8; // 8 个语义话题
const PER_CLUSTER = 24; // 每话题 24 条 → 全库 N = 192
const DIM = 32;
const JITTER = 0.1; // 簇内抖动：小 → 簇紧、好分
const SEED = 42;
const NLIST = 16; // 16 个桶 > 8 个簇 → 簇会被拆开，小 nprobe 必漏一些，曲线才有看头
const ITERATIONS = 15;
const K = 10; // 取 top-10
// 扫一遍 nprobe：末档强制 = NLIST（全探，退化为暴力），因此「最后一档 = nlist」对任意 NLIST 都成立。
// WHY 派生而非写死：练习会让学习者改 NLIST；若 sweep 末档不随之变成 NLIST，invariant ④（末档=全探）就会
// 在改大 NLIST 后误报「构造不变量被破坏」——那不是真缺陷，而是 sweep 没跟上参数。
const NPROBE_SWEEP = [...new Set([1, 2, 4, 8, NLIST].filter((n) => n <= NLIST))].sort((a, b) => a - b);

function round(value: number, digits = 3): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function main(): void {
  const N = CLUSTERS * PER_CLUSTER;
  logger.info(
    `合成语料：${CLUSTERS} 簇 × ${PER_CLUSTER} = ${N} 条 ${DIM} 维向量；建 IVF 索引 nlist=${NLIST}，取 top-${K}。`,
  );

  const { vectors, centers } = makeSyntheticCorpus({
    clusters: CLUSTERS,
    perCluster: PER_CLUSTER,
    dim: DIM,
    jitter: JITTER,
    seed: SEED,
  });
  const index = buildIvfIndex(vectors, { nlist: NLIST, iterations: ITERATIONS });

  // 每个簇构造一条「贴着该簇中心但不完全相同」的查询，平均看召回更稳。
  const queries = centers.map((center, c) => jitterVector(center, JITTER * 0.8, SEED + 100 + c));

  // ── 暴力精确：金标 ───────────────────────────────────────────────────────────
  divider("暴力精确检索（金标）：每次查询和全库每条比");
  const gold = queries.map((q) => bruteForceSearch(vectors, q, K));
  const bruteComparisons = gold[0]!.comparisons;
  console.log(`  每次查询比较次数 = 全库条数 = ${color(String(bruteComparisons), "cyan")}`);
  // 构造保证：暴力比较次数恒等于 N。
  invariant(
    gold.every((g) => g.comparisons === N),
    "暴力检索每次都应比较 N 条",
  );
  logger.success(`暴力检索 = 精确但每查都全扫 ${N} 条；这是召回的金标，也是要被 ANN 省掉的成本。`);

  // ── IVF 近似：扫不同 nprobe，看「速度↔召回」曲线 ──────────────────────────────
  divider("IVF 分桶近似检索：只比最近的 nprobe 个桶");
  console.log(`  ${color("nprobe", "yellow")}   ${color("比较次数", "yellow")}   ${color("vs 暴力", "yellow")}   ${color("平均 recall@" + K, "yellow")}`);

  const rows = NPROBE_SWEEP.map((nprobe) => {
    const results = queries.map((q) => ivfSearch(index, q, K, nprobe));
    // 各查询桶内候选数略有差异，对比较次数取平均更能代表该 nprobe 的真实成本。
    const avgComparisons = results.reduce((s, r) => s + r.comparisons, 0) / results.length;
    const avgRecall =
      queries.reduce((s, q, i) => s + recallAtK(results[i]!.ids, new Set(gold[i]!.ids), K), 0) /
      queries.length;
    return { nprobe, avgComparisons, avgRecall };
  });

  for (const r of rows) {
    const speedup = `${round(bruteComparisons / r.avgComparisons, 1)}×省`;
    const bar = "█".repeat(Math.round(r.avgRecall * 20));
    console.log(
      `  ${String(r.nprobe).padStart(5)}   ${String(round(r.avgComparisons, 0)).padStart(7)}   ${speedup.padStart(7)}   ${color(round(r.avgRecall).toFixed(3), "green")} ${color(bar, "green")}`,
    );
  }

  // ── 运行时核对：所有结论都由代码现场判定 ─────────────────────────────────────
  divider("结论核对（运行时判定，不写死）");

  const first = rows[0]!; // nprobe = 1
  const last = rows[rows.length - 1]!; // nprobe = NLIST

  // ① 小 nprobe 必省算：nprobe=1 的比较次数远小于暴力。
  invariant(first.avgComparisons < bruteComparisons, "nprobe=1 比较次数应小于暴力");
  console.log(
    `  ① nprobe=1 只比 ${round(first.avgComparisons, 0)} 次（暴力 ${bruteComparisons}）→ ${color(round(bruteComparisons / first.avgComparisons, 1) + "× 省算", "cyan")}`,
  );

  // ② 比较次数随 nprobe 单调不减（候选集合单调变大）。
  invariant(
    rows.every((r, i) => i === 0 || r.avgComparisons >= rows[i - 1]!.avgComparisons),
    "比较次数应随 nprobe 单调不减",
  );
  console.log(`  ② 比较次数随 nprobe ${color("单调升", "cyan")}（多探桶 = 多候选）`);

  // ③ 召回随 nprobe 单调不减（探更多桶只会更接近精确，不会更差）。
  invariant(
    rows.every((r, i) => i === 0 || r.avgRecall >= rows[i - 1]!.avgRecall - 1e-9),
    "召回应随 nprobe 单调不减",
  );
  console.log(`  ③ 召回随 nprobe ${color("单调升", "cyan")}（探更多桶 = 更接近精确）`);

  // ④ nprobe = nlist 退化为暴力精确：recall=1，但比较次数 > 暴力（多扫了 nlist 个质心）。
  invariant(Math.abs(last.avgRecall - 1) < 1e-9, "nprobe=nlist 时召回应为 1（退化为精确）");
  invariant(last.avgComparisons > bruteComparisons, "nprobe=nlist 比较次数应 > 暴力（多了质心扫描）");
  console.log(
    `  ④ nprobe=nlist=${NLIST}：recall=${color("1.000", "green")}（=暴力结果），但比 ${round(last.avgComparisons, 0)} 次 > 暴力 ${bruteComparisons} → ${color("全探反而更贵", "red")}`,
  );

  // ⑤ 甜点区（软结论，非普适不变量）：某个远小于 nlist 的 nprobe 既高召回（≥0.8）又显著省算（<暴力一半）。
  //    它依赖「数据真有簇结构」——簇坍缩时（如练习4 把 JITTER 调大）甜点会消失，那本身就是教学点，
  //    所以这里用「现场计算 + else 诊断」而非 invariant 抛错（呼应：数据依赖的结论不写死、留诊断分支）。
  const sweet = rows.find((r) => r.avgRecall >= 0.8 && r.avgComparisons < bruteComparisons / 2);
  if (sweet) {
    console.log(
      `  ⑤ 甜点 nprobe=${color(String(sweet.nprobe), "green")}：recall=${color(round(sweet.avgRecall).toFixed(3), "green")} 且仅 ${round(sweet.avgComparisons, 0)} 次比较（< 暴力一半）`,
    );
  } else {
    console.log(
      `  ⑤ ${color("无甜点", "red")}：没有哪个 nprobe 同时满足高召回与显著省算——簇结构太弱时 ANN 失效（ANN 的前提是数据真有簇结构）。`,
    );
  }

  divider("一句话总结");
  logger.success(
    "ANN 不是更聪明的精确，而是用可控的召回损失换比较次数；nprobe 就是那个旋钮：小=快但可能漏，大=准但接近全扫。",
  );
}

try {
  main();
} catch (err) {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
}
