/**
 * 命令行入口：对「合规 Agent」与「退化 Agent」各跑一次评测，打印指标表与回归门裁决，
 * 直观展示评测如何拦下「该拒答却乱答」的回归。
 *
 * 运行：pnpm agent-eval-harness
 */
import { divider } from "../../../src/shared/util/ui";
import { goodSubject, regressedSubject, type Subject } from "./subject";
import { runEval, checkGate, type EvalReport } from "./harness";

function printReport(name: string, report: EvalReport): void {
  divider(`评测：${name}`);
  for (const c of report.cases) {
    const kw = c.keywordScore === null ? "—" : c.keywordScore.toFixed(2);
    const rf = c.refusalCorrect === null ? "—" : c.refusalCorrect ? "✓" : "✗";
    console.log(`${c.pass ? "✅" : "❌"} ${c.id.padEnd(14)} tool=${c.toolMatch ? "✓" : "✗"} keyword=${kw} refusal=${rf}`);
  }
  const a = report.aggregate;
  console.log(
    `通过率 ${(a.passRate * 100).toFixed(0)}% | 工具准确率 ${(a.meanToolAccuracy * 100).toFixed(0)}% | 答案分 ${a.meanAnswerScore.toFixed(2)} | 拒答准确率 ${a.refusalAccuracy === null ? "—" : (a.refusalAccuracy * 100).toFixed(0) + "%"} | 成本 $${a.costUsd.toFixed(6)}`,
  );
  const gate = checkGate(report);
  console.log(`回归门：${gate.ok ? "✅ PASS" : "❌ BLOCK"}${gate.ok ? "" : " — " + gate.failures.join("; ")}`);
}

function evalSubject(name: string, subject: Subject): void {
  printReport(name, runEval(subject));
}

function main(): void {
  console.log("📊 Agent 评测与回归门 · 离线演示\n");
  evalSubject("合规 Agent（goodSubject）", goodSubject);
  evalSubject("退化 Agent（regressedSubject）", regressedSubject);
  console.log("\n💡 同一套 golden set，退化版因『该拒答却乱答』被回归门拦下——这就是评测的价值。");
}

main();
