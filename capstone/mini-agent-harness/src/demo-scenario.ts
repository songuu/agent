/**
 * 可复用的 invoice-regression 演练 fixture。
 *
 * WHY：DemoPlanner 需要一个确定、可回滚且不依赖网络或环境变量的失败案例，才能把
 * MCP 读取、sandbox 失败证据、修复与验收串成一条可重复的闭环。
 */
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const INVOICE_REGRESSION_SCENARIO_ID = "invoice-regression" as const;
export const INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS = 4_500;
export const INVOICE_REGRESSION_DISCOUNT_CENTS = 450;
export const INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS = 4_050;
export const DEFAULT_INVOICE_REGRESSION_OBJECTIVE = "修复订单金额回归，并验证折扣后总额为 4050 分。";

export interface InvoiceLineItem {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
}

export interface InvoiceRegressionTask {
  readonly id: typeof INVOICE_REGRESSION_SCENARIO_ID;
  readonly scenarioId: typeof INVOICE_REGRESSION_SCENARIO_ID;
  readonly objective: string;
  readonly invoice: {
    readonly items: readonly InvoiceLineItem[];
    readonly discountCents: typeof INVOICE_REGRESSION_DISCOUNT_CENTS;
  };
  /** Planner consumes this directly when it derives the intentionally wrong 4500 + 450 baseline. */
  readonly discountCents: typeof INVOICE_REGRESSION_DISCOUNT_CENTS;
  readonly expectedSubtotalCents: typeof INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS;
  readonly expectedTotalCents: typeof INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS;
  readonly acceptance: {
    readonly resultFileName: "result.json";
  };
}

export interface InvoiceRegressionResult {
  readonly scenarioId: typeof INVOICE_REGRESSION_SCENARIO_ID;
  readonly expectedSubtotalCents: number;
  readonly discountCents: number;
  readonly expectedTotalCents: number;
  readonly actualTotalCents: number;
  readonly passed: boolean;
}

export interface InvoiceRegressionResultVerification {
  readonly ok: boolean;
  readonly result: InvoiceRegressionResult;
  readonly reasons: readonly string[];
}

export interface InvoiceRegressionScenario {
  readonly id: typeof INVOICE_REGRESSION_SCENARIO_ID;
  readonly defaultObjective: string;
  readonly taskJson: string;
  readonly baselineInvoiceModule: string;
  readonly fixedInvoiceModule: string;
  readonly baselineAcceptanceScript: string;
  readonly repairAndVerifyScript: string;
}

const FIXTURE_ITEMS: readonly InvoiceLineItem[] = Object.freeze([
  Object.freeze({ sku: "consulting", quantity: 1, unitPriceCents: 3_000 }),
  Object.freeze({ sku: "implementation", quantity: 1, unitPriceCents: 1_500 }),
]);

/**
 * 基线刻意把折扣加回总额；验收脚本必须观察到 4950，而不是把该错误藏在 fixture 中。
 */
export const BASELINE_INVOICE_MODULE = `export function calculateInvoiceTotalCents(invoice) {
  const subtotalCents = invoice.items.reduce(
    (runningSubtotalCents, item) => runningSubtotalCents + item.quantity * item.unitPriceCents,
    0,
  );

  // Intentional regression: a discount must reduce the subtotal, not increase it.
  return subtotalCents + invoice.discountCents;
}
`;

/** 正确实现保留与基线相同的输入边界，只修复折扣的业务符号。 */
export const FIXED_INVOICE_MODULE = `export function calculateInvoiceTotalCents(invoice) {
  const subtotalCents = invoice.items.reduce(
    (runningSubtotalCents, item) => runningSubtotalCents + item.quantity * item.unitPriceCents,
    0,
  );

  return subtotalCents - invoice.discountCents;
}
`;

/**
 * 这个脚本只读取当前工作区内的相对 fixture 文件，并只输出 stderr/exit code，绝不
 * 写 result.json。WHY：修复 action 前的 checkpoint 必须仍是无 result.json 的基线，
 * 才能让 rollback 明确恢复到「尚未修复」的状态。
 */
export const BASELINE_ACCEPTANCE_SCRIPT = `import { readFile } from "node:fs/promises";
import { calculateInvoiceTotalCents } from "./invoice.mjs";

const task = JSON.parse(await readFile("./task.json", "utf8"));
const actualTotalCents = calculateInvoiceTotalCents(task.invoice);
if (actualTotalCents !== task.expectedTotalCents) {
  console.error("expected " + task.expectedTotalCents + ", actual " + actualTotalCents);
  process.exitCode = 1;
} else {
  console.log("invoice-regression baseline unexpectedly passed: " + actualTotalCents);
}
`;

