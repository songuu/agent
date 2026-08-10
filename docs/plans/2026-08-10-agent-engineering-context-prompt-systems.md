---
title: "Agent 工程化、上下文系统与 PromptOps 深研"
type: sprint
status: completed
created: "2026-08-10"
updated: "2026-08-10"
phase: complete
tags: [sprint, agent-engineering, context-engineering, prompt-engineering, research]
aliases: ["Agent Engineering 深研", "Context Compiler 与 PromptOps"]
---

# Agent 工程化、上下文系统与 PromptOps 深研

## Phase 1: 产品边界（Think）

### 原始请求

> 继续丰富当前的架构，主要是针对于 agent 工程化，上下文管理和提示词工程的深入研究。

### 要做

- 保持 `docs/agent-trends-architecture.md` 为生产责任模型的 canonical 蓝图；本轮补的是可运行、可测试的工程合同，不复制七趋势和五平面正文。
- 从生产生命周期与评估、Context 编译与记忆、Prompt 版本与发布、工具安全与权限、multi-agent handoff 五个角度读取一手资料，并记录日期、适用边界、反证和仍未知项。
- 建立一条 provider-neutral、离线可运行的 Agent Engineering 纵切面，明确区分 Run、Session、Working Context、Memory、Artifact、Prompt、Tool 与 Eval 的所有权。
- 把“提示词技巧”升级为 Prompt-as-code / typed inputs / version diff / fixture regression / release gate / rollback，把“上下文管理”升级为可观测的编译管线，而不是字符串拼接。
- 复用现有课程 03 / 07 / 15、RAG Context Engineering、Agent Eval Harness、五平面蓝图、VitePress IA、知识图谱与仓库校验入口。
- 持续区分已验证事实、工程推断、未知项和环境阻塞；当前已有 dirty changes 全部保留并单独归因。

### 不做

- 不再造通用 Agent framework、模型 SDK、向量数据库或第二套 eval harness。
- 不把 RAG 片段去重/重排重复实现为 Agent Context Compiler；新能力只负责异构上下文的来源、信任、阶段、预算、选择、降级和 provenance。
- 不把 deterministic offline lab 宣称为真实模型质量、生产持久化、分布式一致性或安全隔离已经完成。
- 不升级依赖，不改 lockfile，不调用付费模型，不写 Supabase/远端文章库，不发布、commit、push 或 deploy。
- 不手改知识图谱生成区，也不覆盖当前内容同步已写入的课程 19 / graph / seed 变更。

### 可观察的成功标准

1. WHEN 研究综合完成，THE SYSTEM SHALL 覆盖至少五个相互独立的工程角度，并让关键判断可回溯到一手来源、发布日期、适用边界和限制。
2. WHEN 参考纵切面运行，THE SYSTEM SHALL 产生可回读的 run manifest、context packet 与 prompt release decision，能区分 session/context/memory/artifact，记录版本、provenance、预算、过滤/降级原因和完成证据。
3. WHEN 输入含超预算、过期、低信任、敏感字段、缺变量或 prompt 回归，THE SYSTEM SHALL 由确定性测试证明安全降级、阻断发布或回滚；正常候选则通过同一 gate。
4. WHEN 学习者进入现有课程体系，THE SYSTEM SHALL 能从五平面蓝图、全局导航、课程大纲和 VitePress sidebar 找到 Agent Engineering 实践轨道，并能回链课程 03 / 07 / 15、RAG L11 与 Agent Eval Harness。
5. WHEN Sprint 验收，THE SYSTEM SHALL 通过新轨道 smoke/typecheck、现有定向合同、知识图谱幂等、根 typecheck、生产构建、关键 HTML 检查与 `git diff --check`，并把当前已有 dirty changes 与本轮增量分开报告。

### 已验证的仓库基线

- `docs/agent-trends-architecture.md` 已定义五平面、L0–L4 成熟度、决策矩阵与事实/推断/未知/反证口径；它继续作为本轮 canonical 责任模型。
- 课程 03 已讲 system/few-shot/CoT/JSON/temperature，并提出 prompt 应成为版本化资产，但没有 prompt registry、typed renderer、version diff 或 release gate。
- 课程 07 只覆盖会话滑窗与摘要压缩；`rag-advanced/11-context-engineering` 只覆盖检索片段去重、压缩、预算与位置重排。两者都不是 Agent 运行时级 Context Compiler。
- `capstone/agent-eval-harness` 已有 golden set、轨迹、离线裁判和回归门；本轮只复用其思想/入口，不复制通用评测框架，而是补 prompt/context 可归因的候选发布门。
- 上一 Sprint 的 LangGraph L6 已交付 user/debug/audit 事件投影，证明“参考架构 + 可执行纵切面 + 质量门”是当前仓库的有效落地方式。
- 当前 9 个 tracked dirty files 属于内容同步工作流；其中 `knowledge-graph/data/graph.ts` 与课程 19 的 KG 生成区是后续直接重叠面，必须基于现状追加并由生成器合并。

