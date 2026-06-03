/**
 * 第 12 章 · 示例 A：用 Vercel AI SDK 重建工具 Agent
 *
 * 运行：npx tsx lessons/12-intro-to-frameworks/ai-sdk.ts
 *
 * WHY 用框架而不是 getLLM()：
 *  本章是全课程唯一允许直接使用厂商/框架 SDK 的章节之一。目的不是抛弃前面的手写抽象，
 *  而是让你亲眼看到——第 06 章里你手写的「工具循环」（模型要调工具 → 你执行 → 把结果塞回去 →
 *  再问模型」），在 Vercel AI SDK 里被一个 `maxSteps` 参数替你做完了。
 *
 * 关键认知：
 *  - `generateText` 一次调用就能跑完「多轮工具调用」的完整循环，无需你手写 for 循环。
 *  - `tool({ parameters, execute })` 用 zod 定义参数 + 执行函数，等价于第 06 章的 defineTool。
 *  - anthropic("model") 会自动读取环境变量 ANTHROPIC_API_KEY（无需手动传 key）。
 */
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { logger, divider } from "../../src/shared";

export async function runAiSdkExample(): Promise<void> {
  divider("Vercel AI SDK：generateText + tool（maxSteps 自动跑完工具循环）");

  // 用框架的 tool() 定义两个工具。注意参数字段叫 parameters（AI SDK v4 的命名），
  // 而我们手写版的 defineTool 里叫 schema——这是不同抽象的细微差异，README 有对照表。
  const result = await generateText({
    // anthropic() 自动读 ANTHROPIC_API_KEY；模型名与本仓库 getLLM 默认保持一致
    model: anthropic("claude-opus-4-8"),
    // 没有手动维护 messages 历史——框架在内部替我们累积「助手调用 → 工具结果 → 再调用」的多轮上下文
    prompt: "先用 add 工具算 23 + 19，再把结果用 multiply 工具乘以 2，最后用一句话报告答案。",
    tools: {
      add: tool({
        description: "把两个数字相加，返回它们的和",
        parameters: z.object({
          a: z.number().describe("第一个加数"),
          b: z.number().describe("第二个加数"),
        }),
        // execute 的入参类型由 zod schema 自动推断，无需手写类型注解
        execute: async ({ a, b }) => String(a + b),
      }),
      multiply: tool({
        description: "把两个数字相乘，返回它们的积",
        parameters: z.object({
          a: z.number().describe("被乘数"),
          b: z.number().describe("乘数"),
        }),
        execute: async ({ a, b }) => String(a * b),
      }),
    },
    // maxSteps = 框架自动跑工具循环的最大步数。这一个参数，替代了第 06 章整段手写 for 循环。
    maxSteps: 5,
  });

  // result.steps 里记录了每一步（每次 LLM 调用 + 触发的工具调用），是天然的可观测性
  logger.info(`框架自动跑了 ${result.steps.length} 步（每步 = 一次模型调用）`);
  for (const [i, step] of result.steps.entries()) {
    // 每一步可能触发 0..N 次工具调用，打印出来看清楚框架替我们做了什么
    const calls = step.toolCalls.map((c) => `${c.toolName}(${JSON.stringify(c.args)})`).join(", ");
    if (calls) logger.debug(`  step ${i + 1} 工具调用：${calls}`);
  }

  console.log(`\n最终回答：${result.text}`);
  // AI SDK v4 的用量字段叫 promptTokens / completionTokens（不同于本课统一抽象的 inputTokens/outputTokens）
  logger.info(
    `用量：输入 ${result.usage.promptTokens} / 输出 ${result.usage.completionTokens} token，停止原因：${result.finishReason}`,
  );
}

// 允许单独运行本文件；若被 index.ts 引入则不会触发
import { fileURLToPath } from "node:url";
import { argv } from "node:process";

const isDirectRun = fileURLToPath(import.meta.url) === argv[1];
if (isDirectRun) {
  runAiSdkExample().catch((err) => {
    logger.error(`运行失败：${(err as Error).message}`);
    process.exitCode = 1;
  });
}
