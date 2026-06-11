---
title: "章节选区实时对话"
type: sprint
status: completed
created: "2026-06-11"
updated: "2026-06-11"
checkpoints: 0
tasks_total: 6
tasks_completed: 6
tags: [sprint, selection-chat, website, streaming, no-vue]
invariants:
  - "前端只能使用 vanilla TypeScript + DOM API，禁止 Vue / .vue / ClientOnly / app.component / onMounted"
  - "生产对话能力复用 demo-runner 同源安全门：Host + Origin + X-Demo-Runner + 可选 token"
  - "大模型输出必须流式呈现，并显式呈现 thinking 帧"
invariant_tests:
  - "node node_modules/tsx/dist/cli.mjs .vitepress/theme/selection-chat.test.mts"
  - "node node_modules/tsx/dist/cli.mjs scripts/demo-runner/selection-chat.test.mts"
  - "node node_modules/tsx/dist/cli.mjs scripts/demo-runner/security.test.mts"
  - "pnpm typecheck"
deferred: []
deadcode_until: []
---

# Phase 1: Think

## Scope

- 每个 VitePress 章节正文支持选中文本后出现浮层工具条。
- 工具条当前只提供一个动作：对话。
- 点击后打开右侧 drawer，展示选区摘要、历史消息、输入框、发送/停止。
- 对话请求走生产 runner 服务端，流式返回 `thinking` / `text` / `done` 帧。
- 前端实现保持纯 DOM 模块，不引入 Vue。

## Non-scope

- 不做多按钮工具箱扩展。
- 不做用户账号级历史持久化。
- 不做全文索引/RAG，只把用户选中内容作为本轮上下文。

## Success

- 鼠标/键盘选中 `.vp-doc` 正文内容后，浮层定位在选区附近。
- 点击“对话”后 drawer 可打开、可输入、可流式显示回答和思考过程。
- 后端校验请求体长度和消息形状，非法请求返回 400。
- dev/prod 复用同一 API；生产不要求前端携带构建 token。
- no-Vue 扫描无命中。

## Risks

- VitePress SPA 路由切换后事件重复绑定或旧状态残留。
- 选区可能跨代码块/导航/目录，需限制在正文内。
- 大模型接口失败时必须给用户明确错误态。

# Phase 2: 技术方案

## 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| VitePress theme | 前端 demo runner 使用 vanilla DOM，禁止 Vue | 新增 `.vitepress/theme/selection-chat.ts`，从 `index.ts` 直接 import |
| 生产 runner | Host/Origin/custom header/token 安全门 | 新增 `/api/selection-chat` 复用 `createDemoRunnerServer` gate |
| Streaming UX | 大模型输出需要流式和 thinking 呈现 | 后端转发 `LLMClient.stream()`，前端增量渲染 thinking/text |

## 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 选区浮层 | 用户选中正文文本 | DOM Selection → popover | ❌ 无需持久化 | ❌ 无需刷新保留 |
| 对话 drawer | 点击“对话” | fetch `/api/selection-chat` → LLM stream | ❌ 会话内存 only | ❌ 刷新清空 |
| 生产服务 | 页面 POST | nginx → PM2 runner → `getLLM().stream()` | ❌ 无需持久化 | ✅ 页面重新打开仍可调用 |

## 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| demo-live-runner | 生产 runner 已暴露同源 API | 本 sprint 复用并扩展 | 2026-06-11 |

## Task Breakdown

- [x] T1 [L2] RED 测试：前端选区工具条、drawer、NDJSON parser、no-Vue 静态约束。
- [x] T2 [L3] RED 测试：后端 selection-chat 请求校验、流式响应、安全门复用。
- [x] T3 [L3] 后端 `/api/selection-chat`：JSON body 限长、handler、stop abort、NDJSON 帧。
- [x] T4 [L3] LLM handler：构造系统提示、选区上下文、history、流式 thinking/text/done。
- [x] T5 [L2] 前端 DOM：selection popover、drawer、输入、停止、状态、流式渲染。
- [x] T6 [L2] 样式、入口、构建、浏览器验证、Sprint 文档收尾。

# Phase 3: Work Log

## T1/T2 RED

