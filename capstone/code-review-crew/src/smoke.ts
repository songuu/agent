/**
 * 离线冒烟测试：对内置样本跑评审团，断言关键发现、严重度计数与评审门裁决。
 *
 * 运行：pnpm code-review-crew:smoke
 */
import { ReviewCrew, findingSchema } from "./crew";
import { SAMPLE_FILES } from "./samples";

const failures: string[] = [];
function check(label: string, cond: boolean): void {
  if (!cond) failures.push(label);
}

async function main(): Promise<void> {
  const report = await new ReviewCrew().review(SAMPLE_FILES);
  const rules = new Set(report.findings.map((f) => f.rule));

  // 关键安全发现必须命中
  for (const r of ["hardcoded-secret", "sql-injection", "eval", "command-injection"]) {
    check(`应命中安全规则 ${r}`, rules.has(r));
  }
  // 性能发现必须命中
  check("应命中嵌套循环", rules.has("nested-loop"));
  check("应命中循环内 await", rules.has("await-in-loop"));

  // 严重度计数（4 critical = 3 auth + 1 util）
  check("critical 应为 4", report.countsBySeverity.critical === 4);
  check("major 应 ≥ 2", report.countsBySeverity.major >= 2);

  // 排序：首条必为 critical
  check("发现应按严重度排序（首条 critical）", report.findings[0]?.severity === "critical");

  // 所有发现均通过结构化校验
  check("全部发现通过 zod 校验", report.findings.every((f) => findingSchema.safeParse(f).success));

  // 评审门：有 critical → BLOCK
  check("评审门应拦截（BLOCK）", report.gate.ok === false && report.gate.blockers.length === 4);

  if (failures.length > 0) {
    console.error(`❌ code-review-crew smoke 失败 ${failures.length} 项：`);
    for (const f of failures) console.error("  - " + f);
    process.exit(1);
  }
  console.log(`✅ code-review-crew smoke 全绿：${report.findings.length} 处发现（critical ${report.countsBySeverity.critical}），评审门 ${report.gate.ok ? "PASS" : "BLOCK"}`);
}

main().catch((err) => {
  console.error("smoke 运行异常：", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
