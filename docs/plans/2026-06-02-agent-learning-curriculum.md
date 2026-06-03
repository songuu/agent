---
title: "Agent 开发完整学习路径 (TypeScript)"
type: sprint
status: completed
created: "2026-06-02"
updated: "2026-06-03"
checkpoints: 0
tasks_total: 7
tasks_completed: 7
tags: [sprint, education, agent, typescript, curriculum]
aliases: ["agent 学习路径", "agent curriculum"]

invariants:
  - "所有课程代码用 TypeScript + tsx 直接运行,零编译步骤 (npx tsx lessons/NN-xxx/index.ts)"
  - "所有 LLM 调用经 src/shared/llm 的 provider 无关接口,绝不在课程里直接 new Anthropic()"
  - "每个 lesson 目录自包含: README.md(讲解) + 可运行 .ts + 文末练习"
  - "课程导入共享代码一律用显式相对路径 (../../src/shared/...),不用路径别名魔法,保证初学者可追溯"
  - "示例主用 Claude,关键处标注 OpenAI 等价写法;切换厂商只改 .env,不改课程代码"
  - "tsc --noEmit 全仓库零类型错误"

invariant_tests:
  - "npx tsc --noEmit  # 全仓库类型检查,CI 与每章收尾必跑"

deferred: []
deadcode_until: []
---

# Sprint: Agent 开发完整学习路径 (TypeScript)

> 目标仓库: https://github.com/songuu/agent (当前为空)
> 本地目录: C:\project\my\agent-build

## Phase 1: 需求分析 (Think — CEO/产品视角)

### 一句话
为**初学者**打造一套**从零手写 → 再上框架**的 TypeScript Agent 开发完整学习路径,学完可直接用于**找工作**(作品集 + 面试)和**创业**(demo → 产品)。

### 用户与价值
- **谁**: 有基础 JS/TS、想转/入行 AI Agent 开发的初学者。
- **痛点**: 网上教程要么只调 API 浅尝辄止,要么直接堆框架不讲原理,面试一问底层就露怯;缺少"读得懂 + 跑得起来 + 能写进简历"的完整路径。
- **价值**:
  1. **学得透** — 先纯手写 agent loop / 工具调用 / 记忆 / RAG / 多智能体,理解底层;再引入框架,知其所以然。
  2. **跑得起** — 每章可运行代码,`npx tsx` 即跑,零环境折腾。
  3. **用得上** — 毕业项目可直接当作品集;附就业指南(简历/面试题)与创业指南(demo→产品)。

### Scope (做什么)
- 渐进式课程 18 章 + 1 个毕业项目 + 4 份配套指南文档。
- 共享的 provider 无关 LLM/Embedding 客户端(Claude + OpenAI 双实现)。
- 覆盖: 概念 → 首次调用 → 提示工程 → agent loop → 工具调用 → 工具系统 → 短期记忆 → 向量检索 → RAG → 推理范式 → 多智能体 → 框架(LangGraph.js / Vercel AI SDK) → 结构化输出 → 流式 → 评估测试 → 可观测性与成本 → 安全护栏 → 部署。
- 毕业项目: Deep Research Agent(综合工具/RAG/记忆/规划/多步/流式/评估)。
- 配套: 教学大纲、术语表、就业指南、创业指南。

### Non-scope (不做什么)
- 不做完整前端 UI 框架教学(毕业项目给 CLI + 最简 HTTP API,前端只给最小示例)。
- 不做模型训练/微调(聚焦 agent 应用层)。
- 不绑定单一厂商 SDK 之上的重封装,不做生产级分布式部署(K8s 等仅文档提及)。
- 不替学习者申请/付费任何 API key(给 .env.example 与申请指引)。
- 不覆盖 Python(本路径定调 TS;仅在就业指南里说明 Python 生态对照)。

### 成功标准
- [x] 克隆仓库 → `pnpm i` → 配 `.env` → 任意章节 `npx tsx` 可跑通(代码本身正确,凭 API key 即出结果)。
  - 验证边界: 当前环境无真实 API key; 已验证入口能启动,缺 key 时给出明确错误。真实模型 e2e 需填 `.env` 后复跑。
- [x] `npx tsc --noEmit` 全仓库零类型错误。
- [x] 每章 README 自洽: 学习目标 / 原理讲解 / 代码走读 / 运行方式 / 练习 / 延伸。
- [x] 路径连贯: 后章复用前章建立的共享接口与心智模型,无断层。
- [x] 毕业项目可运行且综合 ≥5 项前述能力。
- [x] 就业/创业指南可操作(简历模板、面试题清单、demo→产品 checklist)。

### 风险
- **R1 代码正确性**: 并行生成的课程代码无法实地跑(无 key/隔离)→ 缓解: 地基与共享接口手工建立并冻结为契约;收尾全仓 `tsc --noEmit` + 审查修正。
- **R2 一致性漂移**: 多 agent 并行编写风格/接口不一 → 缓解: 先手工产出共享 core + 1 章参考样板,workflow 各 agent 严格按契约+样板编写。
- **R3 范围膨胀**: 18 章易写散 → 缓解: 每章统一 README 骨架 + 行数预算,聚焦单一主题。
- **R4 SDK 版本漂移**: 依赖版本过期 → 缓解: package.json 锁定主版本,README 标注以官方文档为准。

