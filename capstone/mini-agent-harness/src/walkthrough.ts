/**
 * 面向 README 与站内 Demo Runner 的零 key walkthrough。
 *
 * 不依赖 Docker，故能在学习环境直接执行；输出会明确标明 development-node 不是
 * 安全沙箱。需要验证实际 Docker 隔离时使用 docker-e2e-smoke.ts。
 */
import { color } from "../../../src/shared/util/logger";
import { runInvoiceRegressionDemo } from "./demo-runtime";
import { createStreamingLogger } from "./logger";
import { DevelopmentNodeRunner } from "./sandbox-runner";

async function main(): Promise<void> {
  console.log(color("\n🧪 Mini Agent Harness · Invoice Regression Walkthrough", "cyan"));
  console.log(color("此演示使用 development-node 运行可信 fixture；它展示控制流，不证明 Docker 隔离。\n", "yellow"));
  const outcome = await runInvoiceRegressionDemo({
    sandbox: new DevelopmentNodeRunner(),
    rollback: true,
    onEvent: createStreamingLogger({ verbose: true }),
  });
  if (!outcome.run.ok) {
    throw new Error(outcome.run.error ?? "invoice-regression walkthrough failed");
  }
  console.log(color(`\n✓ result.json passed: ${outcome.run.summary}`, "green"));
  console.log(color("✓ rollback passed: result.json removed; invoice.mjs restored to the intentional 4950-cent baseline", "green"));
  console.log(color("\n下一步：Docker 可用时运行 pnpm mini-agent-harness:docker:e2e 验证同一链路的容器隔离。", "cyan"));
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(color(`mini-agent-harness walkthrough failed: ${message}`, "red"));
  process.exitCode = 1;
});
