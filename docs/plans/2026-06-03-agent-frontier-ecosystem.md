---
title: "Agent 前沿发展与生态拆解章节"
type: sprint
status: completed
created: "2026-06-03"
updated: "2026-06-03"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, education, agent, ecosystem, frontier]
aliases: ["agent frontier ecosystem", "agent 生态拆解"]

invariants:
  - "所有课程代码用 TypeScript + tsx 直接运行,零编译步骤 (npx tsx lessons/NN-xxx/index.ts)"
  - "所有 LLM 调用经 src/shared/llm 的 provider 无关接口,绝不在课程里直接 new Anthropic()"
  - "每个 lesson 目录自包含: README.md(讲解) + 可运行 .ts + 文末练习"
  - "课程导入共享代码一律用显式相对路径 (../../src/shared/...),不用路径别名魔法,保证初学者可追溯"
  - "示例主用 Claude,关键处标注 OpenAI 等价写法;切换厂商只改 .env,不改课程代码"
  - "tsc --noEmit 全仓库零类型错误"

invariant_tests:
  - "npx tsc --noEmit"

deferred: []
deadcode_until: []
---

# Sprint: Agent 前沿发展与生态拆解章节

## Phase 1: 需求分析

### Scope

- 新增一章结合 2026-06-03 官方资料的 agent 最新发展。
- 对当前 agent 生态做分层拆解: 模型接口、工具协议、agent SDK、编排 runtime、数据/RAG、UI/产品、观测评估、安全治理。
- 课程保持 TypeScript 友好,新增章节也要有可运行 `index.ts`。
- 更新 README 和 curriculum,把新章纳入学习路径。

### Non-scope

- 不做实时 SDK 集成或依赖升级。
- 不声称第三方生态排名绝对正确;只按官方文档与课程目标做工程分类。
- 不引入网络调用型 smoke;新章代码离线运行。

### Success

- [x] 新增 `lessons/19-agent-ecosystem-and-frontier/README.md`。
- [x] 新增可运行 `lessons/19-agent-ecosystem-and-frontier/index.ts`。
- [x] README / curriculum 从 18 章更新为 19 章。
- [x] 章节包含前沿趋势、生态分层、选型矩阵、Mermaid 图、官方资料来源。
- [x] `npx tsc --noEmit` 与 Markdown 链接检查通过。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| lessons | README + 可运行 .ts 自包含 | 第 19 章提供 README + index.ts |
| shared LLM | 课程不直接 new 厂商 SDK | 新章代码离线,不引入 SDK |
| TypeScript | `tsc --noEmit` 零错误 | 收尾运行 invariant test |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 新增生态章节 | 用户阅读/运行第 19 章 | README + index.ts | git 文件 | ✅ |
| 更新总览 | 用户看 README / curriculum | Markdown 链接 | git 文件 | ✅ |

### 入场扫描 - 债务清单

无历史 deferred 债务。

### 任务拆解

| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 查官方资料 | L2 | OpenAI / Anthropic / MCP / A2A / LangGraph / Vercel / CrewAI / LlamaIndex 来源 |
| 2 | 新增第 19 章 README | L2 | 前沿趋势 + 生态分层 + 选型矩阵 + 图解 |
| 3 | 新增第 19 章 index.ts | L1 | 离线打印生态地图与选型表 |
| 4 | 更新 README / curriculum | L1 | 19 章路径纳入总览 |
| 5 | 验证与 Compound | L2 | tsc / 链接 / 结构检查 |

## Phase 3: 变更日志

### Task 1 — 查官方资料

- 查阅 OpenAI Agents SDK / Responses API、Anthropic agent 架构文章、MCP 官方文档与 spec、A2A spec、LangGraph overview、Vercel AI SDK、CrewAI、LlamaIndex agents 文档。
- 决策: 新章显式标注资料时间 `截至 2026-06-03`,避免把快速变化生态写成永久事实。

### Task 2 — 新增第 19 章 README

- 新增 `lessons/19-agent-ecosystem-and-frontier/README.md`。
- 内容覆盖:
  - 2025–2026 agent 发展主线。
  - 模型接口 / 工具协议 / Agent SDK / 编排 runtime / 数据/RAG / UI / 观测评估 / 安全治理八层拆解。
  - MCP vs A2A 对比。
  - 主要框架与平台选型矩阵。
  - 前沿趋势: hosted tools、sandbox、runtime 下沉、协议层、人类介入、eval/observability。
  - 官方资料来源。

### Task 3 — 新增第 19 章 index.ts

- 新增 `lessons/19-agent-ecosystem-and-frontier/index.ts`。
- 离线运行,不需要 `.env`,打印生态层、场景选型、从 demo 到 production 的升级路径。

### Task 4 — 更新 README / curriculum

- `README.md` 学习路径、章节表、目录结构更新为 19 章。
- `docs/curriculum.md` 新增第七部分“前沿与生态”,更新时长估算和学习路径图。
- `lessons/18-deployment/README.md` 末尾延伸链路接到第 19 章。

### Task 5 — 验证与 Compound

- 完成类型检查、链接检查、课程结构检查、课程侧 SDK 违规扫描。

## Phase 4: 审查结果

### 多视角审查

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | 通过 | 新章作为第七部分收束生态视角,不打断 01–18 的从原理到生产主线。 |
| 安全 | 通过 | 新章代码离线运行,不引入密钥、网络调用或新依赖。 |
| 教学质量 | 通过 | 增加生态分层、MCP/A2A 对比、选型矩阵、趋势判断,回应用户“最新发展 + 生态拆解”需求。 |
| 代码质量 | 通过 | `npx tsc --noEmit` 通过,第 19 章 `index.ts` 可运行。 |
| 链接质量 | 通过 | Markdown 相对链接检查通过。外部链接为官方资料源,需随生态变化定期复核。 |
| 第 6 视角: 集成连续性 | 通过 | README、curriculum、第 18 章延伸、第 19 章互相连通; 无 dead code 债务。 |

### Findings

- P0: 无。
- P1: 无。
- P2: 生态资料会随时间漂移。处理: 第 19 章顶部标注资料日期,官方来源集中列在章节末尾。

### 验证记录

- `npx tsx lessons\19-agent-ecosystem-and-frontier\index.ts` (沙盒外) → pass。
- `npx tsc --noEmit` → pass。
- Markdown 相对链接检查 → pass。
- lessons 结构检查: 所有 lesson 目录均有 `README.md + index.ts`。
- `rg -n 'TODO|FIXME|new Anthropic|new OpenAI|@anthropic-ai/sdk' lessons capstone README.md docs\curriculum.md docs\career-guide.md docs\startup-guide.md` → no matches。

## Phase 5: 复利记录

### 经验沉淀

1. **讲“最新生态”必须写资料时间与来源**  
   Agent 生态变化快,课程中应标注“截至日期”,并集中列官方来源,否则文档很快变成伪确定性。

2. **生态拆解比框架罗列更有教学价值**  
   把生态拆成模型接口、工具协议、Agent SDK、编排 runtime、数据/RAG、UI、观测、安全治理八层,学习者更容易按需求选型。

3. **MCP 和 A2A 要明确区分**  
   MCP 解决 agent 连接工具/数据; A2A 解决 agent 连接 agent。混在一起会导致错误架构判断。

### 后续建议

- 每 1–2 个月复核第 19 章官方链接与选型矩阵。
- 后续 capstone 可增加一个“生态版架构升级路线”: 手写版 → Vercel AI SDK UI → LangGraph runtime → MCP tools。
