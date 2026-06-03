/**
 * 极简评估框架（eval harness）。
 *
 * 一个评估器只做三件事：
 *  1. 拿一份「数据集」（每条 = 输入 + 期望/评分标准）
 *  2. 对每条跑「被测函数」，再用「评分器」给输出打分（通过/不通过 + 分数）
 *  3. 汇总成「通过率 + 失败用例清单」
 *
 * WHY 自己写而不是上来就用 vitest/promptfoo：先理解评估的最小骨架，
 * 你才知道那些框架在帮你做什么。生产里可直接用 vitest 写断言、用 promptfoo 管数据集（见 README）。
 */

/** 单条评估样本：输入 + 该用例自带的评分逻辑。泛型 I 是被测函数的输入类型。 */
export interface EvalCase<I> {
  /** 用例名，出现在报告里，便于定位失败。 */
  name: string;
  /** 喂给被测函数的输入。 */
  input: I;
  /**
   * 评分器：拿到被测函数的实际输出，判断是否通过。
   * 返回 score ∈ [0,1] 与可选 reason。把"判定标准"绑在用例上，数据集即测试。
   */
  score: (output: unknown) => Promise<ScoreResult> | ScoreResult;
}

/** 一次评分的结果。 */
export interface ScoreResult {
  /** 是否通过（通常 score >= 阈值即 true，这里让评分器自己决定，更灵活）。 */
  passed: boolean;
  /** 0~1 的分数，便于做 LLM-as-judge 这种"程度分"。 */
  score: number;
  /** 不通过的原因，写进报告。 */
  reason?: string;
}

/** 单条用例跑完后的明细。 */
export interface EvalRunCase {
  name: string;
  passed: boolean;
  score: number;
  reason?: string;
  /** 被测函数本身抛错时记在这里（与"输出不达标"区分开）。 */
  error?: string;
}

/** 整个数据集跑完的汇总。 */
export interface EvalReport {
  total: number;
  passed: number;
  failed: number;
  /** 通过率 0~1。 */
  passRate: number;
  /** 平均分（含失败用例），反映整体质量趋势，比纯通过率更敏感。 */
  avgScore: number;
  /** 全部明细，方便逐条查看。 */
  cases: EvalRunCase[];
}

/**
 * 跑一遍数据集。
 *
 * WHY 把被测函数作为参数传入：评估器与被测对象解耦——同一份数据集可用来回归测试
 * 不同版本的 prompt / 不同厂商的模型，只要它们满足 (input)=>output 的签名。
 *
 * @param subject 被测函数（System Under Test），输入 I、输出任意，内部可调用 LLM。
 * @param cases   数据集。
 */
export async function runEval<I>(
  subject: (input: I) => Promise<unknown> | unknown,
  cases: EvalCase<I>[],
): Promise<EvalReport> {
  const results: EvalRunCase[] = [];

  for (const testCase of cases) {
    try {
      const output = await subject(testCase.input);
      const score = await testCase.score(output);
      results.push({
        name: testCase.name,
        passed: score.passed,
        score: score.score,
        ...(score.reason !== undefined ? { reason: score.reason } : {}),
      });
    } catch (err) {
      // 被测函数抛错（如 JSON 解析失败）也算一次失败用例，而不是让整个评估崩掉
      results.push({
        name: testCase.name,
        passed: false,
        score: 0,
        error: (err as Error).message,
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  // total 为 0 时避免除零，直接给 0
  const avgScore = total === 0 ? 0 : results.reduce((sum, r) => sum + r.score, 0) / total;

  return {
    total,
    passed,
    failed: total - passed,
    passRate: total === 0 ? 0 : passed / total,
    avgScore,
    cases: results,
  };
}
