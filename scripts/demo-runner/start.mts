import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDemoRegistry } from "./registry.mjs";
import { runDemoProcess } from "./runner.mjs";
import {
  DEFAULT_RUNNER_HOST,
  DEFAULT_RUNNER_PORT,
  startDemoRunnerServer,
} from "./server.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: resolve(repoRoot, ".env") });
process.env.DEMO_RUNNER_ENABLED = "1";

const registry = buildDemoRegistry(repoRoot);
const server = await startDemoRunnerServer({
  repoRoot,
  runDemo: async ({ demoId, signal, writeFrame }) => {
    const demo = registry.get(demoId);
    if (!demo) {
      writeFrame({ type: "stderr", data: `unknown demo id: ${demoId}\n` });
      writeFrame({ type: "exit", data: 1 });
      return;
    }

    await runDemoProcess({
      demoId,
      entryPath: demo.realpath,
      repoRoot,
      signal,
      writeFrame,
    });
  },
});

function shutdown(): void {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000).unref();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log(`demo runner listening on ${DEFAULT_RUNNER_HOST}:${DEFAULT_RUNNER_PORT}`);
console.log("dev-only: do not expose or proxy this server.");
