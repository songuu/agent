/**
 * 毕业项目 · 最小 HTTP 服务
 *
 * 运行：
 *   npx tsx capstone/deep-research-agent/src/server.ts
 *   # 默认监听 3000，可用 PORT 环境变量覆盖
 *
 * 接口：
 *   POST /research   body: { "question": "..." }   →  { success, data?, error? }
 *   GET  /health     →  { ok: true }
 *
 * WHY: 把同一份 research() 能力从「命令行」搬到「HTTP」，几乎零改动——这正是 agent.ts 把
 * 核心逻辑与展示层（CLI）解耦的收益。生产里换成 Express/Fastify 思路完全一致，这里用
 * node:http 是为了零依赖、让初学者看清「一个请求进来发生了什么」。
 */
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { logger } from "../../../src/shared/util/logger";
import { getEnv } from "../../../src/shared/util/env";
import { research, renderReportMarkdown } from "./agent";

// 请求体 schema：在系统边界校验外部输入，绝不信任 body 直接用（安全 + 快速失败）。
const requestSchema = z.object({
  question: z.string().min(1, "question 不能为空").max(500, "question 过长"),
});

/** 统一的 JSON 响应封装（与课程 patterns 的 API Response Format 一致）。 */
function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

/** 读取并解析请求体（限制大小，防止超大 body 拖垮进程）。 */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const MAX_BYTES = 16 * 1024;
  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    received += buf.length;
    if (received > MAX_BYTES) throw new Error("请求体过大");
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON 解析失败：${(err as Error).message}`);
  }
}

async function handleResearch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let parsed: z.infer<typeof requestSchema>;
  try {
    const body = await readJsonBody(req);
    parsed = requestSchema.parse(body);
  } catch (err) {
    // 校验/解析类错误 → 400，并把可读原因回传
    sendJson(res, 400, { success: false, error: (err as Error).message });
    return;
  }

  try {
    logger.info(`收到研究请求：${parsed.question}`);
    const result = await research(parsed.question);
    sendJson(res, 200, {
      success: true,
      data: {
        question: result.question,
        plan: result.plan,
        report: result.report,
        markdown: renderReportMarkdown(result),
        notes: result.notes,
        cost: result.cost,
      },
    });
  } catch (err) {
    // 研究过程中的失败（如缺 API key、模型异常）→ 500
    logger.error(`研究失败：${(err as Error).message}`);
    sendJson(res, 500, { success: false, error: (err as Error).message });
  }
}

const server = createServer((req, res) => {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";

  if (method === "GET" && url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (method === "POST" && url === "/research") {
    // handleResearch 内部已自行兜底所有错误，这里再加一层防止未捕获的 reject 漏出
    void handleResearch(req, res).catch((err) => {
      logger.error(`未处理异常：${(err as Error).message}`);
      if (!res.headersSent) sendJson(res, 500, { success: false, error: "服务器内部错误" });
    });
    return;
  }

  sendJson(res, 404, { success: false, error: `未知路由：${method} ${url}` });
});

const port = Number(getEnv("PORT", "3000"));
server.listen(port, () => {
  logger.success(`Deep Research Agent 服务已启动：http://localhost:${port}`);
  logger.info(`试试：curl -X POST http://localhost:${port}/research -H "Content-Type: application/json" -d "{\\"question\\":\\"什么是 RAG？\\"}"`);
});
