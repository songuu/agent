import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDemoRegistry } from "./registry.mjs";
import { runDemoProcess } from "./runner.mjs";
import { createSelectionChatHandler } from "./selection-chat.mjs";
import {
  DEFAULT_RUNNER_HOST,
  DEFAULT_RUNNER_PORT,
  startDemoRunnerServer,
} from "./server.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: resolve(repoRoot, ".env") });

const port = readIntegerEnv("DEMO_RUNNER_PORT", DEFAULT_RUNNER_PORT);
const allowedHosts = readListEnv("DEMO_RUNNER_ALLOWED_HOSTS", ["songuu.top"]);
const allowedOrigins = readListEnv("DEMO_RUNNER_ALLOWED_ORIGINS", ["https://songuu.top"]);
const requireToken = readBooleanEnv("DEMO_RUNNER_REQUIRE_TOKEN", false);
const allowMissingOrigin = readBooleanEnv("DEMO_RUNNER_ALLOW_MISSING_ORIGIN", true);

const registry = buildDemoRegistry(repoRoot);
const server = await startDemoRunnerServer({
  repoRoot,
  port,
  allowedHosts,
  allowedOrigins,
  requireToken,
  allowMissingOrigin,
  writeTokenFile: false,
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
  selectionChat: createSelectionChatHandler(),
});

function shutdown(): void {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000).unref();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log(`demo runner production listening on ${DEFAULT_RUNNER_HOST}:${port}`);
console.log(`allowed hosts: ${allowedHosts.join(", ")}`);
console.log(`allowed origins: ${allowedOrigins.join(", ")}`);

function readListEnv(name: string, fallback: string[]): string[] {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "yes";
}

function readIntegerEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
