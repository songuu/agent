/**
 * 第 10 章 · 推理范式：ReAct / Plan-and-Execute / Reflection
 *
 * 运行：npx tsx lessons/10-reasoning-patterns/index.ts
 *
 * 本章用「同一个任务，三种推理范式」做横向对比：
 *  1. ReAct（边想边做）        ：交给 runAgent，让模型自己决定何时调用工具、何时收尾。
 *  2. Plan-and-Execute（先规划再执行）：先用 zod 约束模型产出 JSON 步骤计划，再逐步执行。
 *  3. Reflection（自我反思修正）：先生成初稿 → 让模型扮演批评者挑刺 → 据批评改写。
 *
 * WHY 把三者放在一起跑：推理范式没有银弹。它们在「步数 / 成本 / 可靠性」上各有取舍，
 * 只有把同一个任务用三种方式跑一遍、再看各自的 LLM 调用次数与产出，才能建立直觉：
 *   - 探索型、依赖外部信息的任务 → ReAct
 *   - 步骤明确、可提前拆解的复杂任务 → Plan-and-Execute
 *   - 对「质量」要求高于「速度」的产出（文案/代码/方案）→ Reflection
 */
import { z } from "zod";
import { getLLM } from "../../src/shared/llm";
import { defineTool, ToolRegistry, runAgent, divider, logger, color } from "../../src/shared";
import type { LLMClient } from "../../src/shared/llm/types";

// ───────────────────────────────────────────────────────────────────────────
// 统一的对比任务
//
// WHY 选这个任务：它既需要「外部数据」（菜价、人数），又需要「多步计算」（小计 → 折扣 →
// 人均），还隐藏了一个容易算错的折扣规则。这样三种范式的差异才看得出来：
//   - ReAct 会反复调用工具去查、去算；
//   - Plan-and-Execute 会先把步骤列清楚再执行；
//   - Reflection 适合打磨「最终给用户的那段话」是否严谨、好懂。
// ───────────────────────────────────────────────────────────────────────────
const TASK =
  "我们 4 个人去吃饭，点了 2 份『水煮鱼』和 3 杯『柠檬茶』。" +
  "餐厅规则：消费满 100 元打 9 折（折扣只对菜品总价生效）。" +
  "请算出折后总价和人均，并用一句话告诉我每人该付多少。";

/** 一个极简的菜单「数据库」，模拟需要从外部查询的价格。 */
const MENU: Record<string, number> = {
  水煮鱼: 58,
  柠檬茶: 12,
  番茄炒蛋: 22,
};

// ───────────────────────────────────────────────────────────────────────────
// 工具：给 ReAct 用。注意 schema 同时承担「给模型的参数说明」和「运行期校验」两件事。
// ───────────────────────────────────────────────────────────────────────────

/** 查菜价：模拟一次外部数据查询。 */
const lookupPrice = defineTool({
  name: "lookup_price",
  description: "按菜名查询单价（单位：元）。菜名必须与菜单完全一致。",
  schema: z.object({
    dish: z.string().describe("菜品名称，例如『水煮鱼』"),
  }),
  execute: ({ dish }) => {
    const price = MENU[dish];
    if (price === undefined) {
      // WHY 返回错误字符串而非抛异常：让模型「看到」错误并自我纠正（换个菜名/确认拼写）。
      return `未找到菜品「${dish}」。可选菜品：${Object.keys(MENU).join("、")}`;
    }
    return `${dish} 单价为 ${price} 元`;
  },
});

