/**
 * 进阶 RAG · 第 05 章：RAG 评估——三指标定位坏在哪一环
 *
 * 演示什么 / WHY：
 *   RAG 答得不好时，你最需要回答的不是「好不好」，而是「坏在哪一环」——
 *   是检索没找对资料，还是模型拿着对的资料乱编，还是答非所问？
 *   本 demo 用 LLM-as-judge 把一次问答拆成三个独立打分（参考 RAGAS 的指标设计）：
 *     · contextRelevance（上下文相关性）→ 体检「检索」环：资料和问题相关吗？
 *     · faithfulness（忠实度）       → 体检「生成」环：答案有没有臆造、是否都有资料支撑？
 *     · answerRelevance（答案相关性） → 体检「提示/切题」环：有没有直接回答问题？
 *
 *   demo 跑两个对照，把「三分如何分别指向不同病灶」演示清楚：
 *     A 组（健康）：正常 RAG 问答，检索准、答案忠实且切题 → 三分都应偏高。
 *     B 组（生病）：人为做坏——故意检索一堆无关上下文，并强行让模型答非所问，
 *                  于是 contextRelevance（检索坏）与 answerRelevance（切题坏）显著掉下来，
 *                  对照之下你一眼就能定位「问题出在检索 + 提示，而不是模型忠实度」。
 *
 *   语料是一段中文虚构资料（云笺笔记 v7.3），版本号/价格/配额都是「私有知识」，
 *   只能从资料里得到答案——这样才能凸显「评估的是检索+忠实，而非模型的世界知识」。
 *
 * 运行（需要 OPENAI_API_KEY 做 embedding，LLM 走 .env 里的厂商）：
 *   npx tsx rag-advanced/05-rag-evaluation/index.ts
 */
import { MemoryVectorStore } from "../../src/shared/rag";
import { asRetriever, answerWithRag, evaluateRag } from "../../src/shared/rag";
import type { RetrievedChunk } from "../../src/shared/rag";
import { divider, logger, color } from "../../src/shared";

/**
 * 虚构语料：云笺笔记（一款私有产品）的产品事实。
 * 版本号 / 价格 / 配额都是编造的（虚构），目的是让答案【只能来自资料】，
 * 这样三项评估才衡量得到「检索+忠实+切题」，而不是模型已有的世界知识。
 */
const KNOWLEDGE: { id: string; text: string }[] = [
  {
    id: "fact-version",
    text: "云笺笔记当前稳定版本为 v7.3（虚构），于 2026 年 3 月发布，主打离线优先与端到端加密同步。",
  },
  {
    id: "fact-price",
    text: "云笺笔记专业版定价为每用户每月 42 元（虚构），按年付可享 8 折；团队版另需每席位每月 18 元的协作附加费。",
  },
  {
    id: "fact-quota",
    text: "免费版每个账户的云端存储配额为 5 GB（虚构），单个附件上限 100 MB；专业版配额提升至 200 GB。",
  },
  {
    id: "fact-sync",
    text: "云笺笔记的同步采用增量差量算法，断网时本地可继续编辑，联网后自动合并冲突，冲突保留双版本供人工选择。",
  },
  // 几段与价格问题无关的「干扰段」，用来模拟检索可能引入的噪声。
  {
    id: "noise-history",
    text: "云笺笔记最早源于 2019 年的一个开源 Markdown 编辑器项目，后续团队重写了渲染引擎。",
  },
  {
    id: "noise-mascot",
    text: "云笺笔记的吉祥物是一只名叫「墨墨」的小水獭，常出现在加载动画与节日彩蛋里。",
  },
];

/** 与价格完全无关的无关片段，用于 B 组「故意检索坏」：喂给评估的全是噪声。 */
const IRRELEVANT_CONTEXTS: RetrievedChunk[] = [
  {
    id: "noise-mascot",
    text: "云笺笔记的吉祥物是一只名叫「墨墨」的小水獭，常出现在加载动画与节日彩蛋里。",
    score: 0.31,
  },
  {
    id: "noise-history",
    text: "云笺笔记最早源于 2019 年的一个开源 Markdown 编辑器项目，后续团队重写了渲染引擎。",
    score: 0.28,
  },
];

