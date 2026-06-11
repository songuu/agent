---
title: "章节选区实时对话"
type: solution
created: "2026-06-11"
tags: [solution, selection-chat, streaming, vitepress, no-vue]
---

# Problem

课程章节需要支持“选中正文 → 调起对话 → 流式回答”，并且沿用生产实时 runner 能力。硬约束：前端不使用 Vue。

# Solution

- 前端新增 `.vitepress/theme/selection-chat.ts`，直接从 theme entry import。模块在浏览器端创建单例 popover + right drawer，通过 DOM Selection 判断 `.vp-doc` 内有效选区。
- 对话请求发到 `/api/selection-chat`，请求体携带 `selectedText`、`question`、`pageTitle`、`pagePath`、短 history。
- 后端新增 `scripts/demo-runner/selection-chat.mts`，做请求规范化、prompt 构造、`LLMClient.stream()` 转 NDJSON。
- `scripts/demo-runner/server.mts` 新增 `POST /api/selection-chat`，放在既有 Host/Origin/`X-Demo-Runner`/token gate 之后。
- `/api/stop` 同时 abort demo run 与 selection chat，避免长流悬挂。

# Boundaries

- 不持久化对话历史；drawer 内存会话即可。
- 不做全文 RAG；只把用户选中的内容作为上下文。
- 生产仍然只有一个 runner 服务；不再新增单独 chat 服务。
- 前端保持 vanilla TypeScript + DOM API，禁止 `.vue` / `ClientOnly` / `onMounted` / `createApp`。

# Verification

- `node node_modules\tsx\dist\cli.mjs .vitepress\theme\selection-chat.test.mts`
- `node node_modules\tsx\dist\cli.mjs scripts\demo-runner\selection-chat.test.mts`
- `node node_modules\tsx\dist\cli.mjs scripts\demo-runner\security.test.mts`
- `node node_modules\typescript\bin\tsc -p scripts\demo-runner\tsconfig.json`
- `pnpm typecheck`
- no-Vue `rg` scan
- production `pnpm site:build` with `/agent-build/` base

# Gotchas

- Runner tsconfig uses NodeNext. Do not directly static-import `src/shared/llm/index.js` from `scripts/demo-runner/*`, or TypeScript pulls shared source into runner config and hits extension-check errors. Use runtime variable dynamic import behind a local `LLMClientLike` boundary.
- Browser automation in the in-app browser may not synthesize native text Selection via drag. Keep DOM Selection behavior covered by targeted unit tests.
