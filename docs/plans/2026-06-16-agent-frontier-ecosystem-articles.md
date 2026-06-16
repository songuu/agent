---
title: "Agent 前沿与生态章节延伸阅读补强"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, education, agent, ecosystem, frontier, knowledge-graph]
aliases: ["agent frontier ecosystem articles", "前沿与生态文章补强"]

invariants:
  - "知识图谱与延伸阅读自动段只改 knowledge-graph/data/graph.ts,再由生成器注入"
  - "外部资料必须优先官方来源,避免把快速变化生态写成无来源判断"
  - "章节 demo 保持离线运行,不需要 .env,不消耗 token"
  - "tsc --noEmit 全仓库零类型错误"

invariant_tests:
  - "npx tsc --noEmit"

deferred: []
deadcode_until: []
---

# Sprint: Agent 前沿与生态章节延伸阅读补强

## Phase 1: 需求分析

### Scope

- 继续丰富 `lessons/19-agent-ecosystem-and-frontier/README.md` 的延伸阅读。
- 通过知识图谱数据源补更多官方文章/文档,保证全局图谱、交互图谱和章节尾部一致。
- 保持第 19 章代码 demo 离线可运行。

### Non-scope

- 不新增新的课程章节。
- 不实时集成第三方 SDK。
- 不手改 `<!-- KG:START -->` 自动生成区。

### Success

