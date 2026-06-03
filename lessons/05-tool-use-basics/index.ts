/**
 * 第 05 章 · 工具调用基础 (Function Calling)
 *
 * 运行：npx tsx lessons/05-tool-use-basics/index.ts
 *
 * 本章演示「原生工具调用」的完整往返，全部手写、不借助 shared 的 ToolRegistry / runAgent：
 *  1. 手写 ToolSpec（包括 parameters 的原始 JSON Schema），看清它给模型的真实形态。
 *  2. chat() 后读 result.toolCalls：模型不会自己执行工具，只会「请求」你执行。
 *  3. 手动 dispatch：根据 toolCall.name 找到本地函数、执行、把结果作为 role:"tool" 消息回传。
 *  4. 循环：chat → 有 toolCalls 就执行回传 → 再 chat，直到 stopReason 不是 "tool_use"。
 *
 * WHY 要手写：第 04 章我们靠「让模型输出特定文本、再用正则解析」来触发工具，脆弱且难扩展。
 * 本章改用现代模型的结构化工具调用：你传 JSON Schema，模型回传结构化的 toolCalls，
 * 可靠性天差地别。手写一遍，才能理解 shared 里 ToolRegistry / runAgent 到底替你做了什么。
 */
import { getLLM } from "../../src/shared/llm";
import type { Message, ToolCall, ToolSpec } from "../../src/shared/llm/types";
import { divider, logger, color } from "../../src/shared";

/**
 * 本地工具的真实实现。注意：模型永远不会运行这些函数——它只会告诉你「我想调用 get_weather，
 * 参数是 {...}」，真正的执行发生在你的进程里。这正是「工具调用」的安全边界：副作用由你掌控。
 */
const TOOL_IMPLEMENTATIONS: Record<string, (args: Record<string, unknown>) => string> = {
  // 一个查天气的假数据工具：真实项目里这里会去调天气 API。
  get_weather: (args) => {
    const city = typeof args.city === "string" ? args.city : "未知城市";
    // 用一张写死的表模拟外部数据源，保证课程零依赖、可离线跑。
    const fakeDb: Record<string, string> = {
      北京: "晴，26℃",
      上海: "多云，29℃",
      广州: "雷阵雨，31℃",
    };
    const weather = fakeDb[city] ?? "暂无该城市数据";
    return `${city}：${weather}`;
  },

  // 一个本地计算器：把数学交给确定性的代码，而不是让模型「心算」（模型算术并不可靠）。
  calculate: (args) => {
    const a = typeof args.a === "number" ? args.a : Number.NaN;
    const b = typeof args.b === "number" ? args.b : Number.NaN;
    const op = typeof args.op === "string" ? args.op : "";
    if (Number.isNaN(a) || Number.isNaN(b)) return "Error: a / b 必须是数字";
    switch (op) {
      case "add":
        return String(a + b);
      case "sub":
        return String(a - b);
      case "mul":
        return String(a * b);
      case "div":
        return b === 0 ? "Error: 除数不能为 0" : String(a / b);
      default:
        return `Error: 不支持的运算 "${op}"，可选 add | sub | mul | div`;
    }
  },
};

/**
 * 手写的 ToolSpec：这就是「发给模型的工具说明书」。
 *
 * 关注 parameters——它是一份**手写的 JSON Schema**。模型靠它理解：
 *  - 这个工具要哪些参数（properties）
 *  - 每个参数是什么类型、什么含义（type / description / enum）
 *  - 哪些参数必填（required）
 *
 * description 写得越清楚，模型越知道「什么时候该调用」「参数怎么填」。
 * 本章故意手写这份 schema，让你看清它的原始形态；下一章会用 zod 自动生成它。
 */
