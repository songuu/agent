/**
 * Docker-first 的短生命周期执行器。
 *
 * Docker 是唯一可以称为隔离沙箱的运行模式；development-node fallback 仅为了本地
 * 教学/demo 在未启动 Docker 时可运行，它没有 filesystem/process 隔离，返回值会
 * 明确标记 isolation: "development-node"。
 */
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { PassThrough } from "node:stream";
import Docker from "dockerode";
import { assertManagedWorkspace } from "./checkpoint";
import { SandboxPolicy, SandboxPolicyError } from "./sandbox-policy";
import type { SandboxGateway, SandboxRequest, SandboxResult, SandboxRuntime } from "./types";

export interface DockerDaemonPreflight {
  available: boolean;
  error?: string;
}

export interface DockerSandboxRunnerOptions {
  docker?: Docker;
  images?: Partial<Record<SandboxRuntime, string>>;
  defaultTimeoutMs?: number;
  memoryBytes?: number;
  nanoCpus?: number;
  pidsLimit?: number;
  maxOutputBytes?: number;
  /** 默认 disabled；只有显式选择 node 才会启动非隔离的本地 fallback。 */
  developmentFallback?: "disabled" | "node";
  policy?: SandboxPolicy;
}

export const DEFAULT_DOCKER_IMAGES: Readonly<Record<SandboxRuntime, string>> = Object.freeze({
  node: "node:20-alpine",
  python: "python:3.12-alpine",
  bash: "bash:5.2-alpine",
});

interface ExecutionFile {
  hostPath: string;
  containerPath: string;
}

interface ExecutionOutcome {
  exitCode: number | null;
  timedOut: boolean;
}

interface CapturedOutput {
  readonly stdout: PassThrough;
  readonly stderr: PassThrough;
  read(): { stdout: string; stderr: string };
}

/**
 * 默认的 Docker 隔离运行器。构造并不连接 daemon；run() 会先执行 ping preflight，
 * 因此 CLI 可将 daemon 不可用与代码执行失败分开显示。
 */
export class DockerSandboxRunner implements SandboxGateway {
  private readonly docker: Docker;
  private readonly images: Readonly<Record<SandboxRuntime, string>>;
  private readonly defaultTimeoutMs: number;
  private readonly memoryBytes: number;
  private readonly nanoCpus: number;
  private readonly pidsLimit: number;
  private readonly maxOutputBytes: number;
  private readonly developmentFallback: "disabled" | "node";
  private readonly policy: SandboxPolicy;
  private readonly nodeFallback: DevelopmentNodeRunner;

  public constructor(options: DockerSandboxRunnerOptions = {}) {
    this.docker = options.docker ?? new Docker();
    this.images = { ...DEFAULT_DOCKER_IMAGES, ...options.images };
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;
    this.memoryBytes = options.memoryBytes ?? 256 * 1024 * 1024;
    this.nanoCpus = options.nanoCpus ?? 500_000_000;
    this.pidsLimit = options.pidsLimit ?? 64;
    this.maxOutputBytes = options.maxOutputBytes ?? 1_024 * 1_024;
    this.developmentFallback = options.developmentFallback ?? "disabled";
    this.policy = options.policy ?? new SandboxPolicy();
    assertPositiveInteger("defaultTimeoutMs", this.defaultTimeoutMs, 100, 30_000);
    assertPositiveInteger("memoryBytes", this.memoryBytes, 16 * 1024 * 1024);
    assertPositiveInteger("nanoCpus", this.nanoCpus, 10_000_000);
    assertPositiveInteger("pidsLimit", this.pidsLimit, 1, 512);
    assertPositiveInteger("maxOutputBytes", this.maxOutputBytes, 1_024, 8 * 1_024 * 1_024);
    this.nodeFallback = new DevelopmentNodeRunner({
      defaultTimeoutMs: this.defaultTimeoutMs,
      maxOutputBytes: this.maxOutputBytes,
      policy: this.policy,
    });
  }

  public async preflight(): Promise<DockerDaemonPreflight> {
    try {
      await this.docker.ping();
      return { available: true };
    } catch (error) {
      return { available: false, error: safeErrorMessage(error) };
    }
  }

