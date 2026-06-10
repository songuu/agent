---
title: "网页内运行 Demo：本地实时运行器 + xterm 流式输出"
type: sprint
status: completed
created: "2026-06-10"
updated: "2026-06-10"
checkpoints: 1
tasks_total: 9
tasks_completed: 9
tags: [sprint, website, demo-runner, xterm, dx, security]
aliases: ["demo 运行器", "live runner", "在网页跑 demo"]

invariants:
  - "demo 可运行清单由 knowledge-graph/data/graph.ts 的 CHAPTERS(+demo 元数据)单一数据源派生（与 sidebar 同源，不另起文件系统扫描）"
  - "运行器代码全部在 scripts/demo-runner/ 内并配独立 tsconfig；根 npm run typecheck(tsc --noEmit) 行为零变化、不触及 scripts/.vitepress"
  - "课程 Markdown 正文零改动（运行按钮由 config.mts 渲染期注入，不写进任何 README）"
  - "静态站可独立部署：site:build 不打包本地 server/token；运行器不可用时 demo 区优雅降级，不崩页"
  - "运行器默认 off（需 DEMO_RUNNER_ENABLED=1）；只接受 demo id 一个入参，绝不把请求参数转进子进程 argv/env"
  - "运行器四重门(Host+Origin+自定义头+POST)恒在；任意跨源/异 Host 请求必须 403"
  - "前端 demo runner 禁止使用 Vue/.vue/ClientOnly/app.component/onMounted；只能用 vanilla TypeScript + DOM API + xterm 动态 import"
invariant_tests:
  - "npx tsc --noEmit（根项目类型零错，且不含 scripts/.vitepress 文件）"
  - "pnpm site:build（站点构建 exit 0；dist 非 demo 页无 xterm chunk）"
  - "npx tsx scripts/demo-runner/security.test.mts（异 Origin/异 Host/缺自定义头 → 403；合法 → 200）"
deferred:
  - sprint: "2026-06-10-course-website"
    item: "直接打包部署（含站点 Pages 发布）"
    deadline: "2026-06-30"
    reason: "部署/CI 留给部署 sprint；运行器本就是 dev-only，永不上线"
---

# 网页内运行 Demo：本地实时运行器 + xterm 流式输出

## Phase 1: 需求分析（Think）

### 原始需求
> 在当前架构里增加一个最佳实践：页面里有很多 demo，需要在 demo 位置加「运行」按钮，直接运行当前 demo，并实时看到运行结果（整个流程都可查看，含 AI 的流式返回）。调研用 xterm.js 还是别的方式。AI 配置暂时只读本地配置即可，支持现有大模型 + 本地 ollama。

### 核心矛盾与解法
VitePress 产出的是**静态站**，但"运行 demo + 看 AI 流式"本质需要一个 **Node 运行时**真去执行 `tsx lessons/NN/index.ts` 并把 stdout 实时推给浏览器。
→ 解法：**dev-only 本地运行器（companion server）** + 前端 xterm 终端。静态站本身不变，运行能力由本地伴随服务提供（永不部署上线）。

关键洞察：demo 已经 `process.stdout.write()` 流式打印（含 AI 逐字返回），所以**无需改任何课程代码**——运行器只要 spawn 子进程、把 stdout/stderr 按块经 SSE 推给前端，xterm 原样渲染，"整个流程"自然可见。

### 架构（推荐）
```
浏览器 (VitePress 站)                  本地运行器 (127.0.0.1:5174, dev-only)
┌─────────────────────────┐           ┌───────────────────────────────┐
│ vanilla DOM runner      │  GET /api/demos   │ 扫 lessons/*/index.ts 等 → 白名单 │
│  ▶ 运行本课 Demo         │ ───────────────► │ GET /api/config → 当前 provider  │
│  xterm 终端 (流式)       │  GET /api/run?demo=id (SSE)                          │
│  状态/停止/配置徽章      │ ◄─────────────── │ spawn `tsx <whitelisted path>`  │
└─────────────────────────┘  stdout/stderr 块 │ 继承本地 .env → key 不过网线     │
                                              └───────────────────────────────┘
```

1. **运行器** `scripts/demo-runner/server.mts`：原生 http，**仅绑 127.0.0.1**。
   - `GET /api/demos`：从文件系统派生可运行 demo 清单（id→路径，与 CHAPTERS 对齐）。
   - `GET /api/run?demo=<id>`：白名单校验 id→绝对路径→`spawn`（arg 数组，**非 shell 字符串**）tsx 执行；stdout/stderr 按块 SSE 推；结束推 `done`(exitCode)。超时(默认 120s)自动 kill。
   - `GET /api/config`：报告检测到的本地配置（provider/model/baseURL/是否有 key/ollama 是否在线），**绝不回传 key 明文**。
   - 客户端断开 / `POST /api/stop` → kill 子进程。
2. **前端** VitePress theme：markdown 渲染期插入 `<div data-demo-runner data-demo-id="...">` 占位；theme 只加载 vanilla TypeScript DOM client，用 `MutationObserver` 绑定占位节点，按 demo id 调本地运行器；xterm（`@xterm/xterm`+`addon-fit`，**仅浏览器端动态 import**）渲染流式输出 + 状态/停止/配置徽章。运行器未启动时按钮给出「启动：pnpm demo:server」提示而非报错。**禁止 Vue / .vue / ClientOnly / app.component / onMounted。**
3. **本地配置 + ollama**：`getLLM` 加显式 `ollama` provider（默认 baseURL `http://localhost:11434/v1`、key 可空），保留 anthropic/openai；`.env.example` 文档化 `LLM_PROVIDER=ollama`。
4. **联动**：`pnpm demo:server` 独立起运行器；`pnpm site:live` = concurrently 同起站点 + 运行器。

