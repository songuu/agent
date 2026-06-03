/**
 * 第 08 章 · Embedding 与向量检索
 *
 * 运行：npx tsx lessons/08-embeddings-and-vector-search/index.ts
 *
 * 注意：embedding 默认走 OpenAI，需要 .env 里配置 OPENAI_API_KEY。
 *
 * 本章演示三件事：
 *  1. 亲手写一个极简内存向量库（add 存 {text,vec}，search 算余弦相似度排序取 top-k），理解原理
 *  2. 直接用 shared 的 MemoryVectorStore 做同样的事，看"成熟版"如何封装
 *  3. 对比语义检索 vs 关键词检索：搜「汽车」为什么能命中「轿车」「电动车」
 */
import { embed, cosineSimilarity } from "../../src/shared/llm/embeddings";
import { MemoryVectorStore } from "../../src/shared/rag/vectorStore";
import { divider, logger } from "../../src/shared";

/**
 * 一份小语料：前几条都和「车」相关但用词各异，后几条是无关话题。
 * WHY: 故意不出现 query 里的字面词，才能凸显"语义检索 ≠ 关键词匹配"。
 */
const CORPUS = [
  "这款轿车的百公里油耗只有五升，非常省钱。", // 语义相关：轿车 ≈ 汽车
  "新能源电动车充一次电能跑五百公里。", // 语义相关：电动车 ≈ 汽车
  "高速公路上行驶时记得系好安全带。", // 语义相关：驾驶场景
  "今天的红烧排骨炖得软烂入味。", // 无关：美食
  "他每天清晨去公园里跑步锻炼身体。", // 无关：运动
  "这本小说的结局让人意想不到。", // 无关：文学
];

/** 检索时返回的一条命中结果（手写库与 shared 库共用这个形状，便于统一打印）。 */
interface Hit {
  text: string;
  score: number;
}

/** 把一组命中结果按相似度从高到低打印出来。 */
function printHits(query: string, hits: Hit[]): void {
  logger.info(`查询：「${query}」 → top ${hits.length} 命中：`);
  hits.forEach((hit, idx) => {
    // score 保留两位小数，方便肉眼对比"相关 vs 无关"的分数断层
    console.log(`  ${idx + 1}. [${hit.score.toFixed(3)}] ${hit.text}`);
  });
}

/**
 * 极简内存向量库（教学版）。
 *
 * WHY: 真正理解一个东西，最快的路是亲手实现一遍最小版本。这里只有两个动作：
 *  - add：把文本批量向量化后，连同原文一起存进内存数组
 *  - search：把 query 也向量化，逐条算余弦相似度，排序后取前 k 条
 * shared/rag/vectorStore.ts 里的 MemoryVectorStore 就是它的"加固版"。
 */
class TinyVectorStore {
  // 每条记录 = 原文 + 它的向量。向量是 number[]，维度由 embedding 模型决定。
  private records: { text: string; vec: number[] }[] = [];

  /** 批量加入文本：一次性向量化（比逐条调用省往返、更省钱）。 */
  async add(texts: string[]): Promise<void> {
    if (texts.length === 0) return;
    const vectors = await embed(texts);
    texts.forEach((text, idx) => {
      // noUncheckedIndexedAccess 下，下标访问是 number[] | undefined，用 ! 断言非空
      this.records.push({ text, vec: vectors[idx]! });
    });
  }

  /** 检索与 query 最相近的 k 条：向量化 query → 逐条算相似度 → 排序取 top-k。 */
  async search(query: string, k = 3): Promise<Hit[]> {
    if (this.records.length === 0) return [];
    const [queryVec] = await embed([query]);
    if (!queryVec) return [];
    return this.records
      .map((rec) => ({ text: rec.text, score: cosineSimilarity(queryVec, rec.vec) }))
      .sort((a, b) => b.score - a.score) // 分数降序：越相似越靠前
      .slice(0, k);
  }
}

/** 作为对照组的"关键词检索"：只看 query 的字符是否字面出现在文本里。 */
function keywordSearch(query: string, texts: string[]): Hit[] {
  return texts
    .filter((text) => text.includes(query)) // 字面包含才算命中
    .map((text) => ({ text, score: 1 })); // 关键词匹配没有"相似度"概念，命中即 1
}

async function main(): Promise<void> {
  const query = "汽车";

  // ---- 第一部分：亲手实现，理解原理 ----
  divider("第一部分：手写极简向量库（embed + cosineSimilarity）");
  const tiny = new TinyVectorStore();
  await tiny.add(CORPUS);
  const tinyHits = await tiny.search(query, 3);
  printHits(query, tinyHits);
  logger.info("观察：分数高的几条都和「车」相关，但原文里压根没有「汽车」二字。");

  // ---- 第二部分：用 shared 的成熟版 ----
  divider("第二部分：直接用 shared 的 MemoryVectorStore");
  const store = new MemoryVectorStore();
  // shared 版的 add 接收对象数组，可带 id/metadata；这里只用 text
  await store.add(CORPUS.map((text) => ({ text })));
  logger.info(`已入库 ${store.size} 条文档。`);
  const storeHits = await store.search(query, 3);
  // SearchHit 的形状是 { doc, score }，转换成统一的 Hit 再打印
  printHits(
    query,
    storeHits.map((hit) => ({ text: hit.doc.text, score: hit.score })),
  );
  logger.info("结论：手写版与成熟版结果一致——封装只是把同一套原理藏进了类里。");

  // ---- 第三部分：语义检索 vs 关键词检索 ----
  divider("第三部分：语义检索 vs 关键词检索");
  const keywordHits = keywordSearch(query, CORPUS);
  if (keywordHits.length === 0) {
    logger.warn(`关键词检索「${query}」：0 命中——因为没有一条原文字面包含「汽车」。`);
  } else {
    printHits(`关键词检索 ${query}`, keywordHits);
  }
  logger.success(
    `语义检索「${query}」：${tinyHits.length} 命中——它理解「轿车/电动车」与「汽车」同义。`,
  );
  logger.info("这正是 RAG 的地基：先用向量把'语义相关'的资料捞出来，再喂给 LLM 作答。");
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
