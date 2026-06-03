/**
 * 第 11 章 · 多智能体编排（supervisor + workers）
 *
 * 运行：npx tsx lessons/11-multi-agent-orchestration/index.ts
 *
 * 本章演示：
 *  1. supervisor（协调者）：一次结构化 LLM 调用，决定"下一步派给哪个 worker / 还是结束"。
 *  2. worker（专才）：researcher（带检索工具）+ writer（只成文），各有独立 system prompt。
 *  3. 一个完整编排回合：supervisor 调度 researcher → writer，并把结果汇总成最终摘要。
 *
 * WHY 从零手写而不用多 agent 框架：
 *   "多智能体"本质上没有魔法——它就是"几次有计划的 LLM 调用 + 一个把结果传来传去的循环"。
 *   亲手写一遍，你就能看穿任何框架（LangGraph / AutoGen / CrewAI）背后的同一套骨架，
 *   而不是被术语吓住。第 12 章再看框架，会觉得"哦，原来就是把这段封装了一下"。
 */
import { z } from "zod";
import { getLLM } from "../../src/shared/llm";
import type { LLMClient } from "../../src/shared/llm/types";
import { divider, logger } from "../../src/shared";
import { makeResearcher, makeWriter, type Worker } from "./workers";

/** supervisor 能派活的 worker 名单。用字面量联合而非字符串，能在编译期挡住打错的名字。 */
type WorkerName = "researcher" | "writer";

/**
 * supervisor 的决策结构。
 *
 * WHY 让 supervisor 输出"结构化 JSON"而不是自然语言：
 *   编排循环需要据此精确分支（派给谁？还是结束？）。自然语言要再解析、易歧义；
 *   约定一个小 JSON，配合 zod 校验，循环逻辑才稳。这就是"让 LLM 当路由器"的标准做法。
 */
const decisionSchema = z.object({
  // next="done" 表示资料已足够，可以汇总收尾；否则派给某个 worker
  next: z.enum(["researcher", "writer", "done"]),
  // 派活时写给该 worker 的具体子任务；done 时可留空
  task: z.string().default(""),
  // 一句话说明为什么这么决策，纯粹为了让编排过程可解释（方便教学/调试）
  reason: z.string().default(""),
});
type Decision = z.infer<typeof decisionSchema>;

/** 编排过程中累积的"共享工作台"：记录每个 worker 产出，供 supervisor 与下游 worker 参考。 */
interface Scratchpad {
  goal: string;
  /** 已完成的工序记录，按时间顺序。 */
  entries: { worker: WorkerName; output: string }[];
}

/** 把工作台渲染成给 supervisor 看的纯文本进度（让它知道"现在做到哪了"）。 */
function renderProgress(pad: Scratchpad): string {
  if (pad.entries.length === 0) return "（尚无任何 worker 产出，这是第一步）";
  return pad.entries
    .map((e, i) => `第 ${i + 1} 步 · ${e.worker} 产出：\n${e.output}`)
    .join("\n\n");
}

/**
 * supervisor：读取"总目标 + 当前进度"，返回一个结构化决策。
 *
 * 它只做一次 chat()，不带工具——它的"工具"就是后面那几个 worker。
 * 这也呼应了一个关键认知：**supervisor 自己往往是最便宜的那个 agent**，
 * 因为真正烧 token 的检索/写作都外包给了 worker。
 */
async function decide(client: LLMClient, pad: Scratchpad): Promise<Decision> {
  const system = [
    "你是多智能体团队的协调者（supervisor）。你不亲自做研究或写作，",
    "你的职责是：根据总目标与当前进度，决定下一步该派给哪个 worker，或宣布完成。",
    "",
    "可用 worker：",
    "- researcher：擅长用检索工具收集事实，产出要点式研究笔记。",
    "- writer：擅长把研究笔记组织成连贯、带要点的摘要。",
    "",
    "决策规则：",
    "1. 一般顺序是先 researcher 收集事实，再 writer 成文。",
    "2. 只有当已经有一份成稿摘要时，才输出 next='done'。",
    "3. 严格只输出一个 JSON 对象，形如：",
    '   {"next":"researcher","task":"研究 X 的 Y 和 Z","reason":"还没有任何事实材料"}',
    "   不要输出 JSON 以外的任何文字、不要用代码块包裹。",
  ].join("\n");

  const userContent = `总目标：${pad.goal}\n\n当前进度：\n${renderProgress(pad)}\n\n请输出下一步决策的 JSON。`;

  const result = await client.chat({
    system,
    messages: [{ role: "user", content: userContent }],
    // 决策要稳定可复现，温度调低，减少"今天派 A 明天派 B"的抖动
    temperature: 0,
  });

  // 模型偶尔会把 JSON 裹在 ```json ``` 里或带前后缀，做一次宽容提取再交给 zod 校验。
  // WHY 显式容错：把外部不可信输出（这里是模型文本）当成边界数据校验，是工程铁律。
  const decision = parseDecision(result.text);
  logger.debug(`supervisor 决策：${JSON.stringify(decision)}`);
  return decision;
}