### xterm.js 决策 → **采用 xterm.js**
- 理由：需求明确要"看到运行实时结果 / 整个流程 / AI 流式"。demo 输出含 divider、颜色、逐字流式；xterm 是真终端模拟器，**原样还原** ANSI/回车/逐字，与"看真实运行"目标一致。约 250KB，仅在有运行器的页**懒加载**，学习站可接受。
- 否决 纯 `<pre>` 追加：更轻但丢 ANSI/保真度，违背"看真实运行"初衷。
- 否决 WebContainers(StackBlitz)：浏览器内 WASM 跑 Node——无法读本地 .env key、无法连本地 ollama，与"读本地配置"直接冲突，且重。

### Scope
- dev-only 本地运行器（SSE 流式、白名单、localhost、超时、停止）
- 每课 demo「运行」按钮 + xterm 实时输出 + 状态/停止/配置徽章
- 本地配置读取：现有 provider（anthropic/openai/兼容端点）+ 新增 ollama provider
- 运行器未起 / 缺 key / demo 失败的友好降级与提示
- 文档：README + 一节"如何在网页跑 demo"指南；安全声明（dev-only，勿公网暴露）

### Non-scope
- 生产/线上执行（静态站保持静态，运行器永不部署）
- 浏览器内改 demo 代码 / 改参数后运行（留后续）
- 多用户、鉴权、远端运行
- 不改任何 lesson 业务正文逻辑（仅可能加 KG 注入式的"可运行"标记，非必须）

### 安全（最高优先级，clear prose）
本功能引入「网页可触发本地代码执行」端点，必须严格收口：
- **白名单**：只接受解析后命中已知 demo 目录、以 `index.ts` 结尾、且磁盘真实存在的文件；拒绝任意路径/命令/`..` 穿越。
- **localhost only**：运行器仅绑 `127.0.0.1`，绝不对外。
- **无 shell 注入**：`spawn(cmd, [args], {shell:false})`，参数走数组，绝不拼接 shell 字符串。
- **超时 + 并发上限**：单次 120s 自动 kill；限制同时运行数。
- **key 不过网线**：子进程继承本地 .env，`/api/config` 只报"有/无 key"不报明文。
- 文档显著标注：dev-only 工具，切勿公网暴露 / 反代。

### Success（验收）
- `tsc --noEmit` 0 错；`site:build` exit 0（站点仍可静态构建/部署，不被运行器拖累）。
- `pnpm site:live` 后，lessons 页出现运行按钮；点击 → xterm 实时出现 demo 输出（含 AI 逐字流式）→ 结束显示退出码与用量。
- `LLM_PROVIDER=ollama` 本地配置可被运行器识别并跑通（有 ollama 时）。
- 运行器未启动时站点不崩、按钮降级提示。

### Risks
- **安全**（见上）——头号风险，按上述全部收口。
- **Windows spawn**：win32 起 `tsx/npx` 需处理 `.cmd` shim 或用 `node --import tsx`；`shell:false` 下要正确解析可执行文件。impl 风险，Plan 阶段定方案。
- **xterm SSR**：VitePress 服务端渲染——xterm 必须只在浏览器端动态 import；vanilla client 用 `typeof window !== "undefined"` 守卫，SSR 不触碰 xterm/window。
- **交互式 demo**（capstone CLI 读 stdin）不适合一键无输入运行——清单里标注/排除。
- **缺 key/网络**：友好 precheck（/api/config）提示而非崩。

### 下一 Phase 预热（Phase 2: Plan）
关键文件: `.vitepress/config.mts`（注入/端口）、`src/shared/llm/index.ts`（加 ollama）、`knowledge-graph/data/graph.ts`（demo 清单可对齐 CHAPTERS）
执行命令: 确认 demo 文件分布 `Glob lessons/*/index.ts rag-advanced/*/index.ts`；查 win32 tsx spawn 方案
风险预判: spawn 跨平台、白名单边界、xterm 懒加载与 SSR

---

## Phase 2: 技术方案（Plan）

> 本阶段由 Plan-research workflow（6 agent：4 调研 + 2 对抗审查）支撑。调研确证了 win32 spawn / xterm-SSR / SSE / ollama 的精确做法；安全审查把设计从 "risky" 拉回 "可落地"；集成审查把 "文件系统扫描" 纠正为 "CHAPTERS 单一数据源"。关键决策与来源见下。