- 新增 `.vitepress/theme/selection-chat.test.mts`，先失败于 `ERR_MODULE_NOT_FOUND ... selection-chat`。
- 新增 `scripts/demo-runner/selection-chat.test.mts`，先失败于 `ERR_MODULE_NOT_FOUND ... selection-chat.mjs`。

## T3/T4 Backend

- 新增 `scripts/demo-runner/selection-chat.mts`：
  - `normalizeSelectionChatRequest()`：校验选区、问题、页面信息、history；限制长度。
  - `buildSelectionChatMessages()`：把页面标题、路径、选区、问题合成课程助教 prompt。
  - `createSelectionChatHandler()`：运行期加载 `getLLM()`，转发 `LLMClient.stream()` 的 `thinking` / `text` / `done`。
- 修改 `scripts/demo-runner/server.mts`：
  - 新增 `POST /api/selection-chat`。
  - 复用 Host / Origin / `X-Demo-Runner` / token gate。
  - 复用 `/api/stop` abort 当前 demo 或 selection chat。
- 修改 `scripts/demo-runner/start.mts` 与 `start-production.mts`，接入 selection chat handler。

## T5/T6 Frontend

- 新增 `.vitepress/theme/selection-chat.ts`：
  - 监听正文 Selection，仅允许 `.vp-doc` 内选区。
  - 排除 `pre/code/input/button/a` 与自身 drawer/popover。
  - 选区浮层显示“对话”按钮。
  - 右侧 drawer 展示选区、消息、输入框、停止/发送。
  - `fetch /api/selection-chat` 读取 NDJSON 流，增量渲染 thinking 与 answer。
  - error frame 显示失败态；AbortError 显示已停止。
- 修改 `.vitepress/theme/index.ts` 接入模块。
- 修改 `.vitepress/theme/custom.css` 增加 popover/drawer/messages/thinking/form 样式和移动端规则。

# Phase 4: Review

## 5 + 1 视角

| 视角 | 结果 |
|------|------|
| 架构 | 通过。交互能力复用 runner 网关，未新增第二个生产服务。 |
| 安全 | 通过。新增 API 在 `createDemoRunnerServer` gate 之后；测试覆盖合法请求与安全回归。 |
| 性能 | 通过。前端单例 DOM + 全局事件；history/选区长度有限制；输出流式渲染。 |
| 代码质量 | 通过。前端纯 DOM，后端请求规范化与 LLM handler 分离。 |
| 测试覆盖 | 通过。前端 parser/静态接线/纯函数 + 后端 API/校验/stream + 安全回归。 |
| 集成连续性 | 通过。保持 no-Vue invariant；runner 独立 tsconfig 通过；生产 build 通过。 |

## Verification

- RED：`node node_modules\tsx\dist\cli.mjs .vitepress\theme\selection-chat.test.mts` → `ERR_MODULE_NOT_FOUND ... selection-chat`。
- RED：`node node_modules\tsx\dist\cli.mjs scripts\demo-runner\selection-chat.test.mts` → `ERR_MODULE_NOT_FOUND ... selection-chat.mjs`。
- GREEN：`node node_modules\tsx\dist\cli.mjs .vitepress\theme\selection-chat.test.mts` → pass。
- GREEN：`node node_modules\tsx\dist\cli.mjs scripts\demo-runner\selection-chat.test.mts` → pass。
- `node node_modules\tsx\dist\cli.mjs scripts\demo-runner\security.test.mts` → pass。
- `node node_modules\tsx\dist\cli.mjs .vitepress\theme\demo-runner\client.test.mts` → pass。
- `node node_modules\typescript\bin\tsc -p scripts\demo-runner\tsconfig.json` → pass。
- `pnpm typecheck` → pass。
- no-Vue scan → no matches。
- `VITEPRESS_BASE=/agent-build/ DEMO_RUNNER_CLIENT_ENABLED=1 DEMO_RUNNER_BASE_URL=/agent-build/api/demo-runner pnpm site:build` → pass；仅 chunk-size warning。
- Browser mount check：`http://127.0.0.1:5173/lessons/06-building-a-tool-system/` 中 `.selection-chat-drawer` 与 `.selection-chat-popover` 均已挂载，无 console error。内置浏览器自动化无法产生真实文本 Selection；交互细节由 DOM/stream 单测覆盖。

# Phase 4.1: 提交前对抗式复核 + 手动 E2E（2026-06-11 复核）