- [x] 第 19 章自动生成的“延伸阅读”从 3 条扩展到 33 条。
- [x] 新增/关联来源覆盖 OpenAI Agents SDK、Responses API、MCP spec、A2A、Vercel AI SDK、CrewAI、LlamaIndex、guardrails、observability。
- [x] 第 19 章“延伸阅读”每条都显示 `来源：发布方 · [标题](原文链接)`,标题可直接点击查看原文。
- [x] `npm run kg` 等价生成器入口通过,并更新 `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、第 19 章 README。
- [x] `npx tsc --noEmit` 与第 19 章 demo 通过。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| knowledge graph | 自动段只从 `knowledge-graph/data/graph.ts` 生成 | 只改 `ARTICLES`,再跑生成器 |
| lessons | README + 可运行 .ts 自包含 | 第 19 章 demo 未改,但收尾重跑 |
| TypeScript | `tsc --noEmit` 零错误 | 收尾运行 invariant test |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 新增第 19 章资料关联 | 用户阅读第 19 章尾部延伸阅读 | `ARTICLES` → `npm run kg` 注入 | git 文件 | ✅ |
| 全局图谱文章索引 | 用户打开 `docs/knowledge-graph.md` | 生成器重建 Markdown | git 文件 | ✅ |
| 交互图谱节点文章 | 用户打开 `knowledge-graph/output/index.html` | HTML 数据重建 | git 文件 | ✅ |

### 入场扫描 - 债务清单

无历史 deferred 债务。

### 任务拆解

| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 盘点第 19 章现有官方来源与图谱文章差距 | L1 | 确认 README 手写来源 11 条、自动延伸阅读仅 3 条 |
| 2 | 补 `ARTICLES` 第 19 章关联 | L1 | 官方来源覆盖 SDK / API / 协议 / runtime / UI / 数据层 / 治理层 |
| 3 | 重生成并验证 | L2 | 图谱产物、README 注入、demo、typecheck |
| 4 | 补来源展示与第二批资料 | L2 | `source` 字段、来源展示、OpenAI hosted tools / Google ADK / AutoGen / Semantic Kernel / Bedrock / 2026 papers |

## Phase 3: 变更日志

### Task 1 — 差距盘点

- `lessons/19-agent-ecosystem-and-frontier/README.md` 的“官方资料来源”已有 11 条。
- 自动生成的“延伸阅读”来自 `knowledge-graph/data/graph.ts` 的 `ARTICLES`,此前第 19 章只关联 3 条。

### Task 2 — 补充文章关联

- 新增第 19 章专属资料:
  - OpenAI Agents SDK for TypeScript
  - OpenAI Responses API Reference
  - OpenAI: The next evolution of the Agents SDK
  - Model Context Protocol specification repository
  - A2A Protocol specification
  - Vercel AI SDK 5 announcement
  - CrewAI introduction
  - LlamaIndex Agents documentation
- 将既有 guardrails、observability、Vercel AI SDK 文档同时关联到第 19 章,但保留原 note,避免无关章节文案漂移。

### Task 3 — 重生成并验证

- 沙盒内 `npm run kg` 首次失败: `spawn EPERM`。判定为本机沙盒/tsx/esbuild 子进程限制。
- 沙盒外等价入口 `node node_modules\\tsx\\dist\\cli.mjs knowledge-graph\\generate.ts` 通过。
- 沙盒内 `npm run site:build` 失败: VitePress 加载配置时 `spawn EPERM`。沙盒外重跑审批两轮各两次超时,本轮未完成站点构建验证。
- 更新产物:
  - `docs/knowledge-graph.md`
  - `knowledge-graph/output/index.html`
  - `lessons/19-agent-ecosystem-and-frontier/README.md`

### Task 4 — 来源展示与第二批资料补强

- `Article` 增加可选 `source` 字段；未填写时生成器从 URL 域名兜底。
- 第 19 章延伸阅读改为 `来源：X · [标题](原文链接)` 格式,并增加说明: 标题可点击查看原文。
- 全局图谱文章表增加“来源”列；交互式图谱侧栏显示来源。
- 新增/关联第二批资料:
  - OpenAI hosted tools / sandbox / eval / MCP connectors / conversation state。
  - Anthropic context engineering。
  - Google A2A announcement、Google ADK。
  - LangSmith observability。
  - Vercel AI SDK UI chatbot。
  - CrewAI Flows、LlamaIndex Workflows。
  - Microsoft AutoGen、Semantic Kernel Agent Framework、Amazon Bedrock Agents。
  - 2026 arXiv: structural coverage for agentic workflows、Agent-Diff state-diff evaluation。
- 重生成后 `ARTICLES` 总数为 87,第 19 章延伸阅读为 33 条。

## Phase 4: 审查结果

### 多视角审查

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | 通过 | 仍由 `ARTICLES` 作为 single source of truth,自动生成产物不手改。 |
| 安全 | 通过 | 只新增外部资料链接,不引入依赖、密钥、网络运行代码或新工具权限。 |
| 教学质量 | 通过 | 第 19 章延伸阅读覆盖 8 个生态层,并显式标注来源与原文链接,更贴近“前沿与生态”定位。 |
| 代码质量 | 通过 | `npx tsc --noEmit` 通过,第 19 章 demo 通过。 |
| 链接质量 | 通过 | 新增来源均为官方站点/官方 spec 仓库；外部链接仍需随生态变化定期复核。 |
| 第 6 视角: 集成连续性 | 通过 | 第 11/12 章自动段无实质 diff; 第 19 章、全局图谱、交互图谱一致。 |

### Findings

- P0: 无。
- P1: 无。
- P2: 生态资料仍会随时间漂移。处理: 延续第 19 章顶部“资料时间”提示,并集中维护官方来源。

### 验证记录

- `npm run kg` (sandbox) → fail: `spawn EPERM`。
- `node node_modules\\tsx\\dist\\cli.mjs knowledge-graph\\generate.ts` (sandbox 外) → pass,完成 36 单元 / 221 概念 / 351 关系 / 69 文章。
- `node node_modules\\tsx\\dist\\cli.mjs knowledge-graph\\generate.ts` (sandbox 外, 第二轮) → pass,完成 36 单元 / 221 概念 / 351 关系 / 87 文章。
- `node node_modules\\tsx\\dist\\cli.mjs lessons\\19-agent-ecosystem-and-frontier\\index.ts` (sandbox 外) → pass。
- `npx tsc --noEmit` → pass,仅 npm 配置 warning。
- `git diff --check` → pass,仅 Git CRLF warning。
- `npm run site:build` (sandbox) → fail: `spawn EPERM`。
- `npm run site:build` (sandbox 外) → not run: approval review timed out twice in both attempts。

## Phase 5: 复利记录

### 经验沉淀

1. **自动生成段必须从数据源补齐,不要手改 README 尾部。**  
   本仓库的延伸阅读由 `ARTICLES` 注入,手改自动段会被下一次 `npm run kg` 覆盖。

2. **给一章补文章时要检查交叉章节副作用。**  
   如果复用既有文章并修改 note,会同步改变所有关联章节的自动段；更稳妥的是只追加 chapter 关联或新增专属文章。

3. **生态章节应覆盖层级而非只堆链接。**  
   第 19 章资料补强按模型接口、SDK、协议、runtime、UI、数据、观测、安全治理覆盖,比随机加链接更有教学价值。

4. **文章集合要显式展示来源。**  
   只放 URL 不够教学友好；显示 `来源：发布方 · [标题](原文)` 能同时满足可信度判断和一键查看原文。
