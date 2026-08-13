/**
 * 零 key、零 Docker 的完整教学链路 smoke。
 *
 * 它刻意使用 DevelopmentNodeRunner，以验证 MCP → 错误反馈 → 修复 → Git rollback
 * 的控制流；真实容器隔离另由 docker-e2e-smoke.ts 验收，二者不能混为一谈。
 */
import assert from "node:assert/strict";
import { runInvoiceRegressionDemo } from "./demo-runtime";
import { DevelopmentNodeRunner } from "./sandbox-runner";

async function main(): Promise<void> {
  const outcome = await runInvoiceRegressionDemo({
    sandbox: new DevelopmentNodeRunner(),
    rollback: true,
  });
  const { run } = outcome;
  assert.equal(run.ok, true, run.error);
  assert.equal(run.finalState, "COMPLETE");
  assert.ok(run.tools.some((tool) => tool.name === "read_text"));
  assert.ok(run.events.some((event) => event.type === "tools_discovered"));
  assert.equal(run.events.filter((event) => event.type === "correction").length, 1);
  const sandboxResults = run.events.filter((event) => event.type === "sandbox_result");
  assert.equal(sandboxResults.length, 2, "baseline failure and repaired execution must both be visible");
  assert.ok(
    sandboxResults.every((event) => event.result.isolation === "development-node"),
    "smoke must explicitly exercise the non-security development runner",
  );
  assert.ok(sandboxResults.some((event) => event.result.ok === false && /expected 4050, actual 4950/.test(event.result.error ?? "")));
  assert.ok(sandboxResults.some((event) => event.result.ok === true && /INVOICE_REGRESSION_FIXED totalCents=4050/.test(event.result.stdout)));
  assert.ok(outcome.verification, "result.json must satisfy the invoice fixture contract");
  assert.ok(outcome.rollbackCheckpoint, "rollback must restore the repair action's pre-state");
  console.log(
    "✅ mini-agent-harness smoke passed: MCP task read, 4950→4050 repair, bounded correction, Git rollback, development-only runner",
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
