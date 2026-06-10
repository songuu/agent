import { spawn, type ChildProcess } from "node:child_process";
import { isAbsolute } from "node:path";

export interface DemoProcessFrame {
  type: "stdout" | "stderr" | "exit";
  data: string | number;
}

export interface DemoProcessResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}

export interface DemoProcessOptions {
  demoId: string;
  entryPath: string;
  repoRoot: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
  writeFrame: (frame: DemoProcessFrame) => void;
}

const DEFAULT_TIMEOUT_MS = 120_000;

const ENV_ALLOWLIST = [
  "ALLUSERSPROFILE",
  "APPDATA",
  "COMSPEC",
  "HOME",
  "LOCALAPPDATA",
  "PATH",
  "Path",
  "PATHEXT",
  "PROGRAMFILES",
  "PROGRAMFILES(X86)",
  "SYSTEMDRIVE",
  "SYSTEMROOT",
  "TEMP",
  "TMP",
  "USERPROFILE",
  "WINDIR",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "OLLAMA_API_KEY",
  "OLLAMA_BASE_URL",
  "OLLAMA_MODEL",
  "LLM_PROVIDER",
] as const;

export async function runDemoProcess(
  options: DemoProcessOptions,
): Promise<DemoProcessResult> {
  validateRunOptions(options);

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const child = spawn(process.execPath, ["--import", "tsx", options.entryPath], {
    cwd: options.repoRoot,
    env: buildChildEnv(options.env ?? process.env),
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  child.stdout.on("data", (chunk: string) => {
    options.writeFrame({ type: "stdout", data: chunk });
  });
  child.stderr.on("data", (chunk: string) => {
    options.writeFrame({ type: "stderr", data: chunk });
  });

  let timedOut = false;
  let settled = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    options.writeFrame({
      type: "stderr",
      data: `demo "${options.demoId}" timed out after ${timeoutMs}ms\n`,
    });
    killTree(child);
  }, timeoutMs);
  timeout.unref();

  const abortListener = () => {
    options.writeFrame({ type: "stderr", data: `demo "${options.demoId}" stopped\n` });
    killTree(child);
  };
  options.signal?.addEventListener("abort", abortListener, { once: true });

  try {
    return await new Promise<DemoProcessResult>((resolve) => {
      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        options.writeFrame({
          type: "stderr",
          data: `failed to start demo "${options.demoId}": ${error.message}\n`,
        });
        options.writeFrame({ type: "exit", data: 1 });
        resolve({ exitCode: 1, signal: null, timedOut });
      });

      child.on("close", (exitCode, signal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const exitFrame = timedOut ? "timeout" : exitCode ?? signal ?? "unknown";
        options.writeFrame({ type: "exit", data: exitFrame });
        resolve({ exitCode: timedOut ? null : exitCode, signal: signal ?? null, timedOut });
      });
    });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortListener);
  }
}

export function buildChildEnv(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const childEnv: NodeJS.ProcessEnv = {};
  for (const key of ENV_ALLOWLIST) {
    const value = source[key];
    if (value !== undefined) childEnv[key] = value;
  }
  childEnv.FORCE_COLOR = "1";
  return childEnv;
}

export function killTree(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    killer.on("error", () => {
      child.kill("SIGKILL");
    });
    return;
  }
  child.kill("SIGTERM");
}

function validateRunOptions(options: DemoProcessOptions): void {
  if (!options.demoId.trim()) {
    throw new Error("demoId is required");
  }
  if (!isAbsolute(options.entryPath)) {
    throw new Error("entryPath must be absolute");
  }
  if (!isAbsolute(options.repoRoot)) {
    throw new Error("repoRoot must be absolute");
  }
}
