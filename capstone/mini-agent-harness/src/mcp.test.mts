import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createDemoMcpServer } from "./demo-mcp-server";
import { McpClient } from "./mcp-client";

test("McpClient discovers and calls the constrained demo tools in memory", async (t) => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "mini-agent-harness-mcp-"));
  await writeFile(path.join(fixtureRoot, "note.txt"), "safe fixture", "utf8");

  const server = createDemoMcpServer({ rootDir: fixtureRoot, diagnostic: () => undefined });
  const { client } = await connectInMemory(server);
  t.after(async () => {
    await Promise.allSettled([client.close(), server.close()]);
    await rm(fixtureRoot, { recursive: true, force: true });
  });

  const tools = await client.discoverTools();
  assert.deepEqual(
    tools.map((tool) => tool.name).sort(),
    ["echo", "read_text"],
  );

  const echo = await client.callTool("echo", { text: "hello MCP" });
  assert.deepEqual(echo, {
    kind: "success",
    isError: false,
    text: "hello MCP",
    structured: undefined,
  });

  const file = await client.callTool("read_text", { path: "note.txt" });
  assert.equal(file.kind, "success");
  assert.equal(file.isError, false);
  assert.equal(file.text, "safe fixture");

  const escapedPath = await client.callTool("read_text", { path: "..\\outside.txt" });
  assert.equal(escapedPath.kind, "tool_error");
  assert.equal(escapedPath.isError, true);
  assert.match(escapedPath.text, /escapes the configured workspace/);
});

test("McpClient follows listTools cursors until all pages are collected", async (t) => {
  const cursors: Array<string | undefined> = [];
  const server = new Server(
    { name: "paged-mcp-test", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    const cursor = request.params?.cursor;
    cursors.push(cursor);
    if (cursor === undefined) {
      return {
        tools: [toolDefinition("first")],
        nextCursor: "page-2",
      };
    }
    if (cursor === "page-2") {
      return { tools: [toolDefinition("second")] };
    }
    throw new Error(`unexpected cursor: ${cursor}`);
  });

  const { client } = await connectInMemory(server);
  t.after(async () => {
    await Promise.allSettled([client.close(), server.close()]);
  });

  const tools = await client.discoverTools();
  assert.deepEqual(tools.map((tool) => tool.name), ["first", "second"]);
  assert.deepEqual(cursors, [undefined, "page-2"]);
});

test("McpClient keeps tool errors distinct from client-side call exceptions", async (t) => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "mini-agent-harness-mcp-"));
  const server = createDemoMcpServer({ rootDir: fixtureRoot, diagnostic: () => undefined });
  const { client } = await connectInMemory(server);
  t.after(async () => {
    await Promise.allSettled([client.close(), server.close()]);
    await rm(fixtureRoot, { recursive: true, force: true });
  });

  const toolError = await client.callTool("read_text", { path: "missing.txt" });
  assert.equal(toolError.kind, "tool_error");
  assert.equal(toolError.isError, true);

  const unconnectedClient = new McpClient();
  const exception = await unconnectedClient.callTool("echo", { text: "not connected" });
  assert.equal(exception.kind, "exception");
  assert.equal(exception.isError, true);
  assert.match(exception.text, /^MCP_CALL_EXCEPTION: echo: MCP_CLIENT_NOT_CONNECTED/);
});

test("McpClient can reach the demo through a real stdio transport", { timeout: 15_000 }, async (t) => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "mini-agent-harness-mcp-"));
  await writeFile(path.join(fixtureRoot, "stdio.txt"), "stdio fixture", "utf8");

  const sourceDir = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(sourceDir, "../../..");
  const childEnvironment: Record<string, string> = {
    MINI_AGENT_HARNESS_WORKSPACE: fixtureRoot,
    PATH: process.env.PATH ?? "",
  };
  if (process.platform === "win32" && process.env.SystemRoot) {
    childEnvironment.SystemRoot = process.env.SystemRoot;
  }

  const client = await McpClient.connectStdio({
    command: process.execPath,
    args: [
      path.join(repositoryRoot, "node_modules", "tsx", "dist", "cli.mjs"),
      path.join(sourceDir, "demo-mcp-server.ts"),
    ],
    cwd: fixtureRoot,
    env: childEnvironment,
    stderr: "pipe",
  });
  t.after(async () => {
    await client.close();
    await rm(fixtureRoot, { recursive: true, force: true });
  });

  const result = await client.callTool("read_text", { path: "stdio.txt" });
  assert.equal(result.kind, "success");
  assert.equal(result.text, "stdio fixture");
});

async function connectInMemory(server: {
  connect(transport: InMemoryTransport): Promise<void>;
}): Promise<{ client: McpClient }> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new McpClient();
  await client.connect(clientTransport);
  return { client };
}

function toolDefinition(name: string) {
  return {
    name,
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  };
}