## 手动真浏览器 E2E（闭合原缺口）

`pnpm site:live`（runner:5174 + dev:5173 + token 握手），人工在 `localhost:5173` 真实拖选正文：

- ✅ 选区 → popover「对话」浮现；点击 → 右侧 drawer 打开（引用选区 + 输入框 + 发送/停止）。
- ✅ 输入问题 → 真实 SiliconFlow 流式逐字渲染 → `回答完成。`。
- ✅ 选代码块不触发 popover；SPA 路由切章后再选仍正常（不漏绑/不残留）。
- ✅ 监控期间 runner 无报错。

原 Phase 4 遗留的「真实文本 Selection 交互未端到端验证」缺口由此闭合。

## 对抗式多视角复核（4 视角并行 → 每条 finding 验真）

P0=0。确认 1×P1 + 5×P2，驳回 1（生产 gate 退化为 Host+header——既有设计、非本功能引入、security.test 已固化）。

| # | 等级 | 文件 | 问题 | 处置 |
|---|------|------|------|------|
| 1 | P1 | selection-chat.ts | drawer 打开后改选正文，提交发的是新选区而非钉住摘要→静默答错段落 | ✅ 修：`drawerSelectedText` 作 SoT，`streamSelectionChat` 显式收 `selectedText` 参 |
| 2 | P2 | selection-chat.ts | error/坏帧抛错时 reader 泄漏（无 try/finally） | ✅ 修：读循环 try/finally + `reader.cancel()` |
| 3 | P2 | selection-chat.ts | error/abort 时已流式部分回答丢出历史 | ✅ 修：finally 内按非空回答补录 assistant turn（在追加错误文案前快照） |
| 4 | P2 | server.mts | 单飞守卫 TOCTOU：`await readJsonBody` 前未抢锁→并发双流 | ✅ 修：await 前同步抢 AbortController（镜像 /api/run），校验失败释放 |
| 5 | P2 | selection-chat.mts + src/shared/llm/* | abort 未把 signal 传给 SDK→上游 LLM 请求不取消 | ✅ 修（用户拍板当轮做）：`ChatOptions` 加 `signal?: AbortSignal`，openai/anthropic 转发给 SDK 请求选项；handler 传 `signal` 并吞掉 intentional abort，re-throw 其余 |
| 6 | P2 | selection-chat.ts | `/api/stop` 跨杀 demo run 与 selection chat | ✅ 修：删 stopCurrentChat 里冗余 `/api/stop` POST（本地 abort 经 server `res.on("close")` 已端到端拆流） |
| 7 | P2 | selection-chat.ts | client 无视 `__DEMO_RUNNER_CLIENT_ENABLED__` gate 无条件挂载 | ✅ 修：`isSelectionChatEnabled()` 对齐 demo-runner client 启用契约 |

## 复核后回归

- no-Vue 扫描：clean。
- `node node_modules/tsx/dist/cli.mjs .vitepress/theme/selection-chat.test.mts` → ok。
- `node node_modules/tsx/dist/cli.mjs scripts/demo-runner/selection-chat.test.mts` → ok。
- `node node_modules/tsx/dist/cli.mjs scripts/demo-runner/security.test.mts` → ok。
- `node node_modules/tsx/dist/cli.mjs .vitepress/theme/demo-runner/client.test.mts` → ok。
- `node node_modules/typescript/bin/tsc -p scripts/demo-runner/tsconfig.json` → ok。
- `pnpm typecheck` → ok（覆盖 #5 的 `src/shared/llm/*` SDK 签名改动）。
- `pnpm site:build`（`/agent-build/` base + runner client enabled）→ ok。
- 注：#1/#2/#3/#6 为纯 DOM 行为，单测未覆盖（无 jsdom/Playwright，用户选择不装依赖）；由代码复核 + 手动 E2E 兜底。#5 的 abort 取消上游路径由 typecheck 守签名，运行期取消行为属 SDK 契约。

# Phase 5: Compound

## Knowledge

- 新增 solution：`docs/solutions/2026-06-11-selection-chat.md`。
- 更新架构规则：`.codex/rules/architecture.md` 记录“章节级实时交互复用 runner 网关 + vanilla DOM”的边界。

## Final State

- status: completed
- tasks_completed: 6/6
- Checkpoints: 0
