/**
 * 第 11 章 · 多智能体编排 —— worker（专才）定义
 *
 * 这里定义两个"专才 agent"。每个 worker 都是一个独立的小函数：
 *  - 有自己专属的 system prompt（人格 + 职责边界）
 *  - 可以有自己专属的工具（researcher 有检索工具，writer 没有）
 *  - 输入是"一段子任务 + 已有上下文"，输出是"一段文本结果"
 *
 * WHY 把 worker 抽成独立模块：
 *   多智能体的核心收益是"分工 → 各自上下文更窄、提示更专"。把每个 worker 的
 *   system prompt 和工具隔离在自己的作用域里，supervisor（见 index.ts）才不会被
 *   一大坨混在一起的提示词污染。文件小、职责单一，也方便单独替换/测试某个 worker。
 */
import type { LLMClient } from "../../src/shared/llm/types";
import { runAgent } from "../../src/shared/agent/loop";
import { ToolRegistry, defineTool } from "../../src/shared/agent/tool";
import { logger } from "../../src/shared";
import { z } from "zod";

/**
 * 一份"本地知识库"。
 *
 * WHY 用本地知识库而不是真实联网检索：
 *   本章重点是"编排"，不是"检索质量"。用一份内置语料，课程只要一个 LLM key 就能跑通，
 *   不依赖搜索 API / embedding key，初学者复现成本最低。真实项目里，把这个工具的实现
 *   换成 Web 搜索或向量库（第 08/09 章）即可，supervisor 与 writer 一行都不用改。
 */
const KNOWLEDGE_BASE: { topic: string; text: string }[] = [
  {
    topic: "agent",
    text: "AI Agent = LLM（大脑）+ 工具（手脚）+ 循环（自主多步）。它能感知环境、规划步骤、调用工具并根据结果调整，而非一问一答。",
  },
  {
    topic: "agent",
    text: "单 agent 的瓶颈：职责越多，system prompt 越臃肿、工具越杂、上下文越容易被无关信息挤爆，导致跑偏或遗忘。",
  },
  {
    topic: "multi-agent",
    text: "多智能体把一个大任务拆给多个专才（如研究员/写手/审校），由 supervisor 协调员决定派给谁、串行还是并行，最后汇总。",
  },
  {
    topic: "multi-agent",
    text: "多智能体的收益：每个 agent 上下文更聚焦、提示更专、可独立替换；代价：调用次数与 token 上升、编排复杂度增加、调试更难。",
  },
  {
    topic: "supervisor",
    text: "supervisor（协调者）本身通常只是一次结构化的 LLM 调用：读取当前进展，输出'下一步派给哪个 worker 及其子任务'或'结束'。",
  },
  {
    topic: "token",
    text: "token 是模型处理文本的最小计费单位。多智能体每多一次 worker 调用就多一份输入/输出 token，因此要在'分工收益'与'成本'之间权衡。",
  },
];

/**
 * researcher（研究员）专属工具：在本地知识库里按关键词检索。
 *
 * WHY 给 researcher 工具、不给 writer：
 *   这正是"分工"的体现——研究员负责"找事实"，所以它需要检索能力；写手负责"组织语言"，
 *   只该消费研究员产出的事实，不该自己去查（避免两个 agent 职责重叠、互相打架）。
 */
const knowledgeSearchTool = defineTool({
  name: "knowledge_search",
  description: "在本地知识库中按关键词检索资料，返回最相关的若干条原文。研究主题时优先使用。",
  schema: z.object({
    keyword: z.string().describe("检索关键词，如 'multi-agent'、'supervisor'、'token'"),
  }),
  execute: ({ keyword }) => {
    const needle = keyword.toLowerCase();
    const hits = KNOWLEDGE_BASE.filter(
      (entry) => entry.topic.includes(needle) || entry.text.toLowerCase().includes(needle),
    );
    // 工具结果统一返回字符串：命中则编号列出，未命中也要明确告知（让 agent 自己换词重试）
    if (hits.length === 0) {
      return `未检索到与 "${keyword}" 相关的资料，请换一个更宽泛的关键词重试。`;
    }
    return hits.map((entry, idx) => `[${idx + 1}] (${entry.topic}) ${entry.text}`).join("\n");
  },
});

/** worker 的统一签名：吃"子任务 + 上游已有的上下文"，吐"一段文本结果"。 */
export type Worker = (task: string, context: string) => Promise<string>;

/**
 * 研究员 worker：用检索工具收集事实，输出"带要点的研究笔记"。
 *
 * 它内部直接复用 shared 的 runAgent（第 04/05 章的 agent 循环成熟版）：
 * 模型自己决定调用几次 knowledge_search，直到攒够材料再收尾。
 */
export function makeResearcher(client: LLMClient): Worker {
  const registry = new ToolRegistry([knowledgeSearchTool]);
  const system = [
    "你是一名严谨的研究员。你的唯一职责是：围绕给定子任务，调用 knowledge_search 收集事实，",
    "然后输出一份**要点式研究笔记**（3-6 条 bullet）。",
    "规则：",
    "1. 只陈述检索到的事实，不要展开成文章（成文是写手的活）。",
    "2. 至少检索 2 个不同关键词，确保覆盖面。",
    "3. 若检索不到就如实说明，绝不编造。",
  ].join("\n");

  return async (task, context) => {
    const userContent = context
      ? `子任务：${task}\n\n（已有背景，供参考但不要重复检索）\n${context}`
      : `子任务：${task}`;
    const run = await runAgent({
      client,
      registry,
      system,
      messages: [{ role: "user", content: userContent }],
      maxSteps: 6,
    });
    logger.debug(`researcher 用量：in=${run.usage.inputTokens} out=${run.usage.outputTokens}`);
    return run.finalText;
  };
}

/**
 * 写手 worker：把研究员的事实笔记，组织成一段连贯、带要点的摘要。
 *
 * 它**没有工具**，只做一次 chat()——因为写作不需要检索，强行给它工具只会增加跑偏风险。
 * 这体现了"按职责裁剪能力"的设计原则。
 */
export function makeWriter(client: LLMClient): Worker {
  const system = [
    "你是一名专业写手。你的唯一职责是：把研究员提供的事实笔记，整理成一段面向初学者的摘要。",
    "要求：先一段 2-3 句的概述，再用 3-5 条 bullet 列关键要点；语言简洁、准确，不臆造事实。",
    "你不负责查资料，只负责把给定材料写好。",
  ].join("\n");

  return async (task, context) => {
    const result = await client.chat({
      system,
      messages: [
        {
          role: "user",
          content: `写作任务：${task}\n\n可用素材（研究员的笔记）：\n${context}`,
        },
      ],
    });
    logger.debug(`writer 用量：in=${result.usage.inputTokens} out=${result.usage.outputTokens}`);
    return result.text;
  };
}
