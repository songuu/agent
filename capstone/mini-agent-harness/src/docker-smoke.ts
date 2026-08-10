/** Docker isolation 的手动验收。daemon 或镜像不可用属于环境阻塞，退出码为 2。 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createManagedWorkspace } from "./checkpoint";
import { DockerSandboxRunner } from "./sandbox-runner";

async function main(): Promise<void> {
  const workspace = await createManagedWorkspace("docker-smoke");
  try {
    await writeFile(join(workspace.workspacePath, "input.txt"), "isolated fixture\n", "utf8");
    const runner = new DockerSandboxRunner({ defaultTimeoutMs: 1_000 });
    const preflight = await runner.preflight();
    if (!preflight.available) {
      console.error(`SANDBOX_DOCKER_UNAVAILABLE: ${preflight.error ?? "daemon ping failed"}`);
      process.exitCode = 2;
      return;
    }

    const success = await runner.run(
      {
        runtime: "node",
        code: [
          'import { readFileSync, writeFileSync } from "node:fs";',
          'writeFileSync("docker-result.txt", readFileSync("input.txt", "utf8").toUpperCase());',
          'console.log("docker write complete");',
        ].join("\n"),
      },
      workspace.workspacePath,
    );
    assert.equal(success.ok, true, `${success.error ?? "unknown Docker failure"}\n${success.stderr}`);
    assert.equal(success.isolation, "docker");
    assert.match(await readFile(join(workspace.workspacePath, "docker-result.txt"), "utf8"), /ISOLATED FIXTURE/);

    const timeout = await runner.run(
      {
        runtime: "node",
        timeoutMs: 100,
        code: 'setTimeout(() => console.log("too late"), 10_000);',
      },
      workspace.workspacePath,
    );
    assert.equal(timeout.ok, false);
    assert.equal(timeout.timedOut, true, timeout.error);
    console.log("✅ mini-agent-harness Docker smoke passed: hardened container write + timeout kill");
  } finally {
    await workspace.cleanup().catch(() => undefined);
  }
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
