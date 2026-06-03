/**
 * 第 14 章 · 流式输出与交互体验
 *
 * 运行：npx tsx lessons/14-streaming-and-ux/index.ts
 *
 * 本章演示三件事，全部围绕"让等待变得可忍受":
 *  1. 打字机式流式文本（typewriter）——逐字蹦出，降低首字延迟焦虑。
 *  2. 在 agent 流程里用 runAgent 的 onStep 回调，实时播报"第几步 / 正在调哪个工具 / 结果是啥"。
 *  3. 用 AbortController 取消一个"太长"的流，并优雅处理取消（而不是让程序卡死或报错崩溃）。
 *
 * WHY: 流式不会让总耗时变短，但它把"沉默的等待"变成"看得见的进展"——这是 Agent 产品体验的分水岭。
 */
import { defineTool, getLLM, logger, runAgent, ToolRegistry, divider } from "../../src/shared";
import { z } from "zod";
import { consumeWithAbort, typewriter } from "./stream-utils";

/**
 * 演示 1：打字机式流式输出。
 * 复用 stream-utils 里的 typewriter，把模型逐块返回的文本以稳定节奏逐字呈现。
 */
async function demoTypewriter(): Promise<void> {
  divider("演示 1 · 打字机式流式文本");
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  const stream = llm.stream({
    system: "你是一位简洁的科普作者。",
    messages: [{ role: "user", content: "用三句话解释什么是流式输出（streaming）。" }],
  });
  // typewriter 内部逐字打印并返回完整文本，便于后续记录/复用
  const full = await typewriter(stream, 12);
  logger.success(`流式完成，共 ${full.length} 个字符。`);
}

/**
 * 演示 2：agent 流程中的实时进度。
 *
 * 关键不在"流式文本"，而在"流式进度"——用户最焦虑的是 agent 在多步工具调用里"卡住不说话"。
 * runAgent 的 onStep 回调让我们在每一步落地时立刻播报：第几步、调用了哪些工具、各自返回了什么。
 */
async function demoAgentProgress(): Promise<void> {
  divider("演示 2 · agent 多步进度实时播报");
  const llm = getLLM();

  // 两个玩具工具：足够让模型分两步调用，从而看到逐步进展
  const getCity = defineTool({
    name: "get_user_city",
    description: "返回当前用户所在城市。无需参数。",
    schema: z.object({}),
    execute: () => "杭州",
  });
  const getWeather = defineTool({
    name: "get_weather",
    description: "查询指定城市的天气。",
    schema: z.object({ city: z.string().describe("城市名，如 杭州") }),
    execute: (input) => `${input.city}：晴，26°C，东南风 2 级`,
  });
  const registry = new ToolRegistry([getCity, getWeather]);

  const result = await runAgent({
    client: llm,
    registry,
    system: "你是出行助手。需要城市时先查城市，再查天气，最后用一句话给出穿衣建议。",
    messages: [{ role: "user", content: "我今天出门要不要带外套？" }],
    onStep: (step) => {
      // onStep 在"每一步的工具结果都拿到后"触发，这正是给用户进度感的最佳时机
      const calls = step.result.toolCalls;
      if (calls.length === 0) {
        logger.info(`步骤 ${step.index + 1}：模型直接作答（无工具调用）`);
        return;
      }
      // toolCalls 与 toolResults 顺序一一对应（runAgent 内部按序执行并回填）
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i]!; // noUncheckedIndexedAccess：下标结果是 T|undefined，用 ! 收窄
        const observed = step.toolResults[i]?.output ?? "(无结果)";
        const args = JSON.stringify(call.arguments);
        logger.info(`步骤 ${step.index + 1}：调用工具 ${call.name}(${args}) → ${observed}`);
      }
    },
  });

  divider("最终回复");
  console.log(result.finalText);
  logger.success(
    `共 ${result.steps.length} 步；用量：输入 ${result.usage.inputTokens} / 输出 ${result.usage.outputTokens} token。`,
  );
}

/**
 * 演示 3：用 AbortController 取消一个长流，并优雅善后。
 *
 * 场景：用户点了"停止生成"，或我们设置了一个超时阈值。我们启动一个"会写很久"的流，
 * 但用 setTimeout 在 N 毫秒后调用 controller.abort()。consumeWithAbort 会在下一个检查点
 * 发现 signal.aborted 并停止继续消费，返回 { aborted: true } 以及已经收到的片段。
 *
 * WHY 用"消费侧取消"而非给 SDK 传 signal：
 *  课程的统一 stream() 接口没有暴露 AbortSignal 参数（见 src/shared/llm/types.ts）。
 *  对应用层来说，停止向生成器要数据，就等价于"我不再需要后续输出了"，这是最通用、最跨厂商的取消方式。
 */
async function demoAbort(): Promise<void> {
  divider("演示 3 · AbortController 取消长流");
  const llm = getLLM();

  const controller = new AbortController();
  const TIMEOUT_MS = 1500;
  // 设一个"截止线"：到点就中止。clearTimeout 在正常读完时清掉，避免悬挂定时器。
  const timer = setTimeout(() => {
    logger.warn(`已超过 ${TIMEOUT_MS}ms，触发 abort()。`);
    controller.abort();
  }, TIMEOUT_MS);

  // 故意要一段"会写很久"的内容，好让超时大概率先于完成发生
  const stream = llm.stream({
    system: "你是一位话痨作家，喜欢用很长的篇幅展开。",
    messages: [
      { role: "user", content: "请写一篇 600 字以上的散文，主题是 TypeScript 的类型系统之美。" },
    ],
  });

  process.stdout.write("[AI] ");
  try {
    const { text, aborted } = await consumeWithAbort(stream, controller.signal, (delta) => {
      // 边到边打印，给用户"它在动"的实时反馈
      process.stdout.write(delta);
    });
    process.stdout.write("\n");

    if (aborted) {
      // 优雅处理取消：这不是错误，是用户/超时主动叫停。给一条明确反馈，而不是静默或抛异常。
      logger.warn(`生成已取消（已输出 ${text.length} 个字符）。`);
    } else {
      logger.success(`生成完成（共 ${text.length} 个字符）。`);
    }
  } finally {
    // 无论中止还是读完，都要清理定时器——典型的"资源善后"良好习惯
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  await demoTypewriter();
  await demoAgentProgress();
  await demoAbort();
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
