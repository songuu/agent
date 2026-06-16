/**
 * 评审团 supervisor：把多个角色评审员**并行**跑在每个文件上，汇总 → zod 校验 → 去重 → 按严重度
 * 排序 → 产出「评审门」裁决（有 critical 即拦截）。
 *
 * 这是多 Agent「并行异构 team（fork → 多角色 → join）」的骨架：每个 reviewer 是独立角色，
 * 互不依赖、可并发；supervisor 只负责调度与合并，不关心单个角色内部怎么得出结论。
 */
import { z } from "zod";
import { REVIEWERS } from "./reviewers";
import type { CodeFile } from "./samples";

/** 发现的严重度。 */
export type Severity = "critical" | "major" | "minor";

/** 一条评审发现。 */
export interface Finding {
  reviewer: string;
  severity: Severity;
  rule: string;
  message: string;
  path: string;
  line: number;
}

/** 结构化输出校验：每条发现必须满足此 schema，挡住格式跑偏的产物。 */
export const findingSchema = z.object({
  reviewer: z.string().min(1),
  severity: z.enum(["critical", "major", "minor"]),
  rule: z.string().min(1),
  message: z.string().min(1),
  path: z.string().min(1),
  line: z.number().int().positive(),
});

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };

/** 评审门裁决。 */
export interface GateVerdict {
  ok: boolean;
  /** 触发拦截的发现（critical）。 */
  blockers: Finding[];
  reason: string;
}

/** 评审报告。 */
export interface ReviewReport {
  findings: Finding[];
  countsBySeverity: Record<Severity, number>;
  gate: GateVerdict;
}

/** 去重键：同一文件同一行同一规则只报一次（不同评审员重叠时合并）。 */
function dedupeKey(f: Finding): string {
  return `${f.path}:${f.line}:${f.rule}`;
}

/**
 * 评审团：并行跑所有评审员，合并去重排序，产出门禁裁决。
 * gate 阈值：出现任何 critical 即拦截（block）。
 */
export class ReviewCrew {
  constructor(private readonly reviewers = REVIEWERS) {}

  async review(files: readonly CodeFile[]): Promise<ReviewReport> {
    // fork：每个 (reviewer × file) 是一个独立任务，并行执行（reviewer 同步，用 resolve 包装成并发 join）。
    const tasks = this.reviewers.flatMap((reviewer) =>
      files.map((file) => Promise.resolve().then(() => reviewer.review(file))),
    );
    const raw = (await Promise.all(tasks)).flat();

    // 结构化校验：任何不合 schema 的发现直接丢弃（边界处把不可信产物挡掉）。
    const validated = raw.filter((f) => findingSchema.safeParse(f).success);

    // 去重：不同评审员对同一行同一规则的重叠发现合并为一条。
    const seen = new Set<string>();
    const deduped = validated.filter((f) => {
      const key = dedupeKey(f);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 排序：严重度优先，其次文件名、行号，保证稳定可回归。
    deduped.sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        a.path.localeCompare(b.path) ||
        a.line - b.line,
    );

    const countsBySeverity: Record<Severity, number> = { critical: 0, major: 0, minor: 0 };
    for (const f of deduped) countsBySeverity[f.severity] += 1;

    const blockers = deduped.filter((f) => f.severity === "critical");
    const gate: GateVerdict = {
      ok: blockers.length === 0,
      blockers,
      reason: blockers.length === 0 ? "无 critical 问题，评审通过" : `存在 ${blockers.length} 个 critical 问题，拒绝合并`,
    };

    return { findings: deduped, countsBySeverity, gate };
  }
}
