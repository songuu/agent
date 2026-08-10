/**
 * 受控工作区与 checkpoint 后端。
 *
 * 这里的边界是刻意严格的：checkpoint 只能操作由 createManagedWorkspace()
 * 创建、且仍位于系统临时目录专属根目录下的目录。它不是通用的 Git/文件回滚
 * 工具，因此不会意外触碰调用者的仓库。
 */
import { createHash, randomUUID } from "node:crypto";
import {
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { simpleGit, type SimpleGit } from "simple-git";
import type { CheckpointGateway, CheckpointRef } from "./types";

export const MANAGED_WORKSPACE_MARKER = ".mini-agent-harness-workspace";
const MANAGED_WORKSPACE_MARKER_CONTENT = "mini-agent-harness-workspace/v1\n";
const MANAGED_ROOT_NAME = "mini-agent-harness";
const CHECKPOINT_STORE_MARKER = ".mini-agent-harness-checkpoint-store";

export type CheckpointStrategy = Extract<CheckpointRef["strategy"], "file" | "git">;

export interface ManagedWorkspace {
  /** 绝对路径；只应传给本项目的 MCP/Sandbox/Checkpoint 模块。 */
  workspacePath: string;
  /** 删除这个临时工作区及其 file-checkpoint sidecar。重复调用安全。 */
  cleanup(): Promise<void>;
}

export interface CheckpointStoreOptions {
  workspacePath: string;
  /** 默认 file；git 后端会在受控临时工作区内新建自己的 Git 仓库。 */
  strategy?: CheckpointStrategy;
}

interface StoredCheckpoint {
  ref: CheckpointRef;
  /** file 快照路径或 git commit SHA；不暴露给 AgentLoop。 */
  storageRef: string;
}

/**
 * 创建唯一、带 marker 的受控临时目录。
 *
 * 不接受调用者指定绝对路径，避免 "为了方便回滚" 而把用户仓库纳入操作范围。
 */
export async function createManagedWorkspace(prefix = "workspace"): Promise<ManagedWorkspace> {
  const root = await ensureManagedRoot();
  const safePrefix = normalizePrefix(prefix);
  const workspacePath = await mkdtemp(join(root, `${safePrefix}-`));
  await writeFile(join(workspacePath, MANAGED_WORKSPACE_MARKER), MANAGED_WORKSPACE_MARKER_CONTENT, {
    encoding: "utf8",
    mode: 0o600,
  });

  // Docker 内使用非 root UID。临时目录本身无敏感内容，允许该 UID 写入受控挂载。
  await chmod(workspacePath, 0o777).catch(() => undefined);

  let cleaned = false;
  return {
    workspacePath,
    cleanup: async (): Promise<void> => {
      if (cleaned) return;
      const resolvedWorkspace = await assertManagedWorkspace(workspacePath);
      await rm(resolvedWorkspace, { recursive: true, force: false });
      await rm(await checkpointStorePath(resolvedWorkspace), { recursive: true, force: true });
      cleaned = true;
    },
  };
}

/**
 * 断言目录是本模块创建的临时工作区，并返回真实绝对路径。
 *
 * marker 既防止路径误传，也让调用点在删除/重置前必须显式通过这道边界。
 */
export async function assertManagedWorkspace(workspacePath: string): Promise<string> {
  if (typeof workspacePath !== "string" || workspacePath.trim().length === 0) {
    throw new Error("UNMANAGED_WORKSPACE: workspacePath must be a non-empty string");
  }

  const root = await ensureManagedRoot();
  let resolvedWorkspace: string;
  try {
    resolvedWorkspace = await realpath(resolve(workspacePath));
  } catch {
    throw new Error("UNMANAGED_WORKSPACE: workspace does not exist");
  }

  if (!isChildPath(root, resolvedWorkspace)) {
    throw new Error("UNMANAGED_WORKSPACE: workspace must live under the harness temporary root");
  }

  const workspaceStat = await lstat(resolvedWorkspace);
  if (!workspaceStat.isDirectory() || workspaceStat.isSymbolicLink()) {
    throw new Error("UNMANAGED_WORKSPACE: workspace must be a real directory");
  }

  const markerPath = join(resolvedWorkspace, MANAGED_WORKSPACE_MARKER);
  let markerStat;
  try {
    markerStat = await lstat(markerPath);
  } catch {
    throw new Error("UNMANAGED_WORKSPACE: workspace marker is missing");
  }
  if (!markerStat.isFile() || markerStat.isSymbolicLink()) {
    throw new Error("UNMANAGED_WORKSPACE: workspace marker is invalid");
  }

  const marker = await readFile(markerPath, "utf8");
  if (marker !== MANAGED_WORKSPACE_MARKER_CONTENT) {
    throw new Error("UNMANAGED_WORKSPACE: workspace marker content is invalid");
  }
  return resolvedWorkspace;
}

/**
 * File/Git 两种实现共用的 gateway。Git 模式在第一次 checkpoint 时才初始化，
 * 且拒绝复用已有 .git 目录，确保永远不是用户仓库。
 */
export class CheckpointStore implements CheckpointGateway {
  private readonly strategy: CheckpointStrategy;
  private readonly checkpoints = new Map<string, StoredCheckpoint>();
  private disposed = false;
  private git: SimpleGit | undefined;
  private gitInitialized = false;

  public constructor(private readonly options: CheckpointStoreOptions) {
    this.strategy = options.strategy ?? "file";
    if (this.strategy !== "file" && this.strategy !== "git") {
      throw new Error(`INVALID_CHECKPOINT_STRATEGY: ${String(this.strategy)}`);
    }
  }

  public async create(label: string): Promise<CheckpointRef> {
    this.assertNotDisposed();
    const normalizedLabel = normalizeLabel(label);
    const workspacePath = await assertManagedWorkspace(this.options.workspacePath);
    await assertWorkspaceHasNoSymlinks(workspacePath);

    const ref: CheckpointRef = {
      id: randomUUID(),
      label: normalizedLabel,
      createdAt: new Date().toISOString(),
      strategy: this.strategy,
    };

    if (this.strategy === "file") {
      const snapshotPath = join(await checkpointStorePath(workspacePath), ref.id);
      await mkdir(await checkpointStorePath(workspacePath), { recursive: true });
      await writeFile(
        join(await checkpointStorePath(workspacePath), CHECKPOINT_STORE_MARKER),
        "mini-agent-harness-checkpoint-store/v1\n",
        "utf8",
      );
      await cp(workspacePath, snapshotPath, { recursive: true, force: false, errorOnExist: true });
      this.checkpoints.set(ref.id, { ref, storageRef: snapshotPath });
      return ref;
    }

    const git = await this.getManagedGit(workspacePath);
    await git.raw(["add", "--all"]);
    await git.raw(["commit", "--allow-empty", "-m", `checkpoint: ${normalizedLabel}`]);
    const commit = (await git.revparse("HEAD")).trim();
    if (!/^[0-9a-f]{40,64}$/i.test(commit)) {
      throw new Error("GIT_CHECKPOINT_FAILED: Git did not return a commit SHA");
    }
    this.checkpoints.set(ref.id, { ref, storageRef: commit });
    return ref;
  }

  public async rollback(checkpoint: CheckpointRef): Promise<void> {
    this.assertNotDisposed();
    const stored = this.checkpoints.get(checkpoint.id);
    if (!stored || stored.ref.strategy !== this.strategy) {
      throw new Error(`UNKNOWN_CHECKPOINT: ${checkpoint.id}`);
    }
    const workspacePath = await assertManagedWorkspace(this.options.workspacePath);

    if (this.strategy === "file") {
      await assertSnapshotPath(stored.storageRef, workspacePath);
      await assertWorkspaceHasNoSymlinks(stored.storageRef);
      await emptyDirectory(workspacePath);
      await copyDirectoryContents(stored.storageRef, workspacePath);
      await assertManagedWorkspace(workspacePath);
      return;
    }

    const git = await this.getManagedGit(workspacePath);
    await git.raw(["reset", "--hard", stored.storageRef]);
    // 清掉 Agent 后续创建、但尚未入库的文件；只作用于已验证的临时目录。
    await git.raw(["clean", "-fdx"]);
    await assertManagedWorkspace(workspacePath);
  }

  /** 释放 file snapshots；不删除工作区，生命周期仍由 createManagedWorkspace().cleanup() 管理。 */
  public async dispose(): Promise<void> {
    if (this.disposed) return;
    const workspacePath = await assertManagedWorkspace(this.options.workspacePath);
    if (this.strategy === "file") {
      await rm(await checkpointStorePath(workspacePath), { recursive: true, force: true });
    }
    this.checkpoints.clear();
    this.disposed = true;
  }

  private async getManagedGit(workspacePath: string): Promise<SimpleGit> {
    if (this.git && this.gitInitialized) return this.git;

    const existingGitPath = join(workspacePath, ".git");
    if (await pathExists(existingGitPath)) {
      throw new Error("GIT_CHECKPOINT_REQUIRES_FRESH_WORKSPACE: refusing to reuse an existing Git repository");
    }

    const git = simpleGit({ baseDir: workspacePath, maxConcurrentProcesses: 1 });
    await git.init();
    await git.addConfig("user.name", "mini-agent-harness");
    await git.addConfig("user.email", "mini-agent-harness@local.invalid");
    // checkpoint 是字节级工作区回滚，不应受宿主 Git 全局 autocrlf 策略影响。
    await git.addConfig("core.autocrlf", "false");
    this.git = git;
    this.gitInitialized = true;
    return git;
  }

  private assertNotDisposed(): void {
    if (this.disposed) throw new Error("CHECKPOINT_STORE_DISPOSED");
  }
}

function normalizePrefix(prefix: string): string {
  const normalized = prefix.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40);
  return normalized || "workspace";
}

