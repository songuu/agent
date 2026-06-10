/**
 * 进阶 RAG · 第 01 章 demo：三种分块策略对比（递归与 Markdown 感知）
 *
 * 这个 demo 演示什么？
 *   同一篇中文 Markdown 产品手册，分别用三种切块方式处理：
 *     1) slidingWindowChunk —— 第 09 章的「字符滑窗」基线，按固定字符长度盲切。
 *     2) recursiveChunk     —— 递归语义切分，优先在段落/句末等语义边界下刀。
 *     3) markdownChunk       —— Markdown 标题感知切分，给每块加上「标题路径」前缀。
 *
 * WHY（为什么值得专门学一章）？
 *   检索质量的【上限】由切块决定。块切坏了，后面再强的 embedding、rerank、prompt 都救不回来：
 *     - 滑窗会把一句完整的话从中间截断，答案恰好落在边界时任何一块都答不全。
 *     - 递归在句末/段落边界下刀，块内语义完整，召回更「锐利」。
 *     - markdownChunk 进一步利用文档结构，把「这块出自哪个标题」写进块里，让片段自带出处。
 *
 * 这是少数【无需任何 API key】就能跑通的 demo：三个分块函数都是纯函数，
 * 不调用 LLM、不做 embedding，离线即可观察差异。
 *
 * 运行：npx tsx rag-advanced/01-chunking-strategies/index.ts
 */
import {
  approxTokens,
  slidingWindowChunk,
  recursiveChunk,
  markdownChunk,
} from "../../src/shared/rag";
import type { Chunk } from "../../src/shared/rag";
import { divider, logger, color } from "../../src/shared";

// ── 虚构语料：一段中文 Markdown 产品手册（含多级标题、列表、长短段落）──────────────
// 「织云协作」「v4.2」「￥58」等均为(虚构)，用于凸显「私有知识、防幻觉」：模型没见过这些，
// 只能靠检索拿到正确的块才能答对。
const PRODUCT_MANUAL = `# 织云协作 用户手册

织云协作是一款面向中小团队的文档与任务一体化工具（虚构产品）。本手册介绍它的核心能力、价格与常见问题，供新用户快速上手。

## 一、核心功能

### 1.1 实时文档
多人可以同时编辑同一篇文档，光标与改动实时同步。历史版本默认保留 90 天（虚构），随时可回滚到任意一次保存点。

### 1.2 任务看板
看板支持以下视图：

- 列表视图：按截止时间排序，适合个人每日清单。
- 泳道视图：按负责人分组，适合站会同步进度。
- 甘特视图：展示任务依赖与里程碑，仅专业版（虚构）开放。

任务可以和文档双向关联：在文档里 @一个任务会生成卡片，在任务里也能反查相关文档。

## 二、价格方案

织云协作提供三档方案（价格为虚构示例）：

- 免费版：最多 5 名成员，单文件上限 20 MB。
- 标准版：每用户每月 ￥58，成员无上限，单文件上限 2 GB。
- 专业版：每用户每月 ￥128，含甘特视图、审计日志与单点登录（SSO）。

年付可享 8 折（虚构）。教育与公益团队可申请专业版免费授权。

## 三、常见问题

### 3.1 如何导出数据
在「设置 > 数据导出」里可一键导出全部文档与任务为 ZIP 包，格式为 Markdown 加 JSON。导出任务通常在 10 分钟内完成（虚构），完成后会发邮件通知下载链接。

### 3.2 是否支持私有化部署
当前版本 v4.2（虚构）仅提供云端 SaaS，暂不支持私有化部署；私有化方案预计在 v5.0（虚构）随企业版一同推出。
`;

/**
 * 把一个块的文本压成单行预览，避免换行打乱终端排版。
 * @param maxLen 预览最大字符数，超出截断并加省略号。
 */
function preview(text: string, maxLen = 64): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > maxLen ? `${oneLine.slice(0, maxLen)}…` : oneLine;
}