/**
 * 修复与验证在同一个受控 action 中进行，使 planner 不必猜测是否已经将正确源码写入
 * 工作区。它仍只使用相对路径，因此可通过 SandboxPolicy 的工作区边界检查。
 */
export const REPAIR_AND_VERIFY_SCRIPT = `import { readFile, writeFile } from "node:fs/promises";

const repairedInvoiceModule = ${JSON.stringify(FIXED_INVOICE_MODULE)};
await writeFile("./invoice.mjs", repairedInvoiceModule, "utf8");

const task = JSON.parse(await readFile("./task.json", "utf8"));
const { calculateInvoiceTotalCents } = await import("./invoice.mjs");
const actualTotalCents = calculateInvoiceTotalCents(task.invoice);
const result = {
  scenarioId: task.scenarioId,
  expectedSubtotalCents: task.expectedSubtotalCents,
  discountCents: task.discountCents,
  expectedTotalCents: task.expectedTotalCents,
  actualTotalCents,
  passed: actualTotalCents === task.expectedTotalCents,
};

await writeFile("./result.json", JSON.stringify(result, null, 2) + "\\n", "utf8");
if (!result.passed) {
  console.error("expected " + result.expectedTotalCents + ", actual " + result.actualTotalCents);
  process.exitCode = 1;
} else {
  console.log("INVOICE_REGRESSION_FIXED totalCents=" + result.actualTotalCents);
}
`;

/** 用可选 objective 生成任务 JSON；除了 objective 外，回归输入与验收目标始终固定。 */
export function createInvoiceRegressionTaskJson(objective?: string): string {
  return `${JSON.stringify(createInvoiceRegressionTask(objective), null, 2)}\n`;
}

/** 严格解析 DemoPlanner 经 MCP 读取的 task.json，拒绝被篡改的金额与 fixture 输入。 */
export function parseInvoiceRegressionTaskJson(taskJson: string): InvoiceRegressionTask {
  const parsed = parseJson(taskJson, "task.json");
  const task = requireRecord(parsed, "task.json");
  const id = requireString(task.id, "task.json.id");
  if (id !== INVOICE_REGRESSION_SCENARIO_ID) {
    throw new TypeError(`task.json.id must be ${INVOICE_REGRESSION_SCENARIO_ID}`);
  }
  const scenarioId = requireString(task.scenarioId, "task.json.scenarioId");
  if (scenarioId !== INVOICE_REGRESSION_SCENARIO_ID) {
    throw new TypeError(`task.json.scenarioId must be ${INVOICE_REGRESSION_SCENARIO_ID}`);
  }

  const objective = normalizeObjective(requireString(task.objective, "task.json.objective"));
  const invoice = requireRecord(task.invoice, "task.json.invoice");
  const items = requireArray(invoice.items, "task.json.invoice.items");
  if (items.length !== FIXTURE_ITEMS.length) {
    throw new TypeError(`task.json.invoice.items must contain ${FIXTURE_ITEMS.length} fixed line items`);
  }
  const parsedItems = items.map((item, index) => parseFixtureItem(item, index));
  const discountCents = requireSafeInteger(invoice.discountCents, "task.json.invoice.discountCents");
  const taskDiscountCents = requireSafeInteger(task.discountCents, "task.json.discountCents");
  const expectedSubtotalCents = requireSafeInteger(task.expectedSubtotalCents, "task.json.expectedSubtotalCents");
  const expectedTotalCents = requireSafeInteger(task.expectedTotalCents, "task.json.expectedTotalCents");
  const acceptance = requireRecord(task.acceptance, "task.json.acceptance");
  const resultFileName = requireString(acceptance.resultFileName, "task.json.acceptance.resultFileName");

  if (discountCents !== INVOICE_REGRESSION_DISCOUNT_CENTS) {
    throw new TypeError(`task.json.invoice.discountCents must be ${INVOICE_REGRESSION_DISCOUNT_CENTS}`);
  }
  if (taskDiscountCents !== INVOICE_REGRESSION_DISCOUNT_CENTS) {
    throw new TypeError(`task.json.discountCents must be ${INVOICE_REGRESSION_DISCOUNT_CENTS}`);
  }
  if (taskDiscountCents !== discountCents) {
    throw new TypeError("task.json.discountCents must equal task.json.invoice.discountCents");
  }
  if (expectedSubtotalCents !== INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS) {
    throw new TypeError(`task.json.expectedSubtotalCents must be ${INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS}`);
  }
  if (expectedTotalCents !== INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS) {
    throw new TypeError(`task.json.expectedTotalCents must be ${INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS}`);
  }
  if (resultFileName !== "result.json") {
    throw new TypeError("task.json.acceptance.resultFileName must be result.json");
  }

  return freezeTask({
    id: INVOICE_REGRESSION_SCENARIO_ID,
    scenarioId: INVOICE_REGRESSION_SCENARIO_ID,
    objective,
    invoice: { items: parsedItems, discountCents: INVOICE_REGRESSION_DISCOUNT_CENTS },
    discountCents: INVOICE_REGRESSION_DISCOUNT_CENTS,
    expectedSubtotalCents: INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS,
    expectedTotalCents: INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS,
    acceptance: { resultFileName: "result.json" },
  });
}

