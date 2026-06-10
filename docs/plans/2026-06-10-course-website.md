---
title: "课程网页化：VitePress 总览站点"
type: sprint
status: completed
created: "2026-06-10"
updated: "2026-06-10"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, website, vitepress, docs]
aliases: ["课程网站", "course-website"]
auto_mode: true

invariants:
  - "站点 sidebar/课程清单由 knowledge-graph/data/graph.ts 的 CHAPTERS 驱动（数据驱动，新增章节自动上站）"
  - "课程 Markdown 正文零改动（站点只消费不改写）"
  - ".vitepress 不进 tsconfig include；npm run typecheck 行为不变"
  - "docs/plans/** 不发布到站点（srcExclude）"

invariant_tests:
  - "npx tsc --noEmit（项目类型不受站点影响）"
  - "pnpm site:build（站点构建 exit 0）"

deferred:
  - sprint: "2026-06-04-knowledge-graph"
    item: "直接打包部署（tsup/dist + Docker + CI；含站点的 GitHub Pages 自动发布）"
    deadline: "2026-06-30"
    reason: "部署/CI 统一留给部署 sprint；本 sprint 只交付本地可 build/preview 的站点"
---

# 课程网页化：VitePress 总览站点

## Phase 1: 需求分析（Think）

### 原始需求
> 将所有的课程都需要直接通过网页的形式呈现，需要一个总览界面，直接支持跳转显示不同的课程，需要将界面设计的非常美观保证功能和展示效果都很好。

### Scope
- 美观总览首页：hero + 12 个分版块卡片（七部分 + 毕设 + 进阶 RAG + 图谱 + 求职 + 创业）
- 全部课程网页化：19 lessons + rag-advanced 6 章 + capstone + docs 指南，侧边栏完整目录、上一篇/下一篇
- 全文本地搜索（中文可用）、暗色模式、移动端自适应
- README 里的 Mermaid 图直接渲染；`.ts` 源码相对链接自动跳转 GitHub
- 交互式知识图谱 HTML 可从站内打开
- 干净 URL（`/lessons/01-what-is-an-agent/` 而非 `.../README.html`）

### Non-scope
- 不改任何课程 Markdown 正文（站点只消费）
- 不做后端/评论/账号
- 不做 CI 自动发布（归 deferred 部署 sprint）；本次交付 `site:dev / site:build / site:preview`

### 技术选型
**VitePress**（devDependency）+ `vitepress-plugin-mermaid` + `markdown-it-task-lists`。
理由：md 原地建站零迁移；默认主题即高颜值（暗色/响应式/搜索内置）；TS 配置可直接 import `CHAPTERS` 做数据驱动 sidebar；mermaid 插件覆盖全部图。
否决：自写静态生成器（美观成本高一个量级）、Docusaurus（React 栈过重）、Astro Starlight（引入第二框架心智）。

## Phase 2: 技术方案（Plan）

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| 知识图谱 | 数据驱动单一来源 | sidebar/rewrites 由 CHAPTERS 生成；新增章节进 CHAPTERS 即自动上站 |
| 类型 | tsc --noEmit 零错 | .vitepress 不进 tsconfig include，typecheck 行为不变 |
| 课程内容 | README 注入幂等 | 站点零改动课程 md；KG 注入段在站点正常渲染 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 产物 | 成环 |
|--------|----------|--------|------|------|
| .vitepress/config.mts | site:dev/build | CHAPTERS → sidebar/rewrites | dist/ 静态站 | ✅ |
| index.md 首页 | / 路由 | hero+features → 各版块 | 总览界面 | ✅ |
| ts 链接转换 | md 渲染期 | relativePath 解析 → GitHub blob | 源码可点 | ✅ |
| 交互 KG html | dev 中间件 + buildEnd 拷贝 | knowledge-graph/output → dist 同路径 | 站内可开 | ✅ |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-04-knowledge-graph | 直接打包部署（含站点 Pages 发布） | ⏭ 保持 deferred | 2026-06-30 |

### 设计要点

- `rewrites`：`lessons/:l/README.md → lessons/:l/index.md`（同 rag-advanced/capstone/knowledge-graph），配 `cleanUrls` 得到 `/lessons/01-.../`；VitePress 会按 rewrites 解析相对链接。
- `srcExclude`：`docs/plans/**`（内部文档不发布）、根 `README.md`（与首页重复）。
- 搜索：`themeConfig.search = { provider: 'local' }` + 中文文案。
- 美观：品牌渐变色 CSS 变量、hero 渐变名、卡片 hover、中文字体栈；暗色自动适配。
- `ignoreDeadLinks: true` 兜底（少量指向 LICENSE 等非 md 的链接）。

### 任务
- [ ] W1 脚手架：.vitepress/config.mts + theme + index.md + package.json scripts/devDeps
- [ ] W2 安装 + build + 修错（需 shell 恢复）
- [ ] W3 README 接线 + 本文档更新
- [ ] W4 审查 + Compound

## Phase 3: 变更日志（Work）