function normalizeLabel(label: string): string {
  if (typeof label !== "string") throw new Error("INVALID_CHECKPOINT_LABEL: label must be a string");
  const normalized = label.replace(/[\r\n\t]+/g, " ").trim();
  if (!normalized || normalized.length > 120) {
    throw new Error("INVALID_CHECKPOINT_LABEL: label must contain 1-120 printable characters");
  }
  if (/[^\P{C}]/u.test(normalized)) {
    throw new Error("INVALID_CHECKPOINT_LABEL: label contains a control character");
  }
  return normalized;
}

async function ensureManagedRoot(): Promise<string> {
  const root = join(tmpdir(), MANAGED_ROOT_NAME);
  await mkdir(root, { recursive: true, mode: 0o700 });
  return realpath(root);
}

async function checkpointStorePath(workspacePath: string): Promise<string> {
  const root = await ensureManagedRoot();
  const digest = createHash("sha256").update(workspacePath).digest("hex").slice(0, 24);
  const store = join(root, "checkpoints", `${basename(workspacePath)}-${digest}`);
  if (!isChildPath(root, store)) {
    throw new Error("UNMANAGED_CHECKPOINT_STORE: checkpoint store escaped managed root");
  }
  return store;
}

async function assertSnapshotPath(snapshotPath: string, workspacePath: string): Promise<void> {
  const storePath = await checkpointStorePath(workspacePath);
  const resolvedStore = resolve(storePath);
  const resolvedSnapshot = resolve(snapshotPath);
  if (!isChildPath(resolvedStore, resolvedSnapshot)) {
    throw new Error("UNMANAGED_CHECKPOINT: snapshot path is outside this workspace store");
  }
  const snapshotStat = await lstat(resolvedSnapshot);
  if (!snapshotStat.isDirectory() || snapshotStat.isSymbolicLink()) {
    throw new Error("UNMANAGED_CHECKPOINT: snapshot is not a real directory");
  }
}

async function assertWorkspaceHasNoSymlinks(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`UNSAFE_WORKSPACE_SYMLINK: ${entryPath}`);
    }
    if (entry.isDirectory()) await assertWorkspaceHasNoSymlinks(entryPath);
  }
}

async function emptyDirectory(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    await rm(join(directory, entry.name), { recursive: true, force: true });
  }
}

async function copyDirectoryContents(source: string, destination: string): Promise<void> {
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    await cp(join(source, entry.name), join(destination, entry.name), {
      recursive: entry.isDirectory(),
      force: false,
      errorOnExist: true,
    });
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}

function isChildPath(parent: string, candidate: string): boolean {
  const child = relative(parent, candidate);
  return child.length > 0 && !child.startsWith("..") && !isAbsolute(child);
}
