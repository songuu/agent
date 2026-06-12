/**
 * 进阶 RAG · 第 02 章 Demo：混合检索（向量 + BM25 + RRF 融合）
 *
 * 演示什么：
 *   同一份中文语料，构造一个「既含语义改写、又含精确专名」的查询，对比三种检索：
 *     1) 纯向量（MemoryVectorStore）—— 擅长语义近似，但常漏掉精确专名/型号。
 *     2) 纯 BM25（BM25Index + tokenize）—— 擅长精确词命中，但漏掉换了说法的语义改写。
 *     3) 混合（HybridRetriever，内部用 reciprocalRankFusion 融合两路）—— 两类命中都能召回。
 *
 * WHY 要混合：
 *   向量把文本压成稠密向量，按余弦相似度找「意思相近」的（轿车≈汽车），
 *   但对没在训练分布里见过的私有专名/型号/编号（如虚构的 "玄武 X9"、"FW-2024.11"）
 *   向量距离往往不敏感；BM25 恰恰相反——只认字面词，专名命中很准，却对「换个说法」无能为力。
 *   两路各有盲区，用 RRF（只看名次不看分值，量纲无关）融合，召回更全。这是生产 RAG 的默认起手式。
 *
 * 跑这个 demo 需要 OPENAI_API_KEY（向量路要算 embedding）。纯 BM25 路其实不需要 key，
 * 但本 demo 的价值在「三路对比」，所以整体要求有 key。
 */
import {
  MemoryVectorStore,
  BM25Index,
  tokenize,
  reciprocalRankFusion,
  HybridRetriever,
} from "../../src/shared/rag";
import type { RetrievedChunk } from "../../src/shared/rag";
import { divider, logger, color } from "../../src/shared";
// 语料与查询抽到 corpus.ts：demo 与「离线 fixture 注册表」共用同一份字符串，杜绝漂移。
import { CORPUS, QUERY } from "./corpus";

/**
 * 把一路命中（已是 id 排序）打印成「名次表」，并标注该 id 属于哪类目标（专名 / 语义改写 / 干扰）。
 * @param title 这一路的名字
 * @param ids 按相关性降序的文档 id 列表
 * @param k 展示前几名
 */
function printRanking(title: string, ids: string[], k: number): void {
  divider(title);
  if (ids.length === 0) {
    logger.info(color("（无命中）", "gray"));
    return;
  }
  ids.slice(0, k).forEach((id, i) => {
    const item = CORPUS.find((c) => c.id === id);
    const text = item ? item.text : "(未知文档)";
    console.log(`  #${i + 1}  ${color(id, "cyan")}  ${text}`);
  });
}

/** 判断某个目标 id 是否进入了某一路的 top-k，便于在小结里一眼看出谁漏了谁。 */
function hitRank(ids: string[], targetId: string): string {
  const idx = ids.indexOf(targetId);
  return idx === -1 ? color("未召回", "red") : color(`第 ${idx + 1} 名`, "green");
}

