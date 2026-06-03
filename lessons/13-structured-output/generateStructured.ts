/**
 * 第 13 章 · 通用「结构化输出」工具：generateStructured
 *
 * WHY 单独抽一个文件：
 *  - 「让模型稳定吐 JSON 并通过 zod 校验」是工程里反复出现的需求（信息抽取/分类/填表），
 *    抽成一个与业务无关、provider 无关的小函数，后续任何章节/毕业项目都能直接复用。
 *  - 它只依赖课程的统一抽象 getLLM()，不耦合任何厂商 SDK。
 *
 * 核心思路（retry-repair / 自我修复重试）：
 *  1. 用「强约束提示」要求模型只输出 JSON；
 *  2. 从返回文本里抠出 JSON 并 zod.parse；
 *  3. 校验失败时，把 zod 的报错原样拼回下一轮提示，让模型「看着错误自己改」；
 *  4. 最多重试 maxRetries 次，仍失败则抛出携带完整上下文的错误。
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { LLMClient, Message } from "../../src/shared/llm/types";

/** generateStructured 的可选项。 */
export interface GenerateStructuredOptions<T> {
  /** 期望产出的数据形状（单一事实来源：既约束模型，也做运行期校验）。 */
  schema: z.ZodType<T>;
  /** 给模型的任务描述（要抽取/分类什么），不必在这里写「请输出 JSON」——本函数会补上。 */
  prompt: string;
  /** 用于交互的 LLM 客户端（默认让调用方传入，便于测试与切厂商）。 */
  client: LLMClient;
  /** 失败后最多再重试几次（不含首次尝试）。默认 2 次。 */
  maxRetries?: number;
  /** 额外的系统提示，可补充领域规则。 */
  system?: string;
  /** 每次尝试的回调，便于在课程里观察「修复」过程。 */
  onAttempt?: (info: { attempt: number; rawText: string; error?: string }) => void;
}

/** 一次结构化生成的完整结果（含调试信息）。 */
export interface GenerateStructuredResult<T> {
  /** 已通过 zod 校验、类型安全的数据。 */
  data: T;
  /** 总共尝试了几次（1 表示一次成功）。 */
  attempts: number;
  /** 最终被成功解析的原始文本，便于排查。 */
  rawText: string;
}

/**
 * 从一段可能夹带解释文字 / Markdown 代码围栏的文本里，尽力抠出 JSON 字符串。
 *
 * WHY: 即使我们要求模型「只输出 JSON」，它仍可能包上 ```json 围栏或加一句客套话。
 * 与其指望模型 100% 听话，不如在解析侧做容错——这是结构化输出能稳定落地的关键工程细节。
 */
export function extractJson(text: string): string {
  const trimmed = text.trim();

  // 情形一：被 ```json ... ``` 或 ``` ... ``` 围栏包裹，优先取围栏内内容。
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();

  // 情形二：裸 JSON。截取第一个 { 到最后一个 } 之间的片段，去掉前后客套话。
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  // 实在抠不出来，原样返回，交给 JSON.parse 报错（错误信息也会喂回模型修复）。
  return trimmed;
}

/**
 * 把 zod 的校验错误整理成「人/模型都看得懂」的一行行说明。
 * WHY: 直接把 error.message 丢给模型太啰嗦；逐条 path + message 更利于模型定位并修正。
 */
function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `- 字段 \`${issue.path.join(".") || "(根)"}\`：${issue.message}`)
    .join("\n");
}

/**
 * 让模型产出一个符合 schema 的结构化对象，失败自动修复重试。
 *
 * @returns 通过校验的数据 + 调试信息。
 * @throws 当用尽重试仍无法得到合法结构时，抛出携带最后一次原始输出与错误的 Error。
 */
export async function generateStructured<T>(
  options: GenerateStructuredOptions<T>,
): Promise<GenerateStructuredResult<T>> {
  const { schema, prompt, client, system, onAttempt } = options;
  const maxRetries = options.maxRetries ?? 2;

  // 用 zod 反推出一份 JSON Schema 文本，作为对模型的「形状契约」写进提示里。
  // WHY: 比起自然语言描述字段，给出机器可读的 JSON Schema 能显著提高首次命中率。
  const jsonSchemaHint = JSON.stringify(zodToJsonSchemaSafe(schema), null, 2);

  const baseSystem =
    "你是一个严格的结构化数据生成器。你必须只输出一个 JSON 对象，" +
    "不要输出任何解释、不要使用 Markdown 代码围栏、不要加多余文字。" +
    (system ? `\n\n领域规则：\n${system}` : "");

  // 对话历史会在「修复重试」时累积：把上一轮的错误回传，引导模型基于上下文修正。
  const conversation: Message[] = [
    {
      role: "user",
      content:
        `${prompt}\n\n` +
        `请严格按下面的 JSON Schema 输出对应的 JSON 对象：\n${jsonSchemaHint}`,
    },
  ];

  let lastError = "";
  let lastRawText = "";

  // 首次 + maxRetries 次 = 总尝试次数。
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const result = await client.chat({
      system: baseSystem,
      messages: conversation,
      // 抽取/分类类任务追求稳定可复现，温度压到 0。
      temperature: 0,
    });

    lastRawText = result.text;
    const jsonText = extractJson(result.text);

    // 第一步：能不能解析成 JSON？
    let parsedUnknown: unknown;
    try {
      parsedUnknown = JSON.parse(jsonText);
    } catch (err) {
      lastError = `输出不是合法 JSON：${(err as Error).message}`;
      onAttempt?.({ attempt, rawText: result.text, error: lastError });
      pushRepairTurn(conversation, result.text, lastError);
      continue;
    }

    // 第二步：解析出来的对象，结构是否满足 schema？
    const validation = schema.safeParse(parsedUnknown);
    if (validation.success) {
      onAttempt?.({ attempt, rawText: result.text });
      return { data: validation.data, attempts: attempt, rawText: result.text };
    }

    // 校验失败：把逐条错误回传，让模型「看着错误改」。
    lastError = `JSON 结构校验失败，请修正以下问题：\n${formatZodIssues(validation.error)}`;
    onAttempt?.({ attempt, rawText: result.text, error: lastError });
    pushRepairTurn(conversation, result.text, lastError);
  }

  throw new Error(
    `generateStructured 在 ${maxRetries + 1} 次尝试后仍未得到合法结构。\n` +
      `最后一次错误：${lastError}\n最后一次原始输出：${lastRawText}`,
  );
}

/**
 * 把「模型上一轮的输出」与「这一轮的修复指令」追加进对话。
 * WHY: 让模型看到自己刚才错在哪，比让它「重答一遍」更可能一次改对（保留上下文 = 复利）。
 */
function pushRepairTurn(conversation: Message[], assistantText: string, errorMessage: string): void {
  conversation.push({ role: "assistant", content: assistantText });
  conversation.push({
    role: "user",
    content: `${errorMessage}\n\n请只返回修正后的 JSON 对象，不要任何解释。`,
  });
}

/**
 * 把 zod schema 转成 JSON Schema 对象（用于提示）。
 * WHY: 课程已装了 zod-to-json-schema（src/shared/agent/tool.ts 也用它），复用同一套依赖；
 * 去掉对提示无意义的顶层字段，保持 schema 干净，提升模型可读性。
 */
function zodToJsonSchemaSafe(schema: z.ZodType<unknown>): Record<string, unknown> {
  const raw = zodToJsonSchema(schema, { target: "openApi3" }) as Record<string, unknown>;
  const { $schema, definitions, ...rest } = raw;
  void $schema;
  void definitions;
  return rest;
}
