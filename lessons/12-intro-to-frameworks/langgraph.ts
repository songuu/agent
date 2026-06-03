/**
 * 第 12 章 · 示例 B：用 LangGraph.js 重建工具 Agent
 *
 * 运行：npx tsx lessons/12-intro-to-frameworks/langgraph.ts
 *
 * WHY 选 LangGraph 而非 AI SDK：
 *  - Vercel AI SDK 把 agent 看作「一次带工具的文本生成」，胜在轻、流式好、贴近 Web 前端。
 *  - LangGraph.js 把 agent 看作「一张状态机图」（节点 = 步骤，边 = 转移），胜在可持久化
 *    （checkpoint）、可中断恢复（human-in-the-loop）、可做复杂多 agent 编排。
 *  本例用官方预制的 createReactAgent，它在内部已经搭好了「模型节点 ←→ 工具节点」的循环图，
 *  对应第 06 章你手写的 think→act→observe 循环——只是这里它是一张真正的有向图。
 */
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { logger, divider } from "../../src/shared";

export async function runLangGraphExample(): Promise<void> {
  divider("LangGraph.js：createReactAgent（图式状态机，内置工具循环）");

  // ChatAnthropic 同样自动读取 ANTHROPIC_API_KEY；模型名与本课统一默认对齐
  const model = new ChatAnthropic({ model: "claude-opus-4-8" });

  // LangChain 的 tool() 把「执行函数 + 元信息」打包。注意：第一参数是 execute，
  // 第二参数里参数 schema 字段叫 schema（又一处与 AI SDK 的 parameters 命名差异）。
  const addTool = tool(async ({ a, b }) => String(a + b), {
    name: "add",
    description: "把两个数字相加，返回它们的和",
    schema: z.object({ a: z.number(), b: z.number() }),
  });
  const multiplyTool = tool(async ({ a, b }) => String(a * b), {
    name: "multiply",
    description: "把两个数字相乘，返回它们的积",
    schema: z.object({ a: z.number(), b: z.number() }),
  });

  // createReactAgent 返回一张「已编译的状态图」。我们没有写任何 for 循环——
  // 「模型节点判断要不要调工具 → 工具节点执行 → 结果回流到模型节点」这条循环边，框架已替我们连好。
  const agent = createReactAgent({ llm: model, tools: [addTool, multiplyTool] });

  // invoke 的入参是图的初始状态：一条消息列表。返回的也是图的终态，messages 里含完整对话轨迹。
  const out = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "先用 add 工具算 23 + 19，再把结果用 multiply 工具乘以 2，最后用一句话报告答案。",
      },
    ],
  });

  // out.messages 是整条状态轨迹：user → assistant(调工具) → tool(结果) → ... → assistant(终答)
  const messages = out.messages;
  logger.info(`图终态共 ${messages.length} 条消息（含工具调用与结果的完整轨迹）`);

  // 最后一条消息就是 agent 的最终回答。BaseMessage 有 .text 取纯文本（content 可能是结构化数组）
  const last = messages[messages.length - 1];
  console.log(`\n最终回答：${last?.text ?? ""}`);
}

// 允许单独运行本文件；若被 index.ts 引入则不会触发
import { fileURLToPath } from "node:url";
import { argv } from "node:process";

const isDirectRun = fileURLToPath(import.meta.url) === argv[1];
if (isDirectRun) {
  runLangGraphExample().catch((err) => {
    logger.error(`运行失败：${(err as Error).message}`);
    process.exitCode = 1;
  });
}
