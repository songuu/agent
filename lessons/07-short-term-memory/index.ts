/**
 * 第 07 章 · 短期记忆与上下文管理
 *
 * 运行：npx tsx lessons/07-short-term-memory/index.ts
 *
 * 本章演示三件事：
 *  1. 「记忆」= 手动维护 messages 数组并每次回灌——证明模型「记得」你说过的名字/偏好。
 *  2. 滑动窗口：只保留最近 N 轮原文，控制每次发送的规模。
 *  3. LLM 摘要压缩：历史过长时把旧对话压成一条摘要，省 token 还不失忆。
 *
 * 可选交互模式：传 --chat 参数进入 REPL，自己跟它多聊几句感受「记忆」。
 *   npx tsx lessons/07-short-term-memory/index.ts --chat
 */
import { getLLM } from "../../src/shared/llm";
import { divider, logger, printMessage, prompt } from "../../src/shared";
import { Conversation } from "./conversation";

/** 演示一：证明 Conversation「记得」前文（名字 + 偏好）。 */
async function demoRemembers(): Promise<void> {
  divider("演示一：它记得我说过的名字和偏好");

  const llm = getLLM();
  const chat = new Conversation({
    client: llm,
    system: "你是一位简洁的助手，回答尽量控制在两句话内，必要时直接引用用户给过的信息。",
    keepRecentTurns: 3,
    summarizeThreshold: 6,
  });

  // 先抛出几条「事实」，看后面是否还记得。
  const opening = "你好，我叫林小满，我最讨厌香菜，最喜欢的编程语言是 TypeScript。";
  printMessage("user", opening);
  printMessage("assistant", await chat.ask(opening));

  // 关键检验：不再重复名字/偏好，直接问——能答对说明历史被正确回灌了。
  const probe = "根据我前面说的，帮我推荐一道菜，并说明用什么语言写后端。";
  printMessage("user", probe);
  printMessage("assistant", await chat.ask(probe));

  logger.info(`当前窗口原文条数：${chat.recentCount}，是否已生成摘要：${chat.currentSummary ? "是" : "否"}`);
}

/** 演示二：用一段较长的多轮对话，触发「滑动窗口 + 摘要压缩」，再验证压缩后仍记得关键信息。 */
async function demoCompression(): Promise<void> {
  divider("演示二：聊到历史过长 → 触发摘要压缩 → 仍然记得最早的关键信息");

  const llm = getLLM();
  const chat = new Conversation({
    client: llm,
    system: "你是一位简洁的助手，回答控制在一句话内。",
    keepRecentTurns: 2, // 窗口很小，方便快速触发压缩
    summarizeThreshold: 4, // 攒够 4 条窗口外历史就压一次
  });

  // 第一条藏一个「暗号」，它会很快滑出窗口、只能靠摘要保住。
  const secret = "请记住我的会员编号是 A7-2025，这个编号后面会用到。";
  printMessage("user", secret);
  printMessage("assistant", await chat.ask(secret));

  // 用一串无关闲聊把窗口顶满，迫使最早的「暗号」被压进摘要。
  const fillers = [
    "今天北京天气怎么样，适合出门吗？",
    "推荐一部适合周末看的电影。",
    "番茄炒蛋的关键步骤是什么？",
    "用一句话介绍一下黑洞。",
    "周一适合做哪种轻量运动？",
  ];

  for (const text of fillers) {
    printMessage("user", text);
    // onSummarize 回调：压缩真实发生时打印出来，让「记忆被压成了什么」可见。
    const reply = await chat.ask(text, (info) => {
      logger.warn(
        `触发摘要压缩：移除 ${info.removedMessages} 条旧原文 → 压成 1 条摘要`,
      );
      logger.debug(`摘要内容：${info.summary}`);
    });
    printMessage("assistant", reply);
  }

  if (chat.currentSummary) {
    divider("压缩后的「记忆笔记」");
    printMessage("system", chat.currentSummary);
  }

  // 终极检验：暗号早已滑出原文窗口，只能从摘要里取——能答对就证明压缩没丢关键信息。
  divider("检验：暗号还在吗？");
  const finalProbe = "我的会员编号是多少？";
  printMessage("user", finalProbe);
  printMessage("assistant", await chat.ask(finalProbe));

  logger.info(`最终窗口原文条数：${chat.recentCount}（已被滑动窗口控制在小范围）`);
}

/** 可选演示三：交互式 REPL，自己上手验证「记忆」。输入 exit 退出。 */
async function demoInteractive(): Promise<void> {
  divider("交互模式：随便聊，输入 exit 退出");

  const llm = getLLM();
  const chat = new Conversation({
    client: llm,
    system: "你是一位友好、简洁的中文助手。",
    keepRecentTurns: 3,
    summarizeThreshold: 6,
  });

  // 循环直到用户主动退出；每轮都会自动维护窗口与摘要。
  while (true) {
    const input = await prompt("你说（exit 退出）：");
    if (!input || input.toLowerCase() === "exit") break;

    const reply = await chat.ask(input, (info) =>
      logger.warn(`（已压缩 ${info.removedMessages} 条旧历史为摘要）`),
    );
    printMessage("assistant", reply);
  }

  logger.success("对话结束。");
}

async function main(): Promise<void> {
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  // 通过命令行参数选择模式：默认跑两段自动演示，--chat 进入交互。
  if (process.argv.includes("--chat")) {
    await demoInteractive();
    return;
  }

  await demoRemembers();
  await demoCompression();

  divider("小结");
  logger.success(
    "记忆 = 手动回灌 messages；窗口控规模；超长时用 LLM 摘要压缩，既省 token 又不失忆。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