/** 计算器：把算术外包给确定性代码，避免模型「心算」出错。 */
const calculator = defineTool({
  name: "calculate",
  description:
    "计算一个算术表达式并返回数值结果。仅支持 + - * / ( ) 和数字，例如『(58*2 + 12*3) * 0.9』。",
  schema: z.object({
    expression: z.string().describe("要计算的算术表达式"),
  }),
  execute: ({ expression }) => {
    // WHY 做白名单校验：绝不把任意字符串丢给 eval。只允许数字与基本运算符，防注入。
    if (!/^[\d+\-*/().\s]+$/.test(expression)) {
      return `表达式含非法字符，仅允许数字与 + - * / ( )：${expression}`;
    }
    try {
      // 受限字符集下用 Function 求值；上一行白名单已保证安全。
      const value = Function(`"use strict"; return (${expression});`)() as number;
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return `表达式无法求出有限数值：${expression}`;
      }
      return `${expression} = ${value}`;
    } catch (err) {
      return `表达式求值失败：${(err as Error).message}`;
    }
  },
});

// ───────────────────────────────────────────────────────────────────────────
// 范式一：ReAct（Reasoning + Acting，边想边做）
//
// 我们不手写循环——shared 的 runAgent 已经实现了「思考 → 调用工具 → 观察结果 → 再思考」
// 的标准 ReAct 循环（第 04 章手写过原理）。这里只负责：给工具、给任务、统计调用次数。
// ───────────────────────────────────────────────────────────────────────────
interface PatternResult {
  /** 范式名称。 */
  name: string;
  /** 最终给用户的答案。 */
  answer: string;
  /** 本范式总共发起了多少次 LLM 调用（成本的核心指标）。 */
  llmCalls: number;
  /** 累计 token 用量。 */
  usage: { inputTokens: number; outputTokens: number };
}