### 入场扫描 - Invariants 继承（自 website sprint）

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| 课程清单 | sidebar 由 CHAPTERS 数据驱动（单一来源） | demo 清单**也从 CHAPTERS 派生**：给 `Chapter` 加可选 `demo?` 元数据；运行器白名单与前端按钮同源于 CHAPTERS。**不**新增文件系统扫描第二真相源 |
| 课程内容 | 课程 md 正文零改动 | 运行按钮由 `config.mts` markdown 渲染期注入 `<div data-demo-runner ...>`，**不写进任何 README** |
| 类型 | `tsc --noEmit` 零错、`.vitepress` 不进 tsconfig | 运行器置于 `scripts/demo-runner/` + 独立 tsconfig；`scripts/` 本就不在根 include；前端只用 `.vitepress/theme/demo-runner/*.ts` vanilla DOM 模块 |
| 前端技术边界 | 用户硬性要求：不准使用 Vue | 禁止新增/使用 `.vue`、`ClientOnly`、`app.component`、`onMounted`；后续 T6/T7/T8 也必须保持 vanilla TypeScript + DOM API |
| 站点构建 | 静态站可独立部署 | xterm 仅客户端懒加载；无 runner 时 demo 区优雅降级；`site:build` 产物不含本地 server/token |
| 内部文档 | `docs/plans/**` 不发布 | 运行器若需缓存白名单/token 写 `.vitepress/cache/` 或纯内存，不落仓库根 |

### 入场扫描 - 集成路径（用户从点击到看见结果的完整链路）

| 改动点 | 触发动作 | 中间层 | 持久化 | 结果可见 |
|--------|----------|--------|--------|----------|
| vanilla runner「运行」按钮 | `POST /api/run`（带 token + `X-Demo-Runner` 头） | 四重门校验 → 白名单 Map(id→realpath) → `spawn(node --import tsx)` | ❌ 无持久化（一次性运行，符合预期） | ✅ NDJSON 流 → fetch ReadableStream → `term.write` xterm 实时 |
| 「停止」按钮 / 关页 | `POST /api/stop` 或断连 | `req 'close'` → `killTree`(win32 `taskkill /T /F`) | — | ✅ 子进程整树退出，无僵尸 |
| 配置徽章 | 进页 `GET /api/config`（同四重门） | 读运行器自身 env（不回 key 明文） | — | ✅ provider/model/有无 key/ollama 在线 → 按钮可用性 |
| runner 未启动 | 进页探活失败 | — | — | ✅ 降级提示「执行 pnpm demo:server 后刷新」，页面不崩 |

所有链路闭环；无 ❌ 悬挂（"无持久化" 是一次性运行的预期语义，非缺口）。

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-10-course-website | 直接打包部署（含站点 Pages 发布） | ⏭ 保持 deferred（运行器 dev-only，与部署正交） | 2026-06-30 |

### 关键决策

**D1 传输：`fetch + ReadableStream`（NDJSON 帧），不用 EventSource。**
安全门要求自定义头 `X-Demo-Runner`，而 EventSource 无法设自定义头 → 必须用 fetch streaming。NDJSON（每行一个 `{"t":"stdout|stderr|done|exit","d":...}`）比手搓 SSE `data:` 帧更稳：JSON.stringify 自动转义换行，规避 SSE「chunk 内换行破坏帧边界」与多字节切断坑（服务端 `setEncoding('utf8')` 已处理跨 chunk 半个汉字）。来源：MDN SSE、WHATWG spec、安全审查 P0。

**D2 运行子进程：`spawn(process.execPath, ['--import','tsx', absPath], {cwd: repoRoot, shell:false})`。**
win32 实测：`npx`/`tsx` 裸名 + `shell:false` 必 ENOENT（.cmd shim）；`process.execPath` 永不 ENOENT。`cwd=repoRoot` 让 `tsx` 裸包名 + 相对 import(`../../src`) + dotenv 读根 `.env` 三者都解析得到。`absPath` 用 `path.resolve` 且**仅来自启动期 Map**。整树 kill 用 `taskkill /PID <pid> /T /F`（`child.kill()` 漏 tsx spawn 的 node 孙进程）。来源：win32-spawn 调研（本机实测）。

**D3 xterm：`@xterm/xterm@^6` + `@xterm/addon-fit@^0.11`（scoped 新包，旧 `xterm` 已 deprecated）。**
SSR 守卫：theme 入口只 import vanilla client；client 顶层先判断 `typeof window !== "undefined"`，xterm 与 CSS 均在用户点击运行/清屏时动态 import。`convertEol:true`（子进程多只发 `\n`）。`ResizeObserver` 自动 fit。`.npmrc shamefully-hoist` 已规避 mermaid 那类 pnpm 提升坑。来源：xterm-vitepress 调研 + 用户硬性 no-Vue 修正。

**D4 ollama：新增一等 `ollama` provider（采纳调研方案，非集成 agent 的"仅走 openai 通道"）。**
理由：用户**明确点名** ollama 为需求，一等支持 UX 更好（`LLM_PROVIDER=ollama` 即用默认 `http://127.0.0.1:11434/v1` + key 占位 + `llama3.2`，零额外配置）。落地最小化降低集成 agent 顾虑：把 openai.ts 抽成可注入默认值的工厂，`createOllamaClient` 复用之（DRY），仅 `getLLM` switch + `ProviderName` + `.env.example` 联动；**不改任何课程 md**（教学叙述不动）。`createOpenAICompatibleClient` 改用 `getEnv('OPENAI_API_KEY', fallback)` 替代 `requireEnv`，使 ollama 无真 key 不抛错。
> ⚠️ 替代方案（集成 agent 主张，gate 时可选）：不加 provider，ollama 走 `LLM_PROVIDER=openai + OPENAI_BASE_URL=...:11434/v1 + 占位 key`，零核心改动。若你偏好最小 blast radius 选它，T4 退化为只改 `requireEnv→getEnv` + `.env.example` 文档。

