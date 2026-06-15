/**
 * Golden-set evaluation gate for deterministic RAG regression checks.
 *
 * The LLM judge in evaluate.ts answers "is this response good?". This file answers
 * the narrower CI question: "did retrieval still find the labeled evidence, and
 * did no-answer cases refuse instead of inventing?" It is pure and keyless.
 */
import { ndcgAtK, precisionAtK, recallAtK, reciprocalRank } from "./metrics";

export interface GoldenEvalCase {
  id: string;
  question: string;
  retrievedIds: string[];
  relevantIds: string[];
  answer?: string;
  shouldRefuse?: boolean;
}

export interface GoldenEvalCaseResult {
  id: string;
  question: string;
  recall: number;
  precision: number;
  mrr: number;
  ndcg: number;
  refusalCorrect: boolean | null;
}

export interface GoldenEvalReport {
  k: number;
  cases: GoldenEvalCaseResult[];
  aggregate: {
    meanRecall: number;
    meanPrecision: number;
    meanMrr: number;
    meanNdcg: number;
    refusalAccuracy: number | null;
  };
}

export interface GoldenGateThresholds {
  minMeanRecall?: number;
  minMeanPrecision?: number;
  minMeanMrr?: number;
  minMeanNdcg?: number;
  minRefusalAccuracy?: number;
}

export interface GoldenGateResult {
  ok: boolean;
  failures: string[];
}

const DEFAULT_REFUSAL_PATTERNS = [
  /资料中未提及/,
  /资料里没有/,
  /无法从(给定)?资料/,
  /cannot\s+answer/i,
  /not\s+mentioned/i,
  /insufficient\s+(context|information)/i,
];

function mean(values: number[]): number {
  return values.length === 0 ? 1 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function isRefusalAnswer(answer: string, patterns = DEFAULT_REFUSAL_PATTERNS): boolean {
  return patterns.some((pattern) => pattern.test(answer));
}

export function evaluateGoldenSet(cases: readonly GoldenEvalCase[], k: number): GoldenEvalReport {
  if (!Number.isInteger(k) || k <= 0) throw new Error(`k must be a positive integer, got ${k}`);

  const results = cases.map((item): GoldenEvalCaseResult => {
    const answerable = item.relevantIds.length > 0;
    const refusalCorrect =
      item.shouldRefuse === undefined || item.answer === undefined
        ? null
        : item.shouldRefuse === isRefusalAnswer(item.answer);

    return {
      id: item.id,
      question: item.question,
      recall: answerable ? recallAtK(item.retrievedIds, item.relevantIds, k) : 1,
      precision: answerable ? precisionAtK(item.retrievedIds, item.relevantIds, k) : 1,
      mrr: answerable ? reciprocalRank(item.retrievedIds, item.relevantIds) : 1,
      ndcg: answerable ? ndcgAtK(item.retrievedIds, item.relevantIds, k) : 1,
      refusalCorrect,
    };
  });

  const retrievalCases = results.filter((item, index) => cases[index]!.relevantIds.length > 0);
  const refusalCases = results.filter((item) => item.refusalCorrect !== null);

  return {
    k,
    cases: results,
    aggregate: {
      meanRecall: mean(retrievalCases.map((item) => item.recall)),
      meanPrecision: mean(retrievalCases.map((item) => item.precision)),
      meanMrr: mean(retrievalCases.map((item) => item.mrr)),
      meanNdcg: mean(retrievalCases.map((item) => item.ndcg)),
      refusalAccuracy:
        refusalCases.length === 0
          ? null
          : refusalCases.filter((item) => item.refusalCorrect === true).length / refusalCases.length,
    },
  };
}

export function checkGoldenGate(
  report: GoldenEvalReport,
  thresholds: GoldenGateThresholds,
): GoldenGateResult {
  const failures: string[] = [];
  const check = (label: string, actual: number | null, min: number | undefined): void => {
    if (min === undefined) return;
    if (actual === null || actual < min) {
      failures.push(`${label} ${actual === null ? "n/a" : actual.toFixed(3)} < ${min.toFixed(3)}`);
    }
  };

  check("meanRecall", report.aggregate.meanRecall, thresholds.minMeanRecall);
  check("meanPrecision", report.aggregate.meanPrecision, thresholds.minMeanPrecision);
  check("meanMrr", report.aggregate.meanMrr, thresholds.minMeanMrr);
  check("meanNdcg", report.aggregate.meanNdcg, thresholds.minMeanNdcg);
  check("refusalAccuracy", report.aggregate.refusalAccuracy, thresholds.minRefusalAccuracy);

  return { ok: failures.length === 0, failures };
}