### 一手研究综合（核验于 2026-08-10）

#### 1. Agent Engineering 是完整生命周期，不是一个循环

- Anthropic 将 agent eval 的对象定义为 model + harness + tools + environment；可靠判断同时需要 outcome、trajectory/transcript、多次 trial 与不同 grader，而不是只看最终回答：[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)，2026-01-09。
- OpenAI 的 Agents SDK 把 instructions、tools、approvals、tracing、handoff、resume bookkeeping、sandbox 与 artifact/workspace 组织为 harness，并强调 harness 与 compute 分离有利于隔离、持久恢复和扩缩：[The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)，2026-04-15。
- **边界**：provider SDK 能证明一种可行实现，不能证明唯一架构；本轮只提取稳定合同，不绑定具体 SDK。

#### 2. Context 应是从持久状态编译出的临时视图

- Anthropic 把 context 视为有限 attention budget，建议最小高信号 token 集、compaction、结构化外置笔记、按需工具与 clean-context subagent；同时明确过度压缩会丢失后来才显重要的细节：[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)，2025-09-29。
- Google ADK 把 Session / Memory / Artifacts 视为 sources，把有序 processors 视为 compiler passes，把每次调用的 Working Context 视为可丢弃 compiled view；同时强调 scope-by-default、稳定前缀与动态后缀：[Architecting efficient context-aware multi-agent framework for production](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)，2025-12-04。
- **边界**：更大 context window 不会自动解决 stale data、低信任工具输出、秘密泄漏、来源冲突、成本与 lost-in-the-middle；deterministic compiler 也不能代替语义检索和模型判断。

#### 3. Prompt 工程必须进入可发布的软件生命周期

