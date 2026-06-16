/**
 * 离线冒烟测试：断言合规 Agent 过门、退化 Agent 被拦，且关键指标符合预期。
 * 任一失败则非零退出（可作 CI gate）。
 *
 * 运行：pnpm agent-eval-harness:smoke
 */
import { goodSubject, regressedSubject } from "./subject";
import { runEval, checkGate } from "./harness";

const failures: string[] = [];
function check(label: string, cond: boolean): void {
  if (!cond) failures.push(label);
}

function main(): void {
  const good = runEval(goodSubject);
  const regressed = runEval(regressedSubject);

  // 合规 Agent：满分通过 + 过门
  check("合规 Agent 通过率应为 100%", good.aggregate.passRate === 1);
  check("合规 Agent 工具准确率应为 100%", good.aggregate.meanToolAccuracy === 1);
  check("合规 Agent 拒答准确率应为 100%", good.aggregate.refusalAccuracy === 1);
  check("合规 Agent 应过回归门", checkGate(good).ok === true);

  // 退化 Agent：拒答失败 → 通过率下滑 → 被门拦下
  check("退化 Agent 通过率应 < 90%", regressed.aggregate.passRate < 0.9);
  check("退化 Agent 拒答准确率应为 0", regressed.aggregate.refusalAccuracy === 0);
  const regressedGate = checkGate(regressed);
  check("退化 Agent 应被回归门拦下", regressedGate.ok === false);
  check("拦截原因应含 refusalAccuracy", regressedGate.failures.some((f) => f.includes("refusalAccuracy")));

  // 成本可估算
  check("成本应可估算 > 0", good.aggregate.costUsd > 0);

  if (failures.length > 0) {
    console.error(`❌ agent-eval-harness smoke 失败 ${failures.length} 项：`);
    for (const f of failures) console.error("  - " + f);
    process.exit(1);
  }
  console.log(
    `✅ agent-eval-harness smoke 全绿：合规 PASS（通过率 ${(good.aggregate.passRate * 100).toFixed(0)}%），退化 BLOCK（${checkGate(regressed).failures.join("; ")}）`,
  );
}

main();
