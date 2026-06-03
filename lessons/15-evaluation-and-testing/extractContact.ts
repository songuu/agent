/**
 * 被测函数（System Under Test）：从自然语言里抽取结构化的「联系人」信息。
 *
 * 这是第 13 章「结构化抽取」的同款做法——给模型一段自由文本，要求它只返回 JSON，
 * 再用 zod 在运行期把 JSON 校验成强类型对象。本章把它当作"被评估对象"，
 * 演示如何系统化地测一个输出非确定的 LLM 函数。
 *
 * WHY 单独成文件：评估的关键纪律是"被测对象"和"评估逻辑"分离——
 * SUT 不该知道自己正在被测，评估器也不该依赖 SUT 的内部实现。
 */
import { z } from "zod";
import { getLLM } from "../../src/shared/llm";

/** 抽取结果的契约：一个 zod schema 同时承担「类型定义」与「运行期校验」两职。 */
export const ContactSchema = z.object({
  /** 姓名；文本里没提到就给空串，便于规则评分时统一处理。 */
  name: z.string(),
  /** 公司；同理，缺失给空串而非 undefined，避免下游到处判空。 */
  company: z.string(),
  /** 意图分类：约束成有限集合，方便用"字段相等"这种精确规则来打分。 */
  intent: z.enum(["sales", "support", "spam", "other"]),
});

/** 从 schema 反推类型，避免类型与校验逻辑各写一份导致漂移。 */
export type Contact = z.infer<typeof ContactSchema>;

/**
 * 把一段自由文本抽取成结构化联系人。
 *
 * WHY 强制 JSON：让模型只吐 JSON 是结构化抽取的标准手法——输出可解析、可校验、可断言。
 * 这里特意把温度设为 0，尽量压低随机性；但请记住"低温 ≠ 确定"，所以才需要本章的评估体系。
 *
 * @param text 任意一段包含联系人线索的自然语言（如一封邮件、一条留言）。
 * @returns 校验通过的结构化联系人对象。
 */
export async function extractContact(text: string): Promise<Contact> {
  const llm = getLLM();

  const result = await llm.chat({
    // 系统提示把"只输出 JSON、字段含义、缺失如何填"讲死，减少格式跑偏
    system: [
      "你是一个信息抽取引擎。只输出一个 JSON 对象，禁止任何解释、禁止 Markdown 代码块。",
      "字段：name(姓名,字符串)、company(公司,字符串)、intent(意图,取值仅限 sales|support|spam|other)。",
      "文本中未出现的字段用空字符串。无法判断意图时用 other。",
    ].join("\n"),
    messages: [{ role: "user", content: text }],
    temperature: 0,
  });

  // LLM 可能在 JSON 外面裹一层代码块或多余文字——先抠出最外层的 {...} 再解析，提升鲁棒性
  const json = extractFirstJsonObject(result.text);
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(json);
  } catch (err) {
    // 显式抛出带上下文的错误：把模型的原始输出带出来，方便定位"为什么解析失败"
    throw new Error(`模型输出不是合法 JSON：${(err as Error).message}；原始输出=${result.text}`);
  }

  // 运行期校验：不信任模型输出，用 schema 兜底。校验失败说明 SUT 有缺陷，应被评估暴露
  const parsed = ContactSchema.safeParse(parsedUnknown);
  if (!parsed.success) {
    const reason = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`抽取结果不符合契约：${reason}；原始输出=${result.text}`);
  }

  return parsed.data;
}

/**
 * 从一段可能含杂质的文本里截取第一个完整的 JSON 对象子串。
 *
 * WHY: 模型有时会输出 "好的，结果是：{...}" 或包在 ```json 里。
 * 用括号配对找出最外层 {...}，比直接 JSON.parse 整段更耐造。
 */
function extractFirstJsonObject(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) return text;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i]!; // noUncheckedIndexedAccess 下下标结果是 string|undefined，循环边界已保证存在
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  // 没配平就原样返回，交给上层 JSON.parse 报错（错误信息里能看到原文）
  return text.slice(start);
}