  public async run(request: SandboxRequest, workspacePath: string): Promise<SandboxResult> {
    const policyDecision = this.policy.validate(request);
    if (!policyDecision.ok) {
      return rejectedResult(policyDecision.violations.map((item) => item.code).join(", "));
    }

    let managedWorkspace: string;
    try {
      managedWorkspace = await assertManagedWorkspace(workspacePath);
    } catch (error) {
      return failedResult(`UNMANAGED_WORKSPACE: ${safeErrorMessage(error)}`, "docker");
    }

    const preflight = await this.preflight();
    if (!preflight.available) {
      if (this.developmentFallback === "node") {
        return this.nodeFallback.run(request, managedWorkspace);
      }
      return failedResult(`DOCKER_UNAVAILABLE: ${preflight.error ?? "daemon ping failed"}`, "docker");
    }

    return this.runInDocker(request, managedWorkspace);
  }

  private async runInDocker(request: SandboxRequest, workspacePath: string): Promise<SandboxResult> {
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    let executionFile: ExecutionFile | undefined;
    let container: Docker.Container | undefined;
    let attached: NodeJS.ReadWriteStream | undefined;
    let result: SandboxResult | undefined;
    let cleanupError: string | undefined;
    const output = createOutputCollector(this.maxOutputBytes);

    try {
      executionFile = await writeExecutionFile(workspacePath, request.runtime, request.code);
      const command = runtimeCommand(request.runtime, executionFile.containerPath);
      container = await this.docker.createContainer(
        buildDockerContainerOptions({
          image: this.images[request.runtime],
          command,
          workspacePath,
          memoryBytes: this.memoryBytes,
          nanoCpus: this.nanoCpus,
          pidsLimit: this.pidsLimit,
        }),
      );
      attached = await container.attach({ stream: true, stdout: true, stderr: true, logs: false });
      this.docker.modem.demuxStream(attached, output.stdout, output.stderr);
      await container.start();
      const outcome = await waitForContainer(container, timeoutMs);
      const logs = output.read();
      result = {
        ok: !outcome.timedOut && outcome.exitCode === 0,
        exitCode: outcome.exitCode,
        stdout: logs.stdout,
        stderr: logs.stderr,
        timedOut: outcome.timedOut,
        isolation: "docker",
        ...(!outcome.timedOut && outcome.exitCode === 0
          ? {}
          : {
              error: withStderr(
                outcome.timedOut ? `SANDBOX_TIMEOUT: exceeded ${timeoutMs}ms` : "SANDBOX_EXIT_NONZERO",
                logs.stderr,
              ),
            }),
      };
    } catch (error) {
      const logs = output.read();
      result = {
        ok: false,
        exitCode: null,
        stdout: logs.stdout,
        stderr: logs.stderr,
        timedOut: false,
        isolation: "docker",
        error: `SANDBOX_DOCKER_ERROR: ${safeErrorMessage(error)}`,
      };
    } finally {
      destroyAttachedStream(attached);
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (error) {
          cleanupError = `SANDBOX_CLEANUP_FAILED: ${safeErrorMessage(error)}`;
        }
      }
      if (executionFile) {
        await rm(executionFile.hostPath, { force: true }).catch((error: unknown) => {
          cleanupError ??= `SANDBOX_SCRIPT_CLEANUP_FAILED: ${safeErrorMessage(error)}`;
        });
      }
    }

    const completed = result ?? failedResult("SANDBOX_UNKNOWN_FAILURE", "docker");
    if (!cleanupError) return completed;
    return {
      ...completed,
      ok: false,
      error: completed.error ? `${completed.error}; ${cleanupError}` : cleanupError,
    };
  }
}

/**
 * 明确的 development-only fallback。它会最小化环境变量并有超时/输出上限，
 * 但仍能访问宿主文件系统和进程，因此绝不能视为安全沙箱。
 */
export class DevelopmentNodeRunner implements SandboxGateway {
  private readonly defaultTimeoutMs: number;
  private readonly maxOutputBytes: number;
  private readonly policy: SandboxPolicy;

  public constructor(options: Pick<DockerSandboxRunnerOptions, "defaultTimeoutMs" | "maxOutputBytes" | "policy"> = {}) {
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;
    this.maxOutputBytes = options.maxOutputBytes ?? 1_024 * 1_024;
    this.policy = options.policy ?? new SandboxPolicy();
  }

