/**
 * 命令行入口：对内置样本跑评审团，分组打印发现 + 评审门裁决。
 *
 * 运行：pnpm code-review-crew
 */
import { divider } from "../../../src/shared/util/ui";
import { ReviewCrew } from "./crew";
import { SAMPLE_FILES } from "./samples";

const ICON: Record<string, string> = { critical: "🔴", major: "🟠", minor: "🟡" };

async function main(): Promise<void> {
  console.log("👥 代码评审团 · 离线多智能体演示\n");
  const report = await new ReviewCrew().review(SAMPLE_FILES);

  divider("评审发现（按严重度排序）");
  for (const f of report.findings) {
    console.log(`${ICON[f.severity]} [${f.reviewer}] ${f.path}:${f.line} ${f.rule} — ${f.message}`);
  }

  divider("汇总");
  console.log(`critical ${report.countsBySeverity.critical} / major ${report.countsBySeverity.major} / minor ${report.countsBySeverity.minor}`);

  divider("评审门");
  console.log(`${report.gate.ok ? "✅ PASS" : "❌ BLOCK"} — ${report.gate.reason}`);
  if (!report.gate.ok) {
    for (const b of report.gate.blockers) console.log(`  ⛔ ${b.path}:${b.line} ${b.rule}`);
  }
}

main().catch((err) => {
  console.error("运行失败：", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