const TOOL_SPECS: ToolSpec[] = [
  {
    name: "get_weather",
    description: "查询某个城市当前的天气。当用户询问天气时调用。",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "城市名，例如「北京」「上海」",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "calculate",
    description: "做一次基础四则运算。涉及精确计算时调用，不要自己心算。",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number", description: "第一个操作数" },
        b: { type: "number", description: "第二个操作数" },
        op: {
          type: "string",
          // enum 把可选值钉死，模型几乎不会传出范围外的运算符——这是 schema 约束的威力。
          enum: ["add", "sub", "mul", "div"],
          description: "运算符：add 加 / sub 减 / mul 乘 / div 除",
        },
      },
      required: ["a", "b", "op"],
    },
  },
];

/**
 * 手动 dispatch 一次工具调用：根据 name 找到本地实现并执行。
 *
 * WHY 包一层 try-catch：工具执行可能抛错（网络、越界等）。我们把错误**转成字符串**回传给模型，
 * 而不是让整个程序崩溃——这样模型看到 "Error: ..." 后还有机会换个参数重试，agent 才有韧性。
 */
function dispatchTool(call: ToolCall): string {
  const impl = TOOL_IMPLEMENTATIONS[call.name];
  if (!impl) return `Error: 未知工具 "${call.name}"`;
  try {
    return impl(call.arguments);
  } catch (err) {
    return `Error: 工具 "${call.name}" 执行异常 — ${(err as Error).message}`;
  }
}

async function main(): Promise<void> {
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  // 初始对话：一个需要「先查天气、再算温差」的问题，会逼模型连续调用两类工具。
  const messages: Message[] = [
    {
      role: "user",
      content: "北京今天多少度？另外帮我算一下 26 减 18 等于几。",
    },
  ];
  const system = "你是一个善用工具的助手。需要外部数据或精确计算时，必须调用工具而不是猜测。";

  // 防御性上限：避免模型与工具来回拉扯导致死循环（真实项目里这是必备的安全阀）。
  const MAX_STEPS = 6;
  let totalInput = 0;
  let totalOutput = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    divider(`第 ${step + 1} 轮 chat()`);

    // 每一轮都把当前完整 messages + 工具清单一起发给模型。
    // 注意：tools 一传，模型就「获得了调用工具的能力」，但是否调用由它自己决定。
    const result = await llm.chat({ messages, system, tools: TOOL_SPECS });
    totalInput += result.usage.inputTokens;
    totalOutput += result.usage.outputTokens;
    logger.info(`stopReason=${result.stopReason}，本轮工具调用 ${result.toolCalls.length} 个`);

    // 把这一回合的 assistant 消息记进历史（含它发起的 toolCalls），供下一轮作为上下文。
    // WHY 必须记：模型是无状态的，下一轮请求要靠 messages 才能「记得」自己刚提了哪些工具调用。
    messages.push({
      role: "assistant",
      content: result.text,
      ...(result.toolCalls.length ? { toolCalls: result.toolCalls } : {}),
    });

    // 终止条件：模型不再要求调用工具（stopReason 不是 "tool_use"）即得到最终答案。
    if (result.stopReason !== "tool_use" || result.toolCalls.length === 0) {
      divider("最终回答");
      console.log(result.text);
      logger.success(`完成。累计用量：输入 ${totalInput} / 输出 ${totalOutput} token`);
      return;
    }

    // 否则：逐个执行模型请求的工具调用，把每个结果作为一条 role:"tool" 消息回传。
    // 铁律：assistant 发起的**每一个** toolCall，都必须有一条对应的 tool 结果消息，
    // 且通过 toolCallId 与 ToolCall.id 一一对应——否则下一轮请求会因「悬空的工具调用」而报错。
    for (const call of result.toolCalls) {
      const output = dispatchTool(call);
      console.log(
        `${color("[模型请求]", "yellow")} ${call.name}(${JSON.stringify(call.arguments)})` +
          ` ${color("→", "gray")} ${output}`,
      );
      messages.push({
        role: "tool",
        content: output,
        toolCallId: call.id, // 关键：用 id 把「结果」绑回「哪一次调用」
        name: call.name,
      });
    }
  }

  // 兜底：到达步数上限仍未收敛，多半是工具描述含糊或问题超出工具能力。
  logger.warn(`已达最大步数 ${MAX_STEPS} 仍未得到最终答案，提前停止。`);
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
