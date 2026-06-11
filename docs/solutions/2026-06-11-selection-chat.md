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
- Browser automation in the in-app browser may not synthesize native text Selection via drag. Keep DOM Selection behavior covered by targeted unit tests; Playwright `selectText()`/mouse-drag CAN synthesize a real Selection if you opt into the dependency.

# Gotchas found in pre-commit review (hardened 2026-06-11)

A pre-commit adversarial multi-lens review found 1 P1 + 5 P2 real bugs that happy-path manual E2E + pure-function unit tests all missed. Patterns worth remembering:

- **Drawer must pin its excerpt as source of truth.** Global `selectionchange`/`mouseup`/`keyup` listeners keep firing while the drawer is open, so the live page selection (`state.selectedText`) drifts away from the excerpt the user sees. Send the pinned `drawerSelectedText`, not the live selection, or you silently answer the wrong passage. Fixed by threading `selectedText` explicitly into `streamSelectionChat`.
- **Release the stream reader in `finally`.** An `error`/malformed frame throws out of `parser.push`; without try/finally the `ReadableStream` reader + fetch connection dangle until GC.
- **Record the assistant turn in `finally`, snapshot before appending error text.** On abort/error the success-path history push is skipped, dropping the partial answer from multi-turn context.
- **Claim single-flight locks synchronously before the first `await`.** Checking a busy flag and then `await readJsonBody` before assigning the lock is a TOCTOU race — two POSTs both pass the check and start concurrent streams. Mirror `/api/run`, which parses the URL synchronously and claims before any await.
- **A shared global `/api/stop` cross-kills unrelated streams.** `/api/stop` aborts both the demo-run and selection-chat controllers. The selection-chat client doesn't need to POST it at all: the local `AbortController.abort()` closes the fetch, and the server's `res.on("close")` aborts server-side. Drop the redundant POST.
- **New clients must honor the same enablement gate.** `selection-chat.ts` installed unconditionally while the demo-runner client gated on `__DEMO_RUNNER_CLIENT_ENABLED__`; on a runner-less build the popover still showed and every send hit a dead `127.0.0.1:5174`. Reuse the same `enabled || Boolean(token)` contract.
- **Cross-subsystem (fixed in the same pass):** `stop` originally only halted the frame loop. We plumbed an optional `signal?: AbortSignal` into `src/shared/llm` `ChatOptions`, forwarded it to the OpenAI/Anthropic SDK request options (`create(body, { signal })` / `messages.stream(body, { signal })`), passed it from the selection-chat handler, and swallow the resulting abort error on intentional stop (re-throw otherwise). `stop` now cancels the upstream LLM request, not just frame consumption. Backward-compatible: `signal` is optional, so every other lesson's `getLLM().stream(...)` call is unaffected.