**D5 demo 元数据进 `Chapter`（单一数据源）。**
```ts
interface ChapterDemo {
  entry?: string;            // 相对仓库根的入口，默认 `${dir}/index.ts`
  needsKey?: "none" | "llm" | "embedding"; // 决定无 key 时按钮是否禁用
  interactive?: boolean;     // 读 stdin（如 07 --chat 分支、capstone cli）→ 一键运行排除或锁默认参数
  needsServer?: boolean;     // 常驻 server.listen（18、capstone server）→ 排除一键运行
}
// Chapter 加： demo?: ChapterDemo
```
运行器白名单 = CHAPTERS 中 `demo && !needsServer && !interactive` 者，id=chapter.id，realpath=`realpathSync(repoRoot/entry)`。免 key 绿灯：`rag-chunk`(纯函数 chunk)。各章 `needsKey` 在 Work 期按 index.ts 是否 import getLLM/embeddings 逐一判定（默认 'llm'；08/09/rag-* embedding；18/capstone 排除）。

### 安全架构（headline，clear prose——这是本 sprint 的核心约束）

威胁模型修正：**绑 localhost 不足以防护**。用户运行 `site:live` 期间，其浏览器访问的任意恶意网页都可向 `127.0.0.1:5174` 发请求触发本地代码执行（CSRF），DNS-rebinding 还能读回输出/偷 key。故四重门 + 纵深，全部 fail-closed，**spawn 前按序校验**：

1. **Host 头白名单**：`Host ∈ {127.0.0.1:5174, localhost:5174}`，否则 403。← 杀 DNS-rebinding（重绑请求带攻击者域名 Host）。
2. **Origin 白名单**：`Origin ∈ {http://localhost:5173, http://127.0.0.1:5173}`；state-changing 端点缺 Origin 也拒。← 杀简单跨源 GET CSRF。
3. **自定义头 `X-Demo-Runner: 1`**：跨源带自定义头触发 CORS 预检，运行器不回 `Access-Control-Allow-Origin` → 预检失败、真实请求发不出。← 这也是必须用 fetch 而非 EventSource 的原因（见 D1）。
4. **run/stop 一律 POST**：img/EventSource/导航无法 POST。
5. **每会话 token（纵深）**：启动写 `.vitepress/cache/demo-runner.json`（已 gitignore 区），`config.mts` dev 期读入经 Vite `define` 注入前端；缺失则降级为只靠 1–4（仍封堵已知向量）+ 提示重启。
6. **白名单 Map**：请求 id 只作不透明 key 查 Map，**绝不**由请求重建路径；命中后断言 realpath `startsWith` 根且 `endsWith index.ts`。← 杀 `..`/编码/符号链接/绝对路径注入。
7. **唯一入参 demo id**：绝不把 query 转进 argv/env；子进程 env 从运行器自身 env 显式挑 key 透传；baseURL/provider/model 不可被请求控制。← 杀 key 重定向外泄。
8. **资源**：并发上限 1（满返 429 不排队）；120s 整树超时 kill；`/api/config` 同四重门、只回布尔与 provider 名（baseURL 收敛为 `official|custom|localhost` 枚举）；错误信息泛化无绝对路径。
9. **默认 off**：`DEMO_RUNNER_ENABLED=1` 才绑端口；启动打印醒目 banner；文档显著标注 dev-only、勿公网/反代/0.0.0.0。

### 任务（9 个；> 5 → Task5 后自动 checkpoint）

- [x] T1 [安全核心·L4] `scripts/demo-runner/server.mts`：四重门(Host/Origin/自定义头/POST) + token + 路由(`/api/health` `/api/config` `/api/run`(NDJSON) `/api/stop`) + 并发上限1/429 + fail-closed 顺序校验。独立 `scripts/demo-runner/tsconfig.json`。
- [x] T2 [运行执行] `scripts/demo-runner/runner.mts`：`spawn(execPath,--import tsx,abs)` cwd=root utf8 FORCE_COLOR + `killTree`(win32 taskkill /T /F) + 120s 超时 + stdout/stderr/done/exit → NDJSON 帧。
- [x] T3 [demo 注册·单一数据源] `graph.ts` 加 `ChapterDemo` + 给各 chapter 填 `demo`（needsKey/interactive/needsServer/entry）；`scripts/demo-runner/registry.mts` 从 CHAPTERS 建白名单 Map(id→realpath)，排除 needsServer/interactive。
- [x] T4 [ollama provider] 抽 openai.ts 为可注入工厂 + `createOllamaClient`(默认 11434/v1, key 占位, llama3.2) + `getLLM` switch/`ProviderName` + `createOpenAICompatibleClient` 用 getEnv 不抛 + `.env.example`。（替代方案见 D4）
- [x] T5 [前端终端] `.vitepress/theme/demo-runner/client.ts` + `stream.ts`：xterm 浏览器端动态 import + fetch ReadableStream NDJSON 读取器 → term.write + ResizeObserver fit；禁止 Vue。**← checkpoint**
- [x] T6 [前端面板] vanilla DOM 面板：运行/停止按钮 + 状态(运行中/退出码/耗时) + 配置徽章 + 路由→chapter 解析 + 探活 `/api/config` 降级；禁止 Vue。
- [x] T7 [注入·零改 md] `config.mts` markdown rule `inject-demo-runner`：lessons/rag 页且该 chapter 可运行时，在首个 fence 后插入 `<div data-demo-runner data-demo-id="..."></div>` token（id 由 relativePath→CHAPTERS 反查）；禁止 Vue。
- [x] T8 [接线] `package.json` scripts(`demo:server`、`site:live`=concurrently 且 win32 killOthers/kill-signal) + devDeps(@xterm/xterm、@xterm/addon-fit、concurrently) + `config.mts` token define & xterm optimizeDeps + `.gitignore` token 文件 + server.mts 注册 SIGINT/SIGTERM 优雅退出。
- [x] T9 [文档+安全测试·L4] `README` 加「在网页跑 demo」段 + dev-only 安全声明；`scripts/demo-runner/security.test.mts`(异 Origin/异 Host/缺头→403，合法→200) + 收尾更新本文档。

