import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { test } from "node:test";
import { CheckpointStore, createManagedWorkspace } from "./checkpoint";
import { ContextManager } from "./context-manager";
import { SandboxPolicy } from "./sandbox-policy";
import { buildDockerContainerOptions, DevelopmentNodeRunner } from "./sandbox-runner";

test("ContextManager retains its stable prefix and summarizes an over-budget history", async () => {
  const manager = new ContextManager({
    maxTokens: 180,
    reserveTokens: 20,
    stablePrefix: [{ role: "system", content: "stable system prefix" }],
    summarizer: async ({ messages }) => `summary of ${messages.length} historical messages`,
  });
  manager.add({ role: "user", content: "old message ".repeat(80) });
  manager.add({ role: "assistant", content: "recent response ".repeat(40) });
  manager.add({ role: "user", content: "latest request" });

  const prepared = await manager.prepare();
  assert.equal(prepared.strategy, "summary");
  assert.equal(prepared.summaryUsed, true);
  assert.ok(prepared.totalTokens <= prepared.inputBudgetTokens);
  assert.equal(prepared.messages[0]?.content, "stable system prefix");
  assert.match(prepared.messages[1]?.content ?? "", /^\[Conversation summary/);
});

test("SandboxPolicy blocks obvious destructive, escape, and environment access patterns", () => {
  const policy = new SandboxPolicy();
  const destructive = policy.validate({ runtime: "bash", code: "rm -rf /" });
  const escape = policy.validate({ runtime: "node", code: 'import "../host-secret.mjs";' });
  const environment = policy.validate({ runtime: "node", code: "console.log(process.env.OPENAI_API_KEY)" });

  assert.equal(destructive.ok, false);
  assert.ok(destructive.violations.some((item) => item.code === "DESTRUCTIVE_COMMAND"));
  assert.equal(escape.ok, false);
  assert.ok(escape.violations.some((item) => item.code === "WORKSPACE_ESCAPE"));
  assert.equal(environment.ok, false);
  assert.ok(environment.violations.some((item) => item.code === "ENVIRONMENT_ACCESS"));
});

test("CheckpointStore restores file snapshots only inside a marker-bearing managed workspace", async () => {
  const workspace = await createManagedWorkspace("foundation-test");
  const checkpoints = new CheckpointStore({ workspacePath: workspace.workspacePath });
  try {
    await writeFile(`${workspace.workspacePath}/task.txt`, "original\n", "utf8");
    const checkpoint = await checkpoints.create("before-change");
    await writeFile(`${workspace.workspacePath}/task.txt`, "changed\n", "utf8");
    await writeFile(`${workspace.workspacePath}/new.txt`, "new\n", "utf8");

    await checkpoints.rollback(checkpoint);

    assert.equal(await readFile(`${workspace.workspacePath}/task.txt`, "utf8"), "original\n");
    await assert.rejects(access(`${workspace.workspacePath}/new.txt`));
  } finally {
    await checkpoints.dispose();
    await workspace.cleanup();
  }
});

test("CheckpointStore uses a harness-owned simple-git repository for Git checkpoints", async () => {
  const workspace = await createManagedWorkspace("git-checkpoint-test");
  const checkpoints = new CheckpointStore({ workspacePath: workspace.workspacePath, strategy: "git" });
  try {
    await writeFile(`${workspace.workspacePath}/task.txt`, "original\n", "utf8");
    const checkpoint = await checkpoints.create("before-git-change");
    assert.equal(checkpoint.strategy, "git");
    await writeFile(`${workspace.workspacePath}/task.txt`, "changed\n", "utf8");
    await writeFile(`${workspace.workspacePath}/untracked.txt`, "untracked\n", "utf8");

    await checkpoints.rollback(checkpoint);

    assert.equal(await readFile(`${workspace.workspacePath}/task.txt`, "utf8"), "original\n");
    await assert.rejects(access(`${workspace.workspacePath}/untracked.txt`));
  } finally {
    await checkpoints.dispose();
    await workspace.cleanup();
  }
});

test("Docker launch options keep exactly one controlled workspace mount and hardening flags", () => {
  const options = buildDockerContainerOptions({
    image: "node:20-alpine",
    command: ["node", "/workspace/run.mjs"],
    workspacePath: "C:/managed/workspace",
    memoryBytes: 256 * 1024 * 1024,
    nanoCpus: 500_000_000,
    pidsLimit: 64,
  });

  assert.equal(options.HostConfig.NetworkMode, "none");
  assert.equal(options.HostConfig.ReadonlyRootfs, true);
  assert.deepEqual(options.HostConfig.CapDrop, ["ALL"]);
  assert.deepEqual(options.HostConfig.SecurityOpt, ["no-new-privileges:true"]);
  assert.equal(options.HostConfig.Mounts?.length, 1);
  assert.deepEqual(options.HostConfig.Mounts?.[0], {
    Type: "bind",
    Source: "C:/managed/workspace",
    Target: "/workspace",
    ReadOnly: false,
  });
});

test("development-only Node fallback labels itself and returns stderr for self-correction", async () => {
  const workspace = await createManagedWorkspace("development-fallback-test");
  try {
    const result = await new DevelopmentNodeRunner().run(
      {
        runtime: "node",
        code: 'console.error("intentional feedback detail"); process.exit(2);',
      },
      workspace.workspacePath,
    );
    assert.equal(result.ok, false);
    assert.equal(result.isolation, "development-node");
    assert.match(result.error ?? "", /intentional feedback detail/);
  } finally {
    await workspace.cleanup();
  }
});