- **W1 脚手架** ✓ — 新增 `.vitepress/config.mts`（CHAPTERS 数据驱动 sidebar、rewrites 干净 URL、本地搜索中文化、mermaid（放宽 maxTextSize/maxEdges 以渲染 165 节点全局图）、`.ts` 等代码相对链接→GitHub blob 新开页、交互 KG html dev 中间件 + buildEnd 拷贝、srcExclude 排除 docs/plans 与根 README）；`.vitepress/theme/`（默认主题 + 品牌渐变/卡片 hover/中文字体栈）；`index.md` 总览首页（hero + 12 卡片 + 学习路径 mermaid + 快速开始）；package.json 加 `site:dev/build/preview` 与 devDeps（vitepress/mermaid/vitepress-plugin-mermaid/markdown-it-task-lists）；.gitignore 加 `.vitepress/dist|cache`。
- **W3 文档接线** ✓ — README 快速开始加「用网页方式学习」段（命令 + 数据驱动说明）。
- **W2 安装+build** ✓ — `pnpm install`（vitepress 1.6.4 + mermaid 11 + 插件）exit 0；`pnpm site:build` exit 0（27.34s）。dist 产出 38 个 HTML：首页 + 19 lessons + 6 rag-advanced + capstone + 8 docs 指南 + 交互式图谱（buildEnd 已拷贝到 `knowledge-graph/output/index.html`）。同批补跑上一 sprint 验证链全绿（详见 2026-06-09 文档 Phase 4/5）。

## Phase 4: 审查结果（Review）

**方式**：构建即验证 + 确定性内联核查（链接/转换/数据驱动完整性比派 agent 读渲染 HTML 更确定，故内联做）。

### 确认并已修的 P1

- `.vitepress/config.mts`: bug: **正文跨章链接断裂**。`cleanUrls + rewrites(README.md→index.md)` 下，VitePress 对正文里指向 `../NN-xxx/README.md` 的相对链接只剥 `.md` → 输出 `.../README`（404），footer 上/下一篇（来自 sidebar 绝对链接）正常掩盖了问题，`ignoreDeadLinks` 又让 build 不报。影响每章正文互链 + KG 注入段链接。修复：markdown 渲染期新增 `normalize-relative-links` 规则——`/README.md`→目录干净 URL、其余 `.md`→去扩展、源码扩展→GitHub blob（合并原 code-links 规则）。**复验**：重建后全站 grep `href=...README` 与内部 `.md` 均为空；跨章链接变为 `../02-first-llm-call/`、`../../rag-advanced/01-.../`、`../../docs/rag-system-project` 等干净 URL，浏览器内从 `/lessons/09-.../` 正确解析。

### 第 6 视角（集成连续性）

- **数据驱动 invariant 保持**：sidebar 由 `CHAPTERS` 生成，渲染产物含七部分 + 毕业项目(🎓) + 进阶 RAG 专题(R1–R6) + 知识图谱 + 学完之后，链接全部指向干净 URL。新增章节进 CHAPTERS 即自动上站，无需改站点。
- **课程 md 零改动**：站点只 import/消费；本 sprint 未碰任何 lessons/docs 正文。
- **typecheck 不受影响**：`.vitepress` 不在 tsconfig include；`tsc --noEmit` 仍 0 错（上一 sprint 补跑确认）。`config.mts` 由 VitePress esbuild 处理，build 通过即有效。
- **外部改动并存自洽**：会话期间仓库另有人新增 `src/shared/llm/openaiCompatible.ts` 并改 embeddings/openai 走兼容端点（tsc 0 错，与本 sprint 正交，保留不动）。
- 与 goal 无漂移：全部产出服务于「课程网页化总览 + 跳转 + 美观」。

### 待人工目检（非阻塞）

视觉美观需浏览器实看：`pnpm site:dev` 打开首页/任一课程，确认渐变 hero、卡片 hover、暗色、移动端、mermaid 渲染、本地搜索。功能正确性已由 build + 全站链接普查确定性验证。

## Phase 5: 复利记录（Compound）

### 经验沉淀
1. **新增** `vitepress-readme-rewrite-gotcha`（reference）：用 README.md 命名 + rewrites + cleanUrls 建站时，VitePress 不会把正文里指向 `README.md` 的相对链接重写成目录 URL（只剥 .md → `.../README` 404）；ignoreDeadLinks 还会掩盖。解法=markdown 渲染期自写链接规范化规则。
2. **更新** `project-agent-curriculum`：补课程站点（VitePress，数据驱动 sidebar，site:dev/build/preview）。

### 本 sprint 立的 invariants（见 frontmatter）
站点 sidebar 由 CHAPTERS 数据驱动 / 课程 md 零改动 / .vitepress 不进 tsconfig / docs/plans 不发布。invariant_tests：tsc、site:build。

### 模式确认
- **确定性内联核查 > 派 agent 读渲染产物**：链接完整性、转换正确性、结构完整性都是可 grep 的确定事实，内联 1-2 条命令比多 agent 审查更快更确定（与 RAG sprint「13 findings 仅 1 真」呼应：审查的价值在抓不确定项，确定项自己 grep）。
- 站点功能性可被 build + 产物 grep 全量验证；唯视觉美观需人眼，已显式标注为非阻塞待目检。