/** 从模型文本里抠出 JSON 并用 zod 校验；任何异常都退化为安全默认值，避免编排崩溃。 */
function parseDecision(text: string): Decision {
  const match = text.match(/\{[\s\S]*\}/);
  // 注意：开启 noUncheckedIndexedAccess 后 match[0] 类型是 string | undefined，需判空守卫。
  const jsonText = match?.[0];
  if (!jsonText) {
    logger.warn("supervisor 未返回合法 JSON，按'去做研究'兜底。");
    return { next: "researcher", task: "围绕总目标收集基础事实", reason: "fallback：解析失败" };
  }
  try {
    const parsed = decisionSchema.parse(JSON.parse(jsonText));
    return parsed;
  } catch (err) {
    logger.warn(`supervisor JSON 校验失败：${(err as Error).message}，按'去做研究'兜底。`);
    return { next: "researcher", task: "围绕总目标收集基础事实", reason: "fallback：校验失败" };
  }
}

async function main(): Promise<void> {
  const client = getLLM();
  logger.info(`当前厂商：${client.provider} | 模型：${client.model}`);

  // 组装团队：supervisor（decide 函数）+ 两个专才 worker
  const workers: Record<WorkerName, Worker> = {
    researcher: makeResearcher(client),
    writer: makeWriter(client),
  };

  // 这就是要交给团队完成的任务：研究一个主题并产出带要点的摘要。
  const pad: Scratchpad = {
    goal: "向初学者解释'什么时候该用多智能体而不是单 agent'，并产出一段带 3-5 个要点的摘要。",
    entries: [],
  };

  divider("多智能体编排开始");
  logger.info(`总目标：${pad.goal}`);

  // 编排主循环：supervisor 决策 → 派给对应 worker → 结果回写工作台 → 再决策……
  // maxRounds 是防死循环的护栏（和单 agent 的 maxSteps 同理）：万一 supervisor 一直
  // 不肯说 done，也不会无限烧钱。
  const maxRounds = 6;
  let finalSummary = "";

  for (let round = 1; round <= maxRounds; round++) {
    const decision = await decide(client, pad);
    divider(`第 ${round} 轮 · supervisor 决策：${decision.next}`);
    logger.info(`理由：${decision.reason || "(无)"}`);

    if (decision.next === "done") {
      // supervisor 认为活干完了：取最后一份 writer 产出作为最终交付
      const lastWriter = [...pad.entries].reverse().find((e) => e.worker === "writer");
      finalSummary = lastWriter?.output ?? "（supervisor 宣布完成，但没有找到 writer 产出）";
      break;
    }

    // 派活：把"子任务"和"当前已有的全部进度"一起喂给被选中的 worker。
    // 下游能看到上游产出，正是"结果在 agent 之间流动"的关键。
    const worker = workers[decision.next];
    logger.info(`→ 派给 ${decision.next}：${decision.task}`);
    const output = await worker(decision.task, renderProgress(pad));

    // 把产出回写工作台，供 supervisor 下一轮决策与后续 worker 参考
    pad.entries.push({ worker: decision.next, output });
    logger.success(`${decision.next} 已完成，产出 ${output.length} 字。`);
    console.log(output);

    // 兜底：若已经有 writer 成稿但 supervisor 仍未说 done，下一轮交给它收尾即可，无需特殊处理。
  }

  divider("最终汇总");
  if (finalSummary) {
    console.log(finalSummary);
  } else {
    // 触顶仍未收敛：用已有 writer 产出兜底，避免空手而归
    const lastWriter = [...pad.entries].reverse().find((e) => e.worker === "writer");
    logger.warn("达到最大轮数仍未由 supervisor 宣布完成，使用最近一次 writer 产出兜底。");
    console.log(lastWriter?.output ?? "（无任何成稿）");
  }
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
