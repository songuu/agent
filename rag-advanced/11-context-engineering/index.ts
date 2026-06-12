/**
 * 进阶 RAG · 第 11 章 demo：检索后的「上下文工程」—— 去重 / 压缩 / 预算 / 注意力重排
 *
 * 这个 demo 演示什么？
 *   拿一份【固定合成语料】（无需任何 API key、不联网），走一遍把召回片段【装配成提示上下文】的全流程：
 *     1) 去重（dedupeChunks）   —— 删掉与已保留片段近重复的整片冗余（多路召回 / 块重叠的产物）。
 *     2) 压缩（compressChunk）  —— 把超长片段按句抽取裁到预算内（纯抽取、是原文前缀，无幻觉）。
 *     3) 预算（packWithinBudget）—— 在 token 预算内贪心挑价值最高的子集，绝不超预算。
 *     4) 重排（reorderForAttention）—— 把高相关片段放到首尾高注意力位，对抗 lost-in-the-middle。
 *
 * WHY（为什么单独有「上下文工程」这一层）？
 *   第 08/09 章把片段「检索出来」，但**检索到 ≠ 用得上**：窗口有预算、召回有冗余、长文塞不下，
 *   而且模型读上下文【首尾强、中间弱】。本章把「装配」这步做成可离线回归的纯函数。
 *
 * 教学结论分两类，绝不写死：
 *   - 【构造保证腿】用 invariant() 运行时硬核对（对任意旋钮都成立）：
 *       去重是分区（不重不漏）、打包绝不超预算、压缩结果≤预算且是原文前缀、重排是排列且有效相关性≥原序。
 *   - 【数据依赖腿】用「现场计算 + else 诊断」（依赖语料/旋钮，软结论）：
 *       去重在预算紧张时腾出名额、重排带来正增益——条件不满足时打印诊断而非抛错（那本身是教学点）。
 *
 * 运行：npx tsx rag-advanced/11-context-engineering/index.ts
 */
import {
  makeContextCorpus,
  dedupeChunks,
  compressChunk,
  packWithinBudget,
  reorderForAttention,
  effectiveRelevance,
  positionalWeights,
  type ContextChunk,
} from "../../src/shared/rag";
import { divider, logger, color } from "../../src/shared";