### 验证策略（风险分级）
- T1/T9 = **L4（安全）**：必须有 `security.test.mts` 自动化断言四重门；手测一次跨源 fetch 被拒。
- T2 = L3：win32 整树 kill 实测（长跑 demo + 断连，Task Manager 确认无 node 孙进程残留）。
- T3/T4 = L2/L3：`tsc --noEmit` 零错；getLLM('ollama') 冒烟（有 ollama 时）。
- T5/T6/T7 = L2：`site:build` exit 0 + 静态产物不含 dev token；非可运行页无 demo slot；无 runner 时 demo 区降级。
- 不变量回归（每 task）：`tsc --noEmit`（不含 scripts/.vitepress）+ `site:build`。

### 下一 Phase 预热（Phase 3: Work）
关键文件: `scripts/demo-runner/server.mts`(T1 起步)、`knowledge-graph/data/graph.ts`(T3)、`src/shared/llm/openai.ts`(T4 抽工厂)
执行命令: 起步先 `npx tsc --noEmit` 取基线；逐 task 后复跑
风险预判: 安全门顺序/fail-closed、token 注入时序竞态、win32 孙进程泄漏、xterm SSR

---

## Phase 3: Work

### T1 安全核心

完成：
- 新增 `scripts/demo-runner/server.mts`：默认关闭的 dev-only 本地 server；`DEMO_RUNNER_ENABLED=1` 才启动。
- 实现四重门：`Host` 白名单、`Origin` 白名单、`X-Demo-Runner: 1`、`X-Demo-Runner-Token`。
- 实现路由：`GET /api/health`、`GET /api/config`、`POST /api/run`、`POST /api/stop`。
- `POST /api/run` 目前只接好 fail-closed 壳与并发上限；实际 spawn 留给 T2 注入 `runDemo`。
- 启动时写 `.vitepress/cache/demo-runner.json` token 文件；该目录已在 `.gitignore`。
- 新增 `scripts/demo-runner/security.test.mts`：覆盖合法请求 200、异 Origin 403、异 Host 403、缺自定义头 403、错误 token 403、`GET /api/run` 405。
- 新增 `scripts/demo-runner/tsconfig.json`，保持 runner 类型检查独立于根 `tsconfig.json`。

验证：
- RED：`npx tsx scripts/demo-runner/security.test.mts` → `ERR_MODULE_NOT_FOUND ... server.mjs`（预期失败）。
- GREEN：`npx tsx scripts/demo-runner/security.test.mts` → pass。
- `npx tsc -p scripts/demo-runner/tsconfig.json` → pass。
- `pnpm typecheck` → pass。
- `pnpm site:build` → pass（沙箱内会因 esbuild `spawn EPERM` 失败；非沙箱真实构建通过）。

Risk: L4（本地代码执行入口安全门）。回归测试已补。

Next: T2 `scripts/demo-runner/runner.mts`，实现 `spawn(process.execPath, ['--import','tsx', absPath], { shell:false })`、utf8 流、120s timeout、win32 process tree kill。

### T2 运行执行

完成：
- 新增 `scripts/demo-runner/runner.mts`：`spawn(process.execPath, ['--import', 'tsx', entryPath], { cwd: repoRoot, shell:false })`。
- stdout/stderr 均 `setEncoding('utf8')` 后按块转成 `stdout` / `stderr` frame。
- 子进程 env 只透传系统运行所需变量与 LLM 相关配置；请求参数不进入 argv/env。
- 超时默认 120s；超时写 stderr frame，并将结果归一为 `timedOut: true`、`exitCode: null`，避免 Windows killed process 的 exit code 细节外泄。
- win32 下用 `taskkill /PID <pid> /T /F` 杀整棵进程树；非 Windows 用 `SIGTERM`。
- 新增 `scripts/demo-runner/runner.test.mts` 与两个 fixture，覆盖 stdout/stderr unicode 流、退出码、timeout kill。

验证：
- RED：`npx tsx scripts/demo-runner/runner.test.mts` → `ERR_MODULE_NOT_FOUND ... runner.mjs`（预期失败）。
- GREEN：`npx tsx scripts/demo-runner/runner.test.mts` → pass。
- `npx tsx scripts/demo-runner/security.test.mts` → pass。
- `npx tsc -p scripts/demo-runner/tsconfig.json` → pass。
- `pnpm typecheck` → pass。
- `pnpm site:build` → pass（非沙箱；沙箱内 esbuild `spawn EPERM` 已归类为环境噪声）。

