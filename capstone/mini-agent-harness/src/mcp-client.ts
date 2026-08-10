import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
  type StdioServerParameters,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  StreamableHTTPClientTransport,
  type StreamableHTTPClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  SSEClientTransport,
  type SSEClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/sse.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { McpToolGateway, ToolDescriptor, ToolResult } from "./types";

/** Identity announced during the MCP initialization handshake. */
export interface McpClientOptions {
  name?: string;
  version?: string;
}

/**
 * Keeps MCP protocol errors separate from a tool's own `isError` response.
 * The structural `ToolResult` fields keep this directly usable by AgentLoop.
 */
export type McpToolCallResult =
  | (ToolResult & { kind: "success" })
  | (ToolResult & { kind: "tool_error" })
  | (ToolResult & { kind: "exception" });

const DEFAULT_CLIENT_NAME = "mini-agent-harness";
const DEFAULT_CLIENT_VERSION = "0.1.0";

/**
 * Small MCP gateway used by the agent loop. It owns exactly one transport and
 * completes the SDK initialization handshake before exposing tools.
 */
export class McpClient implements McpToolGateway {
  private readonly client: Client;
  private connected = false;
  private closed = false;
  private transport: Transport | undefined;

  public constructor(options: McpClientOptions = {}) {
    this.client = new Client({
      name: options.name ?? DEFAULT_CLIENT_NAME,
      version: options.version ?? DEFAULT_CLIENT_VERSION,
    });
  }

  /** Connect to a local MCP server that communicates over stdio. */
  public static async connectStdio(
    server: StdioServerParameters,
    options: McpClientOptions = {},
  ): Promise<McpClient> {
    const client = new McpClient(options);
    await client.connect(new StdioClientTransport(server));
    return client;
  }

  /** Connect to a remote MCP endpoint implementing Streamable HTTP. */
  public static async connectStreamableHttp(
    url: string | URL,
    transportOptions: StreamableHTTPClientTransportOptions = {},
    options: McpClientOptions = {},
  ): Promise<McpClient> {
    const client = new McpClient(options);
    const endpoint = typeof url === "string" ? new URL(url) : url;
    await client.connect(new StreamableHTTPClientTransport(endpoint, transportOptions));
    return client;
  }

  /**
   * @deprecated Only for pre-Streamable-HTTP MCP servers. New remote servers
   * should use `connectStreamableHttp`, which is the current MCP transport.
   */
  public static async connectLegacySse(
    url: string | URL,
    transportOptions: SSEClientTransportOptions = {},
    options: McpClientOptions = {},
  ): Promise<McpClient> {
    const client = new McpClient(options);
    const endpoint = typeof url === "string" ? new URL(url) : url;
    await client.connect(new SSEClientTransport(endpoint, transportOptions));
    return client;
  }

  /** Alias that makes the transport choice explicit at call sites. */
  public static connectRemote = McpClient.connectStreamableHttp;

  /**
   * Connect a custom transport. Primarily useful for tests with
   * `InMemoryTransport`, while still performing the real MCP handshake.
   */
  public async connect(transport: Transport): Promise<void> {
    if (this.closed) {
      throw new Error("MCP_CLIENT_CLOSED: cannot connect a closed client");
    }
    if (this.connected || this.transport) {
      throw new Error("MCP_CLIENT_ALREADY_CONNECTED: create a new client for another transport");
    }

    this.transport = transport;
    try {
      await this.client.connect(transport);
      this.connected = true;
    } catch (error) {
      this.transport = undefined;
      await transport.close().catch(() => undefined);
      throw new Error(`MCP_CONNECT_FAILED: ${errorMessage(error)}`);
    }
  }

  /** Discover all server tools, following every cursor returned by MCP. */
  public async discoverTools(): Promise<ToolDescriptor[]> {
    this.assertConnected();

    const tools: ToolDescriptor[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    do {
      const page = await this.client.listTools(cursor === undefined ? undefined : { cursor });
      tools.push(
        ...page.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: { ...tool.inputSchema },
        })),
      );

      cursor = page.nextCursor;
      if (cursor !== undefined) {
        if (seenCursors.has(cursor)) {
          throw new Error(`MCP_TOOL_PAGINATION_LOOP: server repeated cursor ${JSON.stringify(cursor)}`);
        }
        seenCursors.add(cursor);
      }
    } while (cursor !== undefined);

    return tools;
  }

  /**
   * Invoke a named tool. A protocol/transport exception becomes `kind:
   * "exception"`; an MCP response with `isError` remains `kind: "tool_error"`.
   */
  public async callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    try {
      this.assertConnected();
      const result = await this.client.callTool({ name, arguments: args });
      const text = Array.isArray(result.content)
        ? renderToolContent(result.content)
        : "MCP tool returned invalid content";
      const structured = result.structuredContent;

      if (result.isError === true) {
        return {
          kind: "tool_error",
          isError: true,
          text: text || `MCP tool ${name} returned isError without text content`,
          structured,
        };
      }

      return {
        kind: "success",
        isError: false,
        text: text || "MCP tool completed without text content",
        structured,
      };
    } catch (error) {
      return {
        kind: "exception",
        isError: true,
        text: `MCP_CALL_EXCEPTION: ${name}: ${errorMessage(error)}`,
      };
    }
  }

  /** Closes the MCP protocol and its underlying stdio or HTTP transport. */
  public async close(): Promise<void> {
    if (this.closed) return;

    this.closed = true;
    this.connected = false;
    this.transport = undefined;
    await this.client.close();
  }

  private assertConnected(): void {
    if (this.closed) {
      throw new Error("MCP_CLIENT_CLOSED: create a new client before making requests");
    }
    if (!this.connected) {
      throw new Error("MCP_CLIENT_NOT_CONNECTED: call connect() before making requests");
    }
  }
}

/** Functional factory for call sites that do not need the class constructor. */
export async function connectStdioMcpClient(
  server: StdioServerParameters,
  options: McpClientOptions = {},
): Promise<McpClient> {
  return McpClient.connectStdio(server, options);
}

/** Functional Streamable HTTP factory for remote MCP servers. */
export async function connectStreamableHttpMcpClient(
  url: string | URL,
  transportOptions: StreamableHTTPClientTransportOptions = {},
  options: McpClientOptions = {},
): Promise<McpClient> {
  return McpClient.connectStreamableHttp(url, transportOptions, options);
}

function renderToolContent(content: readonly unknown[]): string {
  return content.map(renderContentItem).filter(Boolean).join("\n");
}

function renderContentItem(item: unknown): string {
  if (!isRecord(item) || typeof item.type !== "string") {
    return "[unrecognized MCP content]";
  }

  if (item.type === "text" && typeof item.text === "string") {
    return item.text;
  }
  if (item.type === "image" && typeof item.mimeType === "string") {
    return `[image: ${item.mimeType}]`;
  }
  if (item.type === "audio" && typeof item.mimeType === "string") {
    return `[audio: ${item.mimeType}]`;
  }
  if (item.type === "resource" && isRecord(item.resource) && typeof item.resource.uri === "string") {
    return `[resource: ${item.resource.uri}]`;
  }
  if (item.type === "resource_link" && typeof item.uri === "string") {
    return `[resource link: ${item.uri}]`;
  }
  return `[MCP content: ${item.type}]`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
