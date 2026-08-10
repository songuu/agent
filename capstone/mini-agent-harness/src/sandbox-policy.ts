/**
 * 执行前的静态拒绝策略。
 *
 * 它不是安全沙箱的替代品：Docker 隔离才是主防线。Policy 的职责是尽早拒绝
 * 明显的破坏性操作、工作区逃逸与环境变量读取，尤其避免 development fallback
 * 被误用成可访问宿主机 secrets 的执行器。
 */
import type { SandboxRequest, SandboxRuntime } from "./types";

export type SandboxPolicyViolationCode =
  | "INVALID_REQUEST"
  | "CODE_TOO_LARGE"
  | "INVALID_TIMEOUT"
  | "WORKSPACE_ESCAPE"
  | "SENSITIVE_PATH"
  | "ENVIRONMENT_ACCESS"
  | "DESTRUCTIVE_COMMAND"
  | "NETWORK_COMMAND"
  | "NESTED_CONTAINER_COMMAND";

export interface SandboxPolicyViolation {
  code: SandboxPolicyViolationCode;
  message: string;
}

export interface SandboxPolicyDecision {
  ok: boolean;
  violations: readonly SandboxPolicyViolation[];
}

export interface SandboxPolicyOptions {
  maxCodeBytes?: number;
  maxTimeoutMs?: number;
}

export class SandboxPolicyError extends Error {
  public readonly violations: readonly SandboxPolicyViolation[];

  public constructor(violations: readonly SandboxPolicyViolation[]) {
    super(`SANDBOX_POLICY_REJECTED: ${violations.map((item) => item.code).join(", ")}`);
    this.name = "SandboxPolicyError";
    this.violations = violations;
  }
}

const VALID_RUNTIMES = new Set<SandboxRuntime>(["node", "python", "bash"]);

const SENSITIVE_PATH_PATTERNS: readonly RegExp[] = [
  /(?:^|[\s"'`()])\/(?:etc|proc|sys|dev|root|run\/secrets)(?:[\s/"'`()]|$)/i,
  /(?:^|[\s"'`()])[a-z]:\\(?:windows|users|program files)(?:\\|[\s"'`()]|$)/i,
];

const DESTRUCTIVE_COMMAND_PATTERNS: readonly RegExp[] = [
  /\brm\s+-[^\n]*[rf][^\n]*\s+\/(?:\s|$|\*)/i,
  /\b(?:del|erase|rmdir|rd)\s+(?:\/[^\s]+\s+)*(?:[a-z]:\\|\\\\)/i,
  /\b(?:mkfs(?:\.[a-z0-9]+)?|fdisk|parted)\b/i,
  /\bdd\s+if=/i,
  /\b(?:shutdown|reboot|poweroff|halt)\b/i,
  /\binit\s+[06]\b/i,
  /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/,
  /\b(?:chmod|chown)\s+-R\s+[^\n]*(?:\/|\\)/i,
];

const ENVIRONMENT_ACCESS_PATTERNS: readonly RegExp[] = [
  /\bprocess\.env\b/,
  /\b(?:os\.environ|os\.getenv)\b/,
  /\$(?:\{)?(?:AWS_[A-Z0-9_]*|OPENAI_[A-Z0-9_]*|ANTHROPIC_[A-Z0-9_]*|GITHUB_TOKEN|SSH_AUTH_SOCK|DOCKER_HOST|HOME|USERPROFILE)(?:\})?\b/i,
  /%(?:AWS_[A-Z0-9_]*|OPENAI_[A-Z0-9_]*|ANTHROPIC_[A-Z0-9_]*|GITHUB_TOKEN|SSH_AUTH_SOCK|DOCKER_HOST|HOME|USERPROFILE)%/i,
  /\b(?:AWS_[A-Z0-9_]*|OPENAI_[A-Z0-9_]*|ANTHROPIC_[A-Z0-9_]*|GITHUB_TOKEN|SSH_AUTH_SOCK|DOCKER_HOST)\b/i,
];

const NETWORK_COMMAND_PATTERN = /\b(?:curl|wget|nc|ncat|netcat|ssh|scp|ftp|telnet)\b/i;
const NESTED_CONTAINER_PATTERN = /\b(?:docker|podman|nerdctl|kubectl)\b/i;

/** 默认 policy；调用方仍应将执行交给 DockerSandboxRunner。 */
export class SandboxPolicy {
  private readonly maxCodeBytes: number;
  private readonly maxTimeoutMs: number;

  public constructor(options: SandboxPolicyOptions = {}) {
    this.maxCodeBytes = options.maxCodeBytes ?? 64 * 1024;
    this.maxTimeoutMs = options.maxTimeoutMs ?? 30_000;
  }

  public validate(request: SandboxRequest): SandboxPolicyDecision {
    const violations: SandboxPolicyViolation[] = [];
    if (!request || typeof request !== "object" || !VALID_RUNTIMES.has(request.runtime)) {
      violations.push({ code: "INVALID_REQUEST", message: "runtime must be node, python, or bash" });
      return { ok: false, violations };
    }
    if (typeof request.code !== "string" || request.code.trim().length === 0 || request.code.includes("\0")) {
      violations.push({ code: "INVALID_REQUEST", message: "code must be a non-empty text payload without NUL bytes" });
      return { ok: false, violations };
    }
    if (Buffer.byteLength(request.code, "utf8") > this.maxCodeBytes) {
      violations.push({
        code: "CODE_TOO_LARGE",
        message: `code exceeds the ${this.maxCodeBytes}-byte sandbox policy limit`,
      });
    }
    if (
      request.timeoutMs !== undefined &&
      (!Number.isSafeInteger(request.timeoutMs) || request.timeoutMs < 100 || request.timeoutMs > this.maxTimeoutMs)
    ) {
      violations.push({
        code: "INVALID_TIMEOUT",
        message: `timeoutMs must be an integer between 100 and ${this.maxTimeoutMs}`,
      });
    }

    if (/\.\.(?:[\\/]|$)/.test(request.code)) {
      violations.push({ code: "WORKSPACE_ESCAPE", message: "parent-directory traversal is not allowed" });
    }
    if (SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(request.code))) {
      violations.push({ code: "SENSITIVE_PATH", message: "host-sensitive filesystem paths are not allowed" });
    }
    if (ENVIRONMENT_ACCESS_PATTERNS.some((pattern) => pattern.test(request.code))) {
      violations.push({ code: "ENVIRONMENT_ACCESS", message: "reading environment variables is not allowed" });
    }
    if (DESTRUCTIVE_COMMAND_PATTERNS.some((pattern) => pattern.test(request.code))) {
      violations.push({ code: "DESTRUCTIVE_COMMAND", message: "destructive system commands are not allowed" });
    }
    if (NETWORK_COMMAND_PATTERN.test(request.code)) {
      violations.push({ code: "NETWORK_COMMAND", message: "network commands are not allowed" });
    }
    if (NESTED_CONTAINER_PATTERN.test(request.code)) {
      violations.push({ code: "NESTED_CONTAINER_COMMAND", message: "nested container/orchestrator commands are not allowed" });
    }
    return { ok: violations.length === 0, violations };
  }

  public assertAllowed(request: SandboxRequest): void {
    const decision = this.validate(request);
    if (!decision.ok) throw new SandboxPolicyError(decision.violations);
  }
}

export function validateSandboxRequest(
  request: SandboxRequest,
  options?: SandboxPolicyOptions,
): SandboxPolicyDecision {
  return new SandboxPolicy(options).validate(request);
}
