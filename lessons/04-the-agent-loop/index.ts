/**
 * 第 04 章 · 手写 Agent 循环 (ReAct)
 *
 * 运行：npx tsx lessons/04-the-agent-loop/index.ts
 *
 * 本章从零手写一个 ReAct 风格的 agent 循环：
 *   Thought（思考） → Action（行动） → Observation（观察） → … → Final Answer（最终答案）
 *
 * WHY 用「文本协议」而非原生 function calling：
 *   - 我们只用最朴素的 getLLM().chat()（不碰 shared 的 runAgent / ToolRegistry）。
 *   - 让模型按固定文本格式输出，我们用正则把它的"意图"解析出来，再决定调哪个工具。
 *   - 这正是没有原生工具调用的时代（早期 ReAct 论文）的做法，最能暴露 agent 循环的本质：
 *     循环、解析、执行、把观察拼回上下文、再循环——直到出现停止信号。
 *   - 现代生产做法是用原生 function calling（下一章）+ shared 的 runAgent，但理解了
 *     本章的"手摇版"，你才真正知道那层抽象替你做了什么。
 */
import { getLLM } from "../../src/shared/llm";
import { divider, logger } from "../../src/shared";

// ── 1) 工具：纯函数，输入字符串、输出字符串 ────────────────────────────────
// WHY 工具签名统一为 (input: string) => string：
//   文本协议下，模型给的 "Action Input" 本质就是一段文本，工具拿到后自己解析即可。
//   这样循环代码不必关心每个工具的参数形状，保持极简。

/** 城市 → 人口（万人）的查表工具。真实项目里这会是一次数据库/API 调用。 */
const POPULATION_TABLE: Record<string, number> = {
  北京: 2189,
  上海: 2487,
  广州: 1881,
  深圳: 1756,
  成都: 2126,
};

/** 工具：按城市名查人口。查不到时返回给模型一句可读的提示，让它自己换个问法或收尾。 */
function lookupPopulation(city: string): string {
  const key = city.trim();
  const value = POPULATION_TABLE[key];
  if (value === undefined) {
    return `未收录城市「${key}」。已收录：${Object.keys(POPULATION_TABLE).join("、")}。`;
  }
  return `${key} 的常住人口约 ${value} 万人。`;
}

/**
 * 工具：四则运算计算器。
 * WHY 不用 eval：eval 会执行任意代码，是典型安全漏洞。我们只接受 数字/运算符/括号/小数点，
 * 用一个白名单正则把输入卡死，再用 Function 求值——这是教学场景下"够安全又够简单"的折中。
 */
function calculate(expression: string): string {
  const expr = expression.trim();
  // 白名单：仅允许数字、+ - * / ( ) . 和空白，杜绝注入
  if (!/^[\d+\-*/().\s]+$/.test(expr)) {
    return `表达式非法：「${expr}」只允许数字与 + - * / ( ) 运算符。`;
  }
  try {
    // 受白名单保护后再求值；这里不是 eval 任意代码，而是受限的算术求值
    const result = Function(`"use strict"; return (${expr});`)() as unknown;
    if (typeof result !== "number" || !Number.isFinite(result)) {
      return `表达式无法计算出有限数值：「${expr}」。`;
    }
    return `${expr} = ${result}`;
  } catch {
    return `表达式无法计算：「${expr}」，请检查括号是否配对。`;
  }
}

/** 工具分发表：名字 → 执行函数。新增工具只需在这里登记一行。 */
const TOOLS: Record<string, (input: string) => string> = {
  calculate,
  lookup_population: lookupPopulation,
};

// ── 2) System 提示：用文本协议"约法三章" ──────────────────────────────────
// WHY 把格式规则写死在 system 里：模型没有原生工具调用通道时，唯一能约束它的就是提示词。
//   我们要求它每一步要么"调用工具"（给出 Action + Action Input），要么"给出最终答案"
//   （Final Answer）。下面循环就靠解析这两种信号来驱动。
const SYSTEM_PROMPT = `你是一个会使用工具的智能助手。你必须严格按 ReAct 格式逐步推理。

可用工具：
- calculate：四则运算计算器。Action Input 是一个算术表达式，例如 (2189 + 2487) * 2
- lookup_population：查询中国城市常住人口。Action Input 是一个城市名，例如 北京

每一步你只能输出以下两种格式之一：

格式 A（需要调用工具时）：
Thought: <你的思考>
Action: <工具名，必须是 calculate 或 lookup_population 之一>
Action Input: <传给工具的输入>

格式 B（已经能回答用户时）：
Thought: <你的思考>
Final Answer: <给用户的最终答案>

严格要求：
1. 一次只输出一步，且 Action 之后必须紧跟 Action Input，然后立刻停止，等待我返回 Observation。
2. 不要自己编造 Observation，工具结果由我提供。
3. 拿到足够信息后，用 Final Answer 收尾。`;

