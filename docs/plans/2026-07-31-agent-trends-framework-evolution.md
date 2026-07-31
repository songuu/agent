---
title: "2026 Agent 趋势深研与工程框架演进"
type: sprint
status: active
created: "2026-07-31"
updated: "2026-07-31"
phase: work
tags: [sprint, agent, research, architecture, curriculum]
aliases: ["Agent 趋势与框架演进", "2026 Agent 工程趋势"]
---

# 2026 Agent 趋势深研与工程框架演进

## Phase 1: 产品边界（Think）

### 原始请求

> 研究最近的 Agent 发展趋势，继续丰富当前的框架，必须深入分析。

### 要做

- 以 2025-01-01 至 2026-07-31 为主要观察窗口，优先读取官方发布、标准、论文、基准和真实工程报告，建立可追溯的 Agent 趋势证据集。
- 从架构与运行时、上下文与记忆、工具与互操作协议、多 Agent、评测与可观测性、安全与权限、成本与人机协作等角度交叉分析；同时寻找失败证据、限制和反例。
- 把趋势证据与本仓库现有的 Agent 工程课程、实践项目、前沿内容和站点信息架构逐项对照，区分“已有覆盖、内容过时、缺少实践、暂不值得加入”。
- 选择至少一个高价值、可运行、可测试的增量，复用现有 Markdown、TypeScript、VitePress、导航和验证入口落实到当前框架；研究报告不能替代实际改进。
- 在计划、实现和交付中持续区分已验证事实、推断、未知项和环境阻塞。

### 不做

- 不把厂商宣传、搜索摘要或单一榜单直接当成行业共识。
- 不为追逐名词而重写现有课程体系、迁移 VitePress、替换依赖栈或引入与本轮价值无关的平台基础设施。
- 不重复已经完整覆盖的 ReAct、基础工具调用、普通 RAG、LangGraph 入门或泛化的“多 Agent 更强”叙事。
- 不把截至当前日期尚无一手证据的未来能力写成已实现事实。
- 不执行生产部署、远端数据写入、提交或推送，除非用户另行授权。

### 可观察的成功标准

1. WHEN 研究阶段结束，THE SYSTEM SHALL 提供至少 5 个相互独立的趋势维度，并为关键判断附上一手来源、发布日期、适用边界及反证或限制。
2. WHEN 趋势与仓库基线完成对照，THE SYSTEM SHALL 给出“已有 / 需刷新 / 缺失 / 暂缓”差距矩阵，并能从真实文件与运行入口回溯每项结论。
3. WHEN 选择框架增量，THE SYSTEM SHALL 说明它解决的学习或工程问题、为什么优先于其他候选项，以及如何进入现有学习路径而不制造第二套重复结构。
4. WHEN 实施完成，THE SYSTEM SHALL 交付至少一个可运行、可测试的框架或课程增量，并保持既有公开 URL、课程主干和生成式目录合同兼容。
5. WHEN Sprint 验收，THE SYSTEM SHALL 通过与风险匹配的定向测试、类型检查、内容/链接校验及生产构建，并明确报告未验证的运行时或外部事实。

### 风险、假设与待确认项

- **已验证事实**：仓库定位为“Agent 工程知识门户”，已经覆盖 Agent loop、工具、记忆、RAG、多 Agent、LangGraph、评测、安全、MCP/A2A、前沿文章和 Capstone；新增内容必须建立在这些资产之上。
- **工作假设**：“当前的框架”指本仓库的 Agent 工程学习与实践框架，而不是另一个仓库中的 agent orchestrator。该解释与当前工作目录、README 和首页定位一致，且是可撤销的内容/代码改动。
- **主要风险**：趋势研究容易被供应商叙事、短期榜单和术语更新带偏；采用一手来源交叉验证、时间戳、反例和证据等级降低风险。
- **未知项**：最终优先落地的增量要等外部研究与仓库差距矩阵完成后确定；候选方向包括 agent harness、长任务/持久执行、上下文工程、协议互操作、可复现实评与最小权限治理。
- **权限边界**：本轮可在仓库内研究、设计、实现和验证；生产发布、远端写入、commit/push 不在默认授权内。

### Think 证据综合

#### 已验证趋势

