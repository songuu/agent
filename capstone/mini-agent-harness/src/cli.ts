import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { color } from "../../../src/shared/util/logger";
import { AgentLoop } from "./agent-loop";
import { CheckpointStore, createManagedWorkspace } from "./checkpoint";
import { ContextManager } from "./context-manager";
import { DemoPlanner } from "./demo-planner";
import { createStreamingLogger } from "./logger";
import { McpClient } from "./mcp-client";
import { DockerSandboxRunner } from "./sandbox-runner";

interface DemoOptions {
  task: string;
  developmentFallback: boolean;
  keepWorkspace: boolean;
  rollback: boolean;
  verbose: boolean;
}

interface ToolsOptions {
  url?: string;
  legacySse: boolean;
  stdioCommand?: string;
  stdioArg?: string[];
}

const DEFAULT_TASK = "读取 task.txt，然后在受控工作区生成一个可回滚的 result.txt。";

const program = new Command();
program
  .name("mini-agent-harness")
  .description("MCP + Docker sandbox + checkpoint 的最小 Agent Harness")
  .option("--task <text>", "demo 的任务描述", DEFAULT_TASK)
  .option("--development-fallback", "显式允许非安全的宿主 Node 开发回退")
  .option("--keep-workspace", "保留受控临时工作区，便于检查 demo 结果")
  .option("--rollback", "demo 成功后回滚最后一次 sandbox 写入")
  .option("--verbose", "输出 Context token 与截断策略")
  .action(async (options: DemoOptions) => {
    await runDemo(options);
  });

program
  .command("tools")
  .description("只连接 MCP Server 并动态列出 Tools；不会调用远程工具")
  .option("--url <url>", "远端 Streamable HTTP（或 --legacy-sse 的旧 SSE）端点")
  .option("--legacy-sse", "仅兼容旧式 SSE MCP Server；新接入应优先 Streamable HTTP")
  .option("--stdio-command <command>", "本地 MCP Server 可执行命令（shell=false）")
  .option("--stdio-arg <arg...>", "本地 MCP Server 参数")
  .action(async (options: ToolsOptions) => {
    await listExternalTools(options);
  });

void program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(color(`mini-agent-harness failed: ${message}`, "red"));
  process.exitCode = 1;
});

async function runDemo(options: DemoOptions): Promise<void> {
  const workspace = await createManagedWorkspace("demo");
  const checkpoints = new CheckpointStore({ workspacePath: workspace.workspacePath, strategy: "git" });
  try {
    await writeFile(join(workspace.workspacePath, "task.txt"), `${options.task}\n`, "utf8");
    const sandbox = new DockerSandboxRunner({
      developmentFallback: options.developmentFallback ? "node" : "disabled",
    });
    const preflight = await sandbox.preflight();
    if (!preflight.available && !options.developmentFallback) {
      console.error(
        color(
          `SANDBOX_DOCKER_UNAVAILABLE: ${preflight.error ?? "Docker daemon ping failed"}. Use --development-fallback only for trusted local fixtures.`,
          "red",
        ),
      );
      process.exitCode = 2;
      return;
    }
    if (!preflight.available) {
      console.warn(
        color(
          `Docker unavailable; continuing only because --development-fallback was explicitly selected: ${preflight.error ?? "unknown error"}`,
          "yellow",
        ),
      );
    }

    const mcp = await createDemoMcpClient(workspace.workspacePath);
    const logger = createStreamingLogger({ verbose: options.verbose });
    const context = new ContextManager({ maxTokens: 512, reserveTokens: 96 });
    const loop = new AgentLoop({
      planner: new DemoPlanner(),
      mcp,
      sandbox,
      checkpoints,
      context,
      workspacePath: workspace.workspacePath,
      onEvent: logger,
    });
    const result = await loop.run(options.task);
    if (!result.ok) {
      process.exitCode = 1;
      return;
    }

    const resultPath = join(workspace.workspacePath, "result.txt");
    const resultText = await readFile(resultPath, "utf8");
    console.log(color(`✓ demo completed: ${resultText.trim()}`, "green"));

    if (options.rollback) {
      const checkpoint = await loop.rollbackLastStep(logger);
      await expectMissing(resultPath, "rollback should remove result.txt");
      console.log(color(`✓ rollback verified at checkpoint ${checkpoint.id.slice(0, 8)}`, "green"));
    }

    if (options.keepWorkspace) {
      console.log(color(`managed workspace retained: ${workspace.workspacePath}`, "yellow"));
    }
  } finally {
    await checkpoints.dispose().catch(() => undefined);
    if (!options.keepWorkspace) await workspace.cleanup().catch(() => undefined);
  }
}

async function listExternalTools(options: ToolsOptions): Promise<void> {
  const client = await createExternalMcpClient(options);
  try {
    const tools = await client.discoverTools();
    if (tools.length === 0) {
      console.log("No MCP tools were declared by this server.");
      return;
    }
    console.table(tools.map((tool) => ({ name: tool.name, description: tool.description ?? "" })));
  } finally {
    await client.close();
  }
}

async function createExternalMcpClient(options: ToolsOptions): Promise<McpClient> {
  if (options.url) {
    const endpoint = assertAllowedRemoteEndpoint(options.url);
    if (options.legacySse) {
      console.warn(color("Using legacy SSE MCP transport; prefer Streamable HTTP for new servers.", "yellow"));
      return McpClient.connectLegacySse(endpoint);
    }
    return McpClient.connectStreamableHttp(endpoint);
  }
  if (!options.stdioCommand) {
    throw new Error("Specify either --url <endpoint> or --stdio-command <command>");
  }
  return McpClient.connectStdio({
    command: options.stdioCommand,
    args: options.stdioArg ?? [],
    stderr: "pipe",
  });
}

async function createDemoMcpClient(workspacePath: string): Promise<McpClient> {
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

function buildDemoEnvironment(workspacePath: string): Record<string, string> {
  const environment: Record<string, string> = { MINI_AGENT_HARNESS_WORKSPACE: workspacePath };
  for (const key of ["PATH", "Path", "SYSTEMROOT", "SystemRoot", "WINDIR", "ComSpec"] as const) {
    const value = process.env[key];
    if (value) environment[key] = value;
  }
  return environment;
}

function assertAllowedRemoteEndpoint(value: string): URL {
  const endpoint = new URL(value);
  const isLoopback = endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1" || endpoint.hostname === "::1";
  if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && isLoopback)) {
    throw new Error("REMOTE_MCP_URL_REJECTED: use https, or http only for a loopback development server");
  }
  return endpoint;
}

async function expectMissing(path: string, message: string): Promise<void> {
  try {
    await access(path);
  } catch {
    return;
  }
  throw new Error(message);
}