  public async run(request: SandboxRequest, workspacePath: string): Promise<SandboxResult> {
    const decision = this.policy.validate(request);
    if (!decision.ok) return rejectedResult(decision.violations.map((item) => item.code).join(", "), "development-node");
    if (request.runtime !== "node") {
      return failedResult("DEVELOPMENT_FALLBACK_UNSUPPORTED: only node runtime is available without Docker", "development-node");
    }

    let managedWorkspace: string;
    try {
      managedWorkspace = await assertManagedWorkspace(workspacePath);
    } catch (error) {
      return failedResult(`UNMANAGED_WORKSPACE: ${safeErrorMessage(error)}`, "development-node");
    }

    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    let executionFile: ExecutionFile | undefined;
    try {
      executionFile = await writeExecutionFile(managedWorkspace, request.runtime, request.code);
      const output = await runNodeProcess(managedWorkspace, executionFile.hostPath, timeoutMs, this.maxOutputBytes);
      return {
        ok: !output.timedOut && output.exitCode === 0,
        exitCode: output.exitCode,
        stdout: output.stdout,
        stderr: output.stderr,
        timedOut: output.timedOut,
        isolation: "development-node",
        ...(!output.timedOut && output.exitCode === 0
          ? {}
          : {
              error: withStderr(
                output.timedOut ? `DEVELOPMENT_TIMEOUT: exceeded ${timeoutMs}ms` : "DEVELOPMENT_NODE_EXIT_NONZERO",
                output.stderr,
              ),
            }),
      };
    } catch (error) {
      return failedResult(`DEVELOPMENT_NODE_ERROR: ${safeErrorMessage(error)}`, "development-node");
    } finally {
      if (executionFile) await rm(executionFile.hostPath, { force: true }).catch(() => undefined);
    }
  }
}

/**
 * 导出为纯函数方便审计/测试：只有一个 workspace bind mount，且网络、rootfs、
 * capabilities、privileges、PID/CPU/内存与 daemon log 均被显式限制。
 */
export function buildDockerContainerOptions(input: {
  image: string;
  command: string[];
  workspacePath: string;
  memoryBytes: number;
  nanoCpus: number;
  pidsLimit: number;
}) {
  return {
    Image: input.image,
    Cmd: input.command,
    WorkingDir: "/workspace",
    User: "65532:65532",
    AttachStdout: true,
    AttachStderr: true,
    OpenStdin: false,
    Tty: false,
    NetworkDisabled: true,
    Env: [
      "HOME=/tmp",
      "TMPDIR=/tmp",
      "PYTHONDONTWRITEBYTECODE=1",
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    ],
    Labels: { "mini-agent-harness.managed": "true" },
    HostConfig: {
      NetworkMode: "none",
      ReadonlyRootfs: true,
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges:true"],
      PidsLimit: input.pidsLimit,
      NanoCpus: input.nanoCpus,
      Memory: input.memoryBytes,
      Mounts: [
        {
          Type: "bind" as const,
          Source: input.workspacePath,
          Target: "/workspace",
          ReadOnly: false,
        },
      ],
      // 不写 daemon JSON log，stdout/stderr 仅通过 attach 流受 maxOutputBytes 限制收集。
      LogConfig: { Type: "none", Config: {} },
      Tmpfs: { "/tmp": "rw,nosuid,nodev,noexec,size=64m" },
    },
  };
}

/** 兼容更简短的构造名，底层仍是 DockerSandboxRunner。 */
export { DockerSandboxRunner as SandboxRunner };

function runtimeCommand(runtime: SandboxRuntime, executionPath: string): string[] {
  switch (runtime) {
    case "node":
      return ["node", executionPath];
    case "python":
      return ["python", executionPath];
    case "bash":
      return ["bash", executionPath];
  }
}

async function writeExecutionFile(workspacePath: string, runtime: SandboxRuntime, code: string): Promise<ExecutionFile> {
  const extension: Record<SandboxRuntime, string> = { node: "mjs", python: "py", bash: "sh" };
  const name = `.mini-agent-harness-run-${randomUUID()}.${extension[runtime]}`;
  const hostPath = join(workspacePath, name);
  await writeFile(hostPath, code, { encoding: "utf8", mode: 0o644 });
  return { hostPath, containerPath: `/workspace/${name}` };
}

