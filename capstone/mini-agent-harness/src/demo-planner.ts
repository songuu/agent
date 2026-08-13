import {
  invoiceRegressionScenario,
  parseInvoiceRegressionTaskJson,
  type InvoiceRegressionTask,
} from "./demo-scenario";
import type { AgentAction, AgentPlanner, PlannerInput, SandboxResult, ToolResult } from "./types";

/**
 * 零 key 的确定性教学 Planner。
 *
 * 它不是假装成通用 LLM：只处理 `invoice-regression` 这个受控任务。但它会真正
 * 解析 MCP `read_text(task.json)` 的返回值，并验证 sandbox 的错误/成功证据，因而
 * 学习者可看到 Planner 的输入、失败反馈与修复动作之间的实际数据关系。
 */
export class DemoPlanner implements AgentPlanner {
  public async next(input: PlannerInput): Promise<AgentAction> {
    const tool = input.observations.find((observation) => observation.kind === "tool");
    if (!tool) {
      return {
        kind: "tool",
        name: "read_text",
        args: { path: "task.json" },
        summary: "通过 MCP read_text 读取订单回归任务与验收目标",
      };
    }

    const task = this.readTask(tool.result);
    const latestSandbox = [...input.observations].reverse().find((observation) => observation.kind === "sandbox");
    if (!latestSandbox) {
      return {
        kind: "sandbox",
        summary: "运行修复前的金额回归检查（预期失败并产生可见错误证据）",
        request: {
          runtime: "node",
          label: "invoice-regression-baseline",
          code: invoiceRegressionScenario.baselineAcceptanceScript,
        },
      };
    }

    if (!latestSandbox.ok) {
      this.assertExpectedBaselineFailure(latestSandbox.result, task);
      return {
        kind: "sandbox",
        summary: "根据 sandbox 的金额断言错误修复 invoice.mjs，并写入 result.json 重新验证",
        request: {
          runtime: "node",
          label: "invoice-regression-repair",
          code: invoiceRegressionScenario.repairAndVerifyScript,
        },
      };
    }

    this.assertExpectedRepairOutput(latestSandbox.result, task);
    return {
      kind: "complete",
      summary: `${task.id} 已通过 MCP 输入、失败反馈与修复后的金额验收；最近 sandbox 前 checkpoint 可恢复修复前状态。`,
    };
  }

  private readTask(result: ToolResult): InvoiceRegressionTask {
    if (result.isError) {
      throw new Error(`DEMO_MCP_TASK_READ_FAILED: ${result.text}`);
    }
    try {
      return parseInvoiceRegressionTaskJson(result.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`DEMO_TASK_FIXTURE_INVALID: ${message}`);
    }
  }

  private assertExpectedBaselineFailure(result: SandboxResult, task: InvoiceRegressionTask): void {
    const evidence = `${result.error ?? ""}\n${result.stderr}`;
    const wrongTotal = task.expectedSubtotalCents + task.discountCents;
    const expected = `expected ${task.expectedTotalCents}, actual ${wrongTotal}`;
    if (!evidence.includes(expected)) {
      throw new Error(`DEMO_UNEXPECTED_BASELINE_FAILURE: expected evidence ${JSON.stringify(expected)}`);
    }
  }

  private assertExpectedRepairOutput(result: SandboxResult, task: InvoiceRegressionTask): void {
    const expected = `INVOICE_REGRESSION_FIXED totalCents=${task.expectedTotalCents}`;
    if (!result.stdout.includes(expected)) {
      throw new Error(`DEMO_REPAIR_VERIFICATION_MISSING: expected stdout ${JSON.stringify(expected)}`);
    }
  }
}
