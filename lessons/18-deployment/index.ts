/**
 * 第 18 章 · 部署：把 Agent 变成服务
 *
 * 运行：npx tsx lessons/18-deployment/index.ts
 * 然后另开一个终端用 curl 测试（命令见 README）。
 *
 * 本章用 Node 内置的 node:http 起一个最小服务（不引入任何 web 框架），暴露两个端点：
 *   POST /chat         —— 跑一次完整 agent（带工具），一次性返回 JSON
 *   POST /chat/stream  —— 用 SSE（Server-Sent Events）把模型的 token 逐字推给前端
 *   GET  /health       —— 健康检查（部署平台/负载均衡探活用）
 *
 * 贯穿全章的生产化原则：
 *   1) 无状态：每个请求自带完整上下文，服务器不在内存里留会话（要留就放外部存储）。
 *   2) 超时：给每个请求设上限，避免被慢请求拖垮。
 *   3) 错误兜底：任何异常都转成结构化错误响应，绝不让进程崩溃或泄露堆栈。
 *   4) 密钥安全：key 只从环境变量读，永不出现在响应/日志里。
 *   5) 端口可配：从 env 读 PORT，适配各家部署平台。
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { getLLM, runAgent, getEnv, logger } from "../../src/shared";
import { buildRegistry } from "./tools";

// ---- 配置：全部来自环境变量，带合理默认值 ----
// WHY 从 env 读端口：Vercel/Fly/Render/Docker 等平台会通过 PORT 告诉你该监听哪个端口。
const PORT = Number(getEnv("PORT", "3000"));
// 单请求超时（毫秒）。生产里"无限等待"是事故之源——必须有上限。
const REQUEST_TIMEOUT_MS = Number(getEnv("REQUEST_TIMEOUT_MS", "30000"));
// 请求体大小上限（字节），防止超大 body 把内存撑爆（最简限流/防护）。
const MAX_BODY_BYTES = Number(getEnv("MAX_BODY_BYTES", "10000"));

const SYSTEM_PROMPT =
  "你是一个有帮助的助手。需要算术就用 calculator 工具，需要天气就用 get_weather 工具，" +
  "最后用简洁的中文回答用户。";

/**
 * 安全读取请求体并解析成 JSON。
 * WHY 要手动设上限：node:http 默认不限制 body 大小，恶意/异常的超大请求会吃光内存。
 * 这里边收边累计字节数，超限立即拒绝（这是服务的"输入边界校验"）。
 */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error(`请求体过大（上限 ${MAX_BODY_BYTES} 字节）。`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (raw === "") {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("请求体不是合法的 JSON。"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

/**
 * 从已解析的 body 里取出并校验 message 字段。
 * WHY 显式校验：外部输入一律不可信，缺字段/类型不对要给清晰错误，而不是让后面崩。
 */
function extractMessage(body: unknown): string {
  if (typeof body !== "object" || body === null || !("message" in body)) {
    throw new Error('请求体需要形如 { "message": "你的问题" }。');
  }
  const message = (body as { message: unknown }).message;
  if (typeof message !== "string" || message.trim() === "") {
    throw new Error("message 必须是非空字符串。");
  }
  return message;
}

/** 统一的 JSON 响应封装（带状态码与 CORS 头，方便浏览器直连）。 */
function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

/**
 * 处理 POST /chat：跑一次完整 agent（可多步调用工具），一次性返回最终文本与用量。
 * 无状态体现在：每次都新建 registry，且只用本次请求带来的 message，不读任何历史会话。
 */
async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJsonBody(req);
  const message = extractMessage(body);

  const llm = getLLM();
  const registry = buildRegistry();
  const { finalText, steps, usage } = await runAgent({
    client: llm,
    registry,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: message }],
  });

  // 只回必要信息：答案 + 用了几步 + token 用量。绝不回 key、不回堆栈。
  sendJson(res, 200, {
    reply: finalText,
    steps: steps.length,
    usage,
  });
}