// ── 3) 解析模型输出：从文本里抠出"它想干什么" ──────────────────────────────

interface ParsedFinal {
  kind: "final";
  answer: string;
}
interface ParsedAction {
  kind: "action";
  tool: string;
  input: string;
}
interface ParsedUnknown {
  kind: "unknown";
}
type Parsed = ParsedFinal | ParsedAction | ParsedUnknown;

/**
 * 把模型一回合的文本输出解析成结构化意图。
 * WHY 优先匹配 Final Answer：它是停止信号，一旦出现就应结束循环，避免还去找 Action。
 */
function parseStep(text: string): Parsed {
  const finalMatch = text.match(/Final Answer:\s*([\s\S]+)/i);
  if (finalMatch && finalMatch[1] !== undefined) {
    return { kind: "final", answer: finalMatch[1].trim() };
  }

  const actionMatch = text.match(/Action:\s*([^\n]+)/i);
  const inputMatch = text.match(/Action Input:\s*([^\n]+)/i);
  if (actionMatch && actionMatch[1] !== undefined && inputMatch && inputMatch[1] !== undefined) {
    return { kind: "action", tool: actionMatch[1].trim(), input: inputMatch[1].trim() };
  }

  // 模型没按格式输出（既无 Final Answer 也无完整 Action）——交给循环兜底处理
  return { kind: "unknown" };
}

// ── 4) 手写 ReAct 循环 ───────────────────────────────────────────────────

async function runReActLoop(question: string, maxSteps = 6): Promise<string> {
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);
  divider(`问题：${question}`);

  // scratchpad 是模型的"草稿纸"：累积它每一步的输出 + 我们回填的 Observation。
  // WHY 每轮都把完整草稿纸喂回去：LLM 是无状态的（见第 02 章），不重放历史它就"失忆"。
  let scratchpad = `Question: ${question}\n`;

  for (let step = 1; step <= maxSteps; step++) {
    const result = await llm.chat({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: scratchpad }],
      // 低温度让格式更稳定：我们要的是可被正则解析的结构化输出，而非创意发挥
      temperature: 0,
    });

    const text = result.text.trim();
    const parsed = parseStep(text);

    // —— 情况一：模型给出最终答案，循环正常收敛 ——
    if (parsed.kind === "final") {
      divider(`第 ${step} 步 · 收敛`);
      console.log(text);
      logger.success(`循环在第 ${step} 步收敛。`);
      return parsed.answer;
    }

    // —— 情况二：模型要调用工具 ——
    if (parsed.kind === "action") {
      divider(`第 ${step} 步 · 行动`);
      // 只回显到 Action Input 为止，避免模型偷偷把 Observation 也编出来污染草稿纸
      console.log(`Thought/Action: ${parsed.tool} | Input: ${parsed.input}`);

      const tool = TOOLS[parsed.tool];
      const observation = tool
        ? tool(parsed.input)
        : `未知工具「${parsed.tool}」，可用工具：${Object.keys(TOOLS).join("、")}。`;
      logger.info(`Observation: ${observation}`);

      // 把"模型这一步的输出 + 工具观察结果"一起追加回草稿纸，进入下一轮
      // WHY 显式写回 Observation：这是 ReAct 闭环的关键——模型靠读到上一步的真实结果来修正下一步。
      scratchpad += `${text}\nObservation: ${observation}\n`;
      continue;
    }

    // —— 情况三：模型没按格式输出，给一次纠偏机会 ——
    divider(`第 ${step} 步 · 格式异常`);
    logger.warn(`模型输出不符合协议，提示其修正。原文：${text}`);
    scratchpad += `${text}\nObservation: 你的输出格式不正确，请严格使用 Action/Action Input 或 Final Answer 格式。\n`;
  }

  // —— 兜底：触达 maxSteps 仍未收敛 ——
  // WHY 必须有 maxSteps：没有它，一个"想不通"的模型会无限调用工具，烧光预算甚至死循环。
  //   停止条件是 agent 循环的安全带，比循环体本身更重要。
  throw new Error(`达到最大步数 ${maxSteps} 仍未得到 Final Answer，已强制停止以防死循环。`);
}

async function main(): Promise<void> {
  // 这个问题刻意需要"两步工具调用"：先查两个城市人口，再把它们相加。
  // 单步问题看不出循环的价值，多步问题才能体现 Thought→Action→Observation 的反复。
  const question = "北京和上海的常住人口加起来大约是多少万人？";
  const answer = await runReActLoop(question);

  divider("最终答案");
  console.log(answer);
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
