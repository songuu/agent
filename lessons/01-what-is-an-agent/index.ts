/**
 * 第 01 章 · 什么是 Agent
 *
 * 运行：npx tsx lessons/01-what-is-an-agent/index.ts
 *
 * 本章只演示「概念」，不引入 ToolRegistry / runAgent（那是后面章节）。
 * 我们用最朴素的代码，让你亲眼看见 LLM 和 Agent 的差别：
 *
 *  1. 纯 LLM：问一个需要「实时信息」的问题（现在几点），模型没有时间感知，
 *     只能一本正经地编 —— 这就是「无状态、无工具」的天花板。
 *  2. 伪 Agent 循环：同样的问题，但我们手写一段「感知→决策→行动→观察」的循环：
 *     模型说「我需要时间」→ 我们调用本地工具拿到真实时间 → 把结果塞回对话 →
 *     模型据此给出正确答案。
 *
 * 核心心智模型：Agent = LLM + 循环 + 工具 + 记忆（多轮消息就是最初级的记忆）。
 */
import { getLLM } from "../../src/shared/llm";
import type { Message } from "../../src/shared/llm/types";
import { divider, logger } from "../../src/shared";

/**
 * 一个「假工具」：返回当前时间字符串。
 *
 * WHY: LLM 活在训练数据的「过去」，没有访问真实世界的能力。工具就是它伸向真实世界的手 ——
 * 这里用 JS 的 Date 取本机当前时间，正是模型自己永远拿不到的实时信息。
 * 本章不接 ToolRegistry，只用一个普通函数，目的是让「工具」这个概念去掉所有包装、回到本质：
 * 工具不过是一段「模型不会、但我们的代码会」的能力。
 */
function getCurrentTime(): string {
  return new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
}

async function main(): Promise<void> {
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  const question = "现在几点了？请直接告诉我具体时间。";

  // ============================================================
  // 第一幕：纯 LLM —— 无状态、无工具，只能凭空猜
  // ============================================================
  divider("第一幕：纯 LLM（会一本正经地编时间）");
  const naive = await llm.chat({
    system: "你是一个助手。请直接回答用户的问题。",
    messages: [{ role: "user", content: question }],
  });
  console.log(`问：${question}`);
  console.log(`答：${naive.text}`);
  // 注意观察：模型给出的时间几乎一定是错的或含糊其辞 —— 它根本没有「现在」的概念。
  logger.warn("↑ 模型没有时间感知，这个答案是猜的，不可信。");

  // ============================================================
  // 第二幕：伪 Agent 循环 —— 感知 → 决策 → 行动 → 观察 → 再决策
  // ============================================================
  divider("第二幕：伪 Agent 循环（先取真实时间，再回答）");

  // 「记忆」在这里就是一个会不断追加的消息数组：每一步的输入输出都留在里面，
  // 让模型在下一步能看见上一步发生了什么。
  const history: Message[] = [
    {
      role: "system",
      content:
        // 用提示词约定一个极简「协议」：模型若需要当前时间，就只回复 NEED_TIME 这个口令；
        // 拿到时间后再正常作答。真实项目里这一步会由结构化的工具调用（function calling）替代，
        // 见第 04 / 05 章；这里手写是为了把「循环」的机制暴露出来。
        "你是一个能借助外部工具的助手。" +
        "如果你需要知道当前时间才能回答，请【只】回复一个口令：NEED_TIME，不要附带其他文字。" +
        "当我把时间提供给你后，再用自然语言正常回答用户。",
    },
    { role: "user", content: question },
  ];

  // 这就是「Agent 循环」的雏形：在一个有上限的循环里反复让模型决策，
  // 直到它不再需要工具、给出最终答案为止。maxSteps 是必须的安全阀，防止无限循环。
  const maxSteps = 3;
  let finalAnswer = "";

  for (let step = 1; step <= maxSteps; step++) {
    logger.info(`—— 循环第 ${step} 步：把当前对话交给模型，看它怎么决策 ——`);

    // 【感知 + 决策】：模型读完整段历史，决定「我该要工具，还是直接答」。
    const turn = await llm.chat({ messages: history });
    const reply = turn.text.trim();

    // 把模型这一步的产出追加进记忆，保证下一步能看到它说过什么。
    history.push({ role: "assistant", content: reply });

    if (reply.includes("NEED_TIME")) {
      // 【行动】：模型请求工具，于是我们的代码去真实世界取数据。
      const now = getCurrentTime();
      logger.info(`模型请求工具 → 我们调用 getCurrentTime() → ${now}`);

      // 【观察】：把工具结果作为一条普通消息塞回记忆，喂给下一步的模型。
      // WHY 用 role:"user" 而不是 role:"tool"：本章是「文本协议」（口令 NEED_TIME），
      // 并非真正的 function calling。role:"tool" 在底层必须与上一条 assistant 的工具调用
      // (tool_use / tool_calls) 一一配对，否则 Anthropic / OpenAI 都会直接报 400。
      // 真正的 tool 角色配对见第 04 / 05 章；这里把观察结果当作一条普通输入回灌即可。
      history.push({
        role: "user",
        content: `（工具返回）当前时间是：${now}`,
      });
      // 继续下一轮循环：模型这次「观察」到了真实时间，应当能给出正确答案。
      continue;
    }

    // 模型没有再要工具，说明它已能作答 —— 循环结束。
    finalAnswer = reply;
    break;
  }

  console.log(`\n问：${question}`);
  console.log(`答：${finalAnswer || "（达到步数上限仍未得到最终答案）"}`);
  logger.success("↑ 同样的模型，加上『循环 + 工具 + 记忆』后，答案就靠谱了。这就是 Agent。");
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