/** 把三项分数与理由统一打印成「体检报告」。 */
function printReport(label: string, scores: Awaited<ReturnType<typeof evaluateRag>>): void {
  // 低于 0.6 视为「亮红灯」，标黄/红，便于一眼定位坏环。
  const fmt = (name: string, v: number, reason: string): void => {
    const tint = v >= 0.6 ? "green" : v >= 0.4 ? "yellow" : "red";
    logger.info(`${name}: ${color(v.toFixed(2), tint)}  — ${color(reason, "gray")}`);
  };
  divider(label);
  fmt("contextRelevance（检索环）", scores.contextRelevance, scores.reasons.contextRelevance);
  fmt("faithfulness  （生成环）", scores.faithfulness, scores.reasons.faithfulness);
  fmt("answerRelevance（切题环）", scores.answerRelevance, scores.reasons.answerRelevance);
}

async function main(): Promise<void> {
  const question = "云笺笔记专业版每个月多少钱？团队版还要额外加钱吗？";

  // ---- 建索引：把虚构语料灌进内存向量库（add 内部自动 embedding）----
  divider("建索引");
  const store = new MemoryVectorStore();
  await store.add(KNOWLEDGE.map((k) => ({ id: k.id, text: k.text })));
  logger.success(`已入库 ${store.size} 条片段`);
  const retriever = asRetriever(store);

  // ================= A 组：健康的 RAG（检索准 + 忠实 + 切题）=================
  divider("A 组 · 正常 RAG 问答");
  const good = await answerWithRag({ query: question, retriever, k: 3 });
  logger.info(`问题：${question}`);
  logger.info(`A 答案：${color(good.answer, "cyan")}`);
  logger.info(
    `A 实际检索到的片段：${good.contexts.map((c) => c.id).join(", ")}`,
  );
  const goodScores = await evaluateRag({
    question,
    answer: good.answer,
    contexts: good.contexts,
  });

  // ================= B 组：人为做坏（检索坏 + 答非所问）=================
  // 故意制造两类病灶，看评估能否分别点出来：
  //   1) 检索坏：把喂给评估的 contexts 换成全无关的噪声片段 → contextRelevance 应该掉。
  //   2) 切题坏：答案答的是「吉祥物」而非「价格」      → answerRelevance 应该掉。
  // 注意：这个「坏答案」恰好忠实于「无关资料」（确实没编造），所以 faithfulness 反而可能不低——
  //       这正是三分各管一环的价值：忠实 ≠ 切题 ≠ 检索对，必须分开看。
  divider("B 组 · 故意制造的坏案例");
  const badAnswer =
    "云笺笔记的吉祥物是一只名叫「墨墨」的小水獭，它会出现在加载动画里，非常可爱。";
  logger.info(`问题：${question}`);
  logger.info(`B 答案（答非所问）：${color(badAnswer, "yellow")}`);
  logger.info(
    `B 喂给评估的上下文（全是无关噪声）：${IRRELEVANT_CONTEXTS.map((c) => c.id).join(", ")}`,
  );
  const badScores = await evaluateRag({
    question,
    answer: badAnswer,
    contexts: IRRELEVANT_CONTEXTS,
  });

  // ---- 两份体检报告并排，演示三分如何分别指向不同病灶 ----
  printReport("A 组评估（应三分都高）", goodScores);
  printReport("B 组评估（检索/切题应明显偏低）", badScores);

  divider("怎么读这三个分数");
  logger.info("contextRelevance 低 → 病在【检索】：去调分块 / top-k / 加重排或混合检索。");
  logger.info("faithfulness   低 → 病在【生成】：收紧『仅据资料作答』约束，或换更稳的模型。");
  logger.info("answerRelevance 低 → 病在【提示/切题】：明确任务、约束输出要直接回答问题。");
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