/** 写一个 SSE 事件。SSE 的报文格式很简单：每条以 `data: <内容>\n\n` 结尾。 */
function writeSseEvent(res: ServerResponse, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * 处理 POST /chat/stream：用 SSE 把模型 token 逐字推给前端，实现"打字机"体验。
 *
 * WHY 这里用 llm.stream() 而非 runAgent：runAgent 适合"多步工具→最终文本"的整体流程，
 * 但它不逐 token 吐字。要做聊天产品那种逐字蹦出的体感，最直接的是流单轮对话的 token。
 * （进阶练习：把 runAgent 的 onStep 也通过 SSE 推成"进度事件"，见 README。）
 */
async function handleChatStream(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJsonBody(req);
  const message = extractMessage(body);

  // SSE 必备响应头：text/event-stream + 关闭缓存/保持长连接。
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const llm = getLLM();
  const stream = llm.stream({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: message }],
  });

  // WHY 监听客户端断开：用户关页面/点停止时，要主动 break，别再向生成器要数据（消费侧取消）。
  let clientGone = false;
  req.on("close", () => {
    clientGone = true;
  });

  for await (const chunk of stream) {
    if (clientGone) break; // 协作式取消：客户端走了就停
    if (chunk.type === "text" && chunk.text) {
      writeSseEvent(res, { type: "token", text: chunk.text });
    }
    if (chunk.type === "done" && chunk.result) {
      writeSseEvent(res, { type: "done", usage: chunk.result.usage });
    }
  }
  // 约定一个结束哨兵，前端读到它就可以关闭 EventSource。
  res.write("event: end\ndata: {}\n\n");
  res.end();
}

/**
 * 给一个 handler 套上"超时 + 错误兜底"外壳。
 * WHY 集中处理：每个端点都需要同样的超时与异常转换逻辑，抽出来避免重复、也保证一致性。
 * 任何抛出的异常都会被转成结构化 JSON 错误（且不泄露堆栈），进程绝不因单个请求崩溃。
 */
async function withGuards(
  res: ServerResponse,
  handler: () => Promise<void>,
): Promise<void> {
  // 用 Promise.race 实现请求级超时：handler 与"定时器拒绝"赛跑，谁先到算谁。
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`请求处理超时（上限 ${REQUEST_TIMEOUT_MS}ms）。`)),
      REQUEST_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([handler(), timeout]);
  } catch (err) {
    const message = (err as Error).message;
    logger.error(`请求处理失败：${message}`);
    // 若响应头还没发出去，就回一个标准 500；已经在流式途中则只能尽量收尾。
    if (!res.headersSent) {
      sendJson(res, 500, { error: message });
    } else {
      try {
        writeSseEvent(res, { type: "error", message });
      } catch {
        // 连接可能已断开，吞掉二次错误即可。
      }
      res.end();
    }
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 路由分发：按 method + path 把请求交给对应 handler。 */
async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = req.method ?? "GET";
  // url 只需路径部分；用一个占位 base 把它解析成 URL 对象，安全地拿 pathname。
  const path = new URL(req.url ?? "/", "http://localhost").pathname;

  // CORS 预检：浏览器跨域 POST 前会先发 OPTIONS，直接放行。
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (method === "GET" && path === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (method === "POST" && path === "/chat") {
    await withGuards(res, () => handleChat(req, res));
    return;
  }

  if (method === "POST" && path === "/chat/stream") {
    await withGuards(res, () => handleChatStream(req, res));
    return;
  }

  sendJson(res, 404, { error: `未找到路由 ${method} ${path}` });
}

async function main(): Promise<void> {
  const server = createServer((req, res) => {
    // route 自身已被 withGuards 包裹（针对业务端点）；这里再兜一层，防止路由阶段的意外异常。
    route(req, res).catch((err) => {
      logger.error(`路由异常：${(err as Error).message}`);
      if (!res.headersSent) sendJson(res, 500, { error: "服务器内部错误" });
      else res.end();
    });
  });

  server.listen(PORT, () => {
    logger.success(`Agent 服务已启动：http://localhost:${PORT}`);
    logger.info("可用端点：GET /health | POST /chat | POST /chat/stream");
    logger.info("用 README 里的 curl 命令测试，或打开 README 的 HTML 片段在浏览器里试流式。");
  });

  // 优雅退出：收到终止信号时停止接收新连接，让在途请求跑完（容器/平台滚动更新必备）。
  const shutdown = (signal: string): void => {
    logger.warn(`收到 ${signal}，正在优雅关闭……`);
    server.close(() => {
      logger.success("服务已关闭。");
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
