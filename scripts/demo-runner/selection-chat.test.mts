import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createDemoRunnerServer } from "./server.mjs";
import {
  buildSelectionChatMessages,
  normalizeSelectionChatRequest,
  type SelectionChatRequest,
} from "./selection-chat.mjs";

const TOKEN = "test-token";
const ALLOWED_HOST = "127.0.0.1:5174";
const ALLOWED_ORIGIN = "http://localhost:5173";

const normalized = normalizeSelectionChatRequest({
  selectedText: "  ToolSpec\n\nRegistry  ",
  question: "  解释职责边界  ",
  pageTitle: "06 从零构建工具系统",
  pagePath: "/lessons/06-building-a-tool-system/",
  messages: [
    { role: "assistant", content: "旧回答" },
    { role: "user", content: "继续" },
  ],
});
assert.equal(normalized.selectedText, "ToolSpec Registry");
assert.equal(normalized.question, "解释职责边界");
assert.equal(normalized.messages.length, 2);

const promptMessages = buildSelectionChatMessages(normalized);
assert.equal(promptMessages[0]?.role, "system");
assert.match(promptMessages[0]?.content ?? "", /课程助教/);
assert.match(promptMessages.at(-1)?.content ?? "", /解释职责边界/);
assert.match(promptMessages.at(-1)?.content ?? "", /ToolSpec Registry/);

assert.throws(
  () => normalizeSelectionChatRequest({ selectedText: "", question: "?" }),
  /selectedText is required/,
);
assert.throws(
  () => normalizeSelectionChatRequest({ selectedText: "正文", question: "" }),
  /question is required/,
);

interface RequestOptions {
  path?: string;
  method?: string;
  body?: unknown;
}

interface ResponseSnapshot {
  statusCode: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}

async function withServer<T>(fn: (port: number) => Promise<T>): Promise<T> {
  const server = createDemoRunnerServer({
    token: TOKEN,
    allowedHosts: [ALLOWED_HOST],
    allowedOrigins: [ALLOWED_ORIGIN],
    selectionChat: async ({ request, writeFrame }) => {
      assert.equal(request.selectedText, "ToolSpec Registry");
      assert.equal(request.question, "解释职责边界");
      writeFrame({ type: "thinking", data: "识别概念" });
      writeFrame({ type: "text", data: "ToolSpec 是工具契约。" });
      writeFrame({ type: "done", data: { ok: true } });
    },
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;

  try {
    return await fn(port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function request(port: number, options: RequestOptions = {}): Promise<ResponseSnapshot> {
  const rawBody = options.body === undefined ? undefined : JSON.stringify(options.body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: options.path ?? "/api/selection-chat",
        method: options.method ?? "POST",
        headers: {
          Host: ALLOWED_HOST,
          Origin: ALLOWED_ORIGIN,
          "X-Demo-Runner": "1",
          "X-Demo-Runner-Token": TOKEN,
          ...(rawBody ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(rawBody) } : {}),
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode ?? 0, body, headers: res.headers });
        });
      },
    );
    req.on("error", reject);
    if (rawBody) req.write(rawBody);
    req.end();
  });
}

await withServer(async (port) => {
  const ok = await request(port, {
    body: {
      selectedText: "ToolSpec Registry",
      question: "解释职责边界",
      pageTitle: "06 从零构建工具系统",
      pagePath: "/lessons/06-building-a-tool-system/",
    } satisfies SelectionChatRequest,
  });
  assert.equal(ok.statusCode, 200);
  assert.match(ok.headers["content-type"] ?? "", /application\/x-ndjson/);
  assert.match(ok.body, /"type":"thinking"/);
  assert.match(ok.body, /ToolSpec 是工具契约/);
  assert.match(ok.body, /"type":"done"/);

  const invalid = await request(port, {
    body: { selectedText: "", question: "解释" },
  });
  assert.equal(invalid.statusCode, 400);
  assert.match(invalid.body, /selectedText is required/);

  const get = await request(port, { method: "GET" });
  assert.equal(get.statusCode, 405);
});

console.log("selection-chat server tests passed");
