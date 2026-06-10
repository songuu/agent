/**
 * 进阶 RAG · 第 03 章 demo：召回-精排两段式（LLM 重排）。
 *
 * 演示什么：
 *  1) 先用便宜的向量检索「多召回」top-8（重「别漏」）。
 *  2) 再用一次 LLM 调用把候选「精排」到 top-3（重「排得准」），打印精排前后的顺序变化。
 *  3) 用同一个问题跑 answerWithRag 两次：rerank:false vs rerank:true，
 *     对比【答案质量 / 引用片段 / token 用量】，亲眼看到「精排提高注入上下文信噪比」。
 *
 * WHY：单段检索常陷入两难——召回少了会漏掉答案，召回多了又把噪声塞进 prompt
 *（噪声越多，幻觉与跑题越多，token 也越贵）。两段式把这对矛盾拆开：
 *  第一段只管「捞全」，第二段用更强的判断器「排准并裁掉噪声」。
 * 这里语料是「私有、虚构」的，故意混入相近但无关的干扰项，逼出精排的价值。
 *
 * 需要 key：embedding（OPENAI_API_KEY）+ LLM（getLLM 选用的 provider）。keyless=false。
 * 运行：npx tsx rag-advanced/03-reranking/index.ts
 */
import { MemoryVectorStore, asRetriever, llmRerank, answerWithRag } from "../../src/shared/rag";
import type { RetrievedChunk } from "../../src/shared/rag";
import { divider, logger, color } from "../../src/shared";

/**
 * 一小段中文虚构语料（私有知识库）。主题：虚构公司「青萍科技」的内部产品手册。
 * 故意安排：
 *  - 真正回答「Halo X2 续航」的只有 c1；
 *  - 放入多条「也讲续航/快充/Halo 系列」的相近片段当干扰（向量上很近，但答非所问）；
 *  - 含具体版本号/数字（均为虚构），用来检验「私有知识、防幻觉、可溯源」。
 */
const CORPUS: { id: string; text: string }[] = [
  {
    id: "c1",
    text: "青萍 Halo X2 智能手表（2024 款）内置 480mAh 电池，日常混合使用续航约 11 天；"
      + "开启常亮显示（AOD）后续航降至约 5 天。这些数字来自内部实验室标准测试。（虚构）",
  },
  {
    id: "c2",
    text: "青萍 Halo X1（上一代，2023 款）电池为 410mAh，续航约 7 天。X2 相比 X1 续航提升明显。（虚构）",
  },
  {
    id: "c3",
    text: "青萍 Halo X2 采用磁吸充电，配 5W 充电器从 0 充到 100% 约需 90 分钟，快充 10 分钟可用一天。（虚构）",
  },
  {
    id: "c4",
    text: "续航是可穿戴设备的核心体验。一般而言，屏幕亮度、传感器采样频率与后台同步是影响续航的三大因素。",
  },
  {
    id: "c5",
    text: "青萍 Buds Pro 真无线耳机单次续航约 6 小时，配充电盒总续航约 28 小时，与手表为不同产品线。（虚构）",
  },
  {
    id: "c6",
    text: "青萍 Halo X2 支持血氧、心率与睡眠监测；其中睡眠监测全开会额外消耗约 8% 的日均电量。（虚构）",
  },
  {
    id: "c7",
    text: "退换货政策：Halo 系列自签收起 7 天内无理由退货，需保持配件完整、外观无划痕。（虚构）",
  },
  {
    id: "c8",
    text: "Halo X2 防水等级 5ATM，可游泳佩戴；但热水、桑拿与潜水不在保障范围内。（虚构）",
  },
  {
    id: "c9",
    text: "竞品对比（市场部口径）：同价位某竞品续航标称 14 天，但其测试场景关闭了多数传感器，不可直接对标。（虚构）",
  },
  {
    id: "c10",
    text: "青萍科技 2018 年成立，总部位于深圳，主营消费级智能穿戴设备。（虚构）",
  },
];

/** 把一组片段打印成「排名 + id + 分数 + 摘要」，用于直观对比精排前后顺序。 */
function printRanking(title: string, chunks: RetrievedChunk[]): void {
  logger.info(title);
  chunks.forEach((c, i) => {
    const preview = c.text.replace(/\s+/g, " ").slice(0, 36);
    const head = color(`  #${i + 1}`, "cyan");
    const id = color(c.id.padEnd(4), "yellow");
    const score = color(`score=${c.score.toFixed(3)}`, "gray");
    console.log(`${head} ${id} ${score}  ${preview}…`);
  });
}