async function main(): Promise<void> {
  const k = 4;

  // 这个查询同时考验两路：
  //  - 「最多能接多少终端」是对 d2 的语义改写：d2 的原文是「承载上万台客户机」，
  //    与查询【没有任何共同的字】（BM25 的中文词元=单字+二元组，零重合即零分）。
  //  - 「FW-2024.11」是精确专名（固件编号），是对 d1 的字面命中。
  // 注意查询里刻意不写「这台设备」：「设备」二字会与语料字面重合，让 BM25「侥幸」捞回 d2，
  // 那样就演示不出「BM25 漏语义改写」了——构造对照实验时要把变量控干净。
  const query = QUERY;

  divider("查询");
  console.log(`  ${color(query, "yellow")}`);
  console.log(
    color(
      "  期望：d1（专名 FW-2024.11）与 d2（语义改写：承载上万台客户机）都应被召回；",
      "gray",
    ),
  );
  console.log(
    color(
      "       其中 d2 与查询零字面重合 → BM25 必然漏掉它（确定性），只能靠向量路救回。",
      "gray",
    ),
  );

  // ── 第 1 路：纯向量 ───────────────────────────────────────────────
  // 直接用 MemoryVectorStore：add 会调用 embedding，search 按余弦相似度排序。
  const store = new MemoryVectorStore();
  await store.add(CORPUS.map((c) => ({ id: c.id, text: c.text })));
  const vecHits = await store.search(query, k);
  const vecIds = vecHits.map((h) => h.doc.id);
  printRanking("纯向量检索（语义近似，常漏精确专名）", vecIds, k);

  // ── 第 2 路：纯 BM25 ──────────────────────────────────────────────
  // BM25Index 是稀疏关键词检索：tokenize 切词后按词频/IDF 打分。无需 embedding。
  const bm25 = new BM25Index();
  bm25.add(CORPUS.map((c) => ({ id: c.id, text: c.text })));
  const bmHits = bm25.search(query, k);
  const bmIds = bmHits.map((h) => h.id);
  printRanking("纯 BM25 检索（精确词命中，常漏语义改写）", bmIds, k);

  // 顺带展示 tokenize：看清 BM25 究竟把查询切成了哪些词元（中文走二元组）。
  divider("tokenize 把查询切成的词元（BM25 据此匹配）");
  console.log(`  ${color(tokenize(query).join(" / "), "gray")}`);

  // ── 第 3 路：混合（HybridRetriever 内部 RRF 融合）──────────────────
  // index() 会同时建向量索引与 BM25 索引；retrieve() 各召回一批再 RRF 融合成 top-k。
  const hybrid = new HybridRetriever();
  await hybrid.index(CORPUS.map((c) => ({ id: c.id, text: c.text })));
  const fusedChunks: RetrievedChunk[] = await hybrid.retrieve(query, k);
  const fusedIds = fusedChunks.map((c) => c.id);
  printRanking("混合检索（RRF 融合两路，召回更全）", fusedIds, k);

  // 额外手算一遍 RRF：直接对前两路的 id 列表融合，验证 HybridRetriever 的结论可复现。
  // 这能让读者看清融合「只看名次」的本质——把两路排序喂进去即可，无需任何分数归一化。
  const manualFused = reciprocalRankFusion([vecIds, bmIds]);
  divider("手算 RRF（对上面向量路 / BM25 路的名次直接融合，验证可复现）");
  manualFused.slice(0, k).forEach((f, i) => {
    console.log(
      `  #${i + 1}  ${color(f.id, "cyan")}  RRF=${f.score.toFixed(4)}`,
    );
  });

  // ── 小结：用「目标在各路的名次」凸显融合价值 ──────────────────────
  // 不写死结论，而是按实际名次动态判定：BM25 漏 d2 是构造保证的（零字面重合 → 零分），
  // 向量路的名次会随嵌入模型浮动，所以由代码现场核对再下结论。
  divider("命中对比（专名目标 d1 / 语义改写目标 d2）");
  console.log(
    `  d1（专名 FW-2024.11）  向量=${hitRank(vecIds, "d1")}  BM25=${hitRank(bmIds, "d1")}  混合=${hitRank(fusedIds, "d1")}`,
  );
  console.log(
    `  d2（语义改写：上万台客户机）  向量=${hitRank(vecIds, "d2")}  BM25=${hitRank(bmIds, "d2")}  混合=${hitRank(fusedIds, "d2")}`,
  );

  const bm25MissedD2 = !bmIds.includes("d2");
  const fusedHasBoth = fusedIds.includes("d1") && fusedIds.includes("d2");
  if (bm25MissedD2 && fusedHasBoth) {
    logger.success(
      "BM25 路如预期漏掉了语义改写目标 d2（零字面重合 → 零分），而混合 top-k 里 d1、d2 都在 —— 这就是 RRF 融合补盲区的价值。",
    );
  } else if (!bm25MissedD2) {
    logger.error(
      "BM25 竟然召回了 d2？说明语料或查询被改动后产生了字面重合——对照实验的变量没控住，请检查 d2 文本与查询是否共享了字。",
    );
  } else {
    logger.info(
      "BM25 漏掉了 d2，但混合 top-k 没把两个目标都收进来——嵌入模型对 d2 的语义召回排名偏低。可把 k 调大（如 5）或换嵌入模型再看。",
    );
  }
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
