import assert from "node:assert/strict";
import { access, readFile, rm, writeFile } from "node:fs/promises";
import { test } from "node:test";
import { createManagedWorkspace } from "./checkpoint";
import {
  BASELINE_INVOICE_MODULE,
  INVOICE_REGRESSION_DISCOUNT_CENTS,
  INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS,
  INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS,
  invoiceRegressionScenario,
  parseInvoiceRegressionResultJson,
  parseInvoiceRegressionTaskJson,
  seedInvoiceRegressionWorkspace,
  verifyInvoiceRegressionResult,
  verifyInvoiceRegressionRollback,
} from "./demo-scenario";
import { SandboxPolicy } from "./sandbox-policy";
import { DevelopmentNodeRunner } from "./sandbox-runner";

test("invoice-regression task JSON fixes 4500 subtotal, 450 discount, and 4050 total while allowing only the objective to vary", () => {
  const defaultTask = parseInvoiceRegressionTaskJson(invoiceRegressionScenario.taskJson);
  const customTask = parseInvoiceRegressionTaskJson(
    invoiceRegressionScenario.taskJson.replace(
      invoiceRegressionScenario.defaultObjective,
      "用 MCP 读取此任务，并修复折扣符号。",
    ),
  );

  assert.equal(defaultTask.expectedSubtotalCents, INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS);
  assert.equal(defaultTask.invoice.discountCents, INVOICE_REGRESSION_DISCOUNT_CENTS);
  assert.equal(defaultTask.expectedTotalCents, INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS);
  assert.equal(customTask.objective, "用 MCP 读取此任务，并修复折扣符号。");
  assert.throws(
    () =>
      parseInvoiceRegressionTaskJson(
        invoiceRegressionScenario.taskJson.replace('"expectedTotalCents": 4050', '"expectedTotalCents": 4950'),
      ),
    /expectedTotalCents must be 4050/,
  );
});

test("invoice-regression sandbox sources satisfy SandboxPolicy without env, network, or parent-path access", () => {
  const policy = new SandboxPolicy();
  for (const code of [
    invoiceRegressionScenario.baselineInvoiceModule,
    invoiceRegressionScenario.fixedInvoiceModule,
    invoiceRegressionScenario.baselineAcceptanceScript,
    invoiceRegressionScenario.repairAndVerifyScript,
  ]) {
    const decision = policy.validate({ runtime: "node", code });
    assert.equal(decision.ok, true, decision.violations.map((violation) => violation.code).join(", "));
  }
});

test("invoice-regression exposes the 4950 baseline failure, repairs to 4050, and verifies rollback state", async () => {
  const workspace = await createManagedWorkspace("invoice-regression-test");
  const runner = new DevelopmentNodeRunner();
  try {
    await seedInvoiceRegressionWorkspace(workspace.workspacePath, "验证此 fixture 的完整闭环。");
    await verifyInvoiceRegressionRollback(workspace.workspacePath);

    const baseline = await runner.run(
      { runtime: "node", code: invoiceRegressionScenario.baselineAcceptanceScript, timeoutMs: 5_000 },
      workspace.workspacePath,
    );
    assert.equal(baseline.ok, false);
    assert.equal(baseline.exitCode, 1);
    assert.match(baseline.stderr, /expected 4050, actual 4950/);
    await assert.rejects(access(`${workspace.workspacePath}/result.json`));
    await verifyInvoiceRegressionRollback(workspace.workspacePath);

    const baselineResult = parseInvoiceRegressionResultJson(
      JSON.stringify({
        scenarioId: "invoice-regression",
        expectedSubtotalCents: 4_500,
        discountCents: 450,
        expectedTotalCents: 4_050,
        actualTotalCents: 4_950,
        passed: false,
      }),
    );
    assert.equal(baselineResult.actualTotalCents, 4_950);
    assert.equal(verifyInvoiceRegressionResult(baselineResult).ok, false);

    const repaired = await runner.run(
      { runtime: "node", code: invoiceRegressionScenario.repairAndVerifyScript, timeoutMs: 5_000 },
      workspace.workspacePath,
    );
    assert.equal(repaired.ok, true, repaired.error ?? repaired.stderr);

    const repairedResult = parseInvoiceRegressionResultJson(
      await readFile(`${workspace.workspacePath}/result.json`, "utf8"),
    );
    assert.equal(repairedResult.actualTotalCents, INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS);
    assert.deepEqual(verifyInvoiceRegressionResult(repairedResult), {
      ok: true,
      result: repairedResult,
      reasons: [],
    });
    await assert.rejects(verifyInvoiceRegressionRollback(workspace.workspacePath), /invoice\.mjs does not match/);

    await writeFile(`${workspace.workspacePath}/invoice.mjs`, BASELINE_INVOICE_MODULE, "utf8");
    await rm(`${workspace.workspacePath}/result.json`);
    await verifyInvoiceRegressionRollback(workspace.workspacePath);
  } finally {
    await workspace.cleanup();
  }
});