async function runReAct(client: LLMClient): Promise<PatternResult> {
  divider("范式一：ReAct（边想边做）");

  const registry = new ToolRegistry([lookupPrice, calculator]);
  let llmCalls = 0;

  const result = await runAgent({
    client,
    registry,
    system:
      "你是严谨的助手。遇到需要查价或计算的环节，必须调用工具，不要心算。" +
      "得到全部数据后，给出折后总价、人均，并用一句话回答用户。",
    messages: [{ role: "user", content: TASK }],
    maxSteps: 8,
    // WHY 在 onStep 里计数：runAgent 每「步」对应一次 LLM 调用，这正是 ReAct 的成本来源。
    onStep: (step) => {
      llmCalls += 1;
      const used = step.toolResults.map((t) => t.name).join(", ") || "（仅思考/收尾）";
      logger.info(`第 ${step.index + 1} 步｜工具：${used}`);
      for (const tr of step.toolResults) {
        console.log(color(`    └ ${tr.name} → ${tr.output}`, "gray"));
      }
    },
  });

  console.log(color("最终答案：", "green") + result.finalText);
  return {
    name: "ReAct",
    answer: result.finalText,
    llmCalls,
    usage: result.usage,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 范式二：Plan-and-Execute（先规划再执行）
//
// 思路：第一次 LLM 调用只做「规划」——产出一个结构化的步骤数组（用 zod 兜底校验）。
// 之后逐步「执行」每一步。这里为了聚焦范式本身，执行阶段也交给 LLM（带上累积的上下文），
// 真实工程里每一步可以路由到不同工具/子 agent。
//
// WHY 先规划：复杂任务里，让模型「先把全局想清楚」能显著减少中途跑偏；而且计划本身可被
// 人工检查、缓存、复用——这是 ReAct「走一步看一步」给不了的可控性。
// ───────────────────────────────────────────────────────────────────────────

/** 计划的结构契约：一个有序步骤数组。zod 既约束模型输出，又在运行期兜底。 */
const planSchema = z.object({
  steps: z
    .array(
      z.object({
        id: z.number().int().describe("步骤序号，从 1 开始"),
        action: z.string().describe("这一步要做的事（一句话，动词开头）"),
      }),
    )
    .min(1)
    .describe("完成任务所需的有序步骤"),
});
type Plan = z.infer<typeof planSchema>;

/**
 * 从模型回复里抽出 JSON 对象。
 * WHY: 模型常把 JSON 包在 ```json``` 代码块或前后多余文字里，直接 JSON.parse 会失败。
 * 这里做最稳妥的「截取第一个 { 到最后一个 }」兜底。
 */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`回复中未找到 JSON 对象：${text.slice(0, 120)}…`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function runPlanExecute(client: LLMClient): Promise<PatternResult> {
  divider("范式二：Plan-and-Execute（先规划再执行）");

  let llmCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  // ---- 阶段 A：规划（一次 LLM 调用，强制 JSON 输出）----
  const planResp = await client.chat({
    system:
      "你是任务规划器。只输出一个 JSON 对象，形如 " +
      '{"steps":[{"id":1,"action":"..."}]}，不要任何额外文字或代码块标记。' +
      "把任务拆成尽量少而清晰的可执行步骤。",
    messages: [{ role: "user", content: `任务：${TASK}\n\n请给出步骤计划。` }],
    temperature: 0,
  });
  llmCalls += 1;
  inputTokens += planResp.usage.inputTokens;
  outputTokens += planResp.usage.outputTokens;

  // zod 兜底：即便模型输出畸形，也能给出可读报错而非崩在后续逻辑里。
  const plan: Plan = planSchema.parse(extractJson(planResp.text));
  logger.info(`规划完成，共 ${plan.steps.length} 步：`);
  for (const s of plan.steps) console.log(color(`    ${s.id}. ${s.action}`, "gray"));

  // ---- 阶段 B：执行（逐步调用 LLM，带上「已知信息」滚动上下文）----
  // WHY 维护 scratchpad：每步的结论喂给下一步，让后续步骤站在前面的肩膀上。
  let scratchpad = `菜单数据：${JSON.stringify(MENU)}`;
  for (const step of plan.steps) {
    const stepResp = await client.chat({
      system: "你按计划执行单个步骤。基于已知信息，简洁地只给出本步骤的结论。",
      messages: [
        {
          role: "user",
          content:
            `总任务：${TASK}\n\n已知信息：\n${scratchpad}\n\n` +
            `当前步骤（第 ${step.id} 步）：${step.action}\n\n请只完成这一步并给出结论。`,
        },
      ],
      temperature: 0,
    });
    llmCalls += 1;
    inputTokens += stepResp.usage.inputTokens;
    outputTokens += stepResp.usage.outputTokens;
    logger.info(`执行第 ${step.id} 步 → ${stepResp.text.replace(/\s+/g, " ").trim()}`);
    scratchpad += `\n第 ${step.id} 步结论：${stepResp.text.trim()}`;
  }

  // ---- 阶段 C：汇总成给用户的一句话 ----
  const finalResp = await client.chat({
    system: "你把执行过程的结论汇总成给用户的最终答复，包含折后总价、人均，一句话说清。",
    messages: [{ role: "user", content: `任务：${TASK}\n\n执行记录：\n${scratchpad}\n\n请给出最终答复。` }],
    temperature: 0,
  });
  llmCalls += 1;
  inputTokens += finalResp.usage.inputTokens;
  outputTokens += finalResp.usage.outputTokens;

  console.log(color("最终答案：", "green") + finalResp.text);
  return {
    name: "Plan-and-Execute",
    answer: finalResp.text,
    llmCalls,
    usage: { inputTokens, outputTokens },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 范式三：Reflection（自我反思修正）
//
// 三步：生成初稿 → 让模型「换一顶批评家的帽子」列出问题 → 据批评改写。
// WHY 有效：同一个模型，「写」和「评」是不同任务。把它从「作者」切换到「审稿人」视角，
// 能发现自己初稿里的疏漏（算错、漏条件、表述含糊），从而把质量再抬一档。
// 代价是固定多花约 2 次调用——所以 Reflection 适合「质量 > 速度」的产出。
// ───────────────────────────────────────────────────────────────────────────
async function runReflection(client: LLMClient): Promise<PatternResult> {
  divider("范式三：Reflection（自我反思修正）");

  let llmCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  const accUsage = (r: { usage: { inputTokens: number; outputTokens: number } }) => {
    llmCalls += 1;
    inputTokens += r.usage.inputTokens;
    outputTokens += r.usage.outputTokens;
  };

  // 提供菜单避免模型瞎猜价格——把「能力」和「数据」分开，反思才聚焦在推理而非缺数据。
  const context = `菜单单价（元）：${JSON.stringify(MENU)}`;

  // ---- 1) 初稿 ----
  const draftResp = await client.chat({
    system: "你是助手。基于给定菜单价格，直接给出对用户的答复（含折后总价与人均）。",
    messages: [{ role: "user", content: `${context}\n\n任务：${TASK}` }],
    temperature: 0,
  });
  accUsage(draftResp);
  const draft = draftResp.text;
  logger.info("初稿：");
  console.log(color(`    ${draft.replace(/\n/g, "\n    ")}`, "gray"));

  // ---- 2) 自我批评（换上「审稿人」视角）----
  const critiqueResp = await client.chat({
    system:
      "你是严格的审稿人。逐条列出下面答复中的问题：" +
      "是否算错、是否漏了『满 100 打 9 折』条件、人均是否正确、表述是否清楚。" +
      "只列问题清单，不要改写。若确实没问题，回复『无问题』。",
    messages: [
      { role: "user", content: `${context}\n\n原始任务：${TASK}\n\n待审阅的答复：\n${draft}` },
    ],
    temperature: 0,
  });
  accUsage(critiqueResp);
  const critique = critiqueResp.text;
  logger.info("批评意见：");
  console.log(color(`    ${critique.replace(/\n/g, "\n    ")}`, "yellow"));

  // ---- 3) 据批评改写 ----
  const reviseResp = await client.chat({
    system: "你根据审稿意见改写答复，修正所有被指出的问题，输出最终给用户的一句话答复。",
    messages: [
      {
        role: "user",
        content:
          `${context}\n\n原始任务：${TASK}\n\n初稿：\n${draft}\n\n` +
          `审稿意见：\n${critique}\n\n请据此给出修正后的最终答复。`,
      },
    ],
    temperature: 0,
  });
  accUsage(reviseResp);

  console.log(color("最终答案：", "green") + reviseResp.text);
  return {
    name: "Reflection",
    answer: reviseResp.text,
    llmCalls,
    usage: { inputTokens, outputTokens },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 主流程：三种范式跑同一任务，最后横向对比
// ───────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const client = getLLM();
  logger.info(`当前厂商：${client.provider} | 模型：${client.model}`);
  console.log(color(`\n统一任务：${TASK}`, "cyan"));

  // WHY 顺序而非并行：便于初学者逐段阅读每种范式的日志；真实压测时可并行。
  const results: PatternResult[] = [];
  results.push(await runReAct(client));
  results.push(await runPlanExecute(client));
  results.push(await runReflection(client));

  // ---- 对比表：步数/成本是选型的核心依据 ----
  divider("横向对比：LLM 调用次数 与 token 成本");
  for (const r of results) {
    const total = r.usage.inputTokens + r.usage.outputTokens;
    logger.info(
      `${r.name.padEnd(18)}｜LLM 调用 ${r.llmCalls} 次｜` +
        `token：输入 ${r.usage.inputTokens} / 输出 ${r.usage.outputTokens}（合计 ${total}）`,
    );
  }

  divider("小结");
  console.log(
    [
      "- ReAct：调用次数随任务动态变化，探索型任务首选，但可能跑偏或多绕路。",
      "- Plan-and-Execute：先规划带来可控性，步数≈计划步数+2，适合可预先拆解的复杂任务。",
      "- Reflection：固定多花约 2 次调用换质量，适合『质量 > 速度』的产出。",
      "提示：三者可组合——先 Plan，每步内用 ReAct，最后对成稿做一次 Reflection。",
    ].join("\n"),
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
