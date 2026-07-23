import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

export interface SupabaseRuntimeConfig {
  readonly version: 1;
  readonly updatedAt: string;
  readonly supabase: {
    readonly url: string;
    readonly anonKey: string;
    readonly schema: string;
  };
}

export interface WriteRuntimeConfigOptions {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly outputPath?: string;
  readonly now?: Date;
  readonly dryRun?: boolean;
}

export interface WriteRuntimeConfigResult {
  readonly status: "written" | "absent";
  readonly outputPath: string;
  readonly publicOrigin: string | null;
}

const DEFAULT_OUTPUT_PATH = resolve(".vitepress/public/supabase-runtime-config.json");

export function resolvePublicSupabaseRuntimeConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
  now = new Date(),
): SupabaseRuntimeConfig | null {
  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url && !anonKey) return null;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 必须同时配置，避免发布半切换的公开配置。",
    );
  }

  const parsedUrl = new URL(url);
  if (!/^https?:$/.test(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 必须是无凭据的 http(s) 地址。");
  }

  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (serviceRoleKey && serviceRoleKey === anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY 不能等于 SUPABASE_SERVICE_ROLE_KEY。");
  }

  return {
    version: 1,
    updatedAt: now.toISOString(),
    supabase: {
      url: parsedUrl.toString().replace(/\/+$/, ""),
      anonKey,
      schema: (env.SUPABASE_SCHEMA ?? "public").trim() || "public",
    },
  };
}

export async function writeSupabaseRuntimeConfig({
  env = process.env,
  outputPath = DEFAULT_OUTPUT_PATH,
  now = new Date(),
  dryRun = false,
}: WriteRuntimeConfigOptions = {}): Promise<WriteRuntimeConfigResult> {
  const absoluteOutputPath = resolve(outputPath);
  const runtimeConfig = resolvePublicSupabaseRuntimeConfig(env, now);

  if (!runtimeConfig) {
    if (!dryRun) await rm(absoluteOutputPath, { force: true });
    return { status: "absent", outputPath: absoluteOutputPath, publicOrigin: null };
  }

  if (!dryRun) {
    await mkdir(dirname(absoluteOutputPath), { recursive: true });
    const temporaryPath = `${absoluteOutputPath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(runtimeConfig, null, 2)}\n`, "utf8");
    await rename(temporaryPath, absoluteOutputPath);
  }

  return {
    status: "written",
    outputPath: absoluteOutputPath,
    publicOrigin: new URL(runtimeConfig.supabase.url).origin,
  };
}

interface CliOptions {
  readonly envFile: string | null;
  readonly outputPath: string;
  readonly dryRun: boolean;
}

export function parseRuntimeConfigCliArgs(args: readonly string[]): CliOptions {
  let envFile: string | null = ".env";
  let outputPath = DEFAULT_OUTPUT_PATH;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--env-file") {
      envFile = requiredOptionValue(args, ++index, arg);
    } else if (arg === "--out") {
      outputPath = requiredOptionValue(args, ++index, arg);
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--no-env-file") {
      envFile = null;
    } else if (arg === "--help" || arg === "-h") {
      throw new Error(
        "Usage: tsx scripts/write-supabase-runtime-config.ts [--env-file .env] [--out .vitepress/public/supabase-runtime-config.json] [--dry-run]",
      );
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { envFile, outputPath, dryRun };
}

function requiredOptionValue(args: readonly string[], index: number, option: string): string {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
}

async function main(): Promise<void> {
  const options = parseRuntimeConfigCliArgs(process.argv.slice(2));
  if (options.envFile && existsSync(options.envFile)) {
    loadDotenv({ path: options.envFile, override: false });
  }

  const result = await writeSupabaseRuntimeConfig({
    outputPath: options.outputPath,
    dryRun: options.dryRun,
  });
  if (result.status === "written") {
    process.stdout.write(`Supabase runtime config ${options.dryRun ? "would be written" : "written"}: ${result.publicOrigin}\n`);
  } else {
    process.stdout.write("Supabase runtime config absent: public Supabase env is not configured.\n");
  }
}

const invokedPath = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (invokedPath.endsWith("/write-supabase-runtime-config.ts")) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

