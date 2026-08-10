import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_MAX_READ_BYTES = 1024 * 1024;

export interface DemoMcpServerOptions {
  /** Directory from which `read_text` may read. Defaults to the scoped env var. */
  rootDir?: string;
  /** Refuse large files so a tool result cannot exhaust the agent context. */
  maxReadBytes?: number;
  /** Diagnostics are deliberately kept off stdout, which MCP reserves for JSON-RPC. */
  diagnostic?: (message: string) => void;
}

/**
 * Creates the local teaching server used by the CLI demo.
 *
 * It deliberately exposes only a bounded workspace reader and echo. The root
 * comes from MINI_AGENT_HARNESS_WORKSPACE so a stdio child does not infer a
 * broader parent checkout from its working directory.
 */
export function createDemoMcpServer(options: DemoMcpServerOptions = {}): McpServer {
  const rootDir = path.resolve(
    options.rootDir ?? process.env.MINI_AGENT_HARNESS_WORKSPACE ?? process.cwd(),
  );
  const maxReadBytes = options.maxReadBytes ?? DEFAULT_MAX_READ_BYTES;
  if (!Number.isSafeInteger(maxReadBytes) || maxReadBytes <= 0) {
    throw new Error("INVALID_MAX_READ_BYTES: expected a positive integer");
  }

  const diagnostic = options.diagnostic ?? writeDiagnostic;
  const server = new McpServer({
    name: "mini-agent-harness-demo",
    version: "0.1.0",
  });

  server.registerTool(
    "echo",
    {
      description: "Return supplied text unchanged. Useful for validating an MCP connection.",
      inputSchema: {
        text: z.string().max(16_384).describe("Text to return"),
      },
    },
    async ({ text }) => ({
      content: [{ type: "text", text }],
    }),
  );

  server.registerTool(
    "read_text",
    {
      description: "Read a UTF-8 text file relative to the configured harness workspace.",
      inputSchema: {
        path: z.string().min(1).max(512).describe("Relative path inside the configured workspace"),
      },
    },
    async ({ path: requestedPath }) => {
      try {
        const text = await readWorkspaceText(rootDir, requestedPath, maxReadBytes);
        return { content: [{ type: "text", text }] };
      } catch (error) {
        const message = safeReadErrorMessage(error);
        diagnostic(`[mini-agent-harness:mcp] read_text rejected: ${message}`);
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }
    },
  );

  return server;
}

/** Starts the demo server on stdio. Do not write ordinary output to stdout. */
export async function runDemoMcpServer(options: DemoMcpServerOptions = {}): Promise<void> {
  const server = createDemoMcpServer(options);
  await server.connect(new StdioServerTransport());
  writeDiagnostic("[mini-agent-harness:mcp] demo server connected over stdio");
}

async function readWorkspaceText(
  rootDir: string,
  requestedPath: string,
  maxReadBytes: number,
): Promise<string> {
  const rootRealPath = await realpath(rootDir);
  const candidatePath = resolveRelativeWorkspacePath(rootRealPath, requestedPath);
  const targetRealPath = await realpath(candidatePath);
  assertWithinWorkspace(rootRealPath, targetRealPath);

  const details = await stat(targetRealPath);
  if (!details.isFile()) {
    throw new SafeReadError("read_text only accepts regular files");
  }
  if (details.size > maxReadBytes) {
    throw new SafeReadError(`read_text refused a file larger than ${maxReadBytes} bytes`);
  }

  return readFile(targetRealPath, "utf8");
}

function resolveRelativeWorkspacePath(rootDir: string, requestedPath: string): string {
  if (requestedPath.includes("\0")) {
    throw new SafeReadError("read_text path contains a NUL byte");
  }

  // Normalize both separator conventions before resolving; otherwise `..\\` can
  // evade a POSIX-only check when a remote client supplies Windows-style input.
  const portablePath = requestedPath.replace(/\\/g, "/");
  if (
    portablePath.startsWith("/") ||
    path.posix.isAbsolute(portablePath) ||
    path.win32.isAbsolute(requestedPath) ||
    /^[a-zA-Z]:/.test(requestedPath)
  ) {
    throw new SafeReadError("read_text path must be relative to the configured workspace");
  }

  const candidatePath = path.resolve(rootDir, portablePath);
  assertWithinWorkspace(rootDir, candidatePath);
  return candidatePath;
}

function assertWithinWorkspace(rootDir: string, candidatePath: string): void {
  const relativePath = path.relative(rootDir, candidatePath);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new SafeReadError("read_text path escapes the configured workspace");
  }
}

function safeReadErrorMessage(error: unknown): string {
  if (error instanceof SafeReadError) return error.message;
  return "read_text could not read the requested file";
}

class SafeReadError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "SafeReadError";
  }
}

function writeDiagnostic(message: string): void {
  process.stderr.write(`${message}\n`);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedFile === fileURLToPath(import.meta.url)) {
  runDemoMcpServer().catch((error: unknown) => {
    writeDiagnostic(`[mini-agent-harness:mcp] fatal server error: ${errorMessage(error)}`);
    process.exitCode = 1;
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