- Anthropic 在开始 prompt engineering 前要求先定义 success criteria、建立可经验验证的方法和首版 prompt；并明确某些失败应通过模型/系统选择解决，而不是继续改措辞：[Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)，当前文档，2026-08-10 核验。
- OpenAI 当前 prompting 文档要求把 prompts 当 application code，放进命名模块、用 typed arguments、随代码评审，并在发布时跑 tests/evals、用 Git/feature flags 支持比较和回滚；同页还记录 hosted reusable prompt objects 将于 2026-11-30 关闭：[Prompting](https://developers.openai.com/api/docs/guides/prompting)，2026-08-10 核验。
- **冲突与决策**：仍有 OpenAI 帮助页介绍 hosted Prompt ID/version；更新的 API prompting/deprecation 路径已要求迁移到 code-managed prompts。本轮采用 provider-neutral 的 code-managed version，不把 hosted ID 作为 canonical 真相。
- **边界**：自动 prompt optimizer 只能产生候选；若 grader、dataset 或 holdout 有偏，它会更快地过拟合错误目标，不能自动发布。

#### 4. Tool 与协议能力必须受执行边界约束

- MCP `2026-07-28` 引入 stateless core、Extensions、Tasks、Apps 和授权强化；工具 annotations 仍必须按不可信输入处理，授权应遵守 scope minimization：[2026-07-28 release](https://blog.modelcontextprotocol.io/posts/2026-07-28/) 与 [Tools specification](https://modelcontextprotocol.io/specification/draft/server/tools)。
- **边界**：协议提供消息与授权框架，不替 host 实现信任、凭证隔离、最小权限、审批、脱敏审计或副作用幂等。

#### 5. Multi-agent 的核心是显式 handoff contract

- Anthropic 的长任务 harness 用结构化 artifact 跨 session handoff，并指出 compaction 与 clean reset 的成本/一致性取舍；独立 evaluator 可降低 self-evaluation leniency：[Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)，2026-03-24。
- Google ADK 在 agent transfer 时重新编译新 agent 视角的 working context，避免把前一 agent 的 assistant 行为误归因给接手者；可选择 full / scoped / none history。
- **边界**：共享上下文强、强顺序或低价值任务不应为了“多 Agent”增加 token、延迟和协调失败面。本轮只定义 handoff envelope，不实现通用调度器。

### 差距矩阵

| 能力面 | 当前状态 | 判定 | 本轮方向 |
| --- | --- | --- | --- |
| 五平面责任模型与趋势证据 | 蓝图与课程 19 已覆盖 | 已有 | 蓝图只加实践入口，不复制全文 |
| Prompt 基础技巧 | 课程 03 五个实验 | 已有但基础 | 回链，不重写基础实验 |
| Prompt spec / typed inputs / version / diff | 仅文字愿景 | 缺失 | 建 code-managed prompt contract |
| Prompt fixture / candidate gate / rollback | 通用 eval 可借鉴，无 prompt release | 缺失 | 建可归因 release gate |
| 会话滑窗与摘要 | 课程 07 | 已有 | 作为 Session processor 前置 |
| RAG 片段装配 | RAG L11 | 已有 | 作为 Retrieval source processor 前置 |
| Agent 级 Context Compiler | 无统一 packet/provenance/policy | 缺失 | 建 source -> processors -> working context |
| Run manifest / resume / handoff envelope | 蓝图有概念，无参考合同 | 部分缺失 | 建确定性状态与证据合同 |
| 通用 Agent eval | 课程 15 + capstone | 已有 | 复用，不另造 |
| 分布式持久化、真实 sandbox、远端协议运行 | 无 | 缺失但超范围 | 只记录 production extension point |

### Think 决策

- 建立一个新的 **Agent Engineering 实践轨道**，作为现有五平面蓝图的可执行 companion，而不是新的平行架构真相。
- 用同一条离线参考纵切面拆成三个稳定学习单元：
  1. Run manifest 与 lifecycle/handoff contract；
  2. Context Compiler 与 provenance/budget/trust policy；
  3. Prompt-as-code 与 candidate eval/release/rollback gate。
- 所有示例共享业务场景与类型，确保能观察“Prompt 版本 + Context policy + Tool surface + Eval decision”如何共同决定一个 Agent release；不做三个互不相干的 demo。
- `--auto` 可进入 Plan：产品目标清楚、无不可逆外部影响、无需要用户选择的开放分叉。

### 风险、假设与未知项

- **L2 范围风险**：新实践轨道会触及 IA、共享 TypeScript、测试、可能的图谱事实源和生成物；全部为本地可逆改动，但消费者较多。
- **范围控制**：优先交付一个完整纵切面，不追求生产数据库、真正模型调用、网络协议、分布式 lease 或全功能 orchestrator。
- **质量推断**：离线 fixture 能证明 contract、归因和 gate，不证明真实 LLM 在开放任务上的质量；文档必须保留该未知项。
- **工作区重叠**：知识图谱事实源已有未提交的内容同步追加；Plan 必须安排 baseline snapshot、最小 append、生成后差分审计与幂等回读。
- **上游漂移**：OpenAI prompt/legacy eval surfaces 正处在 2026-10/11 deprecation 窗口；本轮只采用 provider-neutral contract，并给来源标核验日期。
- **外部边界**：不发布、不远端写入、不 commit/push；如后续用户要求发布，另行验证构建产物与线上路由。

### 下一步

设计文件级依赖、类型合同、TDD 顺序、dirty-tree 合并策略和验收矩阵，然后进入 Work。

## Phase 2: 实施计划（Plan）

### 方案概述与关键取舍

本轮交付“**canonical 蓝图 + Agent Engineering 三单元实践轨道 + 持续质量门**”，不创建第二套通用框架：

1. 保持 `docs/agent-trends-architecture.md` 的五平面为唯一责任模型；新增 `agent-engineering/` 只解释如何把责任落实成可执行合同。
2. 三个单元共享一个离线“生产变更审查 Agent”场景，按依赖顺序教学：
   - A1：Run manifest、显式 lifecycle、completion evidence 与 scoped handoff；
   - A2：Session / Memory / Artifact / Tool Result 经有序 processor 编译为 Working Context；
   - A3：Prompt-as-code、完整 behavior bundle diff、fixture eval、candidate gate 与原子 rollback。
3. 共享实现沉淀在既有 Agent namespace 下的 `src/shared/agent/engineering/`，只提供 deterministic pure contracts；不接 LLM、不执行部署、不模拟成“生产系统已完成”。
4. Prompt 的发布单位不是一段文字，而是 pin 住 prompt / model / toolset / output contract / context policy / permission policy / eval suite 的行为 bundle；不允许 `latest` 浮动引用。
5. Context 的输出不是裸字符串，而是 `ContextPacket + decision ledger`；每个 included/excluded item 都带 provenance、trust、audience、freshness、token estimate 与 reason。
6. 新轨道纳入 CHAPTERS、visuals、demo registry、IA、知识图谱和 CI；当前内容同步对 `graph.ts`/生成物的未提交增量原样保留，后续只基于最新事实源追加。

### 共享类型与 API 冻结

#### 公共层 — `contracts.ts`

- `VersionRef / ProvenanceRef / EvidenceRef / ArtifactRef / ContractResult` 只定义跨单元稳定数据，不承载编排逻辑。
- 依赖方向固定为 `contracts -> runLifecycle | contextCompiler | promptRelease`；shared 不反向依赖教程、capstone、VitePress、LangGraph 或 LLM provider。

#### A1 — `runLifecycle.ts`

- `BehaviorRevision`：`id / version / digest`，拒绝 `latest / current / stable` 等浮动版本。
- `RunManifest`：固定 `runId / schemaVersion / objective / behavior revisions / authority / budget / expectedOutcome / createdAt`；创建后返回不可变快照。
- `RunState`：`created -> running -> waiting_approval|paused -> running -> succeeded|failed|cancelled` 的显式 transition table；终态不可恢复为 running。
- `OutcomeEvidence`：`succeeded` 必须引用 artifact/state oracle，不能由 Agent 文本自证。
- `Checkpoint` 与 resume token ledger：相同 token 重放不产生第二次 operation；这里只验证 pure journal/idempotency contract，不声称真实 API exactly-once。
- `HandoffEnvelope`：固定 objective、expected artifact、filtered context refs、lineage、authority、budget/deadline、parent trace、return status；child authority 必须是 parent authority 子集。

#### A2 — `contextCompiler.ts`

- `ContextItem`：`id / kind / role(control|data) / content / tokens / priority / mandatory / trust / sensitivity / audience / asOf / expiresAt / provenance / stable`。
- `ContextPolicy`：版本化 hard budget、completion reserve、allowed audience/sensitivity、current stage/time、required evidence 与 source precedence。
- `compileContext(items, policy)`：确定性 filter -> validate -> dedupe -> budget -> stable-prefix/dynamic-suffix 排序；输入不变。
- `ContextPacket`：included blocks、used/reserved tokens、stable prefix digest、whole packet digest、`sufficient|insufficient|unknown` 与完整 ledger。
- 安全合同：untrusted data 永不晋升 control；secret、过期或 audience 不匹配内容不进入 model blocks；mandatory 内容装不下时显式 `CONTEXT_BUDGET_EXCEEDED`，不静默丢弃。
- provenance 合同：转换后的每一块都有 source refs；所有排除项都有 reason；相关但缺 required evidence 时标 insufficient/unknown，不伪装可回答。

#### A3 — `promptRelease.ts`

- `PromptArtifact<TVariables>`：不可变 `id / version / status / template / variables / outputContract / contentDigest`；通过 literal variable list 同时获得 typed input 与运行期 exact-key 校验。
- `renderPrompt()`：缺变量、多变量、未声明 placeholder 或非字符串值 fail closed；同输入 byte-identical。
- `BehaviorBundle`：原子 pin prompt/model/toolset/output/context/permission/eval revisions；任何浮动引用拒绝发布。
- `diffBehaviorBundles()`：按 instructions、variables、model、tools/schema、output、context、permission、eval 八个行为面分类，而不是只有 text diff。
- `PromptFixture / EvaluationReport / ReleasePolicy`：capability、regression、holdout 分桶；critical case 一票否决；完整保留 trial/seed，不挑最好样本。
- `decideRelease()`：只返回 promote/block/rollback decision 与 reasons；optimizer proposal 永远是 candidate，不能自发布。
- `rollbackRelease()`：把 active pointer 指回前一个完整 bundle 并写 audit；明确只恢复 configuration，不宣称已逆转外部副作用。

### Before / After 契约

| 契约面 | Before | After | 主要消费者与一致性证据 |
| --- | --- | --- | --- |
| 架构真相 | 五平面蓝图完整，但实践只到 LangGraph L6 事件投影 | 蓝图仍 canonical；新增 A1–A3 可执行 companion | 蓝图、专题 hub、课程 backlinks、research contract test |
| Agent run | `runAgent()` 只控制模型/工具循环与 maxSteps | manifest pin 行为依赖；显式状态、evidence completion、resume journal、scoped handoff | A1 shared、demo、smoke |
| Context | 会话窗口与 RAG 片段装配各自独立 | 异构 source 编译为带 budget/trust/audience/provenance 的 ContextPacket | A2 shared、demo、smoke、A3 bundle |
| Prompt | 基础技巧与“可版本化”文字愿景 | code-managed immutable artifact、typed variables、semantic diff、candidate gate、full-bundle rollback | A3 shared、demo、smoke、课程 03 backlink |
| Eval | 通用 Agent eval 能判整体回归，不能归因 prompt/context | fixture 记录 prompt/context/tool/model revisions，critical regression 拒绝晋级 | A3 gate、Agent Eval Harness backlink |
| 课程目录 | RAG ×11、LangGraph ×6，无 Agent Engineering 专题 | Agent Engineering A1–A3，稳定 URL 与专题 sidebar | CHAPTERS、IA、registry、curriculum/navigation/README |
| 图谱/视觉 | 无三单元 concepts/relations/visuals | 每单元 concept、跨课程关系、官方 references 与恰好一个 visual | graph/visuals tests、generator |
| 生成物 | 66 个既有单元及当前内容同步派生物 | 新单元并入全局 MD/HTML/KG 标记区；第二次生成零变化 | `npm run kg` 双跑、hash/diff |
| CI | 无 Agent Engineering 独立门 | `ae:smoke`、`ae:typecheck`、research/IA/registry 合同进入 workflow | package scripts、workflow、本地复核 |
| 外部状态 | dirty content sync 尚未提交 | 原有 9 文件增量保留；无 sync/deploy/commit/push | baseline/final status 与 scoped diff |

### 有序任务

#### Task 1 — RED：三单元 contract smoke

- **目标**：先冻结反例与 hard invariants，证明仓库当前没有对应实现。
- **文件**：新增 `agent-engineering/smoke.ts`。
- **前置依赖**：Plan。
- **风险**：L1。
- **RED 覆盖**：浮动行为版本、非法终态、无 outcome evidence 的假成功、resume token 重放、handoff authority 扩张；超预算、secret/expired/wrong-audience、untrusted->control、缺 provenance、相关但不充分；prompt 缺/多变量、bundle 漏 pin、critical regression 被平均分掩盖、optimizer 自发布、partial rollback。
- **完成证据**：通过 repo-native tsx 运行，因 shared exports 尚不存在而确定失败；记录错误不是环境启动问题。

#### Task 2 — GREEN：共享 Agent Engineering 合同

- **目标**：用最小纯函数实现 A1–A3 API，先让 smoke 全绿。
- **文件**：新增 `src/shared/agent/engineering/{contracts,runLifecycle,contextCompiler,promptRelease,index}.ts`；新增 `agent-engineering/fixtures.ts`；完善 `agent-engineering/smoke.ts`。
- **前置依赖**：Task 1。
- **风险**：L2。
- **完成证据**：所有 positive/negative/mutation fixtures 通过；相同输入 digest 稳定；输入对象未突变；JSON round-trip 保留合同；测试报告区分 `verified_contract / simulation / inference`。

#### Task 3 — 三单元教学纵切面

- **目标**：让同一生产变更审查场景按 A1 -> A2 -> A3 展示 contract payoff，而不是三个孤立 demo。
- **文件**：新增 `agent-engineering/README.md`、`agent-engineering/01-run-contract/{README.md,index.ts}`、`agent-engineering/02-context-compiler/{README.md,index.ts}`、`agent-engineering/03-prompt-release-gate/{README.md,index.ts}`。
- **前置依赖**：Task 2。
- **风险**：L2。
- **完成证据**：三个 CLI 离线 exit 0；A1 输出 run/handoff evidence，A2 输出 packet/ledger，A3 同时演示 safe promote 与 critical-regression block/rollback；README 就近引用一手资料并写明模拟边界。

#### Task 4 [P] — canonical 蓝图与既有学习路径回链

- **目标**：蓝图只增加实践入口，既有课程明确“基础能力 -> Agent Engineering 深化”，避免重复正文。
- **文件**：修改 `docs/agent-trends-architecture.md`、`lessons/03-prompt-engineering/README.md`、`lessons/07-short-term-memory/README.md`、`lessons/15-evaluation-and-testing/README.md`、`rag-advanced/11-context-engineering/README.md`、`capstone/agent-eval-harness/README.md`；新增 `.vitepress/agent-engineering-architecture.test.mts`。
- **前置依赖**：Plan（与 Task 2 文件不相交，URL/API 已冻结）。
- **风险**：L1。
- **完成证据**：静态合同证明 canonical/companion 关系、五类来源、OpenAI current prompt deprecation 边界、offline-not-production 声明和全部 backlinks。

#### Task 5 [P] — scoped typecheck 与 CI gate

- **目标**：让新 shared/demo/smoke 真正进入类型与持续回归门。
- **文件**：新增 `tsconfig.agent-engineering.json`；修改 `package.json`、`.github/workflows/agent-build-deploy.yml`。
- **前置依赖**：Plan（路径与脚本名已冻结；与 Tasks 2/4 文件不相交）。
- **风险**：L2。
- **完成证据**：`ae:typecheck` 覆盖新 shared/track；`ae:smoke` 与 research test 进入 CI；lockfile 不变。

#### Task 6 — CHAPTERS、知识图谱与公开发现入口

- **目标**：把 A1–A3 接入单一事实源和现有 VitePress 信息架构，不写平行目录逻辑。
- **文件**：修改 `knowledge-graph/data/{graph,visuals}.ts`、`.vitepress/config.mts`、`.vitepress/site-information-architecture{.ts,.test.mts}`、`scripts/demo-runner/registry.test.mts`、`docs/{navigation,curriculum}.md`、`README.md`。
- **前置依赖**：Tasks 3–5。
- **风险**：L2。
- **串行原因**：`graph.ts` 当前有用户内容同步增量，且 CHAPTERS 同时驱动 sidebar/demo/KG；先做 scoped append 并复核现有六篇新增 article 零丢失，再更新消费者。
- **完成证据**：固定 `part="Agent Engineering 专题"` 与 `ae-run / ae-context / ae-prompt`；A1–A3 各有 CHAPTER/concepts/relations/article/visual；primary learning menu、专题 sidebar、navigation、curriculum、README 可达；registry 自动发现三份 keyless CLI；现有 RAG/LangGraph/capstone 数量合同不退化。

#### Task 7 — 生成物与幂等闭环

- **目标**：只从合并后的事实源生成 tracked 派生物，并证明第二次不漂移。
- **文件**：预计更新 `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、A1–A3 README KG 区及受新增跨关系影响的既有 README KG 区；禁止手改标记区。
- **前置依赖**：Task 6。
- **风险**：L2。
- **完成证据**：首次 `npm run kg` 缺失 0；第二次更新 0；关键事实源/MD/HTML/README hash 不再变化；当前内容同步文章与课程 19 KG 条目仍在。

#### Task 8 — 风险匹配的最终验收

- **目标**：从最窄 contract 扩展到所有派生消费者和生产构建，最后审计工作树边界。
- **文件**：只修复本轮暴露的问题。
- **前置依赖**：Tasks 1–7。
- **风险**：L2。
- **完成证据**：下列测试矩阵全部通过；关键 HTML 存在且内部链接无 `.md/README` 泄漏；`git diff --check` 通过；最终 status/stat 清楚区分原有 dirty 与本轮文件。

### 测试策略

#### 最窄反馈环

1. `node node_modules\tsx\dist\cli.mjs agent-engineering\smoke.ts`
2. 三个 `agent-engineering\0X-*\index.ts` CLI
3. `node node_modules\typescript\bin\tsc -p tsconfig.agent-engineering.json --noEmit`
4. `node node_modules\tsx\dist\cli.mjs --test .vitepress\agent-engineering-architecture.test.mts`

#### 受影响消费者

5. `node node_modules\tsx\dist\cli.mjs --test .vitepress\site-information-architecture.test.mts knowledge-graph\data\visuals.test.mts knowledge-graph\generate.test.mts`
6. `node node_modules\tsx\dist\cli.mjs scripts\demo-runner\registry.test.mts`
7. `pnpm typecheck`
8. `npm run kg` 两次，比较事实源、全局 MD、交互 HTML、新旧受影响 README 的 SHA256 与 diff。

#### 生产表面

9. `VITEPRESS_BASE=/agent-build/ pnpm site:build`（PowerShell 使用等价环境变量设置），核对专题 hub、A1–A3 与蓝图 HTML。
10. 精确扫描本轮页面的内部链接，禁止 `.md` / `README` 路由泄漏；外部链接绿构建不等于永久可用。
11. `git diff --check`、`git status --short --branch`、`git diff --stat`，并对原有 9 个 dirty files 做保留审计。

### 风险、恢复与未知项

- **整体 L2**：实现是本地可逆纯函数；知识图谱/IA 多消费者使集成面上升，但无认证、迁移、远端写或生产副作用。
- **安全语义高影响但实现非生产**：Context trust/secret/authority 合同若用于真实系统风险可到 L3/L4；本轮只提供教学 reference，README 与 evidence kind 必须显式标识。
- **恢复方式**：用精确反向 patch 撤销本轮源文件；若 graph/visuals 回滚，重跑生成器恢复派生物。禁止 `git reset --hard`，禁止覆盖用户 dirty changes，禁止手改 KG 区。
- **dirty merge gate**：修改 `graph.ts` 前后分别记录现有 appended article titles；生成后若任何现有 title/lesson 19 entry 消失，立即停止并回修事实源，不用旧文件覆盖。
- **版本漂移**：OpenAI hosted prompt/Evals surface 正在 deprecate；实现只依赖 provider-neutral code-managed contracts，来源标核验日期，未来不把当前关闭时间外推为永久事实。
- **token 未知**：离线 token estimate 只证明 budget policy，不等于任一厂商 tokenizer 账单；API 允许注入真实 estimator，默认结果标 simulation。
- **质量未知**：fake subject/fixtures 不证明真实 LLM、更不证明 prompt injection 已防住；真实接入仍需多 trial、holdout、人类校准、sandbox/permissions 与 production monitoring。
- **外部状态**：本轮不 commit/push/deploy/sync；如 shell 出现 `CreateProcessAsUserW failed` / `spawn EPERM`，先用 direct node/tsx 区分环境启动与源码失败。

### Plan 验收

每个任务已有目标、文件、依赖、L0–L4 风险与可回读证据；schema、CHAPTERS、runtime projection、生成物和 CI 消费者均有 before/after 合同；当前 dirty 重叠与恢复 gate 已定义。无不可逆分叉，允许 `--auto` 进入 Work，先执行 Task 1 RED。

## Phase 3: 实施证据（Work）

### 已完成交付

- 新增 `src/shared/agent/engineering/` 的四层纯合同：公共 refs/digest、Run lifecycle + scoped handoff、Context Compiler + ledger、Prompt artifact + behavior/eval/release/rollback gate。
- 新增 `agent-engineering/` 三单元实践轨道；A1/A2/A3 共用“生产变更审查”纵切面，三个 CLI 均断网、固定时钟/seed、无真实工具副作用。
- Prompt 发布门补充 instructions/variables 子表面、pinned eval-suite manifest exact coverage、critical hard veto、完整 bundle snapshot 重算、promotion-audit + CAS rollback lineage。
- Context Compiler 补充 control/data 分离、secret hard block、audience/freshness/trust、utility-first budget、stable prefix、source precedence/dedupe、sufficiency 与全量 provenance ledger。
- Run 合同补充不可变 manifest rehydrate、artifact/state outcome oracle、resume request-digest ledger、terminal evidence、handoff provenance/time/budget/authority 子集。
- canonical 五平面蓝图保持唯一责任模型；课程 03/07/15、RAG L11、Agent Eval Harness 已建立基础到进阶回链。
- CHAPTERS 新增 `ae-run / ae-context / ae-prompt`，固定 `part="Agent Engineering 专题"`；主导航、独立 sidebar、README、curriculum、navigation、demo registry 与三张 visual 已接入。

### TDD 与合同证据

- 首次 RED：`agent-engineering/smoke.ts` 因 `src/shared/agent/engineering/index` 不存在返回 `ERR_MODULE_NOT_FOUND`，证明不是测试运行器环境失败。
- 之后逐项先复现再修复：假成功、terminal 无证据、resume token payload 重用、handoff 扩权/坏 lineage、secret/expiry/tokenizer/schema fail-open、预算选择顺序、来源冲突、template 二次展开、stale snapshot/diff、eval summary/fixture/seed 漏报、critical veto 关闭、partial/arbitrary rollback 等。
- 最终 `pnpm ae:smoke`：`231` 条合同全绿，并输出 `evidence_kind=verified_contract; fixtures=simulation; production_claim=inference_not_made`。
- `pnpm ae:typecheck` 与根 `pnpm typecheck`：通过。
- A1/A2/A3 三个 CLI：均 exit 0；A3 同时展示 safe promote、critical block 与 promotion-audit rollback。
- research/canonical 合同：`5/5`；IA + registry + graph + visuals 合同：`12/12`。

### 派生物、构建与保全证据

- `npm run kg` 首轮：`更新 5 / 未变 64 / 缺失 0`；次轮：`更新 0 / 未变 69 / 缺失 0`。
- 图谱规模稳定为 `69 单元 / 344 概念 / 480 关系 / 274 文章`；事实源及二轮派生物 SHA256 不漂移。
- 课程 19 与并发内容同步的六篇新增文章在 graph、课程 README、全局 Markdown 和交互 HTML 中均保留。
- `$env:VITEPRESS_BASE='/agent-build/'; pnpm site:build`：通过，最终 clean-route 修复后的 VitePress `v1.6.4` 构建在 `48.59s` 完成；仅有既有 chunk >500kB 提示。
- 五个关键 HTML 全部存在；排除 VitePress `/assets/` 模块文件名后，内部导航 `href` 的 `.md/README` route leak 为 `0`，hub/base route 与 blueprint 回链存在。
- `git diff --check`：通过，仅有 Windows LF→CRLF 提示。
- 原有 9 个 tracked dirty files 与并发新增 `docs/solutions/2026-08-10-agent-content-daily-sync.md` 均保留；本轮未 commit、push、deploy 或外部写入。

### Review 回环修复

- 公共 `ContractResult` API 的 23 个 null/malformed JSON 探针均 `throws=0`；Evidence/Artifact ref、Prompt/Eval、Run/Context/Handoff、Release/Rollback 入口全部显式 fail closed。
- Run snapshot rehydrate 重新验证 terminal completion、时间边界和 succeeded artifact/state oracle；`complete` 不再能产生自身无法恢复的空 outcome manifest。
- Context dedupe 保证 mandatory 不输给 optional，按 kind/role 分区；compiler 统一校验 pinned provenance，snapshot rehydrate 重演 untrusted-control、secret、audience、freshness、ledger/block 与 sufficiency 关系不变量。
- Prompt factory 只产 `draft|candidate`，模板与 eval fixture 使用 nested exact-key schema，阻断未声明 authority/grader 字段参数走私。
- 所有关键数组入口使用 dense-array 校验，拒绝 sparse authority、required-evidence checklist、eval seeds/reasons；factory 输出均可立即通过自身 snapshot rehydrate。
- Compiled Context 持久化 `requiredEvidenceIds` 作为 sufficiency basis，并重算 missing/sufficiency；included ledger 与实际 block 的 token/trust/sensitivity/audience/time/provenance 必须一致。
- Run manifest 新增 `lastTransitionAt` 并验证 journal 因果顺序；新迁移不可时间倒退，但已消费 resume token 在运行继续推进后仍可按原 request digest 幂等重放。
- Run/Context 的 `createdAt/now/compiledAt` 明确要求 string 后才解析，拒绝 `Date.parse(0)` 一类 JSON 强制转换。
- 补齐 Agent Engineering README→index rewrites；重建后 hub+A1–A3 均生成 `index.html`，4 个页面 route leak 为 0。
- CI 新增 `demo:registry:test`，并在 `pnpm kg` 后对 tracked Markdown/HTML/README 运行 drift gate；研究合同扩展为 `7/7`。
- Review 期间并发出现的 `docs/solutions/Agent工程化完整学习知识图谱与平台架构.docx` 不属于本 Sprint，也不是 reviewer 生成；已原样保留且未读取/修改。

### 已知边界

- digest/provenance/trust 标签的真实性仍依赖外部可信存储、身份与签名；本地 content hash 不等于认证。
- token estimator、fixture subject 与 outcome oracle 都是离线 simulation，不证明厂商 tokenizer、真实 LLM 质量、prompt-injection 防护或生产安全。
- rollback 只准备并验证 CAS 决策；真实原子 pointer 写入、补偿事务和既有外部副作用恢复不在纯函数范围。
- `evalSuite` revision 迁移默认 fail closed，需要未来单独的双跑/rebaseline migration gate。

## Phase 4: 评审证据（Review）

### Findings-first 回环

- 第一轮评审发现并修复：malformed JSON `TypeError`、Run 假成功 rehydrate、mandatory context 被 optional supersede、Context snapshot 安全/审计分裂、Prompt/Eval 参数走私、clean-route 404、registry/KG drift CI 缺口及 block/rollback 文案混淆。
- 第二轮评审发现并修复：sparse-array 跳过 `.some()`、sufficiency basis 未持久化、ledger/block 仅按 id 关联、Run 时间线倒序、推进后延迟 resume replay 回归、数字时间戳强制转换。
- 每个 finding 均先以定向 mutation/反例复现，再进入 Work 修复；最终 smoke 从 `166` 扩充到 `231` 条。

### 最终独立复审

- Run/Context reviewer：无可操作问题；dense arrays、required evidence/sufficiency 重算、ledger/block 一致性、`lastTransitionAt`、延迟 replay、数字时间戳拒绝均已复验。
- Prompt/Release reviewer：无可操作问题；sparse seeds/reasons、factory→rehydrate、nested exact schema、coverage、critical veto、release/rollback lineage 均已复验。
- 集成 reviewer：无可操作问题；hub+A1–A3 clean routes、registry CI、KG drift gate、69/344/480/274 图谱、并发内容与 dirty-tree 保全均已核对。

### 最终门禁

- `pnpm ae:smoke`：`231/231` GREEN；`pnpm ae:typecheck` 与根 `pnpm typecheck` GREEN。
- `pnpm ae:research:test`：`7/7` GREEN；IA/registry/graph/visuals：`12/12` GREEN。
- A1/A2/A3 CLI 均 exit 0；KG 连续两次 `更新 0 / 未变 69 / 缺失 0`。
- 生产 base 构建 GREEN；4 个 `agent-engineering/**/index.html` 存在且 `.md/README` href leak 为 0。
- `git diff --check` GREEN，仅 Windows LF→CRLF 提示；本轮无 commit、push、deploy 或远端写入。

### Review 判定

未发现剩余可操作问题。保留边界：本地 digest 不是签名/信任锚；真实 tokenizer、LLM 质量、sandbox/permission enforcement、外部 CAS/补偿事务和生产监控仍需真实运行时验证。

## Phase 5: 复利判定（Compound）

### 有界去重

- 已检索 `docs/solutions/` 及仓库本地规则入口，未发现以 Context Compiler、PromptOps、run manifest 或 behavior bundle 为主题的同名专门沉淀。
- 已读取 `docs/solutions/2026-07-31-evidence-gated-agent-framework-evolution.md`：它已经沉淀五平面、证据门控、派生合同和 provider-neutral 边界；本 Sprint 计划则已完整保留 A1–A3 的具体合同、TDD 反例、评审修复、验证命令和未知项。
- 因而不再创建重复 solution，也不修改 solution index、规则或 instinct；当前证据是仓库专属实现与课程架构，不足以新增更高层通用规则。
- Review 期间并发出现的 `docs/solutions/Agent工程化完整学习知识图谱与平台架构.docx` 不属于本 Sprint，未读取、修改或纳入去重依据。

### Compound 结果

- 可复用入口保持为本计划、canonical 五平面蓝图、Agent Engineering hub 和 A1–A3 可执行单元。
- 未写长期记忆，未运行 solution index 同步，未 commit、push、deploy 或改变外部状态。
- `Solution index: unchanged 0 entries -> docs/solutions/index.jsonl; Claude projection: unchanged; AGENTS projection: disabled`

### 最终状态

Think、Plan、Work、Review 与 Compound 均已完成；本 Sprint 可以关闭。生产边界仍以 Review 判定为准，离线合同通过不外推为真实模型质量、生产安全或外部副作用可逆。
