/**
 * 第 02 章 · 你的第一次 LLM 调用
 *
 * 运行：npx tsx lessons/02-first-llm-call/index.ts
 *
 * 本章演示三件事：
 *  1. 用 provider 无关的 getLLM() 发起一次对话（chat）
 *  2. 流式输出（stream），逐字打印
 *  3. 读取 token 用量，建立成本意识
 */
import { getLLM } from "../../src/shared/llm";
import { divider, logger } from "../../src/shared";

async function main(): Promise<void> {
  // 客户端的具体厂商由 .env 的 LLM_PROVIDER 决定（anthropic | openai）
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  // ---- 1) 一次性对话 ----
  divider("chat()：一次性返回完整结果");
  const result = await llm.chat({
    system: "你是一位简洁、友好的编程导师，回答控制在一句话内。",
    messages: [{ role: "user", content: "用一句话解释什么是 AI Agent。" }],
  });
  console.log(result.text);
  logger.info(
    `用量：输入 ${result.usage.inputTokens} / 输出 ${result.usage.outputTokens} token，停止原因：${result.stopReason}`,
  );

  // ---- 2) 流式对话 ----
  divider("stream()：逐字流式输出");
  process.stdout.write("（流式）");
  const stream = llm.stream({
    messages: [{ role: "user", content: "写一首关于 TypeScript 的两行小诗。" }],
  });
  for await (const chunk of stream) {
    if (chunk.type === "text" && chunk.text) process.stdout.write(chunk.text);
    if (chunk.type === "done" && chunk.result) {
      logger.info(
        `\n用量：输入 ${chunk.result.usage.inputTokens} / 输出 ${chunk.result.usage.outputTokens} token`,
      );
    }
  }
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