Risk: L3（本地子进程执行与杀进程树）。行为测试已覆盖可自动断言部分；Task Manager 人工确认留到实际接 UI/长跑 demo 阶段。

Next: T3 `ChapterDemo` 元数据 + registry 白名单 Map，从 CHAPTERS 单一来源派生可运行 demo。

### T3 demo 注册与白名单

完成：
- `knowledge-graph/data/graph.ts` 新增 `ChapterDemo`，`Chapter.demo` 成为 demo 可运行性的单一事实来源。
- 给 19 个 lesson、capstone、6 个 rag-advanced topic 标注 `demo` 元数据：
  - `needsKey: "llm"`：普通 LLM demo。
  - `needsKey: "embedding"`：需要 OpenAI-compatible embedding 的 demo。
  - `needsKey: "none"`：离线 demo（如 `rag-chunk`、第 19 章）。
  - `needsServer: true`：第 18 章 server demo，排除一键运行。
  - `interactive: true`：capstone CLI 无参数会读 stdin，排除一键运行。
- 新增 `scripts/demo-runner/registry.mts`：从 CHAPTERS 派生 `Map<demoId, RunnableDemo>`；跳过 `interactive/needsServer`；所有白名单 entry 必须真实存在、位于 repo 内、且以 `index.ts` 结尾。
- 新增 `scripts/demo-runner/registry.test.mts`：断言 01/08/19/rag-chunk 可运行，18/capstone 被排除，所有 realpath 在 repo 内且是 `index.ts`。

验证：
- RED：`npx tsx scripts/demo-runner/registry.test.mts` → `ERR_MODULE_NOT_FOUND ... registry.mjs`（预期失败）。
- GREEN：`npx tsx scripts/demo-runner/registry.test.mts` → pass。
- `npx tsx scripts/demo-runner/security.test.mts` → pass。
- `npx tsx scripts/demo-runner/runner.test.mts` → pass。
- `npx tsc -p scripts/demo-runner/tsconfig.json` → pass。
- `pnpm typecheck` → pass。
- `pnpm site:build` → pass（非沙箱；沙箱内 esbuild `spawn EPERM` 已归类为环境噪声）。

Risk: L2/L3（数据源扩展 + 白名单安全边界）。自动测试覆盖路径边界与排除规则。

Batch checkpoint: T1-T3 完成，Task 3/9。下一步 T4 ollama provider。

### T4 ollama provider

完成：
- `src/shared/llm/openaiCompatible.ts` 改为可注入 `apiKeyEnv/apiKeyFallback/baseURL/baseURLEnv`；仍在缺 key 时给清晰错误，但允许 ollama 使用本地占位 key。
- `src/shared/llm/openai.ts` 抽出 OpenAI-style client 工厂；`createOpenAIClient` 与 `createOllamaClient` 复用同一路径。
- `createOllamaClient` 默认 `OLLAMA_BASE_URL=http://127.0.0.1:11434/v1`、`OLLAMA_MODEL=llama3.2`、`OLLAMA_API_KEY` 可空。
- `src/shared/llm/index.ts` 扩展 `ProviderName = "anthropic" | "openai" | "ollama"`，`getLLM()` 支持 `LLM_PROVIDER=ollama`。
- `.env.example` 增加 ollama 配置段。
- 新增 `src/shared/llm/openaiCompatible.test.mts`：断言 OpenAI-compatible fallback、`createOllamaClient()`、`getLLM()` env 路由。

验证：
- RED：`npx tsx src/shared/llm/openaiCompatible.test.mts` → 缺 `createOllamaClient` export（预期失败）。
- GREEN：`npx tsx src/shared/llm/openaiCompatible.test.mts` → pass。
- `npx tsx scripts/demo-runner/security.test.mts` → pass。
- `npx tsx scripts/demo-runner/runner.test.mts` → pass。
- `npx tsx scripts/demo-runner/registry.test.mts` → pass。
- `npx tsc -p scripts/demo-runner/tsconfig.json` → pass。
- `pnpm typecheck` → pass。
- `pnpm site:build` → pass（非沙箱；沙箱内 esbuild `spawn EPERM` 已归类为环境噪声）。

Risk: L3（共享 LLM provider 路由）。测试覆盖无 key ollama 本地路径；未实际联网调用 ollama。

Next: T5 vanilla demo-runner client，xterm 浏览器端动态 import + fetch ReadableStream NDJSON → terminal write。

### T5 前端终端

完成：
- 安装 devDeps：`@xterm/xterm@6.0.0`、`@xterm/addon-fit@0.11.0`。
- 新增 `.vitepress/theme/demo-runner/stream.ts`：NDJSON 增量解析，支持 chunk split 与尾行 flush。
- 新增 `.vitepress/theme/demo-runner/stream.test.mts`：覆盖 split frame、尾行无换行、非法 JSON 报错。
- 新增 `.vitepress/theme/demo-runner/client.ts`：
  - 浏览器环境下动态加载 `@xterm/xterm`、`@xterm/addon-fit`、xterm CSS。
  - 使用 `MutationObserver` 扫描并绑定 `[data-demo-runner]` 占位节点。
  - `fetch` + `ReadableStream` + `TextDecoderStream` 读取 NDJSON，并写入 xterm。
  - 提供运行/停止/清空按钮与状态文本，不使用 Vue。
