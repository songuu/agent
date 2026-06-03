/**
 * 评分器集合：两大流派——「规则评分」与「LLM-as-judge」。
 *
 * 规则评分：确定、免费、零延迟，适合能精确判定的场景（字段相等、包含子串、正则、JSON 字段比对）。
 * LLM-as-judge：让另一个模型按标准给"程度分"，适合开放式输出（语气、是否答到点上、有没有幻觉）。
 *
 * WHY 两者都要：能用规则就别用模型当裁判——规则更便宜更稳；规则覆盖不到的主观维度，才上 judge。
 */
import { getLLM } from "../../src/shared/llm";
import type { ScoreResult } from "./evalHarness";

/**
 * 规则1：JSON 字段子集相等。
 * 实际输出（对象）中，expected 列出的每个字段都必须严格相等，才算通过。
 *
 * WHY 用"子集"而非"全等"：期望里只写你关心的字段，其余字段允许模型自由发挥，断言更聚焦、更稳。
 */
export function fieldsMatch(expected: Record<string, unknown>): (output: unknown) => ScoreResult {
  return (output: unknown): ScoreResult => {
    if (typeof output !== "object" || output === null) {
      return { passed: false, score: 0, reason: `输出不是对象：${JSON.stringify(output)}` };
    }
    const actual = output as Record<string, unknown>;
    const mismatches: string[] = [];
    for (const [key, want] of Object.entries(expected)) {
      // 用 JSON.stringify 做结构化比较，覆盖字符串/数字/嵌套对象
      if (JSON.stringify(actual[key]) !== JSON.stringify(want)) {
        mismatches.push(`${key}: 期望 ${JSON.stringify(want)}，实际 ${JSON.stringify(actual[key])}`);
      }
    }
    return mismatches.length === 0
      ? { passed: true, score: 1 }
      : { passed: false, score: 0, reason: mismatches.join("; ") };
  };
}

/**
 * 规则2：输出文本包含某个子串（大小写不敏感）。
 * 适合"必须提到某关键词"这类断言。output 会被 stringify 后做包含判断。
 */
export function contains(needle: string): (output: unknown) => ScoreResult {
  const target = needle.toLowerCase();
  return (output: unknown): ScoreResult => {
    const haystack = (typeof output === "string" ? output : JSON.stringify(output)).toLowerCase();
    return haystack.includes(target)
      ? { passed: true, score: 1 }
      : { passed: false, score: 0, reason: `未包含期望子串 "${needle}"` };
  };
}

/**
 * 规则3：输出（stringify 后）匹配正则。
 * 适合校验格式，如邮箱、日期、JSON 结构形状。
 */
export function matchesRegex(pattern: RegExp): (output: unknown) => ScoreResult {
  return (output: unknown): ScoreResult => {
    const text = typeof output === "string" ? output : JSON.stringify(output);
    return pattern.test(text)
      ? { passed: true, score: 1 }
      : { passed: false, score: 0, reason: `不匹配正则 ${pattern}` };
  };
}

/**
 * LLM-as-judge：让一个独立模型按 criteria 给输出打 0~10 分，并要求返回 JSON。
 *
 * WHY 要求 judge 返回 {score, reason}：分数用于汇总，理由用于人工复核——
 * 评估器自己也可能出错，留下 reason 才能审计"裁判为什么这么判"。
 *
 * @param criteria  评分标准（自然语言，越具体越稳）。
 * @param threshold 通过阈值（0~10），默认 7。
 */
export function llmJudge(
  criteria: string,
  threshold = 7,
): (output: unknown) => Promise<ScoreResult> {
  return async (output: unknown): Promise<ScoreResult> => {
    const llm = getLLM();
    const rendered = typeof output === "string" ? output : JSON.stringify(output, null, 2);

    const result = await llm.chat({
      system: [
        "你是严格但公正的评分裁判。依据给定标准，对「被评内容」打 0 到 10 的整数分。",
        '只输出一个 JSON 对象：{"score": <0-10 整数>, "reason": "<一句话理由>"}。禁止其它文字。',
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: `评分标准：\n${criteria}\n\n被评内容：\n${rendered}`,
        },
      ],
      temperature: 0,
    });

    // judge 也可能格式跑偏，做一次防御性解析
    const parsed = parseJudgeOutput(result.text);
    const passed = parsed.score >= threshold;
    return {
      passed,
      score: parsed.score / 10, // 归一化到 0~1，与规则评分口径一致
      reason: `judge=${parsed.score}/10（阈值${threshold}）：${parsed.reason}`,
    };
  };
}

/** 把裁判模型的输出解析成 {score, reason}，解析失败则记 0 分而非抛错（让评估继续跑完）。 */
function parseJudgeOutput(text: string): { score: number; reason: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return { score: 0, reason: `裁判输出无法解析：${text}` };
  }
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as { score?: unknown; reason?: unknown };
    const score = typeof obj.score === "number" ? clamp(obj.score, 0, 10) : 0;
    const reason = typeof obj.reason === "string" ? obj.reason : "(裁判未给理由)";
    return { score, reason };
  } catch {
    return { score: 0, reason: `裁判输出 JSON 解析失败：${text}` };
  }
}

/** 把数值夹到 [min,max] 区间。 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
