/**
 * 第 09 章 · 从零实现 RAG（Retrieval-Augmented Generation）
 *
 * 运行：npx tsx lessons/09-rag-from-scratch/index.ts
 *
 * 本章把 RAG 全流程完整跑一遍：
 *   加载(load) → 分块(chunk) → 向量化入库(embed+index) → 检索(retrieve)
 *   → 拼上下文进 prompt(augment) → 生成(generate)
 *
 * 并用同一个问题做 A/B 对比：
 *   A. 不带 RAG 直接问  → 模型对「虚构私有产品」只能编造（幻觉）
 *   B. 带 RAG 问        → 模型「仅根据资料」作答，准确且标注引用编号，可溯源
 *
 * WHY 需要 RAG：
 *   - 注入私有知识：大模型没见过你公司的内部文档，RAG 在「推理时」把相关资料喂进去。
 *   - 降低幻觉：约束模型「只用提供的资料」，没有依据就说不知道，而不是硬编。
 *   - 可溯源：每条结论都能指回具体片段，便于人工核对，这是企业落地的硬要求。
 */
import { getLLM } from "../../src/shared/llm";
import { MemoryVectorStore } from "../../src/shared/rag/vectorStore";
import { divider, logger, color } from "../../src/shared";
import { KNOWLEDGE_BASE } from "./knowledge";
import { chunkText } from "./chunk";

// 检索时取多少个最相近的片段塞进提示。
// WHY 不是越多越好：k 太小可能漏掉答案，k 太大引入无关噪声且更费 token。
const TOP_K = 3;

/**
 * 把检索命中的片段拼成「带编号的资料区」。
 * 编号（[片段 0] / [片段 1] …）是「可溯源」的关键——它让模型能在答案里引用具体来源。
 */
function buildContextBlock(hits: { doc: { id: string; text: string }; score: number }[]): string {
  return hits
    .map((hit, i) => `[片段 ${i}]（相似度 ${hit.score.toFixed(3)}）\n${hit.doc.text}`)
    .join("\n\n");
}

async function main(): Promise<void> {
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  // 关于这个「虚构产品」的问题：训练语料里绝无此事，最能暴露「有无 RAG」的差距。
  const question = "星轨笔记的专业版多少钱？智能问答每天能用几次？数据存在哪里？";

  // ---- 0) 加载 ----
  // 真实项目这里是读 PDF / 网页 / 数据库；本章直接用内置的私有知识文本。
  divider("第 0 步：加载知识（load）");
  logger.info(`原始文档长度：${KNOWLEDGE_BASE.length} 字符`);

  // ---- 1) 分块 ----
  divider("第 1 步：分块（chunk）");
  const chunks = chunkText(KNOWLEDGE_BASE, { size: 240, overlap: 50 });
  logger.success(`切分得到 ${chunks.length} 个片段（size=240, overlap=50）`);
  chunks.forEach((c) => {
    // 只预览每块前 36 个字符，看清「按主题聚焦 + 相邻重叠」的效果。
    console.log(color(`  [片段 ${c.index}] `, "gray") + c.text.slice(0, 36).replace(/\n/g, " ") + "…");
  });

  // ---- 2) 向量化入库 ----
  // MemoryVectorStore.add 内部会调用 embed() 把每块转成向量并存下来。
  divider("第 2 步：向量化入库（embed + index）");
  const store = new MemoryVectorStore();
  await store.add(chunks.map((c) => ({ id: `chunk-${c.index}`, text: c.text })));
  logger.success(`已向量化并入库 ${store.size} 个片段`);

  // ---- 3) 检索 ----
  // 把问题向量化，在库里按余弦相似度取最相近的 TOP_K 块。
  divider("第 3 步：检索 top-k（retrieve）");
  logger.info(`用户问题：${question}`);
  const hits = await store.search(question, TOP_K);
  hits.forEach((hit, i) => {
    logger.info(`命中 [片段 ${i}] 相似度=${hit.score.toFixed(3)}  ← ${hit.doc.id}`);
  });

  // ============ A. 不带 RAG：直接问 ============
  // WHY 留这一步：让初学者亲眼看到「没有资料时模型会自信地编」。
  divider("对照组 A：不带 RAG 直接问（大概率幻觉）");
  const baseline = await llm.chat({
    system: "你是一位客服助手。",
    messages: [{ role: "user", content: question }],
  });
  console.log(baseline.text);

  // ============ B. 带 RAG：注入检索到的资料再问 ============
  divider("实验组 B：带 RAG（注入资料 + 要求标注引用）");

  // augment：把命中片段拼成「资料区」，连同「只许根据资料作答」的约束一起给模型。
  const contextBlock = buildContextBlock(hits);
  const ragSystem = [
    "你是星轨笔记的客服助手。",
    "你必须【仅根据下面提供的资料】回答用户问题，不得使用资料之外的知识，更不得编造。",
    "若资料中没有答案，就直接说「资料中未提及」。",
    "每条结论后面用方括号标注它依据的片段编号，例如：……（[片段 1]）。",
    "",
    "===== 资料开始 =====",
    contextBlock,
    "===== 资料结束 =====",
  ].join("\n");

  const augmented = await llm.chat({
    system: ragSystem,
    messages: [{ role: "user", content: question }],
    // 温度调低：事实型问答要稳定、贴资料，不需要发挥创造力。
    temperature: 0,
  });
  console.log(augmented.text);

  // ---- 用量对比：RAG 因为多塞了资料，输入 token 会更高，这是「准确性的成本」。----
  divider("token 用量对比");
  logger.info(`A 无 RAG：输入 ${baseline.usage.inputTokens} / 输出 ${baseline.usage.outputTokens}`);
  logger.info(`B 有 RAG：输入 ${augmented.usage.inputTokens} / 输出 ${augmented.usage.outputTokens}`);
  logger.success("对比结论：B 的答案能对上资料事实并标注来源；A 多半是一本正经地编。");
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