1. **竞争单元从“模型 + 循环”迁移到可演进的 harness。** OpenAI 将 harness、隔离计算、会话状态与模型解耦；Anthropic 把初始化器、进度文件、可恢复状态和独立验证器视为长任务的必要组成。跨来源共同结论是：模型能力必须通过控制面、状态面与执行面才能持续兑现。
   - OpenAI, [The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/), 2026-04-15。
   - Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), 2025-11-26；[Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps), 2026-03-24。
   - Vercel, [AI SDK 7](https://vercel.com/changelog/ai-sdk-7), 2026-06-25：加入 durable `WorkflowAgent`、sandbox、tool approval、harness adapters 与 telemetry，但不能据此替代所有显式复杂图编排。
2. **持久运行要求区分 Session、Context、Memory 与 Artifact。** Managed Agents 公开了追加式会话日志、sandbox 重建和再水化；上下文工程强调有限注意力、按需披露、压缩和外部笔记。“把更多历史塞进 prompt”不是可靠的记忆策略。
   - Anthropic, [Building managed agents](https://www.anthropic.com/engineering/managed-agents), 2026-04-08；[Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 2025-09-29。
3. **互操作开始分层。** MCP 2026-07-28 强化无状态核心、扩展、Tasks、Apps、认证和一致性测试；A2A v1.0 是首个 stable/production-ready 版本，扩展多协议绑定、版本协商、多租户与签名 Agent Card；产品内事件流仍需独立的类型化投影。三者解决不同问题。
   - [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)、[release summary](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)、[A2A v1.0 specification](https://a2a-protocol.org/latest/specification/) 与 [v1.0 announcement](https://a2a-protocol.org/latest/announcing-1.0/)。A2A 交互协议含 breaking changes，但 Agent Card 可同时声明 v0.3/v1.0 以渐进迁移。
4. **多 Agent 收益取决于任务拓扑。** Google 对 180 个配置的研究显示，集中式多 Agent 在可并行任务上可显著增益，但所有受测变体在强顺序任务上均退化；独立 Agent 还会放大错误。并行性、通信成本和验证边界应先于 Agent 数量。
   - Google Research, [Towards a science of scaling agent systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/), 2026-01-28。
5. **评测对象扩展到 outcome、trajectory 与真实环境状态。** Anthropic 区分 agent harness 与 eval harness，并要求多次 trial；OpenAI 对 SWE-Bench Pro 审计估计约 30% 样本破损，说明分数不能脱离任务有效性、grader 与环境版本。
   - Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 2026-01-09；OpenAI, [Separating signal from noise](https://openai.com/index/separating-signal-from-noise-coding-evaluations/), 2026-07-08。
6. **能力时长增长不等于无人值守可靠性。** METR 扩大长任务样本后仍说明 16 小时以上估计不可靠，任务也集中于自包含的软件、ML 与网络安全；time horizon 是给定成功率下的人类任务时长，不是安全自治时长。
   - METR, [Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) 与 [dashboard](https://metr.org/time-horizons/)。
7. **安全主线转向确定性隔离、最小权限与身份链。** Anthropic 报告约 93% 权限提示被批准，提示疲劳削弱人工门；NIST 推进 Agent 身份、授权与安全互操作标准，OWASP 把持久记忆列为投毒攻击面。HITL 是治理手段，不是天然安全保证。
   - Anthropic, [How we contain Claude](https://www.anthropic.com/engineering/how-we-contain-claude), 2026-05-25。
   - NIST, [AI Agent Standards Initiative](https://www.nist.gov/news-events/news/2026/02/announcing-ai-agent-standards-initiative-interoperable-and-secure) 与 [identity/authorization paper](https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd)；OWASP, [Memory attack surface](https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/)。

#### 反证与适用边界

- 厂商文章能证明其基础设施中的可行做法，不能证明普适最优；只采用跨来源重复出现且可离线验证的合同。
- 多 Agent 的并行收益不适用于强顺序任务；本轮不新增通用 orchestrator，也不把 Agent 数量当能力指标。
- time horizon 与 SWE-Bench 等基准受任务分布、脚手架和 grader 影响；课程必须保留有效性与复现条件。
- OpenTelemetry Agent 语义仍在演进；本轮建立稳定事件分类，不锁定未稳定字段。
- MCP 2026-07-28 刚发布，A2A v1.0 的交互协议迁移包含 breaking changes；本轮记录分层和迁移边界，不升级依赖或宣称全面兼容。

#### 仓库差距矩阵

| 维度 | 当前证据 | 判定 | 本轮动作 |
| --- | --- | --- | --- |
| 基础、工具、记忆、RAG、多 Agent | `README.md` 已形成基础到进阶主干 | 已有 | 保持 URL 和主干不变 |
| 评测、安全、部署、前沿来源 | 课程 15–19 与知识图谱已覆盖 | 需刷新 | 最新证据、限制和五平面架构回写课程 19 |
| LangGraph 持久化、HITL、并行 | `langgraph-advanced` L1–L5 可运行 | 已有 | 复用既有六件套合同 |
| 事件流到产品 UI 的稳定投影 | 路线图已有 L6，但无章节与断言 | 缺失 | 实现事件归一化、前端投影和 smoke |
| 进程恢复、租约、幂等副作用 | 仅有 checkpoint 概念 | 缺失但较大 | 保留为后续 L9/L10 |
| MCP/A2A 互操作实验 | 有协议概念，无可运行 lab | 缺失 | 写入路线；低于 L6 |
| 通用多 Agent 编排器 | 无本仓库必须自建的证据 | 暂缓 | 不创建第二套框架 |

#### Think 决策与验收

- 用“**智能与上下文 / 控制与会话 / 执行与工具 / 互操作与协调 / 保障与人机**”五平面统一趋势；每个平面标注事实、推断、成熟度和未知项。
- 最小高价值交付为三件套：深度趋势与架构蓝图、课程 19 主文刷新、LangGraph L6“事件流与前端投影”可运行增量。
- L6 优先于通用 orchestrator、协议 lab 和进程恢复：它已在路线图中，贯通运行时、产品体验、可观测性和审计，可离线验证且无需模型密钥或依赖升级。
- Think 成功标准已有可观察边界；不存在不可逆分叉，允许 `--auto` 进入 Plan。

### 下一步

设计三件套的文件级依赖、TDD 顺序与验收命令，然后进入实现。

## Phase 2: 实施计划（Plan）

### 方案与关键取舍

本轮交付“**参考架构 + 可执行纵切面 + 持续质量门**”，不另造通用 orchestrator：

1. 新增稳定 URL `docs/agent-trends-architecture.md`，把证据归纳为 Intelligence & Context、Control & Harness、Execution & Capability、Interoperability & Coordination、Assurance & Experience 五个生产责任平面。
2. 保留课程 19 的八层生态模型：八层回答“选什么组件”，五平面回答“生产系统谁负责什么”；正文刷新到 2026-07-31，CLI 只 append 五平面，不破坏既有三段输出。
3. 以 LangGraph L6“Event streaming 与前端投影”作为纵切面：固定使用安装版 0.2.74 已实证的 multi-mode stream，把 raw `updates / values / custom` 归一化到 `user / debug / audit`，未知事件安全降级。
4. 沿用 README、demo、shared、smoke、知识图谱、概念可视化六件套，并补 scoped typecheck 与 CI gate；不升级依赖、不改 lockfile、不接 LLM、不写远端。

### 已验证 API 基线

- 声明版本 `^0.2.0`，实际安装 `0.2.74`；本地无网络 spike 已得到 `[mode, payload]`：初始 `values`，节点内 `config.writer` 的 `custom`，partial `updates`，以及每步后的 `values`。
- 单模式与多模式 chunk 形状不同；L6 内部只允许多模式，避免调用方猜形状。
- `streamEvents(v2)` 产生更宽的生命周期事件，本章只说明边界，不扩张成 tracing 教程。

### Before / After 契约

| 契约面 | Before | After | 消费者与证据 |
| --- | --- | --- | --- |
| 趋势模型 | 课程 19 主文截至 2026-06-03，只有八层/五条旧主线 | 八层保持；新增七趋势、反证、五平面、成熟度、未知项 | 蓝图、课程 19 README/CLI、README、curriculum、navigation、docs sidebar |
| 事件边界 | UI 面对 raw chunk；无可见性政策 | `custom progress→user`、`updates→debug`、`values→audit`、未知/畸形→`audit/unknown` | shared、真实 stream、smoke、demo |
| 状态完整性 | 无 L6 终态合同 | 顺序保留；最后 values 与同输入 invoke 终态等价；输入不变 | smoke 与 demo invariant |
| LangGraph 目录 | L1–L5，L6 为 roadmap | L1–L6 已实现；roadmap 为 L7–L11；旧 URL 不变 | CHAPTERS、sidebar、registry、curriculum、navigation |
| 类型覆盖 | 根 tsconfig 不含 `langgraph-advanced` | scoped tsconfig 覆盖 shared/demo/smoke，CI 跑 typecheck/smoke/IA | package script、workflow、本地复核 |
| 图谱/视觉 | 无 L6；lesson 19 无五平面 concept | L6 六件套；lesson 19 新 concept/relations/visual | graph/visuals 数据源及 tests |
| 生成物 | 全局 KG/HTML/标记区来自旧数据源 | 只改事实源；生成器第二次运行零 diff | global MD、interactive HTML、章节标记区 |
| 外部状态 | 文章库、数据库、部署不在本轮 | 仍不触碰 push/sync/deploy | Git 状态与命令边界 |

### 有序任务

#### Task 1 — RED：事件投影合同

- **文件**：`langgraph-advanced/smoke.ts`；**依赖**：Plan；**风险**：L1。
- 先加入尚无实现的断言：三种 audience、未知 mode、畸形 custom、不改输入、真实 stream 顺序、两次运行确定、空输入、最终 values 等价；预期 Red。

#### Task 2 — GREEN：shared 运行时

- **文件**：新增 `src/shared/langgraph/eventStreaming.ts`；修改 `src/shared/langgraph/index.ts`；**依赖**：Task 1；**风险**：L2。
- 实现确定性图、raw frame normalizer 与 projector；完成证据为 smoke Green，未知事件绝不进入 user。

#### Task 3 — L6 教学纵切面

- **文件**：新增 `langgraph-advanced/06-event-streaming/README.md`、`index.ts`；完善 `smoke.ts`；**依赖**：Task 2；**风险**：L1。
- demo 打印 raw modes 和三类投影，并核对顺序、可见性、终态、fallback。

#### Task 4 [P] — 深度蓝图与课程 19

- **文件**：新增 `docs/agent-trends-architecture.md`；修改课程 19 `README.md`（只改 KG 区前）、`index.ts`；**依赖**：Plan；**风险**：L2。
- 与 Tasks 1–3 文件不相交。事实就近引用一手来源/日期/限制；事实、推断、未知分开；八层兼容、CLI append 五平面。

#### Task 5 — 六件套、IA 与发现入口

- **文件**：`langgraph-advanced/README.md`、`knowledge-graph/data/{graph,visuals}.ts`、`.vitepress/site-information-architecture{.ts,.test.mts}`、`docs/{navigation,curriculum}.md`、`README.md`；**依赖**：Tasks 3–4；**风险**：L2。
- L6 sidebar 5→6 且显式可达；lesson 19 新 concept/visual；L6 有 concepts/relations/官方 reference/visual；蓝图进入 docs sidebar，不新增顶级 nav。

#### Task 6 [P] — 类型与持续门禁

- **文件**：新增 `tsconfig.langgraph.json`；修改 `package.json`、`.github/workflows/agent-build-deploy.yml`；**依赖**：Task 3；**风险**：L2。
- 与 Task 5 文件不相交。`lg:typecheck` 覆盖 shared + track；CI 纳入 typecheck、smoke、IA；lockfile 不变。

#### Task 7 — 生成与幂等

- **文件**：预计生成 `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、L6/lesson 19 KG 标记区；**依赖**：Tasks 5–6；**风险**：L2。
- 只运行生成器写标记区；首次“缺失 0”，第二次前后 hash/diff 不再变化；出现其他 diff 先审计。

#### Task 8 — 风险匹配验收

- **文件**：只修复本轮问题；**依赖**：Tasks 1–7；**风险**：L2。
- 最窄反馈扩展到类型、所有派生消费者和生产构建，最终 status/stat 与任务文件集一致。

### 测试矩阵

1. `node node_modules\tsx\dist\cli.mjs langgraph-advanced\smoke.ts`
2. `node node_modules\tsx\dist\cli.mjs langgraph-advanced\06-event-streaming\index.ts`
3. `node node_modules\tsx\dist\cli.mjs lessons\19-agent-ecosystem-and-frontier\index.ts`
4. scoped LangGraph tsc 与根 `pnpm typecheck`
5. demo registry、IA、visuals、KG generator 四组定向测试
6. `npm run kg` 两次并核对幂等
7. `VITEPRESS_BASE=/agent-build/ pnpm site:build`，检查蓝图、课程 19、L6 三个 HTML 及 `.md/README` 泄漏链接
8. `git diff --check`、`git status --short`、`git diff --stat`

### 风险、恢复与未知项

- **整体 L2**：本地、可逆、无迁移；风险来自 version-sensitive chunk、事件可见性和 CHAPTERS 多消费者。
- 用精确反向 patch 恢复；图谱事实源撤销后重跑生成器。禁止 `git reset --hard`，禁止手改生成段。
- `CreateProcessAsUserW failed: 5`、`spawn EPERM/UNKNOWN` 属于环境层；非沙箱 direct-node 复跑结果与源码结果分层报告。
- VitePress `ignoreDeadLinks: true`，绿构建不证明外部 URL 长期有效；蓝图记录核实日期。
- 不更新远端文章表，不升级 SDK，不实现 L7–L11，不 commit/push/deploy。

### Plan 验收

每项已有文件集、依赖、风险、证据；多消费者和生成器有 before/after 契约；无不可逆分叉。允许 `--auto` 进入 Work，先执行 Task 1 Red。

## Phase 3: Work 证据

### 已交付

- 新增 `docs/agent-trends-architecture.md`：用七条一手证据化趋势、反例/限制、仓库差距矩阵、五平面生产责任、L0–L4 成熟度和决策矩阵形成稳定蓝图。
- 刷新课程 19，但保留既有八层生态选型视图；CLI 在原三段之后追加五平面生产责任，不破坏旧输出顺序。
- 新增 `src/shared/langgraph/eventStreaming.ts` 与 L6：真实收集 LangGraph 0.2.74 的 `values` / `custom` / `updates` multi-mode stream，经稳定 normalizer 投影到 user/debug/audit；未知或畸形事件默认进入 audit。
- 把 L6 和蓝图接入 shared export、专题目录、课程总览、全局导航、VitePress sidebar、demo registry、知识图谱、视觉映射、根 README 和 CI 门禁；旧公开 URL 不变。
- 新增 `tsconfig.langgraph.json`、`lg:typecheck`，把原本未被根 `tsconfig` 覆盖的 shared/demo/smoke 纳入真实类型门；只为被新门暴露的 9 处历史隐式 `any` 补上类型。

### TDD 轨迹

1. **RED 1**：先在 `langgraph-advanced/smoke.ts` 引用尚未存在的 `collectEventStream`，运行失败为 `does not provide export named 'collectEventStream'`。
2. **GREEN 1**：完成 shared runtime、normalizer、projector 与真实 stream 收集，专项 smoke 通过。
3. **RED 2**：新增畸形 `updates` / `values` 的安全降级合同，得到 68 通过 / 2 失败。
4. **GREEN 2**：限定 `updates` 必须为单节点 record、`values` 必须为 record；最终 **70 通过 / 0 失败**。

### 验证回读

| 门 | 已验证结果 |
|---|---|
| `pnpm typecheck` | 通过 |
| `pnpm lg:typecheck` | 通过 |
| `pnpm lg:smoke` | 70 通过 / 0 失败 |
| L6 CLI | 7 个 raw frame；user=2、debug=2、audit=3；顺序、终态、fallback 六项 invariant 全通过 |
| 课程 19 CLI | 既有八层/选型/演进输出保留，五平面作为第四段追加 |
| demo registry | `ok` |
| VitePress IA | 6 通过 / 0 失败；蓝图可达 |
| KG visuals / generator | 均 `ok` |
| `npm run kg` 首次 | 66 单元 / 335 概念 / 472 关系 / 257 文章；README 更新 7、未变 59、缺失 0 |
| `npm run kg` 第二次 | README 更新 0、未变 66、缺失 0；9 个关键产物前后 SHA256 全相等 |
| 生产构建 | `VITEPRESS_BASE=/agent-build/ pnpm site:build` 成功，VitePress 1.6.4 用时 53.16s |
| 构建产物 | 蓝图、L6、课程 19 三个 HTML 均存在；精确扫描内部 `.md` / `README` 路由泄漏为 0 |
| Git 卫生 | `git diff --check` 通过；`pnpm-lock.yaml` 无变化；未 commit / push / deploy / sync |

### 已解释的边界与环境信号

- 构建只有既有的 Rollup 大 chunk 警告；页面渲染和产物检查均通过，故记录为非阻塞性能信号，不宣称已完成拆包优化。
- 宽松扫描命中的 `.md` 字样来自 VitePress 的 `.md.<hash>.lean.js` 资产名以及一个外部 GitHub `specification.md` 来源；改用“非外部且以 `.md`/README 结尾”的精确规则后，内部泄漏为 0。
- 当前 Windows restricted-token 环境的通用 `apply_patch` 无法同时执行 split writable-root enforcement，普通 shell 也曾返回 `CreateProcessAsUserW failed: 5`；本轮用受审批准的 PowerShell 与 `git apply` 补丁语义继续，属于工具环境阻塞，不是源码失败。
- 站点配置允许忽略死链，绿构建不能证明所有外部来源未来持续在线；蓝图保留核验日期与限制。没有升级 SDK、实现 L7–L11 或触碰远端文章/数据库。

### Work 验收

Tasks 1–8 均有实现与证据，最窄测试、派生消费者、类型门、生成幂等和生产构建全部通过。允许进入 findings-first Review；若发现实质问题，按 Sprint 状态机回到 Work 修复并复验。

## Phase 4: Review Round 1

### 审查面与证据

- **运行时 correctness/security**：独立 reviewer 审查 shared runtime、L6 demo/smoke、scoped typecheck 与 CI；主线程用携带 `apiToken` 的 custom frame 独立复现。
- **研究准确性**：独立 reviewer 逐项回读官方规范、厂商发布、NIST 草案与 OWASP 原文；主线程再次核对 A2A v1.0、AI SDK 7、NIST Initial Public Draft 与 OWASP 文章。
- **IA/派生消费者**：独立 reviewer 核对 CHAPTERS、sidebar、学习路径、标记区、图谱计数、内嵌 HTML、链接与 lockfile；主线程另做旧计数/“收官”全仓扫描。

### Findings（按严重度）

1. **P1 · A2A 基线过期**：蓝图、课程 19 与本计划仍以 v0.3 为截至 2026-07-31 的基线；官方 v1.0 已是首个 stable/production-ready 版本，包含多协议绑定、版本协商、多租户与签名 Agent Card，交互协议有 breaking changes，但 AgentCard 可同时声明 v0.3/v1.0 以渐进迁移。
2. **P2 · AI SDK 选型停在 v5 时代**：课程把 Vercel AI SDK 局限为 UI/streaming 并笼统排除长任务；2026-06-25 的 AI SDK 7 已加入 durable `WorkflowAgent`、sandbox、tool approval、harness adapters 与新版 telemetry。仍需和显式复杂 graph/state-machine 场景区分。
3. **P2 · 事实/推断边界混淆**：课程把“身份标准已有一手来源”和 production complete 规则列为已验证事实；NIST 当前证据是标准倡议与 agent identity/authorization Initial Public Draft 概念稿，完成态规则是工程推断。
4. **P2 · user 投影可夹带额外敏感字段**：`isProgressEvent` 只检查必需字段，却把原始 payload 整体交给 user；`apiToken: SECRET` 已实际透传。应输出最小规范 payload，并加入回归合同。
5. **P2 · L6 公开消费者漂移**：学习指南、LangGraph 源码解析、L5 README/CLI 仍写 L1–L5 或“本轨道收官”，与已发布的 L1–L6 矛盾。
6. **P3 · OWASP 归因过宽**：原文直接支持持久化投毒及跨 session/reboot 持续影响，不单独证明过期记忆或跨会话机密泄露；应收窄陈述或拆分来源。

### 无 finding 的边界

- `collectEventStream` 的 stream 后独立 invoke 仅用于当前纯函数、离线图的一致性 oracle，不构成现有副作用 bug；若未来泛化到 LLM、工具、checkpointer 或副作用节点，则会双执行，必须把第二次 invoke 留在测试层。
- 图谱当前增量与派生物一致：66 单元 / 335 概念 / 472 关系 / 257 文章；HTML 节点/边、7 个 README 标记区、链接、lockfile 与定向测试均无新问题。
- CI 还没有“重跑 KG 后 `git diff --exit-code`”门，属于未来派生物漂移风险；当前已用双生成与 hash 证明本轮一致，不在本轮扩大门禁范围。

### Review 决策

存在影响安全边界、最新协议基线和学习路径正确性的 findings，Review Round 1 不接受。按 Sprint 状态机回到 Work：先为敏感字段与公开消费者写 RED，再完成版本/事实源刷新、生成器重跑和全量复验。

## Phase 3B: Work 修复与复验

### TDD 修复轨迹

1. **RED · user 投影白名单**：先加入携带 `apiToken: SECRET` 的合法 progress 与纯空白 `stage`，得到 **70 通过 / 2 失败**；证明原实现会把额外字段交给 user，且空白阶段可上屏。
2. **GREEN · 规范化公开事件**：`parseProgressEvent` 先验证非空白字段，再只重建 `type / stage / message`；`pnpm lg:smoke` 最终 **72 通过 / 0 失败**。
3. **RED · 研究准确性**：新增一组静态合同，A2A v1.0 / AI SDK 7、NIST 证据桶、OWASP 归因分别失败，得到 **0 通过 / 3 失败**。
4. **GREEN · 一手事实源**：蓝图、课程 19、CLI 与知识图谱源统一到 A2A v1.0 和 AI SDK 7；NIST 标成 Initial Public Draft，完成态规则移入工程推断，OWASP 只归因持久化投毒；生成后 **3 通过 / 0 失败**。
5. **RED · L6 派生消费者**：学习指南、源码路线和 L5 收尾文案新增合同，得到 **6 通过 / 1 失败**。
6. **GREEN · 公开学习路径**：所有相关入口改为 L1–L6，L5 明确为 StateGraph 核心机制阶段完成并链接 L6；IA 最终 **7 通过 / 0 失败**。

### 六项 finding 的闭环

| Finding | 修复 | 可回读证据 |
|---|---|---|
| A2A v0.3 过期 | 更新到 v1.0 stable/production-ready，记录多协议、版本协商、多租户、签名 Agent Card、breaking interaction 与双版本迁移 | 蓝图、课程 19、图谱事实源、准确性测试 |
| AI SDK 5 选型过时 | 更新 AI SDK 7 `WorkflowAgent`、sandbox、tool approval、harness adapters、telemetry；保留和显式复杂 graph 的边界 | 蓝图、选型矩阵、CLI、图谱事实源 |
| 事实/推断混淆 | NIST identity/authorization 明确为 Initial Public Draft；完成态由 state/artifact/grader 判断列为工程推断 | 课程证据分桶测试 |
| user 泄露额外字段 | 公开 progress 采用 allowlist 重建，空白 stage/message 降级 audit | 两条新增 runtime 回归测试 |
| L6 消费端漂移 | 学习指南、源码路线、L5 README/CLI 全部接到 L6 | IA 新增合同 |
| OWASP 归因过宽 | 只保留持久化投毒跨 session/project/reboot 的直接支持范围 | 准确性测试 |

### 最终 Work 验证

| 门 | 结果 |
|---|---|
| `pnpm lg:smoke` | 72 通过 / 0 失败 |
| `pnpm lg:typecheck`、`pnpm typecheck` | 均通过 |
| `pnpm agent:trends:test` | 3 通过 / 0 失败 |
| VitePress IA | 7 通过 / 0 失败 |
| registry / visuals / generator | 3 组均通过 |
| L6 CLI / 课程 19 CLI | 均离线运行通过；课程 19 保留八层并追加 AI SDK 7 与五平面 |
| `npm run kg` 第一次 | 更新 3、未变 63、缺失 0；66 单元 / 335 概念 / 472 关系 / 257 文章 |
| `npm run kg` 第二次 | 更新 0、未变 66、缺失 0；9 个关键产物 SHA256 变化 0 |
| 生产构建 | VitePress 1.6.4 成功，49.55s；三个关键 HTML 均存在，本轮页面 Markdown/README 路由泄漏 0 |
| Git 卫生 | `git diff --check` 通过；`pnpm-lock.yaml` 未变化；无 commit / push / deploy / sync |

### 已解释的验证边界

- 直接用 Node 24 `--experimental-transform-types` 跑 IA 时，extensionless TypeScript import 触发 `ERR_MODULE_NOT_FOUND`；改回仓库现有 `tsx --test` 入口后 7/7，通过的是 repo-native runner，不把 runner 不匹配写成源码失败。
- 全站宽扫描发现未改动的 `docs/solutions/2026-07-23-daily-project-summary.md` 仍生成 4 个编码后的 Windows 绝对 `.md` href；本轮三个页面精确扫描为 0，旧日报问题作为既有站点卫生项保留，不在本 Sprint 擅自改历史报告。
- 构建仍有 Rollup 大 chunk 警告；这是既有非阻塞性能信号，不等于已完成拆包优化。
- `collectEventStream` 的第二次 invoke 只允许用于当前纯函数 demo 的测试 oracle；副作用图必须复用最后 values 或把独立 invoke 留在测试层。

### Work 再验收

Review Round 1 的六项 findings 均有 RED、修复和 GREEN；类型、派生内容、幂等生成、关键路由与生产构建已复验。允许再次进入 findings-first Review。

## Phase 4B: Review Round 2

### 独立审查结论

- **运行时安全**：无新增 finding；allowlist、空白字段、对象引用隔离与 fallback 均关闭上轮 P2。
- **IA / 派生消费者**：无新增 finding；L1–L6、蓝图入口、KG 计数、HTML、workflow、lockfile 与 10 项静态合同一致。
- **研究准确性**：无 P0/P1，发现 1 项 P2 与 1 项 P3，均落在课程 19 的 canonical graph article，而非五平面主体结论。

### Findings

1. **P2 · AI SDK 版本语义混用**：`knowledge-graph/data/graph.ts` 中共享给第 12/19 章的旧 article 仍把 `maxSteps` 写成当前权威 API；仓库依赖实际为 AI SDK 4，而官方 4→5 迁移已用 `stopWhen` 替代 `maxSteps`，课程 19 又已刷新到 v7。必须显式标为 legacy v4 或拆分记录，不能让 v4 API 冒充 v7。
2. **P3 · A2A v1 结论缺 canonical announcement**：正文已正确写 v1.0 stable、breaking interaction 与 v0.3/v1 渐进迁移，但图谱仍保留 2025 首发 blog。应把 canonical article 替换为 v1.0 announcement，并保持文章数不变后重生成。

### 无 finding 的剩余边界

- debug/audit 当前故意保留 raw payload 引用；进入真实审计存储前仍需复制、脱敏和 retention policy。
- 0.2.74 精确事件顺序只覆盖纯函数顺序图；并行、子图、取消、背压、长流与副作用图未在 L6 验证。
- 旧日报仍有 4 个 Windows 绝对 `.md` href；与本轮页面无关，不擅改历史报告。
- CI 尚未用“KG 生成后 `git diff --exit-code`”自动阻止漂移；本轮用双生成和 hash 证明一致。

### Review 决策

两项来源语义会影响课程 19 的版本准确性，Round 2 不接受。按状态机回 Work：先写版本来源 RED，再最小修复 graph source、重生成并复验。

## Phase 3C: Work 来源语义修复

### TDD 轨迹

1. 新增 `AI SDK 4 legacy / v7 current` 与 `A2A v1 canonical announcement` 两条合同，得到 **3 通过 / 2 失败**。
2. 只修改 `knowledge-graph/data/graph.ts` 两条 article：
   - 第 12 章来源改为官方 4→5 migration，明确仓库 `ai ^4.0.0`、`maxSteps` 属 legacy v4，v5+ 使用 `stopWhen / prepareStep`，且不再共享给课程 19；
   - 课程 19 的 A2A 首发 blog 替换为官方 v1.0 announcement，直接支撑 stable、breaking interaction 与双版本渐进迁移。
3. 源码测试转为 **5 通过 / 0 失败**；重生成后再次保持 5/5。

### 受影响面复验

- `npm run kg` 首次：README 更新 2、未变 64、缺失 0；计数保持 66 / 335 / 472 / 257。
- `npm run kg` 第二次：更新 0、未变 66、缺失 0；10 个关键产物 SHA256 变化 0。
- `knowledge-graph/generate.test.mts` 通过；`git diff --check` 通过；`pnpm-lock.yaml` 未变化。
- VitePress 1.6.4 生产构建成功，53.08s；蓝图、L6、第 12/19 章四个 HTML 均存在，本轮页面 Markdown/README 路由泄漏 0。
- 构建仍只有既有大 chunk 警告；npm 仍提示 `shamefully-hoist` 将在下一 major 停止支持，均为非阻塞环境/依赖维护信号。

### Work 第三次验收

Round 2 的两项 finding 均由 RED→最小事实源修复→GREEN 闭环，派生物、幂等性与生产构建已复验。允许再次进入 Review，只需对两条来源语义做聚焦回读。

## Phase 4C: Review Round 3

### 聚焦回读

- 研究 reviewer：**ACCEPTED**。第 12 章只消费 AI SDK 4→5 migration 并明确 legacy `maxSteps`；课程 19 独立消费 AI SDK 7；A2A v1 announcement 直接支撑稳定性与迁移结论。
- 集成 reviewer：**ACCEPTED**。旧 Google 首发 canonical 零残留，不再有 `chapters:["12","19"] + maxSteps`；KG/HTML 保持 66 / 335 / 472 / 257，准确性测试 5/5，lockfile 未变。
- 主审查：旧 canonical source 扫描 0；四个受影响生产 HTML 存在，内部 Markdown/README 路由泄漏 0。

### 剩余风险

- 第 12 章刻意保留 AI SDK 4 教学；未来升级 `ai` 依赖时必须同步迁移示例、concept 与生成资料。
- CI 仍未强制 KG 重生成后 diff 为空；本轮双生成与 hash 已证明一致，但自动门留作后续。

### Review 决策

无 P0–P3 新 finding，Round 3 接受。目标、实现、来源、派生物、测试和已知边界均可进入 Compound。

## Phase 5: Compound（accepted）

### 候选与去重

- 对现有 solution index、AGENTS/CLAUDE rule 与已配置 homunculus 做同题有界搜索，`五平面 / event projection / AI SDK 7 / A2A v1` 零命中。
- 新增 `docs/solutions/2026-07-31-evidence-gated-agent-framework-evolution.md`，沉淀证据门控、五平面责任、legacy/current 来源隔离、安全事件投影和派生合同；未写个人 instinct、全局记忆或外部同步。

### 已验证

- frontmatter 与 `Problem / Root Cause / Solution / Prevention / Related` 10 项 schema：缺失 0。
- 5 个 Related 本地目标：缺失 0。
- 插件 dry-run 预告新增 `docs/solutions/index.jsonl` 与 `CLAUDE.md` 投影，索引 67 篇 solution，`AGENTS.md` 不改。
- 实际 `--all` 写入成功：JSONL 共 67 行且逐行可解析，新 solution 唯一命中；CLAUDE 受管区块 begin/end 各 1 个，只投影最新 5 条；`AGENTS.md` 仍不存在。
- 首次写入后的第一次复跑对 CLAUDE 换行做了一次规范化；再复跑时 index / CLAUDE / AGENTS 全部为 `[ok]`，CLAUDE SHA256 前后均为 `2F319349B4934ECE1AD737E5E34C6E89231E8A761977829EE3A423EB7FFDFE62`。
- 最新工作树最终门禁：趋势合同 5/5、LangGraph 72/72、IA/registry/visuals/generator 10/10、`lg:typecheck` 与根 `typecheck` 通过、VitePress 1.6.4 生产构建 54.40s 通过、`git diff --check` 通过、`pnpm-lock.yaml` 未变化。

### 索引执行

- skill 指定的 `node scripts/sync-solution-index.js --all` 在本仓库失败：`MODULE_NOT_FOUND`，repo 不含该脚本，canonical `docs/solutions/index.jsonl` 执行前也不存在。
- 用户明确授权后运行已审查的 Tech Persistence 插件 fallback；它以 `process.cwd()` 为 repo root，只写本仓库 canonical index 与有界 CLAUDE 投影，未触发 Obsidian、全局 memory、commit、push 或 deploy。

Solution index: updated 67 entries -> docs/solutions/index.jsonl; Claude projection: updated; AGENTS projection: disabled

### Compound 状态

本轮沉淀通过 schema、去重、索引、投影、回读与幂等复跑校验，Compound 接受；完成最终仓库验证后可终结 Sprint。
