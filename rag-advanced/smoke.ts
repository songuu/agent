/**
 * 进阶 RAG · 纯函数冒烟测试（不需要任何 API key）。
 *
 * WHY: rag-advanced 的多数 demo 需要 embedding / LLM（要 key 才能跑）。但分块、BM25、RRF、
 * 余弦相似度都是**纯函数**，可以离线验证。这个 smoke 就是这套库的「免 key 安全网」：
 * 每次改了 shared/rag 的纯逻辑，先跑它确认没改坏，再谈联网的端到端 demo。
 *
 * 运行：npx tsx rag-advanced/smoke.ts   （或 npm run rag:smoke）
 */
import {
  approxTokens,
  slidingWindowChunk,
  recursiveChunk,
  markdownChunk,
  tokenize,
  BM25Index,
  reciprocalRankFusion,
  recallAtK,
  precisionAtK,
  f1AtK,
  hitRateAtK,
  reciprocalRank,
  ndcgAtK,
} from "../src/shared/rag";
import { cosineSimilarity } from "../src/shared/llm/embeddings";
import {
  fixtureKey,
  lookupInFixture,
  loadEmbeddingFixture,
  type EmbeddingFixture,
} from "../src/shared/llm/embeddingFixture";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}${detail ? "  → " + detail : ""}`);
  }
}

console.log("== approxTokens ==");
check("CJK 每字约 1 token", approxTokens("向量检索") === 4, `得到 ${approxTokens("向量检索")}`);
check("英文按约 4 字符/ token", approxTokens("hello world") <= 4, `得到 ${approxTokens("hello world")}`);

console.log("== slidingWindowChunk ==");
{
  const text = "一二三四五六七八九十".repeat(10); // 100 字符
  const chunks = slidingWindowChunk(text, { size: 30, overlap: 10 });
  check("切出多块", chunks.length > 1, `块数 ${chunks.length}`);
  check("相邻块有重叠", chunks.length >= 2 && chunks[0]!.text.slice(-10) === chunks[1]!.text.slice(0, 10));
  let threw = false;
  try {
    slidingWindowChunk(text, { size: 10, overlap: 10 });
  } catch {
    threw = true;
  }
  check("overlap>=size 抛错", threw);
}

console.log("== recursiveChunk ==");
{
  const text = [
    "第一段讲向量检索。它把文本变成向量，按余弦相似度找最近邻。",
    "第二段讲 BM25。它是经典的关键词打分，擅长精确词命中。",
    "第三段讲混合检索。把向量与 BM25 用 RRF 融合，召回更全。",
  ].join("\n\n");
  const chunks = recursiveChunk(text, { chunkSize: 30, overlap: 5 });
  check("切出多块", chunks.length >= 2, `块数 ${chunks.length}`);
  check("每块不超过 chunkSize 的 1.5 倍", chunks.every((c) => approxTokens(c.text) <= 45), "存在超大块");
  check("内容未丢失关键词", chunks.some((c) => c.text.includes("RRF")));
  check("index 连续从 0", chunks.every((c, i) => c.index === i));
}

console.log("== markdownChunk ==");
{
  const md = "# 安装\n## Windows\n用 winget 安装 node。\n## macOS\n用 brew 安装 node。\n";
  const chunks = markdownChunk(md, { chunkSize: 100 });
  check("切出多节", chunks.length >= 2, `块数 ${chunks.length}`);
  check("块带标题路径前缀", chunks.some((c) => c.text.includes("安装 > Windows")));
  check("metadata 记录 heading", chunks.some((c) => typeof c.metadata?.["heading"] === "string"));
}

console.log("== tokenize / BM25 ==");
{
  const tokens = tokenize("hello 向量");
  check("英文成词", tokens.includes("hello"));
  check("CJK 出单字", tokens.includes("向"));
  check("CJK 出二元组", tokens.includes("向量"));

  const bm25 = new BM25Index();
  bm25.add([
    { id: "a", text: "向量检索用余弦相似度找语义最近邻" },
    { id: "b", text: "BM25 是经典关键词检索打分函数" },
    { id: "c", text: "RRF 把多路排序融合成一个综合排序" },
  ]);
  const hits = bm25.search("BM25 关键词打分", 3);
  check("BM25 命中相关文档", hits.length > 0, `命中 ${hits.length}`);
  check("最相关的是文档 b", hits[0]?.id === "b", `top1=${hits[0]?.id}`);
  check("无共享词时无命中", bm25.search("zzz999 foobar quux", 3).length === 0);
}

console.log("== reciprocalRankFusion ==");
{
  // 两路排序：x 在两路都靠前 → 融合后应居首。
  const fused = reciprocalRankFusion([
    ["x", "y", "z"],
    ["y", "x", "w"],
  ]);
  check("融合产出全集", new Set(fused.map((f) => f.id)).size === 4, `共 ${fused.length}`);
  check("两路都靠前的 x 居首", fused[0]?.id === "x", `top1=${fused[0]?.id}`);
  check("分数降序", fused.every((f, i) => i === 0 || f.score <= fused[i - 1]!.score));
}

console.log("== cosineSimilarity ==");
{
  check("相同向量≈1", Math.abs(cosineSimilarity([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
  check("正交向量≈0", Math.abs(cosineSimilarity([1, 0], [0, 1])) < 1e-9);
  check("反向向量≈-1", Math.abs(cosineSimilarity([1, 0], [-1, 0]) + 1) < 1e-9);
}

console.log("== 检索质量指标（纯 IR 指标，离线确定）==");
{
  // retrieved 按相关性降序；relevant 是标注的相关集（golden）。
  const retrieved = ["a", "b", "c", "d"];
  const relevant = ["a", "c"]; // a 在第1名、c 在第3名
  const approx = (x: number, y: number) => Math.abs(x - y) < 1e-4;

  check("recall@2 = 0.5（top2 只命中 a）", approx(recallAtK(retrieved, relevant, 2), 0.5));
  check("recall@4 = 1（a、c 都进 top4）", approx(recallAtK(retrieved, relevant, 4), 1));
  check("precision@2 = 0.5（2 条里 1 条相关）", approx(precisionAtK(retrieved, relevant, 2), 0.5));
  check("precision@4 = 0.5（4 条里 2 条相关）", approx(precisionAtK(retrieved, relevant, 4), 0.5));
  check("f1@4 = 0.6667（recall1 与 precision0.5 的调和平均）", approx(f1AtK(retrieved, relevant, 4), 2 / 3));
  check("hitRate@1 = 1（第1名即相关）", hitRateAtK(retrieved, relevant, 1) === 1);
  check("MRR = 1（第一个相关项排第1）", approx(reciprocalRank(retrieved, relevant), 1));
  check("MRR = 0.5（相关项排第2时）", approx(reciprocalRank(["b", "a", "c"], relevant), 0.5));
  // nDCG@4：DCG = 1/log2(2) + 1/log2(4) = 1.5；IDCG = 1/log2(2)+1/log2(3) ≈ 1.63093；nDCG ≈ 0.91972。
  check("nDCG@4 ≈ 0.9197（命中但 c 排第3有折损）", approx(ndcgAtK(retrieved, relevant, 4), 0.91972));
  check("理想排序 nDCG = 1（相关项全排最前）", approx(ndcgAtK(["a", "c", "b", "d"], relevant, 4), 1));
  check("全漏时各指标为 0", recallAtK(["x", "y"], relevant, 2) === 0 && reciprocalRank(["x", "y"], relevant) === 0);
  check("relevant 为空时 recall 约定为 1", recallAtK(retrieved, [], 2) === 1);
}

console.log("== 离线 embedding fixture（真向量查表逻辑）==");
{
  // 用一个合成 fixture（含真·确定向量）验证查表/缺失/模型隔离逻辑——无需磁盘、无需 key。
  const model = "text-embedding-3-small";
  const fx: EmbeddingFixture = {
    model,
    dim: 3,
    vectors: {
      [fixtureKey(model, "甲")]: [1, 0, 0],
      [fixtureKey(model, "乙")]: [0, 1, 0],
    },
  };
  const r = lookupInFixture(fx, model, ["甲", "丙", "乙"]);
  check("命中项原样返回真向量", JSON.stringify(r.vectors[0]) === "[1,0,0]");
  check("未命中项为 undefined（顺序对齐）", r.vectors[1] === undefined && JSON.stringify(r.vectors[2]) === "[0,1,0]");
  check("missing 去重列出未覆盖文本", r.missing.length === 1 && r.missing[0] === "丙");
  check("换模型不串向量（model 入 key）", lookupInFixture(fx, "other-model", ["甲"]).missing.length === 1);

  // 磁盘 fixture（可能为空）至少能被无异常加载且结构合法。
  const disk = loadEmbeddingFixture();
  check(
    "磁盘 fixture 结构合法可加载",
    typeof disk.model === "string" && typeof disk.dim === "number" && typeof disk.vectors === "object",
  );
}

console.log(`\n结果：${passed} 通过 / ${failed} 失败`);
if (failed > 0) process.exitCode = 1;
