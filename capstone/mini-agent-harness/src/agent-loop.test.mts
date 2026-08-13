import assert from "node:assert/strict";
import { test } from "node:test";
import { AgentLoop } from "./agent-loop";
import type {
  AgentPlanner,
  CheckpointGateway,
  CheckpointRef,
  McpToolGateway,
  SandboxGateway,
} from "./types";

class FakeCheckpoints implements CheckpointGateway {
  public readonly restored: CheckpointRef[] = [];
  private index = 0;

  public async create(label: string): Promise<CheckpointRef> {
    this.index += 1;
    return { id: `checkpoint-${this.index}`, label, createdAt: "2026-08-10T00:00:00.000Z", strategy: "fake" };
  }

  public async rollback(checkpoint: CheckpointRef): Promise<void> {
    this.restored.push(checkpoint);
  }
}

class FakeMcp implements McpToolGateway {
  public async discoverTools() {
    return [{ name: "read_text", description: "fixture reader" }];
  }

  public async callTool() {
    return { isError: false, text: "fixture content" };
  }
}

test("AgentLoop feeds tool and sandbox failure back to planner, then retains a rollback point", async () => {
  const checkpoints = new FakeCheckpoints();
  let sandboxCalls = 0;
  const sandbox: SandboxGateway = {
    async run() {
      sandboxCalls += 1;
      if (sandboxCalls === 1) {
        return {
          ok: false,
          exitCode: 1,
          stdout: "",
          stderr: "syntax error",
          timedOut: false,
          isolation: "fake",
          error: "syntax error",
        };
      }
      return { ok: true, exitCode: 0, stdout: "done", stderr: "", timedOut: false, isolation: "fake" };
    },
  };
  const actions = [
    { kind: "tool", name: "read_text", args: {}, summary: "read" },
    { kind: "sandbox", request: { runtime: "node", code: "bad" }, summary: "bad script" },
    { kind: "sandbox", request: { runtime: "node", code: "good" }, summary: "fixed script" },
    { kind: "complete", summary: "done" },
  ] as const;
  let cursor = 0;
  const planner: AgentPlanner = {
    async next() {
      const action = actions[cursor];
      cursor += 1;
      if (!action) throw new Error("planner exhausted");
      return action;
    },
  };

  const loop = new AgentLoop({
    planner,
    mcp: new FakeMcp(),
    sandbox,
    checkpoints,
    workspacePath: "C:/managed-workspace",
  });
  const result = await loop.run("demo");

  assert.equal(result.ok, true);
  assert.equal(result.finalState, "COMPLETE");
  assert.equal(sandboxCalls, 2);
  assert.equal(result.events.filter((event) => event.type === "correction").length, 1);
  assert.match(result.rollbackCheckpoint?.label ?? "", /^before-sandbox/);

  await loop.rollbackLastStep();
  assert.equal(checkpoints.restored.length, 1);
  assert.equal(checkpoints.restored[0]?.id, result.rollbackCheckpoint?.id);
});
test("AgentLoop rejects a hallucinated MCP tool but lets a planner continue", async () => {
  const checkpoints = new FakeCheckpoints();
  let cursor = 0;
  const planner: AgentPlanner = {
    async next() {
      cursor += 1;
      return cursor === 1
        ? { kind: "tool", name: "invented_tool", args: {}, summary: "bad tool" }
        : { kind: "complete", summary: "recovered" };
    },
  };
  const result = await new AgentLoop({
    planner,
    mcp: new FakeMcp(),
    sandbox: {
      async run() {
        throw new Error("sandbox should not run");
      },
    },
    checkpoints,
    workspacePath: "C:/managed-workspace",
  }).run("demo");

  assert.equal(result.ok, true);
  const toolResult = result.events.find((event) => event.type === "tool_result");
  assert.equal(toolResult?.type, "tool_result");
  if (toolResult?.type === "tool_result") {
    assert.equal(toolResult.result.isError, true);
    assert.match(toolResult.result.text, /unknown MCP tool/);
  }
});

test("AgentLoop keeps the original MCP and sandbox result available to the next planner turn", async () => {
  const checkpoints = new FakeCheckpoints();
  const seenToolTexts: string[] = [];
  const seenSandboxErrors: string[] = [];
  const planner: AgentPlanner = {
    async next(input) {
      const tool = input.observations.find((observation) => observation.kind === "tool");
      const sandbox = input.observations.find((observation) => observation.kind === "sandbox");
      if (!tool) {
        return { kind: "tool", name: "read_text", args: { path: "task.json" }, summary: "read fixture" };
      }
      seenToolTexts.push(tool.result.text);
      if (!sandbox) {
        return {
          kind: "sandbox",
          request: { runtime: "node", code: "throw new Error('fixture failure')" },
          summary: "run fixture",
        };
      }
      seenSandboxErrors.push(sandbox.result.error ?? sandbox.result.stderr);
      return { kind: "complete", summary: "result inspected" };
    },
  };
  const result = await new AgentLoop({
    planner,
    mcp: {
      async discoverTools() {
        return [{ name: "read_text" }];
      },
      async callTool() {
        return { isError: false, text: '{"expectedTotalCents":4050}' };
      },
    },
    sandbox: {
      async run() {
        return {
          ok: false,
          exitCode: 1,
          stdout: "",
          stderr: "expected 4050, actual 4950",
          timedOut: false,
          isolation: "fake",
          error: "SANDBOX_EXIT_NONZERO: expected 4050, actual 4950",
        };
      },
    },
    checkpoints,
    workspacePath: "C:/managed-workspace",
  }).run("repair invoice regression");

  assert.equal(result.ok, true);
  assert.deepEqual(seenToolTexts, ['{"expectedTotalCents":4050}', '{"expectedTotalCents":4050}']);
  assert.deepEqual(seenSandboxErrors, ["SANDBOX_EXIT_NONZERO: expected 4050, actual 4950"]);
});