## Phase 2: 技术方案 (Plan — 架构师视角)

### 入场扫描 — Invariants 继承
首个 sprint,无前置 invariant 继承。本 sprint 新立的 invariant 见 frontmatter `invariants` 字段。

### 入场扫描 — 集成路径
| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 课程代码导入共享 LLM 接口 | `npx tsx lessons/NN/index.ts` | `src/shared/llm` 工厂按 .env 选 provider | N/A(教学) | ✅ 重跑可见 |
| 毕业项目 RAG | 用户提问 | 检索 → LLM → 工具循环 | 本地向量(内存/文件) | ✅ |

无 ❌ 悬空链路。

### 入场扫描 — 债务清单
首个 sprint,无历史债务。

### 技术选型
- **运行**: Node ≥ 20, `tsx`(零编译直跑 TS), `pnpm` 包管理。
- **语言**: TypeScript (strict)。
- **LLM SDK**: `@anthropic-ai/sdk`(主), `openai`(等价对照)。
- **校验**: `zod`(工具参数 schema、结构化输出)。
- **框架章节**: `@langchain/langgraph`, `ai`(Vercel AI SDK) — 仅 12 章起引入。
- **目录**: 单 package(非 workspace,降低初学者认知负担),共享代码置 `src/shared`,课程置 `lessons/NN-*`,毕设置 `capstone/`。

### 共享契约 (冻结,所有课程依赖)
`src/shared/llm/types.ts` 定义:
- `Message`(role/content/toolCalls/toolCallId)
- `ToolSpec`(name/description/parameters: zod→JSONSchema)
- `ChatOptions` / `ChatResult`(text/toolCalls/stopReason/usage)
- `LLMClient` 接口: `chat()` / `stream()` / `model`
- 工厂 `getLLM()` 按 `LLM_PROVIDER` env 选 Anthropic/OpenAI
- `embed()` 向量化

### 任务拆解
| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 地基: 根配置 + 文档骨架 | L2 | package.json/tsconfig/.gitignore/.env.example/README/LICENSE/docs 骨架 |
| 2 | 共享 core(契约冻结) | L3 | src/shared/llm(types+anthropic+openai+index+embeddings)/env/logger/ui |
| 3 | 参考样板章 02-first-llm-call | L2 | 确立 README 骨架 + 代码风格,作 workflow 模板 |
| 4 | Workflow 并行编写 16 章(01,03–18) | L2 | 各 lessons/NN-*/README.md + 代码 |
| 5 | 毕业项目 + 4 份指南文档 | L2 | capstone/ + docs/{curriculum,glossary,career-guide,startup-guide} |
| 6 | Phase 4 集成审查(全仓 tsc + 多视角 + 第6视角) | L3 | 修正类型/一致性问题 |
| 7 | Phase 5 Compound + 初始化 git + README 总览定稿 | L1 | 复利记录、git init |

> Task 4 用 Workflow(ultracode 已开启)。各 agent 写独立目录,无文件冲突,免 worktree。
> Task 4 后(>5 task)按协议评估 checkpoint。

### 验证策略
- 每 Task 收尾跑 `npx tsc --noEmit`(invariant_test)。
- Task 6 全仓类型检查 + 抽样代码走读。
- L0-L2 为主(教学代码);共享 core 为 L3(被全仓依赖),重点审查接口正确性。

## Phase 3: 变更日志

### Task 1 — 地基
- 创建 package.json（type:module, tsx 直跑）/ tsconfig.json（strict + noUncheckedIndexedAccess + Bundler 解析）/ .gitignore / .env.example / LICENSE(MIT)。
- 依赖：@anthropic-ai/sdk, openai, zod, zod-to-json-schema, ai, @ai-sdk/anthropic, @langchain/{langgraph,core,anthropic}, dotenv；dev: tsx, typescript, @types/node。`pnpm install` 成功。

### Task 2 — 共享 core（契约冻结，L3）
- `src/shared/llm/`：types(统一 Message/ChatResult/ToolSpec/LLMClient) + anthropic + openai 双实现 + index 工厂(getLLM 按 LLM_PROVIDER) + embeddings。
- `src/shared/agent/`：tool(defineTool+ToolRegistry) + loop(runAgent 可复用循环)。
- `src/shared/rag/vectorStore.ts`：MemoryVectorStore。`src/shared/util/`：env/logger/ui。
- 验证：`tsc --noEmit` 零错误 + tsx 运行（zod→schema、参数校验、错误降级 全通过）。

### Task 3 — 参考样板章
- `lessons/02-first-llm-call/`（README 八节骨架 + 代码风格）冻结为 workflow 模板。
- 手写 `docs/setup.md`、顶层 `README.md`（命令精度要求高，自己写）。