/** 严格解析 sandbox 生成的 result.json；格式错误与业务失败保持可区分。 */
export function parseInvoiceRegressionResultJson(resultJson: string): InvoiceRegressionResult {
  const parsed = parseJson(resultJson, "result.json");
  const result = requireRecord(parsed, "result.json");
  const scenarioId = requireString(result.scenarioId, "result.json.scenarioId");
  if (scenarioId !== INVOICE_REGRESSION_SCENARIO_ID) {
    throw new TypeError(`result.json.scenarioId must be ${INVOICE_REGRESSION_SCENARIO_ID}`);
  }

  return Object.freeze({
    scenarioId: INVOICE_REGRESSION_SCENARIO_ID,
    expectedSubtotalCents: requireSafeInteger(result.expectedSubtotalCents, "result.json.expectedSubtotalCents"),
    discountCents: requireSafeInteger(result.discountCents, "result.json.discountCents"),
    expectedTotalCents: requireSafeInteger(result.expectedTotalCents, "result.json.expectedTotalCents"),
    actualTotalCents: requireSafeInteger(result.actualTotalCents, "result.json.actualTotalCents"),
    passed: requireBoolean(result.passed, "result.json.passed"),
  });
}

/**
 * 验证结果既与 fixture 的固定 4500/450/4050 契约一致，也与其自身的 passed 标志
 * 一致。WHY：只信任 result.passed 会让误写的验收脚本掩盖金额回归。
 */
export function verifyInvoiceRegressionResult(
  result: InvoiceRegressionResult,
): InvoiceRegressionResultVerification {
  const reasons: string[] = [];
  if (result.expectedSubtotalCents !== INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS) {
    reasons.push(`expectedSubtotalCents must be ${INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS}`);
  }
  if (result.discountCents !== INVOICE_REGRESSION_DISCOUNT_CENTS) {
    reasons.push(`discountCents must be ${INVOICE_REGRESSION_DISCOUNT_CENTS}`);
  }
  if (result.expectedTotalCents !== INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS) {
    reasons.push(`expectedTotalCents must be ${INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS}`);
  }
  if (result.expectedTotalCents !== result.expectedSubtotalCents - result.discountCents) {
    reasons.push("expectedTotalCents must equal expectedSubtotalCents minus discountCents");
  }
  if (result.actualTotalCents !== result.expectedTotalCents) {
    reasons.push(`actualTotalCents must equal expectedTotalCents (${result.expectedTotalCents})`);
  }
  if (result.passed !== (result.actualTotalCents === result.expectedTotalCents)) {
    reasons.push("passed must match whether actualTotalCents equals expectedTotalCents");
  }
  if (!result.passed) {
    reasons.push("result.passed must be true");
  }

  return Object.freeze({ ok: reasons.length === 0, result, reasons: Object.freeze(reasons) });
}

/** 写入任务与故意错误的 invoice.mjs；不删除已有 result.json，以避免隐藏执行历史。 */
export async function seedInvoiceRegressionWorkspace(workspacePath: string, objective?: string): Promise<void> {
  const fixtureWorkspacePath = requireWorkspacePath(workspacePath);
  const taskPath = join(fixtureWorkspacePath, "task.json");
  const invoicePath = join(fixtureWorkspacePath, "invoice.mjs");
  await Promise.all([
    writeFile(taskPath, createInvoiceRegressionTaskJson(objective), "utf8"),
    writeFile(invoicePath, BASELINE_INVOICE_MODULE, "utf8"),
  ]);
}

/**
 * 确认 checkpoint/rollback 恢复了基线源码且清除了 result.json。
 * WHY：只看到 invoice.mjs 复原还不够；遗留的成功 result.json 会污染下一次验收。
 */
