/**
 * 第 16 章 · 可观测性与成本
 *
 * 运行：npx tsx lessons/16-observability-and-cost/index.ts
 *
 * 本章演示：把一个会展开成「多步」的 agent 任务跑起来，并在每一次 LLM 调用上打点，
 * 结束后输出一棵简化的 trace 树 + 汇总指标（调用次数 / 输入输出 tokens / 估算费用 / 各步耗时）。
 *
 * 核心思路：用 Tracer 透明包住 getLLM() 的客户端，再交给 runAgent。
 * runAgent 内部该怎么循环就怎么循环——它根本不知道自己被"监控"了。
 * 这正是可观测性该有的样子：业务逻辑零侵入，观测能力可插拔。
 */
import { z } from "zod";
import {
  getLLM,
  runAgent,
  ToolRegistry,
  defineTool,
  divider,
  logger,
  color,
} from "../../src/shared";
import { Tracer, type CallSpan } from "./tracer";
import { formatUSD, getPrice } from "./pricing";

/**
 * 准备两个工具，让模型不得不"多步"完成任务（这样 trace 才有多个 span 可看）。
 *
 * WHY 故意造多步：单次 chat 看不出可观测性的价值；只有当一次任务展开成
 * "调天气 → 调汇率 → 汇总" 这样的多步链路时，"哪一步慢/贵"才成为真问题。
 */
function buildRegistry(): ToolRegistry {
  const getWeather = defineTool({
    name: "get_weather",
    description: "查询某个城市当前的天气与气温（摄氏度）。",
    schema: z.object({ city: z.string().describe("城市名，如 北京") }),
    execute: ({ city }) => {
      // 教学用假数据：真实场景这里会发起一次外部 HTTP 调用（也值得被 trace）
      const table: Record<string, { weather: string; temperatureC: number }> = {
        北京: { weather: "晴", temperatureC: 24 },
        上海: { weather: "多云", temperatureC: 27 },
        广州: { weather: "雷阵雨", temperatureC: 31 },
      };
      const hit = table[city] ?? { weather: "未知", temperatureC: 20 };
      return JSON.stringify({ city, ...hit });
    },
  });

  const convertTemperature = defineTool({
    name: "celsius_to_fahrenheit",
    description: "把摄氏度转换为华氏度。",
    schema: z.object({ celsius: z.number().describe("摄氏温度") }),
    execute: ({ celsius }) => {
      const fahrenheit = (celsius * 9) / 5 + 32;
      return JSON.stringify({ celsius, fahrenheit });
    },
  });

  return new ToolRegistry([getWeather, convertTemperature]);
}

/** 打印一条 span（trace 树里的一个节点）。 */
function printSpan(span: CallSpan): void {
  const tag = span.stopReason === "tool_use" ? color("[调用工具]", "yellow") : color("[出最终答案]", "green");
  console.log(
    `  ${color(`#${span.index}`, "cyan")} ${tag} ` +
      `模型=${span.model} | ` +
      `tokens 入${span.inputTokens}/出${span.outputTokens} | ` +
      `耗时 ${span.durationMs.toFixed(0)}ms | ` +
      `费用 ${formatUSD(span.costUSD)}`,
  );
}

async function main(): Promise<void> {
  // 1) 拿到原始客户端，用 Tracer 包一层——对 runAgent 完全透明
  const baseClient = getLLM();
  const tracer = new Tracer(baseClient);
  const tracedClient = tracer.client();
  logger.info(`当前厂商：${baseClient.provider} | 模型：${baseClient.model}`);

  const price = getPrice(baseClient.model);
  logger.info(
    `计费单价（示意，以官方为准）：输入 $${price.inputPerMillion}/1M，输出 $${price.outputPerMillion}/1M`,
  );

  // 2) 跑一个需要多步工具的任务
  divider("运行多步 agent（每步都会被追踪）");
  const registry = buildRegistry();
  const run = await runAgent({
    client: tracedClient, // ← 关键：传入被追踪的客户端
    registry,
    system: "你是一个严谨的助理。需要数据时调用工具，拿到工具结果后再继续推理。",
    messages: [
      {
        role: "user",
        content: "北京现在多少度？请把气温换算成华氏度后告诉我，并简述天气。",
      },
    ],
    maxSteps: 6,
    // onStep 让我们在任务进行中就能看到工具执行情况（生产里这就是实时日志）
    onStep: (step) => {
      for (const tr of step.toolResults) {
        logger.debug(`step#${step.index} 工具 ${tr.name} → ${tr.output}`);
      }
    },
  });

  divider("最终答案");
  console.log(run.finalText);

  // 3) 汇总：打印 trace 树 + 总览指标
  const summary = tracer.summary();

  divider("Trace 树（每次 LLM 调用一个节点）");
  console.log(color("任务: 查北京天气并换算华氏度", "bold"));
  for (const span of summary.spans) printSpan(span);

  divider("汇总指标");
  // 平均每次调用耗时，帮助快速判断"是单次慢还是步数多导致的慢"
  const avgDuration = summary.callCount ? summary.totalDurationMs / summary.callCount : 0;
  logger.info(`LLM 调用次数：${summary.callCount}`);
  logger.info(`总输入 tokens：${summary.totalInputTokens}`);
  logger.info(`总输出 tokens：${summary.totalOutputTokens}`);
  logger.info(`总耗时：${summary.totalDurationMs.toFixed(0)}ms（平均 ${avgDuration.toFixed(0)}ms/次）`);
  logger.success(`本次任务估算费用：${formatUSD(summary.totalCostUSD)}（示意价格，以官方为准）`);

  // 4) 定位"最贵/最慢"的一步——这是可观测性最直接的价值
  if (summary.spans.length) {
    const slowest = summary.spans.reduce((a, b) => (b.durationMs > a.durationMs ? b : a));
    const priciest = summary.spans.reduce((a, b) => (b.costUSD > a.costUSD ? b : a));
    divider("瓶颈定位");
    logger.warn(`最慢的一步：#${slowest.index}，耗时 ${slowest.durationMs.toFixed(0)}ms`);
    logger.warn(`最贵的一步：#${priciest.index}，费用 ${formatUSD(priciest.costUSD)}`);
  }
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