### Task 4+5 — Workflow 并行编写（22 agent）
- 17 章（01,03–18）+ 毕业项目 Deep Research Agent + 4 文档（curriculum/glossary/career-guide/startup-guide），共 60 文件。

### Task 6 — 集成审查与修正
- **关键修复（架构决策）**：全仓 `tsc` 暴露 24 个同源错误——`ToolRegistry` 的 `Tool<unknown,unknown>` 因**函数参数逆变**，导致 `new ToolRegistry([具体类型工具])` 全部不兼容。
  - 根因在共享类型，非 18 个调用点。修法：`defineTool` 内部封装「校验→执行→字符串化」，返回**类型擦除**的统一 `Tool`（`run(input:unknown)=>Promise<string>`）。作者侧 execute 仍有精确类型 `I`，注册表存同构 `Tool[]`——既无变型问题，也**不用 `any`**（遵守 TS 规范）。
  - 同步：第 06 章 `mini-tool-system.ts`（教学镜像）改为 `defineMiniTool` 同款；06 章 index.ts + README 跟随。
  - 结果：全仓 `tsc --noEmit` 零错误；06 章运行期 smoke 全绿（类型化 execute、schema 生成、参数校验、未知工具降级、优雅 env 失败）。
- 第 6 视角（集成连续性）自动检查全绿：各章齐全 README+index、无直接实例化厂商 SDK（除 12/13 章框架对照）、无跨课程耦合导入、capstone 导入深度正确、无残留 TODO。

## Phase 4: 审查结果

审查时间: 2026-06-03

### 多视角审查

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | 通过 | 课程统一经 `src/shared/llm` / `src/shared/agent` / `src/shared/rag` 复用核心接口; lesson 只做教学组合。 |
| 安全 | 通过 | `.env*` 已 gitignore; 未发现硬编码密钥; 缺 key 时通过 `requireEnv` 输出明确错误。 |
| 性能/成本 | 通过 | 示例默认有 maxSteps / top-k / 明确成本估算; 第 16 章和 capstone 覆盖可观测与成本。 |
| 代码质量 | 通过 | `npx tsc --noEmit` 零错误; `rg` 未发现 `TODO` / `FIXME`; README 与代码目录齐全。 |
| 测试覆盖 | 通过但有边界 | 类型检查已跑通; 无 API key,未做真实模型端到端输出校验。 |
| 第 6 视角: 集成连续性 | 通过 | 18 章均有 `README.md + index.ts`; 4 份指南文档与 capstone 已落地; 无 dead code / feature gate 债务登记项。 |

### Findings

- P0: 无。
- P1: 无。
- P2: 真实 LLM / embedding 输出未在当前无 key 环境验证。处理: README 与 `.env.example` 已写明配置方式; 后续填入 key 后运行关键章节和 capstone e2e。

### 验证记录

- `npx tsc --noEmit` → pass。
- `rg -n 'TODO|FIXME|new Anthropic|new OpenAI|@anthropic-ai/sdk'` → no matches。
- `npx tsx lessons\01-what-is-an-agent\index.ts` (沙盒外) → 入口启动; 缺 `ANTHROPIC_API_KEY` 时输出预期错误。
- `npx tsx lessons\06-building-a-tool-system\index.ts` → 离线工具系统 smoke 通过; 真模型段缺 `ANTHROPIC_API_KEY` 时输出预期错误。
- `npx tsx capstone\deep-research-agent\src\cli.ts "test question"` (沙盒外) → 入口启动; 缺 `ANTHROPIC_API_KEY` 时输出预期错误。

## Phase 5: 复利记录

### Task 7 — Compound + git 初始化 + README 总览定稿

- README 总览完成: 覆盖定位、快速开始、学习路径、章节目录、毕业项目、求职/创业指南入口。
- Sprint 文档收口: `status: completed`, `tasks_completed: 7/7`。
- Git 初始化完成: 当前目录已执行 `git init`, `.gitignore` 已排除依赖、密钥、构建产物、handoff 文件。

### 经验沉淀

1. **TypeScript 工具注册表要主动处理函数参数逆变**  
   对外保留作者侧泛型 execute 体验,注册表内部存类型擦除后的 `Tool`。这样既保留教学类型推断,又避免 `Tool<Specific>` 无法放入 `Tool<unknown>` 的变型问题。

2. **教学仓库的 smoke 要区分三层结果**  
   `tsc` 证明类型正确; 无 key smoke 证明入口和错误消息正确; 真实 API key e2e 才证明模型链路输出正确。三者不能混写成同一个"已跑通"。

3. **课程章节应先固化共享契约,再并行扩写内容**  
   `src/shared/llm`、`src/shared/agent`、`src/shared/rag` 先冻结后,各 lesson 只组合能力,能显著降低并行写作带来的风格和接口漂移。

### 后续建议

- 填入 `.env` 后跑关键 e2e: 第 02 / 06 / 08 / 09 / 14 / capstone。
- 若发布到 GitHub,首个提交建议: `feat: add TypeScript agent learning curriculum`。