export async function verifyInvoiceRegressionRollback(workspacePath: string): Promise<void> {
  const fixtureWorkspacePath = requireWorkspacePath(workspacePath);
  const invoicePath = join(fixtureWorkspacePath, "invoice.mjs");
  const resultPath = join(fixtureWorkspacePath, "result.json");
  const invoiceModule = await readFile(invoicePath, "utf8");
  const reasons: string[] = [];

  if (invoiceModule !== BASELINE_INVOICE_MODULE) {
    reasons.push("invoice.mjs does not match the deliberate baseline regression");
  }

  try {
    await access(resultPath);
    reasons.push("result.json still exists after rollback");
  } catch (error) {
    if (!hasErrorCode(error, "ENOENT")) {
      throw new Error(`Unable to inspect result.json during rollback verification: ${errorMessage(error)}`);
    }
  }

  if (reasons.length > 0) {
    throw new Error(`invoice-regression rollback verification failed: ${reasons.join("; ")}`);
  }
}

export const invoiceRegressionScenario: InvoiceRegressionScenario = Object.freeze({
  id: INVOICE_REGRESSION_SCENARIO_ID,
  defaultObjective: DEFAULT_INVOICE_REGRESSION_OBJECTIVE,
  taskJson: createInvoiceRegressionTaskJson(),
  baselineInvoiceModule: BASELINE_INVOICE_MODULE,
  fixedInvoiceModule: FIXED_INVOICE_MODULE,
  baselineAcceptanceScript: BASELINE_ACCEPTANCE_SCRIPT,
  repairAndVerifyScript: REPAIR_AND_VERIFY_SCRIPT,
});

function createInvoiceRegressionTask(objective?: string): InvoiceRegressionTask {
  return freezeTask({
    id: INVOICE_REGRESSION_SCENARIO_ID,
    scenarioId: INVOICE_REGRESSION_SCENARIO_ID,
    objective: objective === undefined ? DEFAULT_INVOICE_REGRESSION_OBJECTIVE : normalizeObjective(objective),
    invoice: {
      items: FIXTURE_ITEMS.map((item) => ({ ...item })),
      discountCents: INVOICE_REGRESSION_DISCOUNT_CENTS,
    },
    discountCents: INVOICE_REGRESSION_DISCOUNT_CENTS,
    expectedSubtotalCents: INVOICE_REGRESSION_EXPECTED_SUBTOTAL_CENTS,
    expectedTotalCents: INVOICE_REGRESSION_EXPECTED_TOTAL_CENTS,
    acceptance: { resultFileName: "result.json" },
  });
}

function freezeTask(task: InvoiceRegressionTask): InvoiceRegressionTask {
  return Object.freeze({
    ...task,
    invoice: Object.freeze({
      ...task.invoice,
      items: Object.freeze(task.invoice.items.map((item) => Object.freeze({ ...item }))),
    }),
    acceptance: Object.freeze({ ...task.acceptance }),
  });
}

function parseFixtureItem(value: unknown, index: number): InvoiceLineItem {
  const item = requireRecord(value, `task.json.invoice.items[${index}]`);
  const expectedItem = FIXTURE_ITEMS[index];
  if (!expectedItem) {
    throw new TypeError(`task.json.invoice.items[${index}] is not part of the fixture`);
  }
  const sku = requireString(item.sku, `task.json.invoice.items[${index}].sku`);
  const quantity = requireSafeInteger(item.quantity, `task.json.invoice.items[${index}].quantity`);
  const unitPriceCents = requireSafeInteger(item.unitPriceCents, `task.json.invoice.items[${index}].unitPriceCents`);
  if (
    sku !== expectedItem.sku ||
    quantity !== expectedItem.quantity ||
    unitPriceCents !== expectedItem.unitPriceCents
  ) {
    throw new TypeError(`task.json.invoice.items[${index}] must match the fixed invoice line item`);
  }
  return Object.freeze({ sku, quantity, unitPriceCents });
}

function parseJson(text: string, label: string): unknown {
  if (typeof text !== "string") {
    throw new TypeError(`${label} must be a JSON string`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new TypeError(`${label} is not valid JSON: ${errorMessage(error)}`);
  }
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string`);
  }
  return value;
}

function normalizeObjective(objective: string): string {
  const normalizedObjective = objective.trim();
  if (normalizedObjective.length === 0) {
    throw new TypeError("task.json.objective must not be blank");
  }
  return normalizedObjective;
}

function requireSafeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be a safe integer`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(`${label} must be a boolean`);
  }
  return value;
}

function requireWorkspacePath(workspacePath: string): string {
  if (typeof workspacePath !== "string" || workspacePath.trim().length === 0) {
    throw new TypeError("workspacePath must be a non-empty string");
  }
  return workspacePath;
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === code;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