- `.vitepress/theme/index.ts` 只 import vanilla client 模块；不注册 Vue 组件。

验证：
- RED：`npx tsx .vitepress/theme/components/demoTerminalStream.test.mts` → 缺 `demoTerminalStream.js`（预期失败，旧 Vue 路线已废弃并删除）。
- GREEN：`npx tsx .vitepress/theme/demo-runner/stream.test.mts` → pass。
- `npx tsx src/shared/llm/openaiCompatible.test.mts` → pass。
- `npx tsx scripts/demo-runner/security.test.mts` → pass。
- `npx tsx scripts/demo-runner/runner.test.mts` → pass。
- `npx tsx scripts/demo-runner/registry.test.mts` → pass。
- `npx tsc -p scripts/demo-runner/tsconfig.json` → pass。
- `pnpm typecheck` → pass。
- `pnpm site:build` → pass（非沙箱；沙箱内 esbuild `spawn EPERM` 已归类为环境噪声）。

Risk: L2（前端终端 DOM client + 新依赖）。视觉/交互完整性留到 T6/T7 接线后用 Browser 验证。

Checkpoint: T5 后按计划生成 `docs/plans/.handoff/2026-06-10-demo-live-runner-handoff-22.md` 与 compact 摘要。

### T6 前端面板

完成：
- `.vitepress/theme/demo-runner/client.ts` 扩展为完整 vanilla DOM 面板：标题、运行/停止/清屏按钮、runner/provider/key badge、消息区与 xterm 容器。
- 进页探测 `/api/config`：无 token、runner 未启动、缺 key 都降级为禁用运行按钮 + 友好提示；`needsKey="none"` 与 `provider="ollama"` 不强制 key。
- 点击运行时动态 import xterm 与 addon-fit；`fetch /api/run` 读取 NDJSON 流，stdout/stderr/exit 分别写入终端。
- 停止按钮调用 `/api/stop` 并 abort 当前请求；清屏按钮在首次使用时懒加载终端。
- 全程不使用 Vue / `.vue` / 组件注册。

验证：
- `npx tsx .vitepress/theme/demo-runner/stream.test.mts` → pass（非沙箱；沙箱内 esbuild `spawn EPERM` 属环境噪声）。
- `pnpm site:build` → pass（非沙箱）。
- no-Vue 实现扫描：`.vitepress scripts src knowledge-graph` 中无 `.vue` / `from "vue"` / `app.component` / `onMounted` / `ClientOnly`。

Risk: L2（浏览器端交互 + dynamic import）。由 build + parser test + no-Vue grep 覆盖；真实视觉交互可用 `pnpm site:live` 人工点运行确认。

### T7 markdown 注入

完成：
- `.vitepress/config.mts` 新增 `buildDemoMarkers()`，从 CHAPTERS 的 `demo` 元数据派生可运行页 marker；同时登记 `<dir>/README.md` 与 rewrite 后 `<dir>/index.md`。
- 新增 markdown core rule `inject-demo-runner`：仅在可运行 lesson/rag 页的首个 fence 后注入 `<div data-demo-runner ...>`，课程 Markdown 正文零改动。
- `needsServer`（第 18 章）与 `interactive`（capstone CLI）页面不会注入 runner。

验证：
- `pnpm site:build` → pass。
- `.vitepress/dist/lessons/01-what-is-an-agent/index.html` → 含 `data-demo-runner data-demo-id="01"`。
- `.vitepress/dist/rag-advanced/01-chunking-strategies/index.html` → 含 `data-demo-runner data-demo-id="rag-chunk"`。
- `.vitepress/dist/lessons/18-deployment/index.html` → 不含 `data-demo-runner`。
- `.vitepress/dist/capstone/deep-research-agent/index.html` → 不含 `data-demo-runner`。

Risk: L2（markdown 渲染期注入）。产物 grep 覆盖正反例。

### T8 接线与 token 时序

完成：
- `package.json` 新增：
  - `demo:server` → `tsx scripts/demo-runner/start.mts`
  - `demo:clear-token` → 清理 `.vitepress/cache/demo-runner.json`
  - `demo:wait-token` → 等待 runner 成功写入 token
  - `site:live` → 先清 token，再用 concurrently 并发启动 runner 与站点；站点启动前等待 token
- 安装 `concurrently@10.0.3`；保留 `@xterm/xterm` 与 `@xterm/addon-fit`。
- `.vitepress/config.mts` 只在 `site:dev` 生命周期读取 token 并用 Vite `define` 注入；`site:build` 强制空 token，避免静态产物泄露 dev token。
- `startDemoRunnerServer()` 改为 `listen()` 成功后再写 token；端口占用时不再留下假 token。
- `scripts/demo-runner/start.mts` 读取 `.env`、构建 registry、把 `/api/run` demo id 映射到真实白名单入口并调用 `runDemoProcess`。
- `server.mts` 注册 SIGINT/SIGTERM 优雅退出。
- `server.mts` 补 CORS preflight：只允许白名单 Host/Origin/Method/Header；实际请求仍必须四重门 + token。

