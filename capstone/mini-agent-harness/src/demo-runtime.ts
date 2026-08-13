/**
 * 可复用的完整教学演示运行时。
 *
 * WHY：CLI、浏览器演示入口、development smoke 和 Docker E2E 应展示同一条真实
 * 执行链路。把工作区、MCP、Planner、checkpoint 的装配收敛在这里，避免每个入口
 * 各自复制一套「看起来相同、行为却漂移」的 fixture。
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { AgentLoop } from "./agent-loop";
import { CheckpointStore, createManagedWorkspace } from "./checkpoint";
import { ContextManager } from "./context-manager";
import { DemoPlanner } from "./demo-planner";
import {
  invoiceRegressionScenario,
  parseInvoiceRegressionResultJson,
  seedInvoiceRegressionWorkspace,
  verifyInvoiceRegressionResult,
  verifyInvoiceRegressionRollback,
} from "./demo-scenario";
import { McpClient } from "./mcp-client";
import type { AgentEvent, AgentRunResult, CheckpointRef, SandboxGateway } from "./types";

export interface InvoiceRegressionDemoOptions {
  /** Docker 或明确标注的 development-only runner，由调用方显式选择。 */
  sandbox: SandboxGateway;
  /** 仅改变 task.json 中的自然语言目标；验收数据与安全边界保持固定。 */
  objective?: string;
  /** 成功后恢复到「修复前的错误版本」，用于可见地证明 rollback。 */
  rollback?: boolean;
  /** 保留受管临时目录，供调用者人工检查；默认在 finally 清理。 */
  keepWorkspace?: boolean;
  /** 只接收可审计动作事件，绝不传递模型隐藏推理。 */
  onEvent?: (event: AgentEvent) => void;
}

export interface InvoiceRegressionDemoResult {
  run: AgentRunResult;
  /** 已通过 result.json 合同验证的业务结果；Agent 失败时不存在。 */
  verification?: ReturnType<typeof verifyInvoiceRegressionResult>;
  rollbackCheckpoint?: CheckpointRef;
  /** 仅在 keepWorkspace=true 时返回，且永远位于 harness 的受管临时根目录。 */
  workspacePath?: string;
}

/**
 * 运行一条真实但确定性的 Agent 修复闭环：MCP 读取任务 → 基线回归失败 → 受限
 * self-correction → result.json 验收 → 可选 Git rollback。它不需要 LLM key，
 * 因此可作为每个学习入口的可重复证据。
 */
export async function runInvoiceRegressionDemo(
  options: InvoiceRegressionDemoOptions,
): Promise<InvoiceRegressionDemoResult> {
  const workspace = await createManagedWorkspace("invoice-regression");
  const checkpoints = new CheckpointStore({ workspacePath: workspace.workspacePath, strategy: "git" });
  try {
    await seedInvoiceRegressionWorkspace(workspace.workspacePath, options.objective);
    const mcp = await createDemoMcpClient(workspace.workspacePath);
    const loop = new AgentLoop({
      planner: new DemoPlanner(),
      mcp,
      sandbox: options.sandbox,
      checkpoints,
      workspacePath: workspace.workspacePath,
      // 较小预算让 --verbose 演示真实的固定前缀、摘要器和窗口策略；Planner 的
      // fixture 则从受控 MCP observation 读取，不依赖被截断的终端日志。
      context: new ContextManager({
        maxTokens: 220,
        reserveTokens: 92,
        summarizer: async ({ messages }) =>
          `已压缩 ${messages.length} 条受控执行记录；保留 invoice-regression 的验收目标和最近错误。`,
      }),
      onEvent: options.onEvent,
    });
    const run = await loop.run(options.objective ?? invoiceRegressionScenario.defaultObjective);
    if (!run.ok) {
      return { run, ...(options.keepWorkspace ? { workspacePath: workspace.workspacePath } : {}) };
    }

    const resultText = await readFile(join(workspace.workspacePath, "result.json"), "utf8");
    const verification = verifyInvoiceRegressionResult(parseInvoiceRegressionResultJson(resultText));
    if (!verification.ok) {
      throw new Error(`DEMO_RESULT_VERIFICATION_FAILED: ${verification.reasons.join("; ") || "unknown result contract failure"}`);
    }
    let rollbackCheckpoint: CheckpointRef | undefined;
    if (options.rollback) {
      rollbackCheckpoint = await loop.rollbackLastStep(options.onEvent);
      await verifyInvoiceRegressionRollback(workspace.workspacePath);
    }
    return {
      run,
      verification,
      ...(rollbackCheckpoint ? { rollbackCheckpoint } : {}),
      ...(options.keepWorkspace ? { workspacePath: workspace.workspacePath } : {}),
    };
  } finally {
    await checkpoints.dispose().catch(() => undefined);
    if (!options.keepWorkspace) await workspace.cleanup().catch(() => undefined);
  }
}

/** Demo MCP 子进程只接收受管工作区变量与运行所需最小 Windows 环境。 */
export async function createDemoMcpClient(workspacePath: string): Promise<McpClient> {
  const tsxCli = fileURLToPath(new URL("../../../node_modules/tsx/dist/cli.mjs", import.meta.url));
  const serverEntry = fileURLToPath(new URL("./demo-mcp-server.ts", import.meta.url));
  return McpClient.connectStdio({
    command: process.execPath,
    args: [tsxCli, serverEntry],
    cwd: workspacePath,
    env: buildDemoEnvironment(workspacePath),
    stderr: "pipe",
  });
}

export function buildDemoEnvironment(workspacePath: string): Record<string, string> {
  const environment: Record<string, string> = { MINI_AGENT_HARNESS_WORKSPACE: workspacePath };
  for (const key of ["PATH", "Path", "SYSTEMROOT", "SystemRoot", "WINDIR", "ComSpec"] as const) {
    const value = process.env[key];
    if (value) environment[key] = value;
  }
  return environment;
}