async function main(): Promise<void> {
  const question = "青萍 Halo X2 的续航大概多久？开了常亮显示呢？";

  // ---- 建库：向量化入库（需要 OPENAI_API_KEY）。----
  divider("0. 构建向量库");
  const store = new MemoryVectorStore();
  await store.add(CORPUS);
  logger.success(`已入库 ${store.size} 条片段（虚构语料：青萍科技产品手册）`);
  console.log(color(`问题：${question}`, "blue"));

  const retriever = asRetriever(store);

  // ---- 第一段：召回 top-8（重「别漏」）。----
  divider("1. 召回（recall）：向量检索 top-8");
  const recalled = await retriever.retrieve(question, 8);
  printRanking("召回结果（按余弦相似度排序，含相近干扰项）：", recalled);

  // ---- 第二段：精排 top-3（重「排得准」）。----
  divider("2. 精排（rerank）：LLM 把 8 条精挑到 3 条");
  const reranked = await llmRerank(question, recalled, { topN: 3 });
  printRanking("精排结果（LLM 重排后保留 top-3）：", reranked);

  // 直观对比：精排把哪些 id 提了上来、刷掉了哪些。
  const recallTop3 = recalled.slice(0, 3).map((c) => c.id);
  const rerankTop3 = reranked.map((c) => c.id);
  console.log(
    color(`\n顺序变化：召回 top-3 = [${recallTop3.join(", ")}]  →  精排 top-3 = [${rerankTop3.join(", ")}]`, "gray"),
  );
  const promoted = rerankTop3.filter((id) => !recallTop3.includes(id));
  const dropped = recallTop3.filter((id) => !rerankTop3.includes(id));
  if (promoted.length > 0) logger.success(`精排提拔进 top-3：${promoted.join(", ")}`);
  if (dropped.length > 0) logger.info(`精排挤出 top-3：${color(dropped.join(", "), "yellow")}`);
  if (promoted.length === 0 && dropped.length === 0) {
    logger.info("本次召回与精排 top-3 一致（说明向量检索本身已较准；换更刁钻的问题更易看出差异）。");
  }

  // ---- A/B：answerWithRag 关精排 vs 开精排（事实型问答 temperature=0）。----
  divider("3. A/B 生成对比：rerank:false vs rerank:true");

  logger.info(color("A) rerank:false —— 直接把召回 top-3 注入生成", "yellow"));
  const plain = await answerWithRag({ query: question, retriever, k: 3, rerank: false });
  console.log(plain.answer.trim());
  console.log(
    color(
      `   引用片段：[${plain.contexts.map((c) => c.id).join(", ")}]`
        + `  | token：in ${plain.usage.inputTokens} / out ${plain.usage.outputTokens}`,
      "gray",
    ),
  );

  console.log();
  logger.info(color("B) rerank:true —— 先召回 8 条再精排到 3 条注入生成", "green"));
  const reranT = await answerWithRag({
    query: question,
    retriever,
    k: 3,
    recallK: 8,
    rerank: true,
  });
  console.log(reranT.answer.trim());
  console.log(
    color(
      `   引用片段：[${reranT.contexts.map((c) => c.id).join(", ")}]`
        + `  | token：in ${reranT.usage.inputTokens} / out ${reranT.usage.outputTokens}`,
      "gray",
    ),
  );

  // ---- 小结：把「信噪比」这件事量化给初学者看。----
  divider("4. 怎么读这组对比");
  const plainIds = new Set(plain.contexts.map((c) => c.id));
  const reranIds = new Set(reranT.contexts.map((c) => c.id));
  const hasAnswerChunkPlain = plainIds.has("c1");
  const hasAnswerChunkReran = reranIds.has("c1");
  logger.info(`含「真正答案片段 c1」：A=${hasAnswerChunkPlain ? "是" : "否"}  B=${hasAnswerChunkReran ? "是" : "否"}`);
  logger.info("关注点：B 注入的 3 条是否更聚焦续航（c1/c3/c6 类），是否剔除了 c4/c5/c7 这类相近但跑题的噪声。");
  logger.info("token 用量两次都按 k=3 注入，差异主要来自被选中片段长短不同；精排省 token 的收益在召回基数更大时更明显。");
  logger.success("结论：召回重『别漏』、精排重『排得准』——两段式提升注入上下文信噪比，是低成本提质的常用手段。");
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