验证：
- `pnpm demo:clear-token` → pass（非沙箱）。
- 端到端冒烟（非沙箱）：后台 `pnpm demo:server` → `pnpm demo:wait-token` → 带 token 请求 `/api/config` → exit 0；测试后停止残留 node 进程，`netstat :5174` 仅剩 TIME_WAIT。
- `pnpm site:build` → pass；grep 当前 dev token 不在 `.vitepress/dist`。
- `npx tsx scripts/demo-runner/security.test.mts` → pass；覆盖合法 CORS preflight 204、未知 preflight header 403、合法 config 200、异 Origin/Host/缺头/错 token 403、GET run 405。

Risk: L4（token/CORS/本地代码执行入口）+ L2（script orchestration）。安全测试与端到端冒烟覆盖关键链路。

### T9 文档与安全收口

完成：
- `README.md` 在“用网页方式学习”下新增「在网页里直接运行 demo」：`pnpm site:live`、站点/runner 地址、本地 `.env`/Ollama 说明、dev-only 安全声明。
- 本 sprint 文档更新 T6-T9、Review、Compound，并修正旧的 Vue/ClientOnly/onMounted 调研表述为当前 vanilla DOM 实现。

验证：
- `pnpm typecheck` → pass。
- `npx tsc -p scripts/demo-runner/tsconfig.json` → pass。
- `npx tsx .vitepress/theme/demo-runner/stream.test.mts` → pass（非沙箱）。
- `npx tsx scripts/demo-runner/security.test.mts` → pass（非沙箱）。
- `npx tsx scripts/demo-runner/runner.test.mts` → pass（非沙箱）。
- `npx tsx scripts/demo-runner/registry.test.mts` → pass（非沙箱）。
- `npx tsx src/shared/llm/openaiCompatible.test.mts` → pass（非沙箱）。
- `pnpm site:build` → pass（非沙箱；沙箱内 esbuild `spawn EPERM` 已归类为环境噪声）。

Risk: L4 文档必须真实反映安全边界；已与实现和测试对齐。

---

## Phase 4: Review

### P0/P1 findings

无未关闭 P0/P1。

已在实现期发现并修复：
- **P0: CORS preflight 与自定义头冲突**。浏览器跨端口 fetch 会发 `OPTIONS`，原四重门会因无 token 拒绝预检，导致合法前端也不可用。修复：新增安全 preflight 分支，只允许白名单 Host/Origin/Method/Header；实际请求仍走 token 四重门。`security.test.mts` 覆盖 204/403。
- **P1: token 竞态/假 token**。端口占用时 server 先写 token 再 listen 失败，`wait-token` 可能通过但请求打到旧进程。修复：`site:live` 先 clear token；`startDemoRunnerServer()` listen 成功后才写 token；端到端冒烟复验通过。
- **P1: build 泄露 dev token 风险**。若 `.vitepress/cache/demo-runner.json` 存在，`site:build` 也可能读入 token。修复：仅 `npm_lifecycle_event === "site:dev"` 注入 token；build 后 grep token 不在 dist。

### 第 6 视角 - 集成连续性

- CHAPTERS 单一来源保持：sidebar 与 demo marker 都由 `knowledge-graph/data/graph.ts` 派生；无第二套文件扫描真相源。
- 课程 Markdown 零改动保持：runner slot 由 markdown rule 注入，README/lessons/rag 正文未写按钮。
- 静态站独立部署保持：`site:build` 成功，且不包含 dev token；没有 runner 时前端禁用运行并提示 `pnpm site:live`。
- no-Vue 硬约束保持：新增实现为 vanilla TypeScript + DOM API；未新增 `.vue` 文件或 Vue API 调用。
- 半完成状态：有完整 dev-only 链路；生产/部署仍按原 deferred，不被本 sprint 偷偷扩大范围。

### Residual risk

- 未在本轮用浏览器手点 `Run` 跑真实 LLM demo，因为这会消耗本地 key/模型资源；自动验证覆盖 server/token/config/registry/runner/process/parser/build。人工验收可用免 key 的 `rag-chunk` 页先点跑。

---

## Phase 5: Compound

### 经验沉淀

1. 本地浏览器触发本地代码执行时，`localhost` 绑定不足以防 CSRF/DNS-rebinding；至少需要 Host + Origin + 自定义头 + token，且 CORS preflight 要单独安全建模。
2. VitePress dev token 只能在 `site:dev` 注入；`site:build` 必须空 token，否则 ignored cache 也可能泄露进静态 bundle。
3. 并发启动 companion server 与 dev site 时，先 clear stale token，再 wait fresh token；server 必须 listen 成功后写 token，避免端口占用生成假凭证。
4. 用户明确禁止某技术栈时，文档与代码都要改到同一个事实表面：本 sprint 已从 Vue 组件路线切到 vanilla DOM client。

### 本 sprint 立的 invariants

- demo runner 入口 dev-only；server/token 不进静态 build。
- demo 白名单从 CHAPTERS 派生，运行请求只传 demo id，不传路径/argv/env。
- 前端 runner 禁止 Vue，使用 vanilla TypeScript + DOM API。
- CORS preflight、实际请求、token 生成时序都必须有回归测试或端到端冒烟覆盖。

### Final status

Sprint completed. Tasks 9/9. Checkpoints 1. Auto mode gates: T1/T9 L4 用测试与端到端冒烟收口；未触发 destructive/manual gate。
