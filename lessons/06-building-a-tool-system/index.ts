/**
 * 第 06 章 · 从零构建工具系统
 *
 * 运行：npx tsx lessons/06-building-a-tool-system/index.ts
 *
 * 本章分两部分：
 *  【第一部分】用我们亲手重建的 MiniToolRegistry（见 ./mini-tool-system.ts）跑通
 *             「定义工具 → 生成 schema → 校验参数 → 安全执行」的全链路，不连真模型，
 *             直接看清内部机制（含「非法参数 / 未知工具」的优雅降级）。
 *  【第二部分】切换到 shared 的成品 { defineTool, ToolRegistry } + { runAgent }，
 *             注册 3 个真工具（计算器 / 当前时间 / 单位换算），交给真模型跑一个多工具 agent。
 *
 * WHY 这样安排：先「徒手造一遍」建立直觉，再「用成品」体会工程化封装的价值——
 * 你会发现成品和你手写的几乎一模一样，只是更完备。
 */
import { z } from "zod";
import { getLLM } from "../../src/shared/llm";
import { defineTool, ToolRegistry } from "../../src/shared";
import { runAgent } from "../../src/shared";
import { divider, logger, printMessage } from "../../src/shared";
import { defineMiniTool, MiniToolRegistry } from "./mini-tool-system";

// ──────────────────────────────────────────────────────────────────────────
// 第一部分：用亲手重建的 MiniToolRegistry，离线看清内部机制（不调用模型）
// ──────────────────────────────────────────────────────────────────────────
async function partOneHandBuilt(): Promise<void> {
  divider("第一部分 · 亲手重建的简化版工具系统");

  // 用一个 zod schema 同时承担「参数校验」和「描述生成」两件事——单一事实来源。
  const addSchema = z.object({
    a: z.number().describe("第一个加数"),
    b: z.number().describe("第二个加数"),
  });

  const registry = new MiniToolRegistry([
    // 用 defineMiniTool 包一层：execute 的 input 会被精确推断为 { a: number; b: number }，
    // 而注册表里存的是类型擦除后的统一 MiniTool（详见 ./mini-tool-system.ts 的 WHY 注释）。
    defineMiniTool({
      name: "add",
      description: "把两个数字相加",
      schema: addSchema,
      // input 已被 zod 校验并推断为 { a: number; b: number }，这里无需再判空
      execute: (input) => `${input.a} + ${input.b} = ${input.a + input.b}`,
    }),
  ]);

  // 1) zod schema 自动生成的「给模型看的描述」长什么样
  logger.info("自动生成的工具 specs（这就是会发给模型的内容）：");
  console.log(JSON.stringify(registry.specs(), null, 2));

  // 2) 正常路径：参数合法 → 正常执行
  divider("场景 A · 合法参数");
  printMessage("tool", await registry.run({ name: "add", arguments: { a: 3, b: 4 } }));

  // 3) 降级路径一：参数非法（b 传了字符串）→ 返回可读的错误字符串，程序不崩
  divider("场景 B · 非法参数（b 不是数字）");
  printMessage("tool", await registry.run({ name: "add", arguments: { a: 3, b: "四" } }));

  // 4) 降级路径二：未知工具名 → 同样返回错误字符串，提示模型换个工具
  divider("场景 C · 未知工具");
  printMessage("tool", await registry.run({ name: "multiply", arguments: { a: 3, b: 4 } }));

  logger.success("第一部分完成：错误没有让程序崩溃，而是变成了「可回传给模型」的字符串。");
}

// ──────────────────────────────────────────────────────────────────────────
// 第二部分：用 shared 成品工具系统 + runAgent，跑一个真·多工具 agent
// ──────────────────────────────────────────────────────────────────────────

/** 工具一：计算器。演示「execute 主动抛错」如何被注册表兜成字符串。 */
const calculatorTool = defineTool({
  name: "calculator",
  description: "做一次四则运算。除以零会报错（这正是用来演示安全执行的）。",
  schema: z.object({
    a: z.number().describe("左操作数"),
    op: z.enum(["+", "-", "*", "/"]).describe("运算符"),
    b: z.number().describe("右操作数"),
  }),
  execute: ({ a, op, b }) => {
    switch (op) {
      case "+":
        return String(a + b);
      case "-":
        return String(a - b);
      case "*":
        return String(a * b);
      case "/":
        // WHY 这里主动抛：让 ToolRegistry.run 演示「execute 异常 → 字符串结果」的兜底，
        // 模型读到错误后通常会改问法或换数字，而不是让整个进程退出。
        if (b === 0) throw new Error("除数不能为 0");
        return String(a / b);
    }
  },
});

