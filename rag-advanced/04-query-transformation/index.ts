/**
 * 第 04 章 · 查询改写：multi-query 与 HyDE
 *
 * 这个 demo 演示「在检索之前先优化查询」的两种手段，对照看它们各自能多召回什么：
 *
 *  1) 直接检索（baseline）：拿用户原话直接向量检索。问题在于——用户问得短、口语、
 *     可能只用了一个词；而资料用的是另一套措辞，于是「明明库里有，却召不回」。
 *
 *  2) multiQuery（多查询扩展）：让 LLM 把同一个意图改写成多个不同措辞/角度的查询，
 *     每个查询各跑一路检索，再把命中【合并去重】。一句话漏掉的，另一句话可能补上，
 *     从而提升召回覆盖（recall）。
 *
 *  3) HyDE（Hypothetical Document Embeddings，假设文档向量）：先让 LLM 写一段
 *     「假设答案」，用这段答案的向量去检索。WHY：在向量空间里，「一段答案」在用词
 *     和篇幅上都比「一个问题」更接近真正的资料，所以常常比用问题本身检索得更准。
 *
 * 为了凸显「私有知识、防幻觉」，语料是一份【虚构】的内部产品手册（版本号/价格/数字
 * 都是编的）。模型训练时没见过，只能靠检索召回——这正好检验「查询改写能不能把对的
 * 片段捞上来」。
 *
 * 运行需要 OPENAI_API_KEY（embedding 走 OpenAI），以及一个可用的 LLM（默认 LLM_PROVIDER）。
 */
import { MemoryVectorStore } from "../../src/shared/rag/vectorStore";
import { asRetriever } from "../../src/shared/rag/ragPipeline";
import { multiQuery, hyde } from "../../src/shared/rag/queryTransform";
import { embedOne, cosineSimilarity } from "../../src/shared/llm/embeddings";
import type { RetrievedChunk } from "../../src/shared/rag/types";
import { divider, logger, color } from "../../src/shared";

/**
 * 虚构的内部产品手册片段（私有知识，模型训练时没见过）。
 * 关键点：每段刻意用「资料的措辞」而非「用户会怎么问」的措辞，制造「问法 ≠ 写法」的鸿沟。
 */
const KNOWLEDGE: { id: string; text: string }[] = [
  {
    id: "doc-quota",
    // 用户大概率会问「数据导出有没有上限」，但资料这里写的是「批量导出额度」。
    text: "「云栈 CloudStack 5.2」企业版的批量导出额度为每个工作区每日 50 万行（虚构）；超出后按每 10 万行 8 元（虚构）计费，导出任务并发上限为 3。",
  },
  {
    id: "doc-retention",
    // 用户会问「数据能存多久 / 会不会被删」，资料写的是「冷归档保留策略」。
    text: "冷数据归档策略：超过 90 天未访问的数据自动转入冷存储，冷存储默认保留 365 天（虚构）后永久删除；可在「治理 > 生命周期」中将保留期延长至 1095 天。",
  },
  {
    id: "doc-sla",
    // 用户会问「宕机赔不赔 / 稳不稳」，资料写的是「可用性 SLA 与服务补偿」。
    text: "可用性 SLA：企业版承诺月度可用性 99.95%（虚构）。未达标按未达标时长返还对应月费的 10%~30%（虚构）服务积分，需在事故后 15 个工作日内提交申诉。",
  },
  {
    id: "doc-auth",
    // 用户会问「能不能用公司账号登录 / 支持单点登录吗」，资料写的是「SAML / SCIM」。
    text: "身份接入：企业版支持基于 SAML 2.0 的单点登录与 SCIM 2.0 用户自动同步（虚构）；最多可配置 5 个身份提供商，且支持按邮箱域名自动路由到对应 IdP。",
  },
  {
    id: "doc-region",
    // 一段相关但容易混淆的「数据驻留」内容，用来检验改写会不会把噪声也一起捞上来。
    text: "数据驻留：企业版可选择数据存放区域（华东 / 华北 / 新加坡，虚构），区域一经创建不可迁移；跨区域访问会触发额外的传输计费，约 0.6 元/GB（虚构）。",
  },
  {
    id: "doc-unrelated",
    // 纯干扰项，与下面的查询都无关，用来观察召回是否会被它污染。
    text: "市场活动：2026 春季开发者大会将于 4 月在线上举办，报名前 500 名赠送限量贴纸一套（虚构），与产品功能无关。",
  },
];

/** demo 用的查询：刻意短、口语化，且用词和资料对不上（用户说「删」，资料写「保留/归档」）。 */
const QUERY = "我的数据会被删掉吗";

const TOP_K = 3;

