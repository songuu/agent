/** Docker 环境中的完整 MCP → correction → checkpoint rollback 端到端验收。 */
import assert from "node:assert/strict";
import { runInvoiceRegressionDemo } from "./demo-runtime";
import { DockerSandboxRunner } from "./sandbox-runner";

async function main(): Promise<void> {
  const sandbox = new DockerSandboxRunner();
  const preflight = await sandbox.preflight();
  if (!preflight.available) {
    console.error(`SANDBOX_DOCKER_UNAVAILABLE: ${preflight.error ?? "daemon ping failed"}`);
    process.exitCode = 2;
    return;
  }

  const outcome = await runInvoiceRegressionDemo({ sandbox, rollback: true });
  assert.equal(outcome.run.ok, true, outcome.run.error);
  const sandboxResults = outcome.run.events.filter((event) => event.type === "sandbox_result");
  assert.equal(sandboxResults.length, 2);
  assert.ok(sandboxResults.every((event) => event.result.isolation === "docker"));
  assert.ok(sandboxResults.some((event) => event.result.ok === false && /expected 4050, actual 4950/.test(event.result.error ?? "")));
  assert.ok(sandboxResults.some((event) => event.result.ok === true && /INVOICE_REGRESSION_FIXED totalCents=4050/.test(event.result.stdout)));
  assert.ok(outcome.verification);
  assert.ok(outcome.rollbackCheckpoint);
  console.log("✅ mini-agent-harness Docker E2E passed: MCP task read, container repair, result validation, Git rollback");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
