/**
 * 第 12 章 · 上框架：LangGraph.js 与 Vercel AI SDK
 *
 * 运行：npx tsx lessons/12-intro-to-frameworks/index.ts
 *
 * 本章是全课程的「分水岭」：前 11 章我们坚持手写、坚持走 getLLM() 统一抽象，为的是学透原理；
 * 从生产视角看，状态管理、检查点持久化、中断恢复、流式、工具生态、可观测性这些「重活」，
 * 不该每个项目都重新发明。框架就是把这些重活标准化的成熟方案。
 *
 * 因此本章破例直接使用框架 SDK（不走 getLLM），给出两个最小可运行示例，并与第 06 章手写版对照：
 *  - 示例 A（ai-sdk.ts）：Vercel AI SDK —— 统一的 generateText / tool 抽象，maxSteps 自动跑工具循环。
 *  - 示例 B（langgraph.ts）：LangGraph.js —— 图式状态机编排，createReactAgent 内置工具循环图。
 *
 * 注意：框架 API 演进很快，本文件以本仓库锁定的版本为准（ai@4 / @ai-sdk/anthropic@1 /
 * @langchain/langgraph@0.2）。实际升级时请以官方文档为准。
 */
import { logger, divider } from "../../src/shared";
import { runAiSdkExample } from "./ai-sdk";
import { runLangGraphExample } from "./langgraph";

async function main(): Promise<void> {
  divider("第 12 章 · 上框架：两种主流方案对照演示");
  logger.info("两个示例都直接用框架 SDK，并自动读取环境变量 ANTHROPIC_API_KEY");

  // 示例 A：Vercel AI SDK —— 把 agent 看作「一次带工具的文本生成」
  await runAiSdkExample();

  // 示例 B：LangGraph.js —— 把 agent 看作「一张可编排的状态机图」
  await runLangGraphExample();

  divider("对照小结");
  logger.success("同一个「两步算术」任务，两个框架都只用十几行就跑通了完整工具循环。");
  logger.info("回看第 06 章：那段手写的 think→act→observe for 循环，正是框架替你做掉的部分。");
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
