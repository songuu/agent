import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ContentReadRepository } from "./contract.ts";
import { loadContentBackendConfig, openContentReadRepository, type ContentRepositoryHandle } from "./repository.ts";
import { DEFAULT_CONTENT_API_PORT, startContentApiServer } from "./server.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadDotenv({ path: resolve(repoRoot, ".env"), override: false });

const enabled = readBooleanEnv("CONTENT_API_ENABLED", false);
let repositoryHandle: ContentRepositoryHandle | null = null;
let repository: ContentReadRepository;
let backendLabel = "disabled";

if (enabled) {
  const backendConfig = loadContentBackendConfig();
  if (!backendConfig) {
    repository = unavailableRepository("CONTENT_API_ENABLED=1 requires a configured content backend.");
    backendLabel = "misconfigured";
  } else {
    repositoryHandle = await openContentReadRepository(backendConfig);
    repository = repositoryHandle.repository;
    backendLabel = backendConfig.driver;
  }
} else {
  repository = unavailableRepository("Content API is disabled.");
}

const port = readIntegerEnv("CONTENT_API_PORT", DEFAULT_CONTENT_API_PORT);
const allowedHosts = readListEnv("CONTENT_API_ALLOWED_HOSTS", ["songuu.top"]);
const allowedOrigins = readListEnv("CONTENT_API_ALLOWED_ORIGINS", ["https://songuu.top"]);
const server = await startContentApiServer({
  repository,
  host: process.env.CONTENT_API_HOST?.trim() || "0.0.0.0",
  port,
  allowedHosts,
  allowedOrigins,
  allowMissingOrigin: readBooleanEnv("CONTENT_API_ALLOW_MISSING_ORIGIN", true),
  onError: (error) => {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`content API read failed: ${detail.slice(0, 500)}`);
  },
});

function shutdown(): void {
  server.close(async () => {
    await repositoryHandle?.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 3000).unref();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
console.log(`content API listening on ${process.env.CONTENT_API_HOST?.trim() || "0.0.0.0"}:${port}; backend=${backendLabel}`);

function unavailableRepository(message: string): ContentReadRepository {
  return {
    async read() {
      throw new Error(message);
    },
  };
}

function readListEnv(name: string, fallback: readonly string[]): string[] {
  const value = process.env[name]?.trim();
  if (!value) return [...fallback];
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