/** 打印一组块：块号、approxTokens、单行预览。返回块数，便于汇总对比。 */
function reportChunks(label: string, chunks: Chunk[]): number {
  divider(label);
  if (chunks.length === 0) {
    logger.info("（无切块结果）");
    return 0;
  }
  for (const chunk of chunks) {
    const tokens = approxTokens(chunk.text);
    const head = color(`#${chunk.index}`, "cyan");
    const tok = color(`${tokens} tok`, "gray");
    console.log(`  ${head} (${tok})  ${preview(chunk.text)}`);
  }
  logger.info(`共 ${chunks.length} 块`);
  return chunks.length;
}

async function main(): Promise<void> {
  logger.info(
    `语料：一段中文 Markdown 产品手册，约 ${approxTokens(PRODUCT_MANUAL)} tokens / ${PRODUCT_MANUAL.length} 字符（含虚构数据）`,
  );

  // 三条分支用「可比」的参数：尽量让每块目标大小接近，差异才主要来自「在哪下刀」。
  const SIZE = 120; // 滑窗按字符；递归/markdown 按 token —— 量级接近即可，重点看切法不同。

  const sliding = slidingWindowChunk(PRODUCT_MANUAL, { size: SIZE, overlap: 30 });
  const recursive = recursiveChunk(PRODUCT_MANUAL, { chunkSize: SIZE, overlap: 20 });
  const markdown = markdownChunk(PRODUCT_MANUAL, { chunkSize: SIZE, overlap: 20 });

  const slidingCount = reportChunks("分支 1 · slidingWindowChunk（字符滑窗 · 第09章基线）", sliding);
  const recursiveCount = reportChunks("分支 2 · recursiveChunk（递归语义切分）", recursive);
  const markdownCount = reportChunks("分支 3 · markdownChunk（Markdown 标题感知）", markdown);

  // ── 直观对比 1：滑窗会从中间截断句子 ───────────────────────────────────────────
  divider("差异 1 · 边界：滑窗常把句子从中间截断");
  // 滑窗的第 0 块结尾几乎一定是半句话（按字符硬切），而递归第 0 块通常落在句末/段落边界。
  const slideTail = sliding[0]?.text.slice(-24) ?? "";
  const recurTail = recursive[0]?.text.slice(-24) ?? "";
  console.log(`  滑窗 #0 结尾：…${color(slideTail, "yellow")}`);
  console.log(`  递归 #0 结尾：…${color(recurTail, "green")}`);
  logger.info("滑窗的结尾多半是半截句子；递归倾向停在「。！？」或段落处，块内语义更完整。");

  // ── 直观对比 2：markdownChunk 给块加「标题路径」前缀 ───────────────────────────
  divider("差异 2 · 出处：markdownChunk 为每块加标题路径前缀");
  const withHeading = markdown.find((c) => typeof c.metadata?.["heading"] === "string");
  if (withHeading) {
    const heading = String(withHeading.metadata?.["heading"]);
    console.log(`  示例块 #${withHeading.index} 的标题路径：${color(heading, "cyan")}`);
    console.log(`  块文本前缀：${color(preview(withHeading.text, 40), "gray")}`);
    logger.info("有了「【标题路径】」前缀，检索命中的片段天然自带出处，更易溯源、也更好召回。");
  } else {
    logger.info("（本次未提取到带 heading 的块，可调大 chunkSize 让更多正文进入有标题的节）");
  }

  // ── 汇总 ────────────────────────────────────────────────────────────────────
  divider("汇总 · 三种策略块数对比");
  console.log(`  字符滑窗 slidingWindowChunk：${color(String(slidingCount), "yellow")} 块`);
  console.log(`  递归语义 recursiveChunk    ：${color(String(recursiveCount), "green")} 块`);
  console.log(`  Markdown markdownChunk     ：${color(String(markdownCount), "cyan")} 块`);
  logger.success(
    "结论：切块决定检索质量上限。盲切字符省事但易割裂语义；递归贴边界；Markdown 还能带上结构出处。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
