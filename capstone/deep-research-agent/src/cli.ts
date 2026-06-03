/**
 * 毕业项目 · 命令行入口
 *
 * 运行：
 *   npx tsx capstone/deep-research-agent/src/cli.ts "你的研究问题"
 *   # 不带参数则进入交互式提问
 *
 * 职责：读取研究问题 → 调 research() → 实时展示进度（规划/检索/撰写）→ 流式打印报告 → 末尾打印成本统计。
 * 这里集中体现「流式输出（CLI 实时展示）」与「可观测（成本统计）」两项能力。
 */
import { getLLM } from "../../../src/shared/llm";
import { divider, prompt } from "../../../src/shared/util/ui";
import { color, logger } from "../../../src/shared/util/logger";
import { research, renderReportMarkdown, formatUSD } from "./agent";
import type { ResearchResult } from "./agent";

/** 取研究问题：优先命令行参数，否则交互式输入。 */
async function resolveQuestion(): Promise<string> {
  const fromArgv = process.argv.slice(2).join(" ").trim();
  if (fromArgv) return fromArgv;
  return prompt("请输入你的研究问题：");
}

/**
 * 流式打印报告。
 *
 * WHY 真用 stream(): 这是课程「流式输出」一章的落地——让最终结论像聊天产品一样逐字蹦出，
 * 首字延迟低、体感好。我们让模型基于已成文的结构化报告，流式口播一段「执行摘要」，
 * 既演示了 stream()，又不重复跑整套检索。完整报告随后以 Markdown 一次性给出。
 */
async function streamExecutiveSummary(result: ResearchResult): Promise<void> {
  const llm = getLLM();
  const reportMarkdown = renderReportMarkdown(result);
  divider("流式 · 执行摘要");
  process.stdout.write(color("[AI] ", "green"));
  const stream = llm.stream({
    system: "你是研究简报播报员。用 4~6 句话口语化地概述这份报告的核心结论，不要标题、不要列表。",
    messages: [{ role: "user", content: `这是研究报告，请口播执行摘要：\n\n${reportMarkdown}` }],
    temperature: 0.3,
  });
  for await (const chunk of stream) {
    if (chunk.type === "text" && chunk.text) process.stdout.write(chunk.text);
  }
  process.stdout.write("\n");
}

/** 打印成本与可观测统计。 */
function printCost(result: ResearchResult): void {
  const { cost } = result;
  divider("可观测 · 成本与调用统计");
  logger.info(`模型：${cost.model}`);
  logger.info(`LLM 调用次数：${cost.llmCalls}`);
  logger.info(
    `Tokens：输入 ${cost.totalInputTokens} / 输出 ${cost.totalOutputTokens}（合计 ${
      cost.totalInputTokens + cost.totalOutputTokens
    }）`,
  );
  const toolSummary = Object.entries(cost.toolCalls)
    .map(([name, n]) => `${name}×${n}`)
    .join("、");
  logger.info(`工具调用：${toolSummary || "（无）"}`);
  logger.info(`总耗时：${(cost.totalDurationMs / 1000).toFixed(2)} s`);
  logger.success(`估算成本：${formatUSD(cost.totalCostUSD)}（示意价格，仅供参考）`);
}

async function main(): Promise<void> {
  const question = await resolveQuestion();
  if (!question) {
    logger.warn("没有收到研究问题，已退出。");
    return;
  }

  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);
  divider("Deep Research Agent · 开始研究");
  logger.info(`研究问题：${question}`);

  // 实时进度：把规划/检索/撰写各阶段、以及 Agent 每一步的工具调用打印出来
  const result = await research(question, {
    onPhase: (phase, detail) => {
      const label =
        phase === "planning" ? "① 规划" : phase === "researching" ? "② 检索推理" : "③ 撰写报告";
      logger.info(`${label} — ${detail}`);
    },
    onStep: (step) => {
      if (step.toolResults.length === 0) return; // 最后一步通常无工具调用
      const used = step.toolResults.map((t) => t.name).join("、");
      logger.debug(`  第 ${step.index + 1} 步调用工具：${used}`);
      // 即便没开 DEBUG，也给出一行轻量进度，让用户知道「在动」
      process.stdout.write(color(`  · 第 ${step.index + 1} 步：${used}\n`, "gray"));
    },
  });

  // 计划
  divider("研究计划");
  logger.info(`思路：${result.plan.strategy}`);
  result.plan.subQuestions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));

  // 流式执行摘要（真实 stream() 调用）
  await streamExecutiveSummary(result);

  // 完整结构化报告（Markdown）
  divider("完整报告");
  console.log(renderReportMarkdown(result));

  // 成本统计
  printCost(result);
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