async function waitForContainer(container: Docker.Container, timeoutMs: number): Promise<ExecutionOutcome> {
  const waitPromise = container.wait().then((result) => ({ kind: "exited" as const, result }));
  let timer: NodeJS.Timeout | undefined;
  try {
    const outcome = await Promise.race([
      waitPromise,
      new Promise<{ kind: "timeout" }>((resolveTimeout) => {
        timer = setTimeout(() => resolveTimeout({ kind: "timeout" }), timeoutMs);
      }),
    ]);
    if (outcome.kind === "exited") {
      const status = outcome.result.StatusCode;
      return { exitCode: typeof status === "number" ? status : null, timedOut: false };
    }

    await container.kill({ signal: "SIGKILL" }).catch(() => undefined);
    const afterKill = await waitPromise.catch(() => undefined);
    const status = afterKill?.result.StatusCode;
    return { exitCode: typeof status === "number" ? status : null, timedOut: true };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runNodeProcess(
  workspacePath: string,
  executionPath: string,
  timeoutMs: number,
  maxOutputBytes: number,
): Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  const output = createByteCollector(maxOutputBytes);
  const child = spawn(process.execPath, [executionPath], {
    cwd: workspacePath,
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    // Reduces accidental secret inheritance but does not turn this into a sandbox.
    env: {
      PATH: process.env.PATH ?? "",
      HOME: workspacePath,
      USERPROFILE: workspacePath,
      TMPDIR: workspacePath,
      TEMP: workspacePath,
      TMP: workspacePath,
    },
  });
  child.stdout.on("data", (chunk: Buffer) => output.stdout.write(chunk));
  child.stderr.on("data", (chunk: Buffer) => output.stderr.write(chunk));

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);
  try {
    const completion = await new Promise<{ exitCode: number | null; error?: Error }>((resolveCompletion) => {
      child.once("error", (error) => resolveCompletion({ exitCode: null, error }));
      child.once("close", (exitCode) => resolveCompletion({ exitCode }));
    });
    const logs = output.read();
    if (completion.error) {
      return { exitCode: null, stdout: logs.stdout, stderr: `${logs.stderr}${safeErrorMessage(completion.error)}`, timedOut };
    }
    return { exitCode: completion.exitCode, stdout: logs.stdout, stderr: logs.stderr, timedOut };
  } finally {
    clearTimeout(timeout);
    output.stdout.end();
    output.stderr.end();
  }
}

function createOutputCollector(maxOutputBytes: number): CapturedOutput {
  const output = createByteCollector(maxOutputBytes);
  return {
    stdout: output.stdout,
    stderr: output.stderr,
    read: output.read,
  };
}

function createByteCollector(maxOutputBytes: number): CapturedOutput {
  let capturedBytes = 0;
  let truncated = false;
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  const capture = (target: Buffer[], chunk: Buffer | string): void => {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const available = Math.max(0, maxOutputBytes - capturedBytes);
    if (available === 0) {
      truncated = true;
      return;
    }
    const accepted = bytes.subarray(0, available);
    target.push(accepted);
    capturedBytes += accepted.length;
    if (accepted.length < bytes.length) truncated = true;
  };
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  stdout.on("data", (chunk: Buffer) => capture(stdoutChunks, chunk));
  stderr.on("data", (chunk: Buffer) => capture(stderrChunks, chunk));
  return {
    stdout,
    stderr,
    read: (): { stdout: string; stderr: string } => ({
      stdout: `${Buffer.concat(stdoutChunks).toString("utf8")}${truncated ? "\n[output truncated]" : ""}`,
      stderr: Buffer.concat(stderrChunks).toString("utf8"),
    }),
  };
}

function rejectedResult(reason: string, isolation: SandboxResult["isolation"] = "docker"): SandboxResult {
  return {
    ok: false,
    exitCode: null,
    stdout: "",
    stderr: "",
    timedOut: false,
    isolation,
    error: `SANDBOX_POLICY_REJECTED: ${reason}`,
  };
}

function failedResult(error: string, isolation: SandboxResult["isolation"]): SandboxResult {
  return { ok: false, exitCode: null, stdout: "", stderr: "", timedOut: false, isolation, error };
}

function assertPositiveInteger(name: string, value: number, minimum: number, maximum = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`INVALID_SANDBOX_OPTION: ${name} must be an integer between ${minimum} and ${maximum}`);
  }
}

function destroyAttachedStream(stream: NodeJS.ReadWriteStream | undefined): void {
  // dockerode 的声明返回 NodeJS.ReadWriteStream，但实际对象是可 destroy 的 Node stream。
  const destroyable = stream as (NodeJS.ReadWriteStream & { destroy?: () => void }) | undefined;
  destroyable?.destroy?.();
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof SandboxPolicyError) return error.message;
  const message = error instanceof Error ? error.message : String(error);
  return message.length <= 300 ? message : `${message.slice(0, 299)}…`;
}

/** AgentLoop 会把 error 优先作为 correction feedback，因此保留受限 stderr 的首段。 */
function withStderr(prefix: string, stderr: string): string {
  const normalized = stderr.replace(/\s+/g, " ").trim();
  if (!normalized) return prefix;
  const limit = 320;
  const detail = normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`;
  return `${prefix}: ${detail}`;
}
