---
title: "Production demo runner streaming UX"
date: 2026-06-10
tags: [solution, demo-runner, streaming, production]
related_instincts: []
aliases: ["生产 runner 卡顿", "runner thinking frame", "LLM streaming UX"]
---

# Production demo runner streaming UX

## Problem

生产环境点击 demo 运行时，LLM 调用阶段会出现长时间静默；高频 token 输出还可能让 xterm 写入过密，造成页面卡顿。

## Root Cause

runner 只把子进程 stdout/stderr 作为普通文本帧透传，缺少可表达“模型正在处理/推理”的协议帧；浏览器端每个 frame 直接写入 xterm，没有按动画帧批量合并。

## Solution

- 在 runner NDJSON 协议中增加 `thinking` frame。
- 子进程在 `DEMO_RUNNER_FRAME_PROTOCOL=1` 时，可通过 stderr 的 `__DEMO_RUNNER_FRAME__{...}` 侧信道发送 runner-only thinking 帧，普通命令行运行不受影响。
- OpenAI-compatible provider 透出 `reasoning_content` / `reasoning` / `reasoning_text` / `thinking` 字段；Anthropic stream 兼容 `thinking_delta`。
- 浏览器端 `createBufferedTerminalWriter()` 使用 `requestAnimationFrame` 批量写入 xterm，减少高频 chunk 导致的 UI stall。
- 生产 PM2 runner 使用新 release cwd 启动，确保服务端和静态 bundle 使用同一版本。

## Prevention

- runner 协议类型变更必须同时更新 `stream.test.mts`、`runner.test.mts`、`client.test.mts`。
- PM2 `startOrReload` 不一定更新已有进程的 `script path` / `exec cwd`；切换 release 后必须复核 `pm2 describe agent-build-runner`。
- 不伪造隐藏 chain-of-thought；只展示 API 明确返回的 reasoning 字段，以及本地可观测的阶段状态。

## Related

- [[session-2026-06-10]]