/** 工具二：当前时间。无参数工具用空对象 schema。 */
const currentTimeTool = defineTool({
  name: "current_time",
  description: "返回服务器当前时间（ISO 8601 字符串），不需要任何参数。",
  schema: z.object({}),
  // 模型只知道「现在不知道时间」，必须靠工具拿到真实世界状态——这正是工具存在的意义
  execute: () => new Date().toISOString(),
});

/** 工具三：单位换算（长度）。演示带枚举与必填校验的稍复杂 schema。 */
const convertLengthTool = defineTool({
  name: "convert_length",
  description: "长度单位换算，支持 m（米）/ km（千米）/ cm（厘米）/ mile（英里）之间互转。",
  schema: z.object({
    value: z.number().describe("待换算的数值"),
    from: z.enum(["m", "km", "cm", "mile"]).describe("源单位"),
    to: z.enum(["m", "km", "cm", "mile"]).describe("目标单位"),
  }),
  execute: ({ value, from, to }) => {
    // 统一先折算成「米」这个基准单位，再折算到目标单位——避免写 N×N 张换算表
    const toMeter: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mile: 1609.344 };
    // schema 已用 enum 约束 from/to 必在表内，下标访问理论上不会 undefined；
    // 但开启了 noUncheckedIndexedAccess，下标结果是 number | undefined，用 ! 收窄。
    const meters = value * toMeter[from]!;
    const result = meters / toMeter[to]!;
    return `${value} ${from} = ${result} ${to}`;
  },
});

async function partTwoRealAgent(): Promise<void> {
  divider("第二部分 · 用 shared 成品 + runAgent 跑真·多工具 agent");

  const client = getLLM();
  logger.info(`当前厂商：${client.provider} | 模型：${client.model}`);

  // 注册表统一管理 3 个工具——新增/删除工具只改这一行，agent 循环零改动
  const registry = new ToolRegistry([calculatorTool, currentTimeTool, convertLengthTool]);
  logger.info(`已注册工具：${registry.list().map((t) => t.name).join(", ")}`);

  // 一个需要「多次、不同」工具协作的问题：算术 + 单位换算 +（可选）问时间
  const question =
    "帮我做两件事：1) 计算 (12 + 8) 乘以 3 等于多少；2) 把 5 千米换算成英里。请分别给出结果。";
  printMessage("user", question);

  const run = await runAgent({
    client,
    registry,
    system: "你是一个严谨的助手。涉及计算或单位换算时，必须调用工具得到结果，不要心算。",
    messages: [{ role: "user", content: question }],
    // onStep 让我们实时看到「模型这一步调了哪些工具、各自返回了什么」
    onStep: (step) => {
      for (const tr of step.toolResults) {
        printMessage("tool", `[${tr.name}] → ${tr.output}`);
      }
    },
  });

  divider("最终回复");
  printMessage("assistant", run.finalText);
  logger.info(
    `共 ${run.steps.length} 步｜用量：输入 ${run.usage.inputTokens} / 输出 ${run.usage.outputTokens} token`,
  );

  // 额外演示：直接对成品 registry 触发降级路径，证明「错误→字符串」一脉相承
  divider("成品 registry 的优雅降级（与第一部分同理）");
  printMessage("tool", await registry.run({ name: "calculator", arguments: { a: 1, op: "/", b: 0 } }));
  printMessage("tool", await registry.run({ name: "calculator", arguments: { a: 1, op: "%", b: 2 } }));
  printMessage("tool", await registry.run({ name: "no_such_tool", arguments: {} }));
}

async function main(): Promise<void> {
  // 第一部分纯离线，任何环境都能跑，先建立直觉
  await partOneHandBuilt();
  // 第二部分需要 .env 里的 LLM key（调用真模型）
  await partTwoRealAgent();
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
