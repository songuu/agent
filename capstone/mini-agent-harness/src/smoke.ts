/**
 * 零 key、零 Docker 的端到端演练。
 *
 * 它明确选择 DevelopmentNodeRunner，因为这是可信 fixture 的回归测试，不能把
 * 宿主子进程误称为安全 sandbox；真实 Docker 验收见 docker-smoke.ts。
 */
import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { AgentLoop } from "./agent-loop";
import { CheckpointStore, createManagedWorkspace } from "./checkpoint";
import { ContextManager } from "./context-manager";
import { DemoPlanner } from "./demo-planner";
import { McpClient } from "./mcp-client";
import { DevelopmentNodeRunner } from "./sandbox-runner";

async function main(): Promise<void> {
  const workspace = await createManagedWorkspace("smoke");
  const checkpoints = new CheckpointStore({ workspacePath: workspace.workspacePath, strategy: "git" });
  try {
    await writeFile(join(workspace.workspacePath, "task.txt"), "写入可回滚的 demo 结果\n", "utf8");
    const mcp = await createDemoMcpClient(workspace.workspacePath);
    const context = new ContextManager({ maxTokens: 180, reserveTokens: 40 });
    const loop = new AgentLoop({
      planner: new DemoPlanner(),
      mcp,
      sandbox: new DevelopmentNodeRunner(),
      checkpoints,
      context,
      workspacePath: workspace.workspacePath,
    });

    const result = await loop.run("读取 task.txt 并生成 result.txt");
    assert.equal(result.ok, true, result.error);
    assert.equal(result.finalState, "COMPLETE");
    assert.ok(result.tools.some((tool) => tool.name === "read_text"));
    assert.ok(result.events.some((event) => event.type === "tools_discovered"));
    assert.ok(result.events.some((event) => event.type === "correction"));
    assert.ok(
      result.events.some((event) => event.type === "sandbox_result" && event.result.isolation === "development-node"),
      "smoke must explicitly exercise the non-security development runner",
    );
    assert.equal((await readFile(join(workspace.workspacePath, "result.txt"), "utf8")).includes("completed:"), true);

    const checkpoint = await loop.rollbackLastStep();
    assert.equal(checkpoint.strategy, "git");
    await assertMissing(join(workspace.workspacePath, "result.txt"));
    console.log("✅ mini-agent-harness smoke passed: MCP discovery/call, correction, Git rollback, development-only runner");
  } finally {
    await checkpoints.dispose().catch(() => undefined);
    await workspace.cleanup().catch(() => undefined);
  }
}
async function createDemoMcpClient(workspacePath: string): Promise<McpClient> {
  const tsxCli = fileURLToPath(new URL("../../../node_modules/tsx/dist/cli.mjs", import.meta.url));
  const serverEntry = fileURLToPath(new URL("./demo-mcp-server.ts", import.meta.url));
  return McpClient.connectStdio({
    command: process.execPath,
    args: [tsxCli, serverEntry],
    cwd: workspacePath,
    env: demoEnvironment(workspacePath),
    stderr: "pipe",
  });
}

function demoEnvironment(workspacePath: string): Record<string, string> {
  const environment: Record<string, string> = { MINI_AGENT_HARNESS_WORKSPACE: workspacePath };
  for (const key of ["PATH", "Path", "SYSTEMROOT", "SystemRoot", "WINDIR", "ComSpec"] as const) {
    const value = process.env[key];
    if (value) environment[key] = value;
  }
  return environment;
}

async function assertMissing(path: string): Promise<void> {
  try {
    await access(path);
  } catch {
    return;
  }
  throw new Error(`expected ${path} to be removed by rollback`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
