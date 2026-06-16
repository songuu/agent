/**
 * 评测框架：把 Subject 跑过整个 golden set，用离线裁判逐条打分，聚合指标，过回归门。
 *
 * 裁判（judges）都是确定性纯函数（离线、可回归）：
 *   - toolMatch    期望工具集 == 实际工具集？
 *   - keywordScore 答案命中多少期望关键片段（比例）
 *   - refusalCorrect 该拒答/该作答是否判断正确（复用 shared 的 isRefusalAnswer 规则裁判）
 * 真实项目可把 keywordScore 换成「LLM-as-judge 按 rubric 打分」，框架其余部分不变。
 */
import { approxTokens } from "../../../src/shared/rag/chunk";
import { isRefusalAnswer } from "../../../src/shared/rag/evalGate";
import { GOLDEN_SET, type GoldenCase } from "./goldenSet";
import type { Subject, Trajectory } from "./subject";

/** 单条 case 的评测结果。 */
export interface CaseResult {
  id: string;
  toolMatch: boolean;
  /** 关键词覆盖比例；无期望关键词时为 null。 */
  keywordScore: number | null;
  /** 拒答判断是否正确；不涉及拒答时为 null。 */
  refusalCorrect: boolean | null;
  pass: boolean;
}

/** 聚合指标 + 门禁。 */
export interface EvalReport {
  cases: CaseResult[];
  aggregate: {
    passRate: number;
    meanToolAccuracy: number;
    meanAnswerScore: number;
    refusalAccuracy: number | null;
    costUsd: number;
  };
}

/** 集合相等（顺序无关）。 */
function sameToolSet(a: readonly string[], b: readonly string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}

function mean(values: number[]): number {
  return values.length === 0 ? 1 : values.reduce((s, v) => s + v, 0) / values.length;
}

/** 给一条 case 打分。 */
function judge(testCase: GoldenCase, traj: Trajectory): CaseResult {
  const toolMatch = sameToolSet(testCase.expectedTools, traj.toolsUsed);

  const keywordScore =
    testCase.expectedAnswerContains.length === 0
      ? null
      : testCase.expectedAnswerContains.filter((kw) => traj.answer.includes(kw)).length /
        testCase.expectedAnswerContains.length;

  const refusalCorrect =
    testCase.shouldRefuse === undefined ? null : isRefusalAnswer(traj.answer) === testCase.shouldRefuse;

  const pass =
    toolMatch &&
    (keywordScore === null || keywordScore >= 0.5) &&
    (refusalCorrect === null || refusalCorrect === true);

  return { id: testCase.id, toolMatch, keywordScore, refusalCorrect, pass };
}

const OUTPUT_PRICE_PER_MTOK = 1.5;

/** 跑完整评测。纯逻辑、确定。 */
export function runEval(subject: Subject, cases: readonly GoldenCase[] = GOLDEN_SET): EvalReport {
  const trajectories = cases.map((c) => subject(c.question));
  const results = cases.map((c, i) => judge(c, trajectories[i]!));

  const answerScores = results.map((r) => r.keywordScore).filter((s): s is number => s !== null);
  const refusalChecks = results.map((r) => r.refusalCorrect).filter((b): b is boolean => b !== null);
  const costTokens = trajectories.reduce((s, t) => s + approxTokens(t.answer), 0);

  return {
    cases: results,
    aggregate: {
      passRate: results.filter((r) => r.pass).length / results.length,
      meanToolAccuracy: mean(results.map((r) => (r.toolMatch ? 1 : 0))),
      meanAnswerScore: mean(answerScores),
      refusalAccuracy: refusalChecks.length === 0 ? null : refusalChecks.filter(Boolean).length / refusalChecks.length,
      costUsd: (costTokens / 1_000_000) * OUTPUT_PRICE_PER_MTOK,
    },
  };
}

/** 回归门阈值。 */
export interface GateThresholds {
  minPassRate?: number;
  minToolAccuracy?: number;
  minRefusalAccuracy?: number;
}

export const DEFAULT_THRESHOLDS: GateThresholds = {
  minPassRate: 0.9,
  minToolAccuracy: 1.0,
  minRefusalAccuracy: 1.0,
};

export interface GateResult {
  ok: boolean;
  failures: string[];
}

/** 把聚合指标和阈值比对，产出门禁结果（任一指标跌破即 fail）。 */
export function checkGate(report: EvalReport, thresholds: GateThresholds = DEFAULT_THRESHOLDS): GateResult {
  const failures: string[] = [];
  const check = (label: string, actual: number | null, min: number | undefined): void => {
    if (min === undefined) return;
    if (actual === null || actual < min) failures.push(`${label} ${actual === null ? "n/a" : actual.toFixed(3)} < ${min.toFixed(3)}`);
  };
  check("passRate", report.aggregate.passRate, thresholds.minPassRate);
  check("toolAccuracy", report.aggregate.meanToolAccuracy, thresholds.minToolAccuracy);
  check("refusalAccuracy", report.aggregate.refusalAccuracy, thresholds.minRefusalAccuracy);
  return { ok: failures.length === 0, failures };
}
