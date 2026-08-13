import { Command } from "commander";
import { color } from "../../../src/shared/util/logger";
import { invoiceRegressionScenario } from "./demo-scenario";
import { runInvoiceRegressionDemo } from "./demo-runtime";
import { createStreamingLogger } from "./logger";
import { McpClient } from "./mcp-client";
import { DockerSandboxRunner } from "./sandbox-runner";

interface DemoOptions {
  scenario: string;
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

const DEFAULT_TASK = "修复订单金额回归：折扣后总额应为 4050 分，并保留可回滚证据。";

const program = new Command();
program
  .name("mini-agent-harness")
  .description("MCP + Docker sandbox + checkpoint 的最小 Agent Harness")
  .option("--scenario <id>", "可运行教学场景", invoiceRegressionScenario.id)
  .option("--task <text>", "写入受控 task.json 的任务目标", DEFAULT_TASK)
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
  assertSupportedScenario(options.scenario);
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

  console.log(color(`▶ ${invoiceRegressionScenario.id}: MCP task fixture → regression failure → repair → checkpoint rollback`, "cyan"));
  if (options.developmentFallback) {
    console.warn(color("⚠ development-node 仅用于受信任教学 fixture，不提供 Docker 级隔离。", "yellow"));
  }
  const logger = createStreamingLogger({ verbose: options.verbose });
  const outcome = await runInvoiceRegressionDemo({
    sandbox,
    objective: options.task,
    rollback: options.rollback,
    keepWorkspace: options.keepWorkspace,
    onEvent: logger,
  });
  if (!outcome.run.ok) {
    process.exitCode = 1;
    return;
  }

  console.log(color(`✓ demo completed: ${outcome.run.summary}`, "green"));
  console.log(color("✓ result.json verified: subtotal=4500, discount=450, total=4050", "green"));
  if (outcome.rollbackCheckpoint) {
    console.log(color(`✓ rollback verified at checkpoint ${outcome.rollbackCheckpoint.id.slice(0, 8)}: result.json removed and invoice.mjs restored`, "green"));
  }
  if (outcome.workspacePath) {
    console.log(color(`managed workspace retained: ${outcome.workspacePath}`, "yellow"));
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

function assertSupportedScenario(scenario: string): asserts scenario is typeof invoiceRegressionScenario.id {
  if (scenario !== invoiceRegressionScenario.id) {
    throw new Error(`UNKNOWN_DEMO_SCENARIO: ${JSON.stringify(scenario)}; supported: ${invoiceRegressionScenario.id}`);
  }
}

function assertAllowedRemoteEndpoint(value: string): URL {
  const endpoint = new URL(value);
  const isLoopback = endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1" || endpoint.hostname === "::1";
  if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && isLoopback)) {
    throw new Error("REMOTE_MCP_URL_REJECTED: use https, or http only for a loopback development server");
  }
  return endpoint;
}