/** 运行时断言：构造保证的结论必须真成立，否则 demo 失败（防止教学结论悄悄腐烂）。 */
function invariant(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

// ── 实验旋钮（全确定，无随机）──────────────────────────────────────────────────
// 这些都可在练习里改；注意：上面四条「构造保证腿」对任意旋钮都成立（不会因改旋钮误报崩），
// 会变的只是「数据依赖腿」的软结论（去重是否腾名额、重排是否有增益），那是设计好的观察点。
const DEDUP_THRESHOLD = 0.6; // Jaccard ≥ 0.6 判近重复
const COMPRESS_CAP = 40; // 单片段超过这么多 token 就抽取式压到这个上限（只有真正超长的 long1 会触发）
const BUDGET = 130; // 最终上下文的 token 预算
const MIDDLE_WEIGHT = 0.4; // 位置权重的中间值（首尾=1，正中=它）；=1 即「无 lost-in-the-middle」

const ids = (chunks: readonly ContextChunk[]): string => chunks.map((c) => c.id).join(",");
const sumRel = (chunks: readonly ContextChunk[]): number =>
  chunks.reduce((s, c) => s + c.relevance, 0);
const round = (value: number, digits = 3): number => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

function main(): void {
  const corpus = makeContextCorpus();
  const N = corpus.length;

  divider("0) 原始召回语料：检索回来的片段（含近重复 / 超长 / 噪声）");
  logger.info(`共 ${N} 条片段（id / 相关性 / token 成本）：`);
  for (const c of corpus) {
    const tag =
      c.id.startsWith("dup") ? color("（近重复）", "red")
      : c.id === "long1" ? color("（超长）", "yellow")
      : c.id === "noise1" ? color("（低相关噪声）", "yellow")
      : "";
    console.log(`  ${c.id.padEnd(7)} rel=${color(c.relevance.toFixed(2), "cyan")}  tok=${String(c.tokens).padStart(3)}  ${c.text.slice(0, 22)}… ${tag}`);
  }

  // 先按相关性降序排序——去重「保留先出现者」，排序后让更相关的那条留下。
  const sorted = [...corpus].sort((a, b) => b.relevance - a.relevance);

  // ── 1) 去重：删整片冗余 ───────────────────────────────────────────────────────
  divider("1) 去重：删掉与已保留片段近重复的整片冗余");
  const dedup = dedupeChunks(sorted, { threshold: DEDUP_THRESHOLD });
  for (const d of dedup.dropped) {
    console.log(`  丢弃 ${color(d.chunk.id, "red")} ←近重复→ 保留 ${color(d.duplicateOf, "green")}（Jaccard=${round(d.similarity, 2)} ≥ ${DEDUP_THRESHOLD}）`);
  }
  console.log(`  去重后保留 ${color(String(dedup.kept.length), "green")} 条：${ids(dedup.kept)}`);
  // ① 构造保证：去重是一次分区——保留 + 丢弃 = 全部，不重不漏。
  invariant(dedup.kept.length + dedup.dropped.length === N, "去重应为分区：kept + dropped = N");
  console.log(`  ① ${color("分区不变量", "cyan")}：kept(${dedup.kept.length}) + dropped(${dedup.dropped.length}) = ${N} ✓`);

  // ── 2) 压缩：把超长片段按句裁到预算内 ────────────────────────────────────────
  divider(`2) 压缩：超过 ${COMPRESS_CAP} token 的片段抽取式裁到上限（保留高信息前缀）`);
  const compacted = dedup.kept.map((c) => {
    if (c.tokens <= COMPRESS_CAP) return c;
    const r = compressChunk(c, COMPRESS_CAP);
    console.log(`  压缩 ${color(c.id, "yellow")}：${c.tokens} → ${color(String(r.chunk.tokens), "green")} token（裁掉 ${r.droppedSentences} 句）`);
    console.log(`     裁后："${r.chunk.text}"`);
    // ④ 构造保证：压缩结果 ≤ 预算，且是原文的前缀（纯抽取、不改写、无幻觉）。
    invariant(r.chunk.tokens <= COMPRESS_CAP, "压缩后 token 应 ≤ 预算");
    invariant(c.text.startsWith(r.chunk.text), "压缩结果应是原文前缀（抽取式）");
    return r.chunk;
  });
  console.log(`  ④ ${color("压缩不变量", "cyan")}：每条压缩结果 token ≤ ${COMPRESS_CAP} 且为原文前缀 ✓`);

  // ── 3) 预算打包：同预算下，「去重+压缩」覆盖的唯一信息 vs 朴素打包 ─────────────
  divider(`3) 预算打包：token 预算 = ${BUDGET}，对比朴素打包 vs 去重压缩后打包`);

  // 朴素基线：不去重、不压缩，直接按相关性贪心塞。
  const naivePack = packWithinBudget(sorted, { budget: BUDGET });
  // 工程后：去重 + 压缩后再打包。
  const engineeredPack = packWithinBudget(compacted, { budget: BUDGET });

  // ② 构造保证：两种打包都绝不超预算。
  invariant(naivePack.usedTokens <= BUDGET && engineeredPack.usedTokens <= BUDGET, "打包用量应 ≤ 预算");

  // 朴素打包的「相关性之和」会因重复内容而虚高——按唯一信息算才公平。
  const naiveUnique = dedupeChunks(naivePack.selected, { threshold: DEDUP_THRESHOLD }).kept;
  const naiveUniqueRel = sumRel(naiveUnique);
  const engineeredRel = engineeredPack.totalRelevance;

  console.log(`  朴素打包  ：选中 [${color(ids(naivePack.selected), "yellow")}] 用 ${naivePack.usedTokens} tok`);
  console.log(`             相关性之和 = ${round(naivePack.totalRelevance, 2)}（${color("虚高", "red")}：含重复内容）；按唯一信息 = ${color(round(naiveUniqueRel, 2).toFixed(2), "red")}（实覆盖 ${naiveUnique.length} 条）`);
  console.log(`  工程打包  ：选中 [${color(ids(engineeredPack.selected), "green")}] 用 ${engineeredPack.usedTokens} tok`);
  console.log(`             唯一相关性 = ${color(round(engineeredRel, 2).toFixed(2), "green")}（实覆盖 ${engineeredPack.selected.length} 条，无重复）`);
  console.log(`  ② ${color("预算不变量", "cyan")}：两种打包用量均 ≤ ${BUDGET} ✓`);

  // ⑥ 数据依赖腿（软结论 + else 诊断）：预算紧张时，去重把浪费在重复上的名额让给唯一片段。
  if (engineeredRel > naiveUniqueRel + 1e-9) {
    console.log(`  ⑥ ${color("去重 payoff", "green")}：同预算下工程打包多覆盖唯一信息（${round(engineeredRel, 2)} > 朴素唯一 ${round(naiveUniqueRel, 2)}）——朴素把预算浪费在了高分重复上。`);
  } else {
    console.log(`  ⑥ ${color("本参数下去重未腾出名额", "yellow")}：预算足够松或重复未被选中，去重不改变覆盖（但仍省 token、去噪）。改小 BUDGET 或调 DEDUP_THRESHOLD 看差异。`);
  }

  // ── 4) 注意力重排：对抗 lost-in-the-middle ──────────────────────────────────
  divider("4) 注意力重排：把高相关片段放到首尾高注意力位（对抗 lost-in-the-middle）");
  // 为看清顺序效果，对「去重后的全集」演示重排（实际中是对打包选中的子集重排，原理相同）。
  const assembled = [...dedup.kept].sort((a, b) => b.relevance - a.relevance);
  const reordered = reorderForAttention(assembled, MIDDLE_WEIGHT);
  const weights = positionalWeights(assembled.length, MIDDLE_WEIGHT);
  console.log(`  位置权重（首尾高、中间低）：[${weights.map((w) => round(w, 2)).join(", ")}]`);
  console.log(`  朴素顺序（按相关性降序）：${color(ids(assembled), "yellow")}  有效相关性=${color(round(effectiveRelevance(assembled, MIDDLE_WEIGHT), 3).toFixed(3), "yellow")}`);
  console.log(`  注意力重排后          ：${color(ids(reordered), "green")}  有效相关性=${color(round(effectiveRelevance(reordered, MIDDLE_WEIGHT), 3).toFixed(3), "green")}`);

  // ③ 构造保证：重排是一次排列（id 多重集合不变）。
  const sameMultiset = JSON.stringify([...assembled].map((c) => c.id).sort()) === JSON.stringify([...reordered].map((c) => c.id).sort());
  invariant(sameMultiset, "重排只换顺序，不增删片段（应为排列）");
  // ③ 构造保证：重排不会让有效相关性变差（重排不等式）。
  const effBefore = effectiveRelevance(assembled, MIDDLE_WEIGHT);
  const effAfter = effectiveRelevance(reordered, MIDDLE_WEIGHT);
  invariant(effAfter >= effBefore - 1e-9, "重排后有效相关性应 ≥ 原序（重排不等式保证）");
  console.log(`  ③ ${color("重排不变量", "cyan")}：结果是原集合的排列，且有效相关性不降（重排不等式）✓`);

  // ⑤ 构造保证：位置权重 U 形对称、两端最大。
  const maxW = Math.max(...weights);
  invariant(
    weights.length < 2 || (Math.abs(weights[0]! - maxW) < 1e-9 && Math.abs(weights[weights.length - 1]! - maxW) < 1e-9),
    "位置权重两端应最大",
  );
  invariant(
    weights.every((w, i) => Math.abs(w - weights[weights.length - 1 - i]!) < 1e-9),
    "位置权重应关于中心对称",
  );

  // ⑦ 数据依赖腿（软结论 + else 诊断）：重排带来正增益，前提是「首尾权重 > 中间」（即真有 lost-in-the-middle）。
  const delta = effAfter - effBefore;
  if (delta > 1e-9) {
    console.log(`  ⑦ ${color("重排 payoff", "green")}：有效相关性 +${round(delta, 3)}——把次相关的也往首尾放，比一味降序更被模型读到。`);
  } else {
    console.log(`  ⑦ ${color("重排无增益", "yellow")}：MIDDLE_WEIGHT=${MIDDLE_WEIGHT} 时首尾与中间权重拉平（无 lost-in-the-middle），重排自然没意义——这正说明「位置注意力不均」才是重排的前提。`);
  }

  divider("一句话总结");
  logger.success(
    "检索到 ≠ 用得上：先去重删整片冗余、压缩裁超长、按预算挑子集，再把最该读的放到首尾——上下文工程是确定性的纯函数，不是玄学。",
  );
}

try {
  main();
} catch (err) {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
}