/** 把一次检索的命中打印成可读列表。 */
function printHits(label: string, hits: RetrievedChunk[]): void {
  logger.info(`${label}：命中 ${hits.length} 条`);
  for (const hit of hits) {
    const score = hit.score.toFixed(3);
    console.log(`  ${color(`[${hit.id}]`, "cyan")} ${color(`(score ${score})`, "gray")}`);
    console.log(`    ${hit.text}`);
  }
}

/**
 * HyDE 检索：用「假设答案」的向量与库里每条文档的向量比余弦相似度，取 top-k。
 * WHY：MemoryVectorStore.search 只接受 query 字符串（内部会 embed 一次问题）。
 * HyDE 要拿「假设答案」当查询向量，所以这里手动 embedOne(hypothetical) 后自己排个序。
 */
async function searchByHyde(
  store: MemoryVectorStore,
  hypothetical: string,
  k: number,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedOne(hypothetical);
  return store
    .all()
    .map((doc) => ({
      id: doc.id,
      text: doc.text,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

async function main(): Promise<void> {
  // 1) 建库：把虚构手册灌进内存向量库（add 内部自动向量化）。
  const store = new MemoryVectorStore();
  await store.add(KNOWLEDGE);
  logger.success(`向量库就绪：${store.size} 条文档`);
  console.log(color(`\n用户查询（短、口语化）：「${QUERY}」`, "yellow"));

  // 复用统一检索抽象：把向量库适配成 Retriever，下面三种策略都基于它。
  const retriever = asRetriever(store);

  // ── 策略 A：直接检索 ──────────────────────────────────────────────
  // 用户原话直接检索。问题：用户说「删」，资料写「归档 / 保留期」，措辞对不上易漏召回。
  divider("策略 A · 直接检索（baseline）");
  const directHits = await retriever.retrieve(QUERY, TOP_K);
  printHits("直接检索", directHits);

  // ── 策略 B：multiQuery 扩多个查询 → 多路检索 → 合并去重 ────────────
  // 让 LLM 把原问题改写成多个角度的查询，每路各检索一次，再按文档去重合并。
  divider("策略 B · multiQuery 多路召回");
  const queries = await multiQuery(QUERY, 3); // 数组首项即原始 query
  logger.info(`扩展出 ${queries.length} 个查询（含原始）：`);
  queries.forEach((q, i) => console.log(`  ${i === 0 ? "原始" : `改写${i}`}：${q}`));

  // 多路检索后按 id 合并；同一文档被多路命中时保留分数最高的那次。
  const merged = new Map<string, RetrievedChunk>();
  for (const q of queries) {
    const hits = await retriever.retrieve(q, TOP_K);
    for (const hit of hits) {
      const prev = merged.get(hit.id);
      if (!prev || hit.score > prev.score) merged.set(hit.id, hit);
    }
  }
  const multiHits = [...merged.values()].sort((a, b) => b.score - a.score);
  printHits("multiQuery 合并去重后", multiHits);

  // ── 策略 C：HyDE 先生成假设答案 → 用答案向量检索 ──────────────────
  // 让 LLM 写一段「假设答案」，用它的向量去检索；答案在用词/篇幅上更贴近资料，常更准。
  divider("策略 C · HyDE 假设文档检索");
  const hypothetical = await hyde(QUERY);
  console.log(color("LLM 生成的假设答案（用它的向量去检索）：", "blue"));
  console.log(`  ${hypothetical}`);
  const hydeHits = await searchByHyde(store, hypothetical, TOP_K);
  printHits("HyDE 检索", hydeHits);

  // ── 对比：三种策略各召回了哪些文档 ───────────────────────────────
  divider("对比 · 召回覆盖差异");
  const idsOf = (hits: RetrievedChunk[]): string => hits.map((h) => h.id).join(", ");
  console.log(`  直接检索     召回：${idsOf(directHits)}`);
  console.log(`  multiQuery   召回：${idsOf(multiHits)}`);
  console.log(`  HyDE         召回：${idsOf(hydeHits)}`);

  // 找出「直接检索漏掉、但被改写策略补回」的文档，直观看出改写的增益。
  const directIds = new Set(directHits.map((h) => h.id));
  const recovered = new Set<string>();
  for (const hit of [...multiHits, ...hydeHits]) {
    if (!directIds.has(hit.id)) recovered.add(hit.id);
  }
  if (recovered.size > 0) {
    logger.success(`改写策略额外捞回（直接检索漏掉的）：${[...recovered].join(", ")}`);
  } else {
    logger.info("本次三种策略召回集合一致（可换更刁钻的查询再试，见 README 练习）。");
  }

  console.log(
    color(
      "\n要点：multiQuery 靠「多措辞并集」扩召回；HyDE 靠「答案更像资料」提精度。两者可叠加。",
      "gray",
    ),
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
