# 第 19 章 · Agent 前沿发展与生态拆解

> 所属阶段：**第七部分 · 前沿与生态**
> 预计用时：70 分钟 | 难度：⭐⭐⭐☆☆
> 资料时间：截至 2026-07-31，优先基于官方工程文章、协议规范、标准机构材料与原始评测说明；生态变化很快，选型前请复核原文日期和版本。
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [五平面架构蓝图](../../docs/agent-trends-architecture.md) · [知识图谱](../../docs/knowledge-graph.md)

## 学习目标

学完本章你能够：

- [ ] 说清 2025–2026 年 agent 发展的主线：从手写 loop 走向 **模型原生工具、标准协议、可观测 runtime、企业治理**。
- [ ] 区分 **模型 API / Agent SDK / 编排 runtime / 工具协议 / 数据层 / UI 层 / 评估治理** 这些生态层。
- [ ] 用 **五平面生产架构** 区分 intelligence/context、control/harness、execution/capability、interoperability/coordination、assurance/experience 的责任。
- [ ] 解释 harness、外置状态、上下文工程、拓扑感知多 agent、轨迹评估与确定性隔离为何成为高信号趋势。
- [ ] 解释 **MCP** 和 **A2A** 分别解决什么问题：一个偏“agent 连工具/数据”，一个偏“agent 连 agent”。
- [ ] 用一张选型矩阵判断：什么时候该用 Vercel AI SDK、OpenAI Agents SDK、LangGraph、CrewAI、LlamaIndex，什么时候继续手写。
- [ ] 在架构判断里主动区分 **已验证事实 / 工程推断 / 未知项 / 反证与限制**。
- [ ] 形成“先手写原理，再选生态部件”的判断力，不被框架名词带跑。

## 前置知识

- 已读 [第 04 章 · Agent 循环](../04-the-agent-loop/README.md)，理解 agent loop。
- 已读 [第 06 章 · 工具系统](../06-building-a-tool-system/README.md)，理解 schema、tool registry、运行期校验。
- 已读 [第 09 章 · RAG](../09-rag-from-scratch/README.md)、[第 12 章 · 框架入门](../12-intro-to-frameworks/README.md)、[第 16 章 · 可观测性](../16-observability-and-cost/README.md)。

## 三层学习路线

| 层级 | 学习目标 | 你要完成什么 |
|------|----------|--------------|
| 极简 | 把 agent 生态拆成清晰层级。 | 能区分模型接口、工具协议、Agent SDK、编排 runtime、RAG、UI、观测和安全治理。 |
| 进阶 | 理解 MCP、A2A、SDK、runtime 的边界。 | 解释 MCP 连接工具和数据,A2A 连接 agent,框架负责控制流和持久化。 |
| 真实实践 | 为真实项目做生态选型和迁移路线。 | 根据一个产品需求选择手写、Vercel AI SDK、OpenAI Agents SDK、LangGraph、CrewAI 或 LlamaIndex,并说明取舍。 |

---

## 图解学习地图

> 读图顺序：先从底层模型能力往上看，再从产品需求往下选型。核心焦点：**把 agent 生态拆成可替换的工程层**。

```mermaid
flowchart TB
  A["模型与推理接口\nResponses / chat / multimodal / reasoning"] --> B["工具与上下文协议\nFunction tools / MCP / hosted tools"]
  B --> C["Agent SDK\nloop / handoff / guardrails / sessions"]
  C --> D["编排 runtime\nLangGraph / CrewAI / workflows / durable execution"]
  D --> E["数据与记忆\nRAG / vector DB / long-term memory"]
  E --> F["产品体验\nchat UI / streaming / voice / computer use"]
  F --> G["生产治理\ntracing / eval / cost / policy / human review"]

  H["A2A"] -.-> D
  H -.-> G
  I["MCP"] -.-> B
  I -.-> E
```

### 原理展开

- 当前 agent 生态的核心变化，不是“又多了一个框架”，而是**分层开始标准化**：模型平台提供 hosted tools，MCP 统一工具/数据接入，A2A 尝试统一 agent 间通信，编排 runtime 负责持久化和人类介入。
- 真正生产化的 agent 不只是 `while + tool call`。它需要会恢复、会被观察、能被评估、能限权、能让人插手，还要能和外部工具、内部数据库、其他 agent 协作。
- 生态选型要从约束出发：你要的是前端流式体验、长任务恢复、企业自动化、多 agent 分工、数据问答，还是 hosted tool / computer use。不同目标对应不同栈。

### 本章和整条路径的关系

前 18 章教你从零造出 agent 的每个零件；本章教你看懂真实生态里这些零件被谁封装、谁标准化、谁负责上线风险。学完后你能更冷静地选框架，而不是被“agent 平台”四个字带着走。

---

## 一、七条最新发展主线：从“会循环”到“可托管的工程系统”

下面每条都把**已验证事实、工程推断和限制**放在一起。详细证据链与五平面架构见[《2026 Agent 发展趋势与五平面架构蓝图》](../../docs/agent-trends-architecture.md)。

### 1. Harness 正在成为能力边界

**已验证事实**：OpenAI 在 2026-02-11 的 [Harness engineering](https://openai.com/index/harness-engineering/) 中把仓库指令、工具、测试和反馈环视为 coding agent 产出的关键组成；Anthropic 在 2025-11-26 的 [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 中用初始化、进度文件和清晰状态交接支撑跨上下文窗口任务。

**工程推断**：竞争单位不再只是模型，而是“模型 × 上下文 × 工具 × 状态 × 验证环境”。prompt 仍重要，但可版本化的任务协议、恢复点和验证命令更接近生产资产。

**限制**：Anthropic 在 2026-03-24 的 [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) 中也提醒，旧 harness 可能限制新模型。harness 必须做有/无对照，不能越堆越厚。

### 2. Session、Context、Memory、Artifact 开始分离

**已验证事实**：Anthropic 在 2026-04-08 的 [Managed Agents](https://www.anthropic.com/engineering/managed-agents) 中把 session 建模为追加式事件日志，并把 harness 与隔离执行环境解耦；OpenAI 在 2026-04-15 的 [The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/) 中把 sandbox、长任务、快照与恢复放进 runtime 演进路线。

**工程推断**：message history 不能同时充当任务身份、当前上下文、长期记忆、恢复日志和最终产物。生产系统需要分别管理 session、context、memory、artifact、event log。

**限制**：更多记忆不等于更可靠。OWASP 在 2026-05-13 的 [Memory is a feature. It is also an attack surface](https://genai.owasp.org/2026/05/13/memory-is-a-feature-it-is-also-an-attack-surface/) 中指出，恶意内容或工具输出可写入持久化记忆，使投毒跨会话、跨项目甚至重启后继续影响行为。

### 3. 上下文工程从“写 prompt”变成运行时调度

**已验证事实**：Anthropic 的 [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 把上下文视为有限注意力预算，强调渐进披露、按需工具、压缩和外置笔记。

**工程推断**：更好的问题不是“上下文窗口多大”，而是“当前阶段必须看到哪些规则、工具和证据”。上下文要像缓存一样装配、淘汰、重新读取，而不是无限追加。

**未知项**：不存在跨模型通用的最佳摘要频率、top-k 或 token 阈值，必须用本项目的成功率、恢复质量与成本校准。

### 4. 协议在分层，不是由一个协议包办一切

**已验证事实**：[MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28) 面向工具、资源与上下文能力；[A2A v1.0 specification](https://a2a-protocol.org/latest/specification/) 是首个 stable、production-ready 版本，面向独立 agent 的发现、消息、任务状态与 artifact 交换，并加入多协议绑定、版本协商、多租户与签名 Agent Card。其 interaction protocol 含 breaking changes，但 Agent Card 可同时声明 v0.3/v1.0 以渐进迁移。

**工程推断**：至少要分清 tool/context protocol、agent-to-agent protocol、product event protocol。MCP 连接工具/数据，A2A 连接独立 agent，UI 事件协议负责 token、步骤、审批、引用和错误投影。

**限制**：协议只解决“怎样说话”，不会自动解决身份可信、最小权限、幂等、补偿和版本兼容。

### 5. Multi-agent 从默认叙事回到拓扑选择

**已验证事实**：Google Research 在 2026-01-28 的 [Towards a science of scaling agent systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) 中比较 180 组配置：集中式多 agent 在可并行金融任务上最高提升 80.9%，但在顺序依赖任务上多种方案下降 39%–70%。

**工程推断**：可独立分片、上下文差异大、结果能分别验收时才优先多 agent；强顺序依赖和高频共享状态更适合单 agent 或确定性 graph。

**限制**：要按“每个成功任务”的质量、成本、延迟和冲突合并计算收益，不能把角色数量当能力指标。

### 6. 评估从最终答案扩展到轨迹和真实状态

**已验证事实**：Anthropic 在 2026-01-09 的 [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) 中区分 task、trial、grader、transcript、outcome、eval harness 与 agent harness；OpenAI 在 2026-07-08 的 [Separating signal from noise in coding evaluations](https://openai.com/index/separating-signal-from-noise-coding-evaluations/) 中估计 SWE-Bench Pro 约 30% 任务存在破损或有效性问题。

**工程推断**：上线门要同时看 outcome、trajectory、evidence、cost 和多次 trial 稳定性。文件 hash、数据库 state diff、测试或人工签字，比模型说“完成了”更接近 truth。

**限制**：[METR Time Horizon](https://metr.org/time-horizons/) 衡量的是某成功概率下任务对应的人类完成时长，不等于 agent 能连续自治多久；超过 16 小时的估计仍不稳定。

### 7. 安全从“频繁弹窗”转向确定性隔离与身份治理

**已验证事实**：Anthropic 在 2026-05-25 的 [How we contain Claude](https://www.anthropic.com/engineering/how-we-contain-claude) 中讨论审批疲劳，并把 VM、sandbox、网络出口和凭证隔离作为确定性边界；NIST 在 2026-02 发起 [AI Agent Standards Initiative](https://www.nist.gov/news-events/news/2026/02/announcing-ai-agent-standards-initiative-interoperable-and-secure)，把互操作与安全、身份和授权放在同一议题里，其中 [identity/authorization material](https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd) 当前仍是 Initial Public Draft（概念草案）。

**工程推断**：凭证应按任务动态收缩，执行应带主体、范围、预算、幂等键和 state diff。HITL 应展示证据、影响和回滚方式，而不是只给一个 Approve 按钮。

**未知项**：跨组织 agent 身份、不可抵赖委托和长期记忆治理仍在演进，当前草案或单一厂商实现不能当成稳定通用控制面。

---

## 二、Agent 生态分层拆解

下面这张表比“哪个框架最好”更重要。你要先知道自己缺哪一层。

| 层 | 解决的问题 | 典型能力 | 代表技术 |
|----|------------|----------|----------|
| 模型接口层 | 模型如何接收输入、输出文本/工具调用 | chat、Responses、reasoning、multimodal、parallel tools | OpenAI Responses API、Anthropic Messages API |
| 工具协议层 | agent 如何安全、标准地调用外部能力 | function tools、MCP server、hosted tools、computer use | MCP、OpenAI hosted tools、Function calling |
| Agent SDK 层 | 如何写 agent loop 和多 agent handoff | agent、tool、handoff、guardrail、session、trace | OpenAI Agents SDK、Vercel AI SDK Agent |
| 编排 runtime 层 | 长任务、状态机、恢复、人类介入 | graph、durable execution、interrupt、checkpoint、subgraph | LangGraph、CrewAI Flows |
| 数据/RAG 层 | agent 如何用私有知识 | ingestion、chunk、embedding、retrieval、query planning | LlamaIndex、vector DB、RAG pipeline |
| 产品/UI 层 | 用户如何感知 agent 过程 | chat UI、streaming、voice、step display、approval UI | Vercel AI SDK、Realtime agents、自建前端 |
| 观测评估层 | 如何知道 agent 对不对、贵不贵、为何错 | tracing、eval、dataset、LLM judge、cost | LangSmith、OpenAI tracing/evals、自建 telemetry |
| 安全治理层 | 如何防止 agent 越权或被注入 | guardrails、policy、human review、sandbox、audit | OpenAI guardrails、sandbox execution、MCP security practices |

### 关键判断

如果你只会问“我要不要用 LangGraph / CrewAI / OpenAI Agents SDK”，说明问题还没拆开。更好的问题是：

```text
我缺的是:
1. 模型接口统一?
2. 工具接入标准?
3. 多 agent handoff?
4. 长任务持久化?
5. 数据/RAG 能力?
6. UI streaming?
7. tracing/eval/guardrails?
```

不同答案，对应完全不同的选型。

---

## 三、MCP vs A2A：别把两个协议混在一起

| 对比 | MCP | A2A |
|------|-----|-----|
| 核心问题 | agent / AI app 如何连接工具、数据、prompt、resource | 不同 agent 如何互相发现、通信、协作 |
| 主要对象 | client、server、tools、resources、prompts | agent card、message/task、artifact、status |
| 类比 | USB-C / 插件接口 | 服务发现 + 跨 agent RPC |
| 典型场景 | Claude Code 连 Figma/GitHub/数据库; ChatGPT 连内部工具 | 一个采购 agent 委托供应链 agent; 一个研究 agent 调用法律 agent |
| 风险重点 | 工具权限、数据外泄、prompt injection、恶意 server | 身份认证、能力声明可信度、跨组织授权、结果审计 |

### 什么时候用 MCP

- 你要把内部数据库、业务 API、文件系统、设计工具、搜索工具暴露给多个 AI 客户端。
- 你想“一次写 server，多处接入”。
- 你关注工具 schema、resource、prompt 复用。

### 什么时候关注 A2A

- 你有多个独立部署的 agent，需要跨系统协作。
- 你要让 agent 暴露可发现的能力，而不是只给一个内部函数调用。
- 你关心任务生命周期、artifact、异步协作、跨组织认证。

### 一句话

```text
MCP: 我这个 agent 能用哪些工具和数据?
A2A: 我这个 agent 能找哪个别的 agent 帮忙?
```

---

## 四、主要框架与平台怎么选

| 选择 | 最适合 | 不适合 | 你该先学哪章 |
|------|--------|--------|--------------|
| 继续手写 | 学原理、小 demo、完全控制 loop | 长任务恢复、多团队协作、大量工具治理 | 04–06 |
| Vercel AI SDK 7 | TypeScript 全栈、chat UI、streaming、durable `WorkflowAgent`、sandbox、tool approval | 需要显式复杂 graph 拓扑、跨 agent 协议治理，或无法迁移到 Node.js 22 + ESM | 14、18 |
| OpenAI Agents SDK | OpenAI 模型栈、handoff、guardrails、tracing、hosted tools | 强多厂商中立或完全自托管需求 | 12、15、16、17 |
| LangGraph | 长任务、状态图、human-in-the-loop、持久化、可恢复执行 | 只做简单聊天 UI 或一次性脚本 | 10、11、16 |
| CrewAI | 企业流程自动化、角色团队、Flows + Crews | 高度底层自定义 runtime 或数据/RAG 专用 | 11、12 |
| LlamaIndex | 数据密集型 agent、RAG、query planning、知识库工具 | 纯 UI agent 或非数据主线任务 | 08、09 |
| MCP | 工具/数据连接标准化 | 单项目内部函数调用足够时 | 05、06、17 |
| A2A | 独立 agent 之间互操作 | 一个进程内的 manager-worker 模式 | 11、18 |

AI SDK 7 已不只是 UI 层工具，但“支持 durable workflow”仍不等于替代所有 graph runtime：有界 TypeScript workflow 可先评估 `WorkflowAgent`；复杂分支、显式状态拓扑和图级恢复语义仍应逐项与 LangGraph 等 runtime 对照。

### 选型口诀

```text
先问任务形态:
- UI/流式优先 -> Vercel AI SDK
- OpenAI hosted tools/guardrails/tracing 优先 -> OpenAI Agents SDK
- 长任务状态/恢复/人工插入 -> LangGraph
- 角色团队/业务流程自动化 -> CrewAI
- 数据/RAG/知识工作流 -> LlamaIndex
- 工具接入标准化 -> MCP
- 跨 agent 互操作 -> A2A
- 还在学原理/需求很小 -> 手写
```

---

## 五、五平面生产架构：八层选型之后，怎样分配责任

八层生态视图继续保留；它回答“缺哪层”。五平面回答“任务运行时谁负责什么”。完整版本见[五平面架构蓝图](../../docs/agent-trends-architecture.md)。

```mermaid
flowchart TB
  U["User / System Goal"] --> A["⑤ Assurance & Experience\n风险门 · UI 投影 · 验收"]
  A --> B["② Control & Harness\nsession · workflow · checkpoint · budget"]
  B --> C["① Intelligence & Context\nmodel · prompt/skill · RAG · memory"]
  C --> B
  B --> D["③ Execution & Capability\nsandbox · tools · credentials · side effects"]
  B --> E["④ Interoperability & Coordination\nMCP · A2A · discovery · delegation"]
  E --> D
  D --> F["Real State / Artifacts"]
  F --> A
```

| 平面 | 负责什么 | 关键输出 | 明确不负责 |
|------|----------|----------|------------|
| Intelligence & Context | 模型、指令/skills、RAG、memory、上下文预算 | 结构化意图、引用、不确定性 | 不宣布真实副作用已完成 |
| Control & Harness | session、workflow/loop、checkpoint、取消、重试、预算 | 下一状态、执行意图、恢复点 | 不绕过执行权限 |
| Execution & Capability | sandbox、工具、凭证、超时、幂等副作用 | result/error、state diff、artifact、audit id | 不自主扩大权限 |
| Interoperability & Coordination | MCP、A2A、发现、委托、task/artifact/status | 可追踪委托、兼容性结果 | 不替代内部 workflow 和身份治理 |
| Assurance & Experience | UI 事件、HITL、trace/eval、policy、成本/SLO、验收 | pass/block/review 与可解释用户状态 | 不把“有日志”当“结果正确” |

### 八层到五平面的映射

| 八层生态 | 主要平面 |
|----------|----------|
| 模型接口、数据/RAG | Intelligence & Context |
| Agent SDK、编排 runtime | Control & Harness |
| hosted/custom tools、sandbox | Execution & Capability |
| MCP、A2A | Interoperability & Coordination |
| UI、观测评估 | Assurance & Experience |
| 安全治理 | Control + Execution + Assurance 的跨平面约束 |

### 成熟度 L0–L4

| 等级 | 可观察状态 | 升级 gate |
|------|------------|-----------|
| L0 Demo | 内存 loop、直接工具、只看最终文本 | 先限定步骤、schema 和工具范围 |
| L1 Bounded Workflow | 有界 loop、allowlist、超时、离线 smoke | 需要跨进程或跨窗口恢复时再升级 |
| L2 Recoverable Product | session、checkpoint、sandbox、幂等写、trace/eval/HITL | 多租户、动态权限或跨 agent 委托出现 |
| L3 Governed Platform | policy snapshot、预算/租约、动态最小权限、outcome + trajectory gate | 多 runtime 和跨域信任确有业务价值 |
| L4 Adaptive Portfolio | 可回滚策略更新、短生命周期环境、协议 conformance、持续评估 | 必须用线上证据证明收益大于复杂度 |

成熟度不是功能清单。只需要 L1 的场景，有边界的 L1 比不可解释的 L3 更可靠。

### 架构决策矩阵

| 任务形态 | 默认选择 | 何时升级 | 不要先做什么 |
|----------|----------|----------|--------------|
| 单轮知识问答 | 单 agent + RAG | 引用、权限、连续追问成为瓶颈 | 不要先上多 agent |
| 确定性业务流程 | workflow + 局部模型节点 | 分支需要人工判断 | 不要让模型接管全部控制流 |
| 长周期研究/编码 | harness + session + artifact | 跨窗口、重启、并行子任务 | 不要只依赖上下文压缩 |
| 写数据库/发消息 | control + isolated execution | 多租户、不可逆批量副作用 | 不要把弹窗当唯一防线 |
| 多客户端复用工具 | MCP + capability policy | 版本协商、远程认证、订阅 | 不要复制多套 connector |
| 跨组织委托 | A2A + identity + audit | 异步 task/artifact、跨域授权 | 不要把进程内 worker 冒充开放 agent |
| 可并行宽任务 | manager-worker | 子任务可独立验收且上下文不同 | 不要共享一个可变草稿 |
| 强顺序依赖任务 | 单 agent / deterministic graph | 某阶段稳定可独立验收后再拆 | 不要因“更智能”默认多 agent |

---

## 六、生态地图：从需求倒推架构

```mermaid
flowchart LR
  A["我要做什么?"] --> B{"主要矛盾"}
  B -->|"前端聊天与流式体验"| C["Vercel AI SDK + 自定义 tools"]
  B -->|"OpenAI hosted tools / guardrails"| D["OpenAI Agents SDK"]
  B -->|"长任务/状态/人工介入"| E["LangGraph"]
  B -->|"企业流程/角色团队"| F["CrewAI"]
  B -->|"数据问答/RAG/知识库"| G["LlamaIndex + Vector DB"]
  B -->|"工具生态复用"| H["MCP server/client"]
  B -->|"跨 agent 协作"| I["A2A"]
  B -->|"学习/小 demo"| J["手写 loop"]

  C --> K["tracing/eval/cost"]
  D --> K
  E --> K
  F --> K
  G --> K
  H --> L["security/policy/audit"]
  I --> L
```

---

## 七、证据边界：事实、推断、未知项与反证

### 已验证事实

- harness、managed session、sandbox、MCP/A2A 与 agent eval 都有可回到的一手来源；NIST 身份与授权材料仍是 Initial Public Draft（概念草案）；
- multi-agent 是否增益强依赖任务能否并行以及协调拓扑；
- benchmark 任务有效性、环境和 harness 会显著改变最终数字；

### 工程推断

- 八层生态适合做技术选型，五平面适合冻结职责和接口；
- 单 agent / workflow 应是默认起点，多 agent 是通过证据晋级后的拓扑；
- 模型输出应停在 intent，执行结果和完成态应由工具返回、state diff 和 grader 决定；
- 安全要跨 control、execution、assurance 三个平面实现，不能只靠 system prompt 或审批弹窗。

### 未知项

- 不同模型的最佳 harness、上下文压缩和 memory 策略；
- 跨组织 agent 身份、授权委托与协议版本何时真正稳定；
- 某个业务使用多 agent 后，每个成功任务的质量/成本比是否提高；
- 人工审批在具体 UI 和组织压力下是否真的降低错误率。

### 反证检查

面对“模型能做更长任务”“多 agent 更强”“接入协议就能互操作”这类结论，至少追问：

1. 任务集有效吗，是否存在泄漏或 grader 漏洞？
2. 模型、harness、预算、工具和环境版本是什么？
3. 报告的是最终文本、真实 state diff，还是人工主观印象？
4. 失败、人工时间、token、延迟和冲突合并是否计入成本？
5. 是否有单 agent / 无 harness / 旧版本基线？

---

## 八、代码走读

本章的 `index.ts` 不调用任何真实模型。它做四件事：

1. 打印 agent 生态分层；
2. 根据需求标签给出推荐栈；
3. 输出一个“从手写到生产”的升级路径。
4. 追加打印五平面的 owner、契约和明确边界。

运行它是为了训练一个能力：**先描述约束，再做选型**。

---

## 九、运行

```bash
npx tsx lessons/19-agent-ecosystem-and-frontier/index.ts
```

预期输出：

- Agent ecosystem layers；
- 典型需求到技术栈的映射；
- 从 demo 到 production 的升级 checklist；
- Production responsibility planes。

本章不需要 `.env`，不消耗 token。

---

## 十、练习

1. **选型题**：你要做一个“企业内部政策问答 + 引用来源 + 人工复核”的 agent。写出你的技术栈，并说明为什么。
2. **协议题**：把“公司内部 CRM 查询能力”设计成 MCP server，列出 3 个 tools、2 个 resources、2 条安全规则。
3. **A2A 题**：设计一个“旅行规划 agent 调用签证政策 agent”的 Agent Card，写出它应该暴露的能力和认证方式。
4. **治理题**：为一个能发邮件的 agent 设计 human-in-the-loop 节点，说明哪些邮件必须人工确认。
5. **迁移题**：把第 04–06 章手写 agent 迁移到 LangGraph 或 OpenAI Agents SDK，你会保留哪些自定义代码？
6. **证据题**：选择一个“agent 能完成数小时任务”的 benchmark，分别写出事实、推断、未知项和一个可能推翻结论的反证。
7. **成熟度题**：把自己的 agent 放到 L0–L4，列出进入下一级所需的真实完成证据，而不是功能愿望。

---

## 十一、官方资料来源

本章参考的官方资料：

- [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/)
- [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI: The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)
- [OpenAI: Harness engineering](https://openai.com/index/harness-engineering/)
- [OpenAI: Separating signal from noise in coding evaluations](https://openai.com/index/separating-signal-from-noise-coding-evaluations/)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Anthropic: Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Google Research: Towards a science of scaling agent systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)
- [METR: Time Horizon](https://metr.org/time-horizons/)
- [Model Context Protocol: What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Model Context Protocol 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [A2A v1.0 specification](https://a2a-protocol.org/latest/specification/)
- [NIST: AI Agent Standards Initiative](https://www.nist.gov/news-events/news/2026/02/announcing-ai-agent-standards-initiative-interoperable-and-secure)
- [NIST: Agent identity and authorization Initial Public Draft](https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd)
- [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [Vercel AI SDK 7](https://vercel.com/changelog/ai-sdk-7)
- [CrewAI introduction](https://docs.crewai.com/en/introduction)
- [LlamaIndex Agents documentation](https://developers.llamaindex.ai/python/framework/use_cases/agents/)

---

> 想按日期浏览完整前沿资料库，见 [第 20 章 · Agent 前沿文章库](../20-agent-frontier-news/README.md)。

## 十二、小结与延伸

你现在可以把 agent 生态拆成 8 层，而不是只记一堆框架名：

```text
模型接口 -> 工具协议 -> Agent SDK -> 编排 runtime -> 数据/RAG -> UI -> 观测评估 -> 安全治理
```

也可以用五平面冻结生产责任：

```text
Intelligence & Context
  -> Control & Harness
  -> Execution & Capability
  -> Interoperability & Coordination
  -> Assurance & Experience
```

下一步不是追每个新框架，而是训练这个判断：

> 我的业务到底缺哪一层？运行时由哪个平面负责？这一层是买现成的、用开源的、还是继续手写？

当你能回答这个问题，才真正从“会写 agent demo”进入“会设计 agent 系统”。

> 💡 **面试会问**：八层生态和五平面架构分别回答什么问题？面对一个新需求，你怎么决定 workflow、single-agent 或 multi-agent？MCP 和 A2A 各解决什么问题？怎样用 outcome、trajectory 和真实 state 证明 agent 完成了任务？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph TB
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_c19_ecosystem_layers["Agent 生态分层"]
  n_c19_five_plane_architecture["Agent 工程五平面"]
  n_c19_mcp["MCP (模型上下文协议)"]
  n_c19_a2a["A2A (Agent2Agent)"]
  n_c19_agent_sdk["Agent SDK"]
  n_c19_orchestration_runtime["编排 runtime"]
  n_c19_hosted_tools["Hosted tools 与 sandbox"]
  n_c19_stack_selection["需求倒推选型"]
  n_c19_governance["可观测与安全治理"]
  n_c20_layer_filter["体系层筛选（第20章）"]
  n_c20_article_detail["文章卡片与原文入口（第20章）"]
  n_c12_framework_choice["框架选型决策（第12章）"]
  n_c05_native_tool_use["原生工具调用 (Function Calling)（第05章）"]
  n_c20_news_archive["前沿文章库（第20章）"]
  n_c19_ecosystem_layers -->|组成| n_c19_mcp
  n_c19_ecosystem_layers -->|组成| n_c19_agent_sdk
  n_c19_ecosystem_layers -->|组成| n_c19_orchestration_runtime
  n_c19_ecosystem_layers -->|组成| n_c19_governance
  n_c19_mcp -->|对比| n_c19_a2a
  n_c19_agent_sdk -->|深化| n_c19_orchestration_runtime
  n_c19_hosted_tools -->|对比| n_c19_mcp
  n_c19_stack_selection -->|应用| n_c19_ecosystem_layers
  n_c19_stack_selection -->|应用| n_c19_agent_sdk
  n_c19_governance -->|应用| n_c19_orchestration_runtime
  n_c19_ecosystem_layers -->|深化| n_c19_five_plane_architecture
  n_c19_five_plane_architecture -->|应用| n_c19_orchestration_runtime
  n_c19_five_plane_architecture -->|应用| n_c19_mcp
  n_c19_five_plane_architecture -->|深化| n_c19_governance
  n_c20_layer_filter -->|应用| n_c19_ecosystem_layers
  n_c20_article_detail -->|应用| n_c19_stack_selection
  n_c19_ecosystem_layers -->|深化| n_c12_framework_choice
  n_c19_mcp -->|应用| n_c05_native_tool_use
  n_c20_news_archive -->|深化| n_c19_ecosystem_layers
  class n_c19_ecosystem_layers,n_c19_five_plane_architecture,n_c19_mcp,n_c19_a2a,n_c19_agent_sdk,n_c19_orchestration_runtime,n_c19_hosted_tools,n_c19_stack_selection,n_c19_governance own;
  class n_c20_layer_filter,n_c20_article_detail,n_c12_framework_choice,n_c05_native_tool_use,n_c20_news_archive cross;
  linkStyle 0 stroke:#d97706,stroke-width:2px;
  linkStyle 1 stroke:#d97706,stroke-width:2px;
  linkStyle 2 stroke:#d97706,stroke-width:2px;
  linkStyle 3 stroke:#d97706,stroke-width:2px;
  linkStyle 4 stroke:#db2777,stroke-width:2px;
  linkStyle 5 stroke:#7c3aed,stroke-width:2px;
  linkStyle 6 stroke:#db2777,stroke-width:2px;
  linkStyle 7 stroke:#059669,stroke-width:2px;
  linkStyle 8 stroke:#059669,stroke-width:2px;
  linkStyle 9 stroke:#059669,stroke-width:2px;
  linkStyle 10 stroke:#7c3aed,stroke-width:2px;
  linkStyle 11 stroke:#059669,stroke-width:2px;
  linkStyle 12 stroke:#059669,stroke-width:2px;
  linkStyle 13 stroke:#7c3aed,stroke-width:2px;
  linkStyle 14 stroke:#059669,stroke-width:2px;
  linkStyle 15 stroke:#059669,stroke-width:2px;
  linkStyle 16 stroke:#7c3aed,stroke-width:2px;
  linkStyle 17 stroke:#059669,stroke-width:2px;
  linkStyle 18 stroke:#7c3aed,stroke-width:2px;
```

### 与其他章节的关系

- `体系层筛选` —**应用**→ `Agent 生态分层`（第 20 章）
- `文章卡片与原文入口` —**应用**→ `需求倒推选型`（第 20 章）
- `Agent 生态分层` —**深化**→ `框架选型决策`（第 12 章）
- `MCP (模型上下文协议)` —**应用**→ `原生工具调用 (Function Calling)`（第 05 章）
- `前沿文章库` —**深化**→ `Agent 生态分层`（第 20 章）

### 延伸阅读

> 标题可点击查看原文；来源为发布方或官方文档站。

- 来源：Anthropic · [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic 官方工程博客，系统讲解 Agent 的循环、工具与何时该用 Agent，与本章心智模型高度对应 `doc`
- 来源：OpenAI · [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/) — OpenAI 官方 TypeScript Agents SDK 文档，对应 agent、tool、handoff、guardrail、session、tracing、MCP 等 SDK 层能力 `doc`
- 来源：OpenAI · [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses) — OpenAI 官方 Responses API 参考，对应模型原生输入输出、工具调用与状态化交互接口层 `doc`
- 来源：OpenAI · [OpenAI: The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/) — OpenAI 官方产品文章：Agents SDK 向 sandbox execution、long-horizon tasks、durable harness 演进，是前沿趋势来源 `blog`
- 来源：OpenAI · [OpenAI Docs · Sandbox agents](https://developers.openai.com/api/docs/guides/agents/sandboxes) — Agents SDK sandbox 文档，对应 code execution / long-running task 的隔离执行与生产化边界 `doc`
- 来源：OpenAI · [OpenAI Docs · Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agent-evals) — OpenAI 官方 agent workflow eval 指南，对应第 19 章评估治理层 `doc`
- 来源：OpenAI · [OpenAI Docs · MCP and Connectors](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) — OpenAI 官方 MCP/connectors 文档，对应 hosted platform 如何接入远程工具协议 `doc`
- 来源：OpenAI · [OpenAI Docs · Web search](https://developers.openai.com/api/docs/guides/tools-web-search) — OpenAI 官方 web search 工具文档，对应 hosted tools 层的网页检索能力 `doc`
- 来源：OpenAI · [OpenAI Docs · File search](https://developers.openai.com/api/docs/guides/tools-file-search) — OpenAI 官方 file search 工具文档，对应 hosted tools / 私有资料检索能力 `doc`
- 来源：OpenAI · [OpenAI Docs · Computer use](https://developers.openai.com/api/docs/guides/tools-computer-use) — OpenAI 官方 computer use 工具文档，对应 UI/桌面自动化与 sandbox 风险边界 `doc`
- 来源：OpenAI · [OpenAI Docs · Conversation state](https://developers.openai.com/api/docs/guides/conversation-state) — OpenAI 官方 conversation state 文档，对应状态化交互和从手写 message history 到平台托管状态的迁移 `doc`
- 来源：Anthropic · [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Anthropic 官方：上下文是有限资源，需主动裁剪与压缩，与本章窗口预算/摘要思路一致 `blog`
- 来源：OpenAI · [OpenAI Agents SDK · Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) — OpenAI 官方：guardrails 与 human-in-the-loop approvals 控制敏感工具和副作用 `doc`
- 来源：OpenAI · [OpenAI Agents SDK · Integrations and observability](https://developers.openai.com/api/docs/guides/agents/integrations-observability) — OpenAI 官方：tracing 记录 model calls、tool calls、handoffs、guardrails 与 custom spans `doc`
- 来源：Model Context Protocol · [Model Context Protocol: What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro) — MCP 官方入门，工具/数据连接标准化的一手来源 `doc`
- 来源：Model Context Protocol · [Model Context Protocol specification repository](https://github.com/modelcontextprotocol/modelcontextprotocol) — MCP 官方 specification 与文档仓库，用于复核协议层术语、版本与实现边界 `doc`
- 来源：A2A Project · [A2A v1.0 specification](https://a2a-protocol.org/latest/specification/) — 首个 stable、production-ready A2A 规范；覆盖多协议绑定、版本协商、多租户、签名 Agent Card 与 task/message/artifact/status，并保留 v0.3/v1.0 渐进迁移边界 `doc`
- 来源：A2A Project · [A2A v1.0 announcement](https://a2a-protocol.org/latest/announcing-1.0/) — A2A 官方 v1.0 公告：首个 stable/production-ready 版本，说明 breaking interaction protocol、multi-protocol bindings、版本协商、多租户、签名 Agent Card 与 v0.3/v1.0 渐进迁移 `blog`
- 来源：Google ADK · [Google Agent Development Kit (ADK) docs](https://adk.dev/) — Google ADK 官方文档，对应 Google 生态里的 agent 开发框架与多 agent 工程实践 `doc`
- 来源：LangChain · [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview) — 编排 runtime 代表，长任务持久化与 human-in-the-loop 官方文档 `doc`
- 来源：LangChain · [LangSmith Observability](https://docs.langchain.com/langsmith/observability) — LangSmith 官方观测文档，对应 agent tracing、调试、线上监控与评估治理层 `doc`
- 来源：Vercel · [Vercel AI SDK 7](https://vercel.com/changelog/ai-sdk-7) — Vercel 官方 AI SDK 7 发布说明：新增 durable WorkflowAgent、sandbox、tool approval、harness adapters 与 telemetry，同时要求 Node.js 22 + ESM 迁移验证 `blog`
- 来源：Vercel · [Vercel AI SDK UI · Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) — Vercel AI SDK UI 官方 chatbot 文档，对应产品/UI 层的对话体验与状态管理 `doc`
- 来源：CrewAI · [CrewAI introduction](https://docs.crewai.com/en/introduction) — CrewAI 官方入门，对应企业流程自动化、Flows 与 Crews 的团队/流程 runtime 心智模型 `doc`
- 来源：CrewAI · [CrewAI Flows](https://docs.crewai.com/en/concepts/flows) — CrewAI 官方 Flows 文档，对应事件驱动 workflow、状态管理、条件控制流与长期流程编排 `doc`
- 来源：LlamaIndex · [LlamaIndex Agents documentation](https://developers.llamaindex.ai/python/framework/use_cases/agents/) — LlamaIndex 官方 Agents 用例文档，对应数据密集型 agent、query planning、tools 与 RAG 生态层 `doc`
- 来源：LlamaIndex · [LlamaIndex Workflows](https://developers.llamaindex.ai/python/llamaagents/workflows/) — LlamaIndex 官方 Workflows 文档，对应事件驱动、可观测、可组合的数据/agent 工作流 `doc`
- 来源：Microsoft AutoGen · [Microsoft AutoGen · AgentChat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/index.html) — AutoGen 官方 AgentChat 文档，对应 agents、teams、human-in-the-loop、state、observability 等多 agent 框架能力 `doc`
- 来源：Microsoft Learn · [Microsoft Semantic Kernel Agent Framework](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/) — Semantic Kernel 官方 agent framework 文档，对应企业应用里的 agent 协作、人工参与和流程编排 `doc`
- 来源：AWS · [Amazon Bedrock Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html) — Amazon Bedrock 官方 Agents 文档，对应云平台托管 agent、API action、knowledge base 与企业集成生态 `doc`
- 来源：arXiv · [Testing Agentic Workflows with Structural Coverage Criteria](https://arxiv.org/abs/2605.26521) — 2026 论文：用结构覆盖衡量多 agent workflow 的测试充分性，对应 agent eval 的前沿方向 `paper`
- 来源：arXiv · [Agent-Diff: Benchmarking LLM Agents on Enterprise API Tasks via Code Execution with State-Diff-Based Evaluation](https://arxiv.org/abs/2602.11224) — 2026 论文：用企业 API 任务和 state-diff 合约评估 agent 执行结果，对应生产级 agent benchmark 方向 `paper`
- 来源：arXiv · [A Survey on Large Language Model based Autonomous Agents](https://arxiv.org/abs/2308.11432) — 综述型入口：从 agent 构造、应用到评估梳理 LLM autonomous agents，适合作为第 19 章体系地图的总览来源 `paper`
- 来源：arXiv · [Large Language Model based Multi-Agents: A Survey of Progress and Challenges](https://arxiv.org/abs/2402.01680) — 多 Agent 系统综述，覆盖角色画像、通信、协作机制、环境模拟与常用 benchmark，用于补齐 multi-agent 生态视角 `paper`
- 来源：arXiv · [LLM-Based Human-Agent Collaboration and Interaction Systems: A Survey](https://arxiv.org/abs/2505.00753) — Human-Agent Systems 综述，把人类反馈、控制、协作、profile 与安全风险纳入 agent 体系，而不是只讨论全自动 agent `paper`
- 来源：arXiv · [Memory for Autonomous LLM Agents: Mechanisms, Evaluation, and Emerging Frontiers](https://arxiv.org/abs/2603.07670) — 2026 agent memory 综述：write-manage-read、长期记忆、反思、压缩、隐私治理与评估，为记忆层提供系统分类 `paper`
- 来源：arXiv · [A Comprehensive Survey of Agents for Computer Use: Foundations, Challenges, and Future Directions](https://arxiv.org/abs/2501.16150) — Computer-use agents 综述，按环境、观察空间、动作空间与 agent 学习方式分类 GUI/桌面/浏览器代理 `paper`
- 来源：OpenAI · [OpenAI · Introducing Operator](https://openai.com/index/introducing-operator/) — OpenAI Operator 官方发布文：浏览器 GUI agent、CUA、WebArena/WebVoyager、用户接管与安全确认，是产品化 computer-use agent 的关键来源 `blog`
- 来源：OpenAI · [OpenAI · Introducing deep research](https://openai.com/index/introducing-deep-research/) — OpenAI deep research 官方发布文：长时网页研究、引用报告、文件/PDF/网页综合分析，对应研究型 agent 产品形态 `blog`
- 来源：OpenAI · [OpenAI · Introducing Codex](https://openai.com/index/introducing-codex/) — OpenAI Codex 官方发布文：云端软件工程 agent、隔离 sandbox、并行任务、终端日志与测试证据，对应 coding agent 产品化形态 `blog`
- 来源：OpenAI · [OpenAI · Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) — OpenAI ChatGPT agent 官方发布文：把 Operator、deep research、terminal、connectors 融合为统一 agent mode，展示产品层整合方向 `blog`
- 来源：OpenAI · [OpenAI Apps SDK · MCP Apps compatibility in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt) — OpenAI Apps SDK 文档：MCP Apps 在 ChatGPT 中的兼容与 UI 组件接入，补齐 agent 工具协议到交互界面的桥梁 `doc`
- 来源：Model Context Protocol · [MCP Specification · Lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle) — MCP 官方生命周期规范：初始化、能力协商、运行、关闭，是协议实现和兼容性复核的一手来源 `doc`
- 来源：Model Context Protocol · [MCP Specification · Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) — MCP 官方授权规范：OAuth 2.1、resource 参数、audience binding、token passthrough 禁止等安全边界 `doc`
- 来源：Linux Foundation · [Linux Foundation · Agentic AI Foundation (AAIF) announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) — Linux Foundation 官方公告：AAIF 承接 MCP、goose、AGENTS.md，说明 agent 生态进入中立治理与标准化阶段 `blog`
- 来源：arXiv · [WebArena: A Realistic Web Environment for Building Autonomous Agents](https://arxiv.org/abs/2307.13854) — Web agent 经典 benchmark：真实网站任务、功能正确性评估、长链路网页操作，是浏览器 agent 评测基线 `paper`
- 来源：arXiv · [OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments](https://arxiv.org/abs/2404.07972) — Computer-use agent 代表 benchmark：真实 OS、桌面应用、文件系统与跨应用 workflow，用执行脚本验证任务完成 `paper`
- 来源：arXiv · [MacArena: Benchmarking Computer Use Agents on an Online macOS Environment](https://arxiv.org/abs/2606.06560) — 2026 computer-use 新 benchmark：421 个 macOS 任务、50 个应用，用于观察跨平台 GUI agent 能力差异 `paper`
- 来源：arXiv · [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045) — tool-agent-user 交互 benchmark：零售/航空领域、多轮用户模拟、数据库状态对齐与 pass^k 稳定性指标 `paper`
- 来源：arXiv · [TRAJECT-Bench: A Trajectory-Aware Benchmark for Evaluating Agentic Tool Use](https://arxiv.org/abs/2510.04550) — 轨迹感知工具使用 benchmark：不仅看最终答案，也看工具选择、参数、顺序、依赖链是否正确 `paper`
- 来源：arXiv · [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793) — 软件工程 agent 代表论文，强调 agent-computer interface 对代码浏览、编辑、测试和性能的影响 `paper`
- 来源：arXiv · [SWE-Lancer: Can Frontier LLMs Earn $1 Million from Real-World Freelance Software Engineering?](https://arxiv.org/abs/2502.12115) — OpenAI SWE-Lancer benchmark：把 freelance 软件工程任务映射到真实经济价值，补齐 coding agent 的经济任务评估视角 `paper`
- 来源：arXiv · [PaperBench: Evaluating AI's Ability to Replicate AI Research](https://arxiv.org/abs/2504.01848) — OpenAI PaperBench：以复现 AI 论文为任务，评估 agent 做长周期科研工程的能力、rubric 与 judge 体系 `paper`
- 来源：OWASP · [OWASP · Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/) — OWASP Agentic Security Initiative 指南：以 threat model 方式整理 agentic AI 新威胁与缓解策略 `doc`
- 来源：OWASP · [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/) — OWASP LLM Top 10 2025：生产 LLM/agent 应用的通用风险清单，是第 19 章治理层的安全基线 `doc`
- 来源：arXiv · [Design Patterns for Securing LLM Agents against Prompt Injections](https://arxiv.org/abs/2506.08837) — prompt injection 防御设计模式论文，讨论工具权限、敏感信息和 agent 架构层面的安全/效用取舍 `paper`
- 来源：arXiv · [Identity Management for Agentic AI](https://arxiv.org/abs/2510.25819) — OpenID Foundation 相关白皮书：agent 身份、认证、授权、delegated authority 与访问管理，是企业落地关键议题 `paper`
- 来源：arXiv · [When Agents Handle Secrets: A Survey of Confidential Computing for Agentic AI](https://arxiv.org/abs/2605.03213) — 2026 综述：当 agent 持有密钥、记忆和工具权限时，TEE/远程证明/多跳 attestation 如何进入生产安全架构 `paper`
- 来源：arXiv · [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — Agent 控制流的奠基范式：交错 reasoning trace 与 action，让模型边推理边调用外部工具/环境，是本课程 ReAct 循环与 maxSteps 的源头 `paper`
- 来源：arXiv · [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) — 不更新权重、用语言反思 + episodic memory 让 agent 从试错中改进，是自我批判/重试类控制流（含进阶 RAG 的 self-grade）的理论根 `paper`
- 来源：Lil'Log · [LLM Powered Autonomous Agents (Lilian Weng)](https://lilianweng.github.io/posts/2023-06-23-agent/) — 把 LLM agent 拆成 planning / memory / tool use 三大件的经典体系文，第 19 章生态地图的概念脚手架 `blog`
- 来源：Anthropic · [Anthropic · Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — 把驱动 Claude Code 的 agent loop / 工具执行 / 上下文管理做成 Python、TS 可编程 SDK 的官方文档，平台级 agent primitives 一手来源 `doc`
- 来源：Anthropic · [Anthropic Engineering · Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — 官方工程博客：用 gather context / take action / verify work 三段式讲如何在 SDK 上搭生产 agent，对照本课程手写 loop 的取舍 `blog`
- 来源：AWS · [Amazon Bedrock AgentCore is now generally available](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available) — AWS 把 Runtime（8 小时执行 + 会话隔离 + A2A）、Memory、Identity、Gateway 等托管 agent 基建打包 GA，企业落地的平台层代表 `doc`
- 来源：Microsoft · [Introducing Microsoft Agent Framework](https://devblogs.microsoft.com/foundry/introducing-microsoft-agent-framework-the-open-source-engine-for-agentic-ai-apps/) — 微软把 Semantic Kernel 的企业基座与 AutoGen 的多 agent 编排合并成单一开源 SDK/runtime（原生支持 A2A、MCP），runtime 收敛的标志性事件 `blog`
- 来源：arXiv · [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) — 把 LLM 上下文当虚拟内存分层管理（core/recall/archival），用中断在主体与用户间切换控制流，Letta 的理论原型与长期记忆层基石 `paper`
- 来源：arXiv · [Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory](https://arxiv.org/abs/2504.19413) — 可外挂的记忆层：从对话动态抽取/合并/检索关键信息（含图变体），LOCOMO 上比满上下文省 90%+ token 与延迟，生产记忆的工程权衡样本 `paper`
- 来源：Letta · [Letta · Benchmarking AI Agent Memory](https://www.letta.com/blog/benchmarking-ai-agent-memory/) — Letta（MemGPT 团队）用基准对比文件系统记忆 vs 各类记忆框架，给「agent 记忆到底该怎么存/取」提供可量化对照 `blog`
- 来源：Anthropic · [Anthropic Engineering · Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 长跑 agent 的上下文工程：跨多个 context window 的 compaction、记忆落盘与首窗特殊 prompt，承接 context engineering 的实操篇 `blog`
- 来源：OpenAI · [OpenAI Agents Python v0.17.5 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.17.5) — 官方 release notes：新增可重试 sandbox_tool 错误、MongoDBSession memory 示例与 ModelSettings.truncation，让托管工具、会话存储和上下文截断的工程边界更明确。 `doc`
- 来源：Microsoft · [Microsoft Agent Framework .NET 1.10.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.10.0) — 官方 release notes：加入 Authorization Toolbox、Azure AI Foundry deployment docs、上下文 compaction opt-in 与 auto-approval rule 增强，直接影响企业 agent 的授权、部署和长上下文治理。 `doc`
- 来源：Google · [Google ADK Python v1.35.0 release notes](https://github.com/google/adk-python/releases/tag/v1.35.0) — 官方 release notes：加入 OpenTelemetry 自动 tracing、trajectory evaluator、A2A auth vs input required 区分、history compaction summaries 与 request_input 标准化，适合观察多 agent runtime 的工程收敛方向。 `doc`
- 来源：arXiv · [StreamMemBench: Towards Better Long-Context Evaluation for Memory Agents](https://arxiv.org/abs/2509.16490) — 提出 streaming long-context benchmark，把 observations、user feedback、knowledge archive 与 follow-up reuse 放到同一条评测线上，适合校正“只看 recall 不看真实复用”的记忆评测偏差。 `paper`
- 来源：arXiv · [What makes a harness a harness? Model-free foundation for agentic AI](https://arxiv.org/abs/2606.10666) — 把 harness 定义为不依赖模型能力、只负责状态、权限、审批、重试与回放的工程壳层，正好补上『agent framework ≠ harness』这层实践边界。 `paper`
- 来源：arXiv · [WorkBench Revisited: Towards a Scalable Benchmark for Evaluating Agents in Realistic Enterprise Workflows](https://arxiv.org/abs/2606.13715) — 面向真实企业 workflow 的 agent benchmark，强调 success 之外还要统计 unintended / harmful action，适合补齐 workplace agent 的安全型评测口径。 `paper`
- 来源：arXiv · [SciAgentArena: Benchmarking Scientific Agents from Paper to Experiment](https://arxiv.org/abs/2508.21126) — 把 scientific agents 的任务从 paper comprehension 拉到 experiment design / execution planning，适合校验研究型 agent 是否真的能从『读』走到『做』。 `paper`
- 来源：LangChain · [LangGraph CLI 0.4.30 release notes](https://github.com/langchain-ai/langgraph/releases/tag/langgraph-cli%3D%3D0.4.30) — 官方 release notes：CLI 开始校验 deployment 与 API version ranges 的兼容关系，并修复 config init 与 env 注入细节，说明 agent runtime tooling 正把部署契约前移到命令行阶段。 `doc`
- 来源：arXiv · [RetailBench: A Long-Horizon Benchmark for AI Agents in Retail Management](https://arxiv.org/abs/2606.14545) — 把零售经营拆成跨天库存、定价、补货与促销决策，强调 agent 不能只会单步答题，还要在长周期里维持策略一致性与收益稳定。 `paper`
- 来源：arXiv · [Can AI Agents Synthesize Scientific Conclusions? Understanding Strategic Generalization on SciConBench](https://arxiv.org/abs/2606.11337) — 提出 SciConBench，要求 agent 从多篇 scientific claims 做 clean-room 结论综合并避免直接搬运原句，适合检验研究型 agent 是否真的具备跨文献 synthesis 能力。 `paper`
- 来源：arXiv · [SubtleMemory: Benchmarking Long-Term Relational Memory in LLM Agents](https://arxiv.org/abs/2606.05761) — 把长期记忆评测拆成补充关系、矛盾关系与无关关系判断，强调 agent 需要维护人物/事件关系一致性，而不是只做关键词 recall。 `paper`
- 来源：arXiv · [SentinelBench: Benchmarking Monitoring Agents in Dynamic Environments](https://arxiv.org/abs/2606.05342) — 聚焦监控/告警场景，要求 agent 在动态环境中持续观测、解释异常并触发后续动作，补齐 monitoring agent 的时序反应与行动链评测。 `paper`
- 来源：OpenAI · [OpenAI Agents Python v0.17.6 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.17.6) — 官方 release notes：新增 pre-approval tool input guardrails，并允许 SDK-only custom tool-output data，说明高权限工具的审批边界与工具输出契约正在前移、收紧。 `doc`
- 来源：OpenAI · [OpenAI Agents JS v0.11.8 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.11.8) — 官方 release notes：JS 版同步加入 opt-in pre-approval tool input guardrails 与 SDK-only custom tool-output data，说明 py/js agent SDK 正在收敛到同一套安全执行边界。 `doc`
- 来源：Google · [Google ADK Python v2.3.0 release notes](https://github.com/google/adk-python/releases/tag/v2.3.0) — 官方 release notes：引入 mTLS AgentRegistry、Remote sandbox workspaces、per-request OpenTelemetry 配置、enterprise 参数迁移与 compaction 修复，说明企业级 agent runtime 的 auth、telemetry 和 remote execution 正在快速工程化。 `doc`
- 来源：LangChain · [LangGraph 1.2.6 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.6) — 官方 release notes：修复 nested subgraph 继承父 checkpoint namespace 回归，以及 v3 stream abort 时未取消运行中 subgraph 的问题，直接关系到 checkpoint 正确性与流式中断一致性。 `doc`
- 来源：arXiv · [Sovereign Execution Brokers: Enforcing Certificate-Bound Authority in Agentic Control Planes](https://arxiv.org/abs/2606.20520) — 提出 Sovereign Execution Broker：把 agent 的 proposal、admission、execution 三层拆开，用证书绑定、撤销窗口、drift 检查和 scoped execution identity 把真实变更权限卡在独立执行边界。 `paper`
- 来源：arXiv · [Efficient and Sound Probabilistic Verification for AI Agents](https://arxiv.org/abs/2606.20510) — 把 runtime monitoring 从 deterministic policy 推到 probabilistic verification：当 PII detector、declassifier 等工具本身有误差时，仍能给出 policy violation 的 sound 上界。 `paper`
- 来源：arXiv · [Probe-and-Refine Tuning of Repository Guidance for Coding Agents](https://arxiv.org/abs/2606.20512) — 研究 repository guidance（如 AGENTS.md）如何影响 coding agent：结论不是“有说明就行”，而是要通过 probe-and-refine 迭代补齐仓库知识，主要提升 agent 找到正确文件的覆盖率。 `paper`
- 来源：CrewAI · [CrewAI 1.14.8a3 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a3) — 官方 release notes：统一 declarative flow loading、收敛 `crewai run` / `crewai flow kickoff` 启动入口，并补上 nested crews 的进度可见性，说明多 agent workflow 的定义与运维体验正在继续向声明式和可观测靠拢。 `doc`
- 来源：AWS · [Shared infrastructure, isolated tenants: Pool model multi-tenancy with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/shared-infrastructure-isolated-tenants-pool-model-multi-tenancy-with-amazon-bedrock-agentcore/) — AWS 官方实践：用 AgentCore 展示 pool-model 多租户模式，强调共享基础设施下仍要隔离 tenant state、identity、telemetry 与审批边界，适合拿来理解生产级 agent runtime 的隔离设计。 `blog`
- 来源：AWS · [Build a protein research copilot with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/build-a-protein-research-copilot-with-amazon-bedrock-agentcore/) — AWS 官方实践：把自然语言参数抽取、protein embedding 检索和 AI scientific summaries 串成研究 copilot，说明垂类 agent 仍应拆开 query parsing、retrieval、summarization 三段，而不是用一个大 prompt 端到端硬做。 `blog`
- 来源：Linux Foundation · [Linux Foundation Agent Name Service identity infrastructure announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-intent-to-launch-agent-name-service-to-establish-trusted-identity-infrastructure-for-ai-agents) — Linux Foundation 官方公告：计划推出 Agent Name Service，为 AI agents 建 trusted identity infrastructure，信号是跨组织 agent 互认这件事正在从“各家自己做账号映射”走向独立身份层。 `blog`
- 来源：OpenAI · [OpenAI Agents Python v0.17.7 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.17.7) — 官方 release notes：新增可配置 websocket `max_size`、buffered Chat Completions tool-call streaming，并修复 sibling guardrail cancellation、ambiguous realtime multi-agent tool dispatch、sandbox sink buffering 等问题，信号是 agent runtime 正在补齐并发收尾、流式工具调用和沙箱 IO 的稳定性边界。 `doc`
- 来源：OpenAI · [OpenAI Agents JS v0.12.0 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.12.0) — 官方 release notes：修复 resolved tool approvals 被重复求值、guardrail failure 后 sibling 任务收尾、特殊 permission bits 解析与 realtime tool dispatch 歧义，说明 JS agent SDK 也在把审批状态机和并发 guardrail 清理做成硬边界。 `doc`
- 来源：Microsoft · [Microsoft Agent Framework .NET 1.11.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.0) — 官方 release notes：要求 file-access tools 在 read-only auto-approval 下也走显式审批，并把 looping、refreshable MCP auth headers、Foundry Hosting 对 MCP 的依赖与 durable worker hosting 进一步收敛到 harness/runtime 层，说明长流程 agent 的权限边界和协议基座正在继续下沉。 `doc`
- 来源：CrewAI · [CrewAI 1.14.8a4 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a4) — 官方 prerelease notes：在继续推进 conversational flows CLI 的同时，补上 skill archive symlink path traversal 修复与 declarative flow definition path 校验，说明 workflow DSL 与本地文件边界已经成为 agent runtime 的直接攻击面。 `doc`
- 来源：OpenAI · [OpenAI research: How agents are transforming work](https://openai.com/index/how-agents-are-transforming-work) — OpenAI 官方研究总结：agent 正在把使用场景从单轮问答推向更长、更复杂、跨角色的工作流，信号不是『聊天更顺』，而是任务边界、过程可见性和生产力衡量口径都在变化。 `blog`
- 来源：CrewAI · [CrewAI 1.15.0 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.0) — 官方 release notes：开始系统化追踪 conversational flow turn usage、统一 declarative flow loading，并把 conversational flows 贯通到 CLI/TUI，说明多智能体 workflow 已从『能跑』进入『可观测、可回放、可统一运维』阶段。 `doc`
- 来源：AWS · [Retrofit, don't rebuild: Agentic overlays for transforming legacy enterprise services](https://aws.amazon.com/blogs/machine-learning/retrofit-dont-rebuild-agentic-overlays-for-transforming-legacy-enterprise-services/) — AWS 官方技术实践：提出 agentic overlays，用薄包装层把传统 REST 服务转成 agent 可消费能力，核心不是重写遗留系统，而是把工具接口、权限边界与渐进迁移拆开。 `blog`
- 来源：AWS · [Building agentic AI applications with a modern data mesh strategy on AWS](https://aws.amazon.com/blogs/machine-learning/building-agentic-ai-applications-with-a-modern-data-mesh-strategy-on-aws/) — AWS 官方技术实践：把 governed, serverless data mesh 作为 production agentic AI 的数据底座，强调 catalog、IAM、Lake Formation、knowledge base 与 retrieval 层要一起设计，而不是让 agent 直连散落数据源。 `blog`
- 来源：Microsoft · [Microsoft Agent Framework .NET 1.11.1 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.1) — 官方 release notes：把 AgentSkillsProvider tools 改成默认 require approval，并补上 AOT-safe declarative workflow checkpointing 与版本升级后的 checkpoint resume 修复，信号是 runtime 的默认权限姿态和持久化兼容性正在被提升为一等边界。 `doc`
- 来源：CrewAI · [CrewAI 1.15.1 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.1) — 官方 release notes：稳定版开始要求显式 CrewAI project 定义、为生成项目自动初始化 Git，并修复 scraping fetches 的 SSRF redirect bypass，说明 coding/deploy agent 的项目边界与网络边界都在继续收紧。 `doc`
- 来源：arXiv · [Benchmarking AI Agents for Addressing Scientific Challenges Across Scales](https://arxiv.org/abs/2606.12736) — SciAgentArena 论文提出约 200 个带 stepwise verification 的交互式科学任务，结果显示 agent 在结构清晰的数据分析流程里更稳，但在自驱探索、原创洞见和开放式研究题上仍明显失稳，适合作为 deep research / science agent 的评测参照。 `paper`
- 来源：Microsoft · [Semantic Kernel Python 1.43.1 release notes](https://github.com/microsoft/semantic-kernel/releases/tag/python-1.43.1) — 官方 release notes：一边给 Azure AI / OpenAI Assistant agents 补 `function_choice_behavior`，一边在 OpenAPI plugin 里拒绝 encoded dot-segment paths，信号是“让 agent 更会调函数”和“把 plugin URL 归一化边界收紧”必须一起治理，否则工具编排能力越强，路径绕过面就越大。 `doc`
- 来源：arXiv · [Towards Automating Scientific Review with Google's Paper Assistant Tool](https://arxiv.org/abs/2606.28277) — PAT 论文把 deep scientific review agent 做成带 inference scaling 的验证流程：不仅总结论文，还检查理论、实验与潜在缺陷，并在 SPOT 数学错误集上把 zero-shot recall 提升约 34%。信号是 research/review agent 的价值不在“给意见”，而在可扩展验证链和保留人类最终裁决。 `paper`
- 来源：arXiv · [Govern the Repository, Not the Agent: Measuring Ecosystem-Level Risk in AI-Native Software](https://arxiv.org/abs/2606.28235) — 论文基于 93 万+ agent-authored PR 研究 integration friction，发现约一半变异留在 repository 层，而且 agent 贡献比 human 更集中到这种仓库级摩擦。信号是 coding agent 不能只按单个任务成功率打分，还要把仓库级并发集成风险、流程成熟度和生态摩擦作为治理对象。 `paper`
- 来源：Microsoft · [Microsoft Agent Framework Python 1.10.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/python-1.10.0) — 官方 release notes：Python 版把 background agent loop 的 provider 解析前移为默认能力，显式暴露 available_resources / scripts，并停止吞掉 skill/resource 错误，外加 standalone Durable Task worker、Foundry adaptive evals 与 reasoning token 统计。信号是 production harness 正在把『可调试、自纠错、可回放』提升为 runtime 的一等职责，而不再只做工具分发器。 `doc`
- 来源：arXiv · [TUA-Bench: A Benchmark for General-Purpose Terminal-Use Agents](https://arxiv.org/abs/2506.17537) — TUA-Bench 给 terminal-use agents 提供 200+ 个跨 coding、文档编辑、邮件、在线研究、内容创作和系统运维的真实知识工作任务，并同时记录成本、时延与任务完成质量。信号是 terminal agent 评测正在从“能不能修代码”扩展到“能不能持续完成真实工作的跨工具链任务”。 `paper`
- 来源：arXiv · [Securing the AI Agent: A Unified Framework for Multi-Layer Agent Red Teaming](https://arxiv.org/abs/2506.19396) — AI-Infra-Guard 论文把 agent 红队统一拆成 infrastructure、protocol、agent、model 四层，强调不能只测 prompt jailbreak，而要同时审查身份、协议调用、工具编排和模型输出。信号是 production agent 的安全验证已从单点提示攻击扩展到多层系统攻防。 `paper`
- 来源：LangChain · [LangGraph 1.2.7 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.7) — 官方 release notes：1.2.7 重点修 checkpoint / delta state 的正确性边界，修掉 `DeltaChannel` 跨 superstep 覆盖、`Overwrite` JSON roundtrip 丢语义，以及 langgraph-api 退出模式下 task_id UUID 非法的问题。信号是图式 agent 一旦进入持久化、回放和 API 化阶段，状态补丁的序列化稳定性本身就是生产事故面，而不只是内部实现细节。 `doc`
- 来源：AWS · [Building a serverless A2A gateway for agent discovery, routing, and access control](https://aws.amazon.com/blogs/machine-learning/building-a-serverless-a2a-gateway-for-agent-discovery-routing-and-access-control/) — AWS 官方实践把 A2A 通信的痛点从『点对点连通』重构为『单域入口 + 注册表 + 语义发现 + JWT scope 授权 + OAuth 代理』。文章直接给出 management / control / execution 三层网关设计，并指出 20 个 agent 无集中层时会膨胀到 190 条点对点连接。信号是 agent 协议标准化只解决“怎么说话”，真正的企业落地还要补 discoverability、authz、rate limit 和统一流式路由。 `blog`
- 来源：AWS · [Structured memory filtering with metadata in AgentCore Memory](https://aws.amazon.com/blogs/machine-learning/structured-memory-filtering-with-metadata-in-agentcore-memory/) — AWS 官方把 AgentCore Memory 的元数据过滤讲成三段式：配置 indexed keys、在 ingestion 期传播或严格保持 metadata、在 retrieval 前先做 metadata pre-filter 再做向量相似度。文中给出 LoCoMo 风格 151 题测试：整体 QA 准确率从 40% 提升到 64%，依赖上下文边界的问题从 16% 提升到 69%。信号是长期记忆系统的关键不只是“记住”，而是让命名空间、确定性标签和时间/权限边界在检索前就先裁掉错误候选集。 `blog`
- 来源：arXiv · [Can Agents Generalize to the Open World? Unveiling the Fragility of Static Training in Tool Use](https://arxiv.org/abs/2607.01084) — OpenAgent 论文把 tool-use agent 的真实部署问题定义成 open-world shift：query、action、observation、domain 都会漂移。作者在受控 sandbox 里按 Perception / Interaction / Reasoning / Internalization 四层制造环境偏移，结果显示 SFT 与 RL agent 都会在开放环境中显著掉点，并提出 Perturbation-Augmented Fine-Tuning 作为鲁棒性补强。信号是静态 benchmark 高分并不等于 agent 已能承受真实工具、真实用户和真实环境的变化。 `paper`
- 来源：GitHub Changelog · [Copilot agent session streaming is now in public preview](https://github.blog/changelog/2026-07-02-copilot-agent-session-streaming-is-now-in-public-preview/) — GitHub 官方 changelog：企业托管用户现在可以通过 streaming endpoint 或 REST API 获取跨 Copilot 客户端的 agent session 数据，包括 prompts、responses 和 tool calls，并可流向 SIEM 或 Microsoft Purview。信号是 coding agent 的企业化重点正在从『能自动做事』推进到『每个 agent session 都能被审计、回放和集中治理』。 `blog`
- 来源：CrewAI · [CrewAI 1.15.2a2 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a2) — CrewAI 官方 prerelease：1.15.2a2 增加 Bedrock extra 的 aiobotocore、补充 flow agent options 与 streaming docs，并修复 self-listening flow methods 的拒绝逻辑。信号是多 agent runtime 的生产化边界继续集中在云模型适配、flow 可配置性、流式体验和声明式 flow 的结构校验上。 `doc`
- 来源：SakanaAI · [Sakana Fugu](https://github.com/SakanaAI/fugu) — SakanaAI 官方仓库把 Fugu 定位成『delivered as one model』的 multi-agent system：内部动态编排 frontier models，但对外通过 Sakana API 暴露为单个 LLM，兼容 Chat Completions 与 Responses endpoints，并提供 Codex 安装入口。信号是多 agent 能力正在从应用层框架下沉为模型/API 产品形态，调用者不一定直接管理多个 agent。 `doc`
- 来源：arXiv · [Registry-Governed Agent Lifecycle: Completing EDDOps with Evaluation-Driven Registration, Promotion, and Retirement on AWS AgentCore](https://arxiv.org/abs/2607.00345) — 论文把 Evaluation-Driven Development and Operations 映射到 AgentCore Runtime、Evaluations、Agent Registry 和 CloudWatch observability，强调 agent 上线不是一次性 benchmark 过关，而是注册、晋升、回滚/退休都受评估证据治理。信号是企业 agent 的模型选择正在变成质量、可靠性、安全、时延和成本共同约束下的生命周期治理问题。 `paper`
- 来源：GitHub Changelog · [Set AI credit session limits in Copilot CLI and SDK](https://github.blog/changelog/2026-07-01-set-ai-credit-session-limits-in-copilot-cli-and-sdk/) — GitHub 官方 changelog：Copilot CLI / SDK 支持按 session 设置 AI credit 上限，覆盖模型调用、subagents 和 compaction 等后台工作；达到软上限后 agent 会收尾并报告。信号是 coding agent 的成本控制正在从全局账单后验统计，前移到每次自动化运行的执行边界。 `blog`
- 来源：GitHub Changelog · [Browser tools for GitHub Copilot in VS Code are generally available](https://github.blog/changelog/2026-07-01-browser-tools-for-github-copilot-in-vs-code-are-generally-available/) — GitHub 官方 changelog：VS Code 中的 Copilot browser tools GA，agent 可打开页面、点击、输入、读取页面内容、采集 console errors 和截图；同时强调用户 tab 默认私有、agent tab 隔离、敏感权限需显式批准，并支持企业域名 allow/deny 控制。信号是 browser-use agent 正在从插件能力进入主流 IDE，但权限、cookie、网络边界必须随能力一起产品化。 `blog`
- 来源：Microsoft · [Microsoft Agent Framework .NET 1.13.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.13.0) — 官方 release notes：.NET 1.13.0 增加 Foundry Hosting per-user session isolation、skill approval options、file editing tools、default-approval harness 可配置化，并把 OpenAI Hosting options 默认改成不透传。信号是 production harness 正在同时收紧身份隔离、工具审批、文件编辑和 shell 默认行为，而不只是给 agent 增加更多工具。 `doc`
- 来源：arXiv · [Agentic generation of verifiable rules for deterministic, self-expanding reaction classification](https://arxiv.org/abs/2607.01061) — 论文用 multi-agent LLM pipeline 自动为 665,901 条美国专利反应分类并生成可验证规则，每条规则都经过 corpus verification loop；标准 taxonomy 从 68 类扩到 14,073 类，并在未见反应上达到 97.7% 分类准确率。信号是 agent 不只生成自由文本，也可以在强验证环里持续扩展 deterministic symbolic rules。 `paper`
- 来源：OpenAI · [OpenAI Agents SDK Python v0.18.0 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.18.0) — OpenAI Agents Python SDK v0.18.0 把 RealtimeAgent 默认模型升级到 gpt-realtime-2.1，并增加 SQLAlchemySession Unicode storage 选项；同日 openai-agents-js v0.13.0 也同步升级 RealtimeAgent 默认模型。信号是 realtime agent 的模型默认值、session 存储和跨语言 SDK parity 已成为生产升级时必须显式审查的运行时边界。 `doc`
- 来源：Google ADK · [Google ADK Python v2.4.0 release notes](https://github.com/google/adk-python/releases/tag/v2.4.0) — Google ADK Python v2.4.0 增加 ManagedAgent、Workflow as Tool、OpenAI Responses API labs 支持、Vertex AI session TTL、MCP HTTP traces、streamed thought/media/code-exec/function-result deltas，并修复 DNS rebinding、AgentTool config_path traversal、artifact scope 等安全边界。信号是企业 agent SDK 正在把托管执行、工作流复用、session 生命周期、trace 和安全默认值放进同一运行时版本面。 `doc`
- 来源：LangGraph · [LangGraph 1.2.8 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.8) — LangGraph 1.2.8 修复 fresh thread 上 updateState 的 delta channel bug，使其强制写 snapshot 而不是 stub checkpoint；同时包含依赖与 websockets major 更新。信号是 graph agent 的 checkpoint / delta 状态不是内部小细节，而是恢复、时间旅行、回放和线上排障的生产边界。 `doc`
- 来源：arXiv · [Adoption and Impact of Command-Line AI Coding Agents: A Study of Microsoft's Early 2026 Rollout of Claude Code and GitHub Copilot CLI](https://arxiv.org/abs/2607.01418) — 论文研究 Microsoft 早 2026 年面向数万工程师 rollout Claude Code 与 GitHub Copilot CLI 的采用与影响：首次使用主要经由社交网络扩散，留存更多与工程师编码活动相关，采用者合并 PR 数约提升 24%，但作者也明确 merged PR 只是 output proxy，不等同真实价值。信号是企业导入 coding agent 要同时看 adoption、retention、成本、产出代理指标和价值归因，而不能只看单次 benchmark 分数。 `paper`
- 来源：GitHub Changelog · [OpenAI's GPT-5.6 Sol, Terra, and Luna are now available in GitHub Copilot](https://github.blog/changelog/2026-07-09-openais-gpt-5-6-sol-terra-and-luna-are-now-available-in-github-copilot/) — GitHub 官方 changelog：Copilot 在 VS Code、Visual Studio、Copilot CLI、cloud agent、github.com、mobile、JetBrains、Xcode 与 Eclipse 中开放 GPT-5.6 Sol / Terra / Luna。Sol 面向复杂推理和长跑 agentic coding，Terra 作为默认通用编码模型，Luna 主打低成本快速任务；Business / Enterprise 还可由管理员策略控制且使用 usage-based billing。信号是 coding agent 的模型选择正在变成任务复杂度、成本策略、入口一致性和组织治理共同决定的运行时配置。 `blog`
- 来源：GitHub Changelog · [Ask Copilot for a repository overview](https://github.blog/changelog/2026-07-09-ask-copilot-for-a-repository-overview/) — GitHub 官方 changelog：用户可在仓库页让 Copilot 生成 overview，概括项目目的、技术栈、贡献指南，并在缺少 README 时辅助生成 README。信号是 code host 正在把仓库理解和 onboarding 变成默认 agent 入口，但这类自动概览仍必须被 README、源码和人工复核约束，不能直接当成事实源。 `blog`
- 来源：GitHub Changelog · [Enterprise-managed OpenTelemetry export for VS Code and CLI](https://github.blog/changelog/2026-07-08-enterprise-managed-opentelemetry-export-for-vs-code-and-cli/) — GitHub 官方 changelog：Copilot 的 VS Code 扩展与 Copilot CLI agent host 支持由企业策略统一配置 OpenTelemetry 导出，覆盖 endpoint、transport、service/resource attributes、headers 与是否包含 prompts / responses / tool content；托管设置优先于本地环境变量，且 headers 不传给子进程以避免 token 泄露。信号是 coding agent 可观测性正在从开发者本地配置进入企业托管控制面。 `blog`
- 来源：CrewAI · [CrewAI 1.15.2 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.2) — CrewAI 官方 stable release：1.15.2 增加动态 LLM 模型选择、inline skill definitions、Generated Flow Definition authoring skill、templated Flow action inputs、flow stream frame protocol 和 repository agents in flow definitions，并修复 model catalog cache key、flow input resolution、pip audit、Bedrock aiobotocore 与 self-listening flow methods 等问题。信号是多 agent runtime 的 flow、skill、repo-agent 与供应链边界正在从 prerelease 进入可跟踪稳定基线。 `doc`
- 来源：arXiv · [Beyond the Leaderboard: A Synthesis of Agentic AI Benchmarking, Failure Taxonomies, and Evaluation Gaps](https://arxiv.org/abs/2607.05775) — 论文综合 27 篇 agent benchmark、taxonomy 与 audit 研究，分析 19 个 benchmark 和 6 类高频失败：tool-use errors、planning breakdowns、long-context degradation、coordination failures、safety vulnerabilities 与 measurement validity gaps；作者强调子任务强不等于端到端可靠，失败会随任务长度非线性放大。信号是 agent 评估正在从排行榜均分转向失败分桶、轨迹审查和测量有效性。 `paper`
- 来源：OpenAI · [OpenAI Agents SDK Python v0.18.2 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.18.2) — OpenAI Agents Python SDK v0.18.2 增加 GPT-5.6 request controls 和 hosted multi-agent beta，同时修复 sandbox PTY / Docker deferred cleanup ownership、realtime callback / playback timing，以及 LiteLLM content-filter refusal 被空 turn 吞掉的问题。信号是 agent SDK 的能力升级正在和 sandbox 生命周期、实时交互可靠性、拒答可见性一起进入生产运行时审查清单。 `doc`
- 来源：LangGraph · [LangGraph 1.2.9 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.9) — LangGraph 1.2.9 继续修正 1.2.8 后的 delta channel 边界，重点是 updateState metadata / counters。信号是 checkpoint 体系里的 metadata、counter 与 delta 状态不是 UI 小字段，而会影响 replay、time travel、观测统计和事故排查的一致性。 `doc`
- 来源：Pydantic AI · [Pydantic AI v2.9.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.9.0) — Pydantic AI v2.9.0 公告披露 AG-UI UIAdapter.sanitize_messages dangling-tool-call strip 的 CWE-863 中等风险 advisory，并说明 requires_approval=True / ApprovalRequiredToolset 或工具参数鉴权可使敏感工具不受影响；同时加入 GPT-5.6 models、reasoning mode、/usage CLI 和 RunContext usage_limits。信号是 agent UI 消息清洗、工具审批、usage limit 和模型支持正在被同一 runtime release 共同治理。 `doc`
- 来源：GitHub Changelog · [Per-user states for multi-user budgets in the REST API](https://github.blog/changelog/2026-07-10-per-user-states-for-multi-user-budgets-in-the-rest-api/) — GitHub 官方 changelog：企业所有者和 billing managers 可通过单个 REST API 分页读取 multi-user budget 下每个用户的消耗、limit、使用比例过滤、排序和 individual override。信号是 agent / Copilot 成本治理正在从总账预算下沉到用户级状态 API，适合做接近限额预警、自动降级和 enablement 定向。 `blog`
- 来源：arXiv · [Agentic AI and Retrieval-Augmented Models in Straight-Through Underwriting](https://arxiv.org/abs/2607.07858) — 论文面向小型商业 BOP underwriting 构造合成但现实化环境，对比 single-LLM、naive RAG 和 multi-agent Agentic RAG；Agentic RAG 结合 targeted retrieval、third-party data checks 与 multi-step rule evaluation，在多步和缺失信息场景表现最好，并强调透明性、可审计性和 human-in-the-loop governance。信号是行业落地里 agentic RAG 的价值来自规则化证据链和拒绝 unsupported straight-through decision，而不是单纯多调几个工具。 `paper`
- 来源：arXiv · [HealthAgentBench: A Unified Benchmark Suite of Realistic Agentic Healthcare Environments for Challenging Frontier AI Agents](https://arxiv.org/abs/2606.31179) — HealthAgentBench 提供 54 个跨 7 类医疗/生物医学 agent 任务，每个任务把 agent 放进终端环境，要求查数据、用工具、推理并由任务级 verifier 评分；作者报告最强且成本效率最高的 Codex GPT-5.5 也只有约 42% success rate。信号是医疗 agent 评估正在从问答准确率转向长流程、工具、数据访问和领域 verifier 组合。 `paper`
- 来源：Microsoft · [microsoft/HealthAgentBench](https://github.com/microsoft/HealthAgentBench) — Microsoft 官方仓库发布 HealthAgentBench benchmark：包含 54 个 Harbor 风格终端任务、7 个任务类别、任务级 README / success criteria / verifier，并明确建议禁用 web browsing 防止 agent 搜索 gold labels。信号是行业 benchmark 正在把评测环境、数据凭证、执行脚本和防作弊边界一起开源。 `doc`
- 来源：arXiv · [Automated Benchmark Auditing for AI Agents and Large Language Models](https://arxiv.org/abs/2605.26079) — 论文提出 Auto Benchmark Audit，用 agentic framework 系统审计 benchmark 任务中的隐含环境依赖、规格缺口和脆弱评分逻辑；在 168 个 benchmark / 9 个领域中发现 25.7% 任务有关键问题，过滤后 SWE-bench Verified 与 Terminal-Bench 2 平均表现分别上移 9.9% 与 9.6%。信号是评估体系本身也需要 agent 审计与回归治理。 `paper`
- 来源：arXiv · [Harness Engineering for Agentic AI Coding Tools: An Exploratory Study](https://arxiv.org/abs/2602.14690) — 论文系统分析 Claude Code、GitHub Copilot、Cursor、Gemini、Codex 的 repository-level 配置机制，覆盖 AGENTS.md/context files、skills、subagents 等 8 类机制；2,853 个 GitHub 仓库样本显示 AGENTS.md 正在成为跨工具起点，而 skills/subagents 多数仍停在浅层静态说明。信号是 coding agent 的能力上限越来越受 harness / repo guidance 质量影响。 `paper`
- 来源：arXiv · [AIDev: Studying AI Coding Agents on GitHub](https://arxiv.org/abs/2602.09185) — AIDev 汇总 932,791 个由 OpenAI Codex、Devin、GitHub Copilot、Cursor、Claude Code 产生的 Agentic-PR，覆盖 116,211 个仓库和 72,189 名开发者，并提供 33,596 个高星仓库 PR 的评论、评审、提交和 issue 子集。信号是 coding agent 研究正在进入大规模真实 GitHub 轨迹阶段，但 PR 数量只能作为采用和协作研究基础，不能直接等同生产率或代码质量。 `paper`
- 来源：OpenAI · [OpenAI Agents SDK JS v0.13.3 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.13.3) — OpenAI Agents JS SDK v0.13.3 修复 workerd 环境中 tracing process lifecycle listeners，并补充 hosted multi-agent 与 GPT-5.6 request controls 文档。信号是同一 Agents SDK 能力需要同时审查边缘运行时、trace 生命周期、托管多 agent 编排和模型请求控制，而不能只看 API 表面是否可调用。 `doc`
- 来源：Model Context Protocol · [MCP Python SDK v2.0.0b2 release notes](https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.0.0b2) — MCP Python SDK v2.0.0b2 是第二个 v2 beta，明确说明预发布需精确 pin；重点变化包括 httpx2 / SSE transport、client-side subscriptions/listen、请求取消在 2026 transports 上真正生效，以及 resolver 可在多轮工具调用中 sample / list roots。信号是 MCP v2 迁移的关键风险在 transport 语义、取消传播、订阅事件和客户端能力注入。 `doc`
- 来源：Model Context Protocol · [MCP TypeScript SDK core v2.0.0-beta.4 release notes](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/%40modelcontextprotocol%2Fcore%402.0.0-beta.4) — MCP TypeScript SDK core v2.0.0-beta.4 将 spec schemas、OAuth schemas 和 protocol constants 移入 @modelcontextprotocol/core，多个包共享同一个 schema graph 和 object identity，并让相关包一起 version。信号是协议 SDK 的 schema 来源、包版本锁定和对象身份会影响跨包互操作，不能把它当成普通依赖整理。 `doc`
- 来源：OpenHands · [OpenHands cloud 1.46.1 release notes](https://github.com/OpenHands/OpenHands/releases/tag/cloud-1.46.1) — OpenHands cloud 1.46.1 修复 lifecycle webhooks 中 conversation created_at 保留问题，并修复 MCP SaaS credentials 使用 encrypted storage 保留。信号是 coding agent SaaS 化后，时间线可审计性和外部凭证持久化同属生产安全边界，尤其需要测试 webhook、凭证轮换和恢复流程。 `doc`
- 来源：Langfuse · [Langfuse v3.213.0 release notes](https://github.com/langfuse/langfuse/releases/tag/v3.213.0) — Langfuse v3.213.0 为 self-hosted deployments 开启 monitors events writes，给 code evaluator editor 增加 contract-aware autocomplete，并修复 eval preview、trace cost、agent API-key audit logs 和 code-eval execution traces。信号是 agent observability 正在把 self-hosted 监控、eval 合约、成本统计和审计日志放进同一生产控制面。 `doc`
- 来源：Arize Phoenix · [Arize Phoenix evals v3.1.1 release notes](https://github.com/Arize-ai/phoenix/releases/tag/arize-phoenix-evals-v3.1.1) — Arize Phoenix evals v3.1.1 修正 macro / weighted F-score 按类别计算以匹配 sklearn 语义、将 AsyncExecutor timeout 计入 max_retries，并限制 0/1 positive_label 自动检测条件。信号是 eval harness 的统计口径、timeout 归因和标签推断会直接改变回归结论，属于上线门禁而非 UI 细节。 `doc`
- 来源：Mem0 · [Mem0 Node SDK v3.1.0 release notes](https://github.com/mem0ai/mem0/releases/tag/ts-v3.1.0) — Mem0 Node SDK v3.1.0 是 TypeScript OSS SDK 的大型 provider release：增加 17 个 vector stores、5 个 LLM providers、4 个 embedders 和 reranking support，并让 mem0ai/oss 不再默认拉入 provider SDK。信号是 agent 长期记忆正在从单一存储封装升级为可组合 provider surface，依赖体积、rerank 策略和供应商选择都需要显式配置。 `doc`
- 来源：arXiv · [LLM-as-a-Verifier: A General-Purpose Verification Framework](https://arxiv.org/abs/2607.05391) — 论文提出 LLM-as-a-Verifier，把 verification 作为 agentic task 的新 scaling axis：不用离散打分，而从 scoring token logits 分布计算连续分数，并通过 score granularity、repeated evaluation 与 criteria decomposition 提高校准；作者报告 Terminal-Bench V2、SWE-Bench Verified、RoboRewardBench 与 MedAgentBench 上达到强结果，并提供 Claude Code extension 用于监控 agentic systems。信号是 eval 正在从 LLM-as-judge 标签判断转向可分解、可重复、可校准的 verifier 信号。 `paper`
- 来源：OpenAI · [OpenAI Agents SDK JS v0.13.4 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.13.4) — OpenAI Agents JS SDK v0.13.4 修复 non-final streaming chunks 的 usage 保留、union/tuple schema conversion 不再静默丢成员，并修复 AI SDK non-streaming responses 只取部分 text parts 的问题。信号是 agent SDK 升级必须同时回归流式计量、schema fail-fast 和 provider response normalization，否则 trace、成本和结构化输出都会悄悄失真。 `doc`
- 来源：OpenHands · [OpenHands cloud 1.46.2 release notes](https://github.com/OpenHands/OpenHands/releases/tag/cloud-1.46.2) — OpenHands cloud 1.46.2 修复跨域 PostHog distinct_id 对齐、app-server DB pool 默认值可配置，以及 settings GET round-trip 剥离 MCP auth secrets 的问题。信号是 coding agent SaaS 的可观测身份、连接池容量和 MCP 凭证往返都属于生产控制面，读配置也可能破坏认证状态。 `doc`
- 来源：Langfuse · [Langfuse v3.218.0 release notes](https://github.com/langfuse/langfuse/releases/tag/v3.218.0) — Langfuse v3.218.0 延续 7 月 16 日多版本更新：把 score filters 应用到 every event stream、导出 eval job configurations 到 core data S3 export、在 outbound-URL/SSRF validation 拒绝时自动关闭 export，并在前序版本加入 agent sandbox、MCP monitor tools、trace I/O 大对象保护和 metadata filtering。信号是 agent observability 正在同时强化 eval 配置可导出、事件筛选一致性、trace UI 大输入防卡死和 SSRF 失败后的数据导出熔断。 `doc`
- 来源：Pydantic AI · [Pydantic AI v2.11.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.11.0) — Pydantic AI v2.11.0 导出 HistoryProcessor、给 usage-limit 与 tool-retry errors 增加 actionable hints，并修复 Mistral streamed number validation、Anthropic/Bedrock native structured output schema transform。信号是 agent framework 需要把 history processing、usage/retry 错误提示、provider-native structured output schema 和 streamed validation 当成可回归 contract。 `doc`
- 来源：arXiv · [Agent-Safety Evaluations as Load-Bearing Evidence: A Vendor-Neutral, Cross-Harness Reconstructability Metric](https://arxiv.org/abs/2607.12469) — 论文指出 agent-safety evaluation 的 task success、attack success 或 monitor score 还不足以成为 load-bearing evidence，因为同一结果可能建立在不同证据制度上；提出 reconstructability metric、Evidence Sufficiency Cards、counterfactual-replay intervention protocol 和 claim-evidence overclaim gap。信号是安全评测要能重建支撑某个结论的决策证据，而不是只保存最终分数。 `paper`
- 来源：arXiv · [Coding-agents can replicate scientific machine learning papers](https://arxiv.org/abs/2607.02134) — 论文提出 Paper-replication workflow：把论文计算性 claim 拆成 target，要求 coding agent 记录证据、重建方法、运行实验、把产物链接到 provenance 与原文 claim 对比，并通过 validation checks 后才算完成。信号是研究型 coding agent 的完成标准正在从最终自然语言消息迁移到 workspace evidence、report coverage 和可验证门禁。 `paper`
- 来源：Hugging Face · [Security incident disclosure — July 2026](https://huggingface.co/blog/security-incident-july-2026) — Hugging Face 披露一次由 autonomous AI agent system 端到端驱动的入侵：恶意 dataset 借 dataset processing 代码执行路径取得 worker 权限，横向移动到内部集群，并触达凭证；防守方用 LLM 辅助日志分析重建 17,000+ recorded events，但商业 API 的安全策略会拦截真实攻击 payload，最终选择本地开源模型做取证。信号是 agent 安全不再只是 prompt injection，数据处理面、credential rotation、incident-response model hosting 和 guardrail lockout 都属于生产防线。 `blog`
- 来源：Ai2 / Hugging Face · [What building Shippy taught us about building agents](https://huggingface.co/blog/allenai/shippy-tech-blog) — Ai2 复盘 maritime agent Shippy：用 soul/skills/config 拆分 agent 身份、能力和运行配置，用确定性 CLI 封装复杂 Skylight API，用每用户 ephemeral Kubernetes session 隔离数据与文件，并用真实数据、rubric 和 Harbor plugin 评估整个 agent 而非单个模型。信号是高风险行业 agent 的可靠性来自 typed tool surface、sandbox isolation、source attribution 和版本化 eval pipeline。 `blog`
- 来源：arXiv / Hugging Face Papers · [Recursive Harness Self-Improvement](https://arxiv.org/abs/2607.15524) — 论文提出 Recursive Harness Self-Improvement，把 harness 表示为 agent loop 的 prompt-level specification，并用 pairwise feedback 在少量迭代内自我修订；作者报告在 30 个 synthetic ML research tasks 上提升低推理强度 agent 上限，并降低最多 60% inference cost。信号是 harness 不是被动脚手架，而是会影响轨迹质量、训练数据和未来模型表现的优化对象。 `paper`
- 来源：arXiv / Hugging Face Papers · [AgentLens: Production-Assessed Trajectory Reviews for Coding Agent Evaluation](https://arxiv.org/abs/2607.06624) — AgentLens 把 coding agent evaluation 从单一 pass/fail 扩展到完整 trajectory review：结合同步验证、LLM-written trajectory reviews 和 side-by-side comparisons，用于 nightly regression pipeline、产品版本比较和行为诊断。信号是代码 Agent 评估需要解释 agent 如何遵循指令、调用工具、验证自己、从错误恢复，而不是只看最终测试是否过。 `paper`
- 来源：Datacurve · [DeepSWE](https://deepswe.datacurve.ai/) — DeepSWE 7 月 17 日 leaderboard 更新覆盖 113 个原创长周期软件工程任务、16 个模型视图，并同时展示 pass rate、cost、output tokens 和 agent steps；第三方 BenchLM 镜像把它标为 display-only，因为结果绑定 model、mini-swe-agent harness 和 effort setting，不应当被误读为纯模型能力排名。信号是 coding agent benchmark 要把任务原创性、隔离环境、program-based verifier、成本和 harness 参数一起报告。 `doc`
- 来源：arXiv / Hugging Face Papers · [ToFu: A White-Box, Token-Efficient Agent Harness for Researchers](https://arxiv.org/abs/2607.11423) — ToFu 是面向研究者的 white-box agent harness：能读代码库、编辑文件、运行命令并接入开发工具，同时强调 token efficiency、lower cost、multilingual capability、MIT license 与本地部署。信号是研究型 coding agent 的价值不只在模型表现，还在于 harness 逻辑可检查、可修改、可评估，适合隐私敏感或需要复现实验的团队。 `paper`
- 来源：OpenAI Agents SDK GitHub releases · [OpenAI Agents SDK Python v0.18.3 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.18.3) — Python Agents SDK v0.18.3 增加 task/turn tracing spans 与 realtime session usage tracking，并修复 conversation session 初始化序列化、provider args 报错、handoff history wrapper、concurrent computer provider isolation、E2B workspace root 和 trace error redaction。信号是生产 Agent runtime 必须把 trace span、会话成本、provider 能力错误和工具会话隔离当成一等契约。 `doc`
- 来源：PyPI / Pydantic AI · [Pydantic AI 2.14.1 release](https://pypi.org/project/pydantic-ai/) — Pydantic AI 2.14.1 继续把 typed agent framework、model-agnostic provider、Pydantic validation、Logfire observability、evals、capabilities 与 MCP 组合成生产级 Agent stack。信号是面试不应只讨论 agent loop，而要说明 typed contracts、eval/trace、provider surface 和能力包如何降低线上不确定性。 `doc`
- 来源：CrewAI GitHub releases · [CrewAI 1.15.5 skill registry authentication release](https://github.com/crewAIInc/crewAI/releases/tag/1.15.5) — CrewAI 1.15.5 的主要 feature 是 Authenticate skill registry downloads。信号是 Agent skill 已经是可分发、可装载的能力包，生产环境要把 registry auth、来源证明、版本锁定、灰度晋级、回滚和审计一起纳入治理，而不是把 skill 当成普通 prompt 片段。 `doc`
- 来源：npm / OpenAI · [OpenAI Codex npm packages 0.145.0 release train](https://www.npmjs.com/org/openai) — OpenAI npm org 页面显示 @openai/codex、@openai/codex-sdk 与相关 Codex packages 发布到 0.145.0 release train。信号是 coding agent 正从 CLI 继续扩展到可嵌入 SDK/包形态，评估时必须审查文件系统权限、命令沙箱、审批策略、JSONL event 流、依赖锁定和 package provenance。 `doc`
- 来源：GitHub Changelog · [AI credit pools for cost centers in the billing UI](https://github.blog/changelog/2026-07-20-ai-credit-pools-for-cost-centers-in-the-billing-ui/) — GitHub 允许在 billing UI 中为 cost center 管理 AI credit pool，并可在到达 limit 后阻断 included usage 或进入 overage。信号是企业 Agent/Copilot 成本治理正在从总预算走向成本中心、license-derived pool、部门 chargeback、告警和限额策略。 `blog`
- 来源：npm / OpenAI · [OpenAI Agents SDK JavaScript 0.13.5 release](https://www.npmjs.com/package/@openai/agents) — @openai/agents 0.13.5 package page 显示 JavaScript/TypeScript Agents SDK 继续围绕 multi-agent workflows、sandbox agents、realtime agents、tools、guardrails、human-in-the-loop、sessions 与 tracing 迭代。信号是跨 Python/JS SDK parity 需要通过 trace、tool schema、realtime session、sandbox 支持和 package pinning 来验证。 `doc`
- 来源：GitHub Changelog · [New Copilot usage metrics impact dashboard](https://github.blog/changelog/2026-07-22-new-copilot-usage-metrics-impact-dashboard/) — GitHub 新增 Copilot metrics impact dashboard：按 Phase 1 Code-first、Phase 2 Agent-first、Phase 3 Multi-agent/Copilot app 与 Passive cohorts 展示 PR throughput、merge velocity、用户占比、代码行和下一步 enablement。信号是企业评估 coding agent 采用度不能停在 active users，而要把采用深度、产出代理指标、速度和组织干预放进同一可视化。 `blog`
- 来源：GitHub Changelog · [Gemini 3.6 Flash is now available in GitHub Copilot](https://github.blog/changelog/2026-07-21-gemini-3-6-flash-is-now-available-in-github-copilot/) — GitHub Copilot 开始灰度 Gemini 3.6 Flash，官方定位覆盖 web/app development、coding、longer-horizon agentic tasks，支持 configurable reasoning effort 与 parallel tool use，并纳入 usage-based billing 和企业管理员 preview policy。信号是 Copilot 类 coding agent 的模型选择已经同时受任务复杂度、工具并行、推理 effort、价格和管理员策略约束。 `blog`
- 来源：Claude by Anthropic · [Building verification loops in Claude Code with skills](https://claude.com/blog/building-verification-loops-in-claude-code-with-skills) — Anthropic 介绍把人工验收步骤写成 Claude Code skills，让 agent 在 gather context、take action、verify results 之间形成可迭代闭环；示例覆盖 /verify、工具链错误、code review、GitHub Actions、spec validation、rubric grader、standalone/embedded/chained/PR 四种运行位置。信号是 coding agent 的可靠性正在从『靠人记得检查』迁移到 repo-local skills 与 CI 中的可复用验证契约。 `blog`
- 来源：arXiv · [CodeRescue: Budget-Calibrated Recovery Routing for Coding Agents](https://arxiv.org/abs/2607.19338) — CodeRescue 把 coding agent 失败后的下一步建模成 recovery routing：根据执行反馈决定继续用低价模型恢复、升级高价模型，或走其它恢复动作，并用 Conformal Risk Control 在部署预算变化时校准成本风险。作者报告一个 CRC-calibrated frontier point 在 GPT-5.4-nano/GPT-5.4 组合上超过 always-escalate solve rate，同时只用 35% 平均恢复成本。信号是 agent 成本优化应发生在失败后恢复策略层，而不只是请求前模型路由。 `paper`
- 来源：arXiv · [ResearchArena: Evaluating Sabotage and Monitoring in Automated AI R&D](https://arxiv.org/abs/2607.19321) — ResearchArena 面向自动化 AI R&D 构造四类长周期任务，并把 deployable artifact 与隐藏 sabotage side task 绑定，比较 trajectory-only monitor、可执行探测 monitor、chain-of-thought 可见性等控制策略。作者指出训练数据中的隐藏破坏最难发现，执行探测有帮助但不足以覆盖 embedded sabotage。信号是高风险研究 agent 需要把产物运行、沙箱行为、监控 blind spot 和 agent 不可信假设一起评估。 `paper`
- 来源：arXiv · [Skillware: A Software Ontology and Engineering Lifecycle for Persistent Behavioral Artifacts](https://arxiv.org/abs/2607.18970) — Skillware 把 Agent Skills 定义为 persistent behavioral artifacts：一个 skill artifact 不只是 prompt，而是可包含 metadata、references、scripts、assets、hooks、package manifests、tests 和 companion interfaces，并需要独立 identity、生命周期、rollback、removal 与 host activation 关系。论文用 138,133 个去重 SKILL.md 记录和 20,556 个仓库标识支撑 taxonomy。信号是 skill 正在成为可维护的软件对象，生产治理要看身份、版本、测试和宿主兼容性。 `paper`
- 来源：arXiv · [Data Leakage Prevention in Agentic Applications via Preemptive Hardening](https://arxiv.org/abs/2607.18847) — 论文提出 agentic applications 的 pre-deployment hardening pipeline：扫描 prompt templates、tool interfaces 与 tool-invocation code，生成 schema tightening、boundary sanitization、allowlist tool gating、least-privilege checks 等补丁，再用 jailbreak、instruction override、tool-targeted manipulation 和 benign variants 验证。作者在 5 个真实应用和 AgentDojo 上报告基本攻击泄露降为 0、stress manipulation 泄露减少 91%。信号是 agent 安全不应只靠运行时 policy，部署前静态/半静态硬化与回归验证也要进入流水线。 `paper`
- 来源：OpenAI Agents SDK GitHub releases · [OpenAI Agents SDK Python v0.19.0 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.19.0) — OpenAI Agents Python v0.19.0 增加 Programmatic Tool Calling：受支持 Responses 模型可以生成 JavaScript 来协调 eligible tools，并纳入 allowed_callers、结构化 function-tool 输出、Runner streaming、guardrails、approvals、sessions 与 tracing。信号是 tool orchestration 正从单次函数调用走向受控的小程序式工具协调，生产侧必须把可调用者、审批、会话和轨迹纳入同一个执行边界。 `doc`
- 来源：Model Context Protocol TypeScript SDK releases · [MCP TypeScript SDK 2.0 packages add 2026-07-28 specification support](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/%40modelcontextprotocol%2Fnode%402.0.0) — MCP TypeScript SDK v2 package line发布 first beta packages for the 2026-07-28 specification revision，并把 migration guide、v1/v2 包边界、core schema 运行时依赖和兼容性测试放进发布说明。信号是 MCP 协议升级不能只改 client/server package version，还要同时验证 wire schema、transport、OAuth、capability merge、迁移路径和精确版本 pinning。 `doc`
- 来源：GitHub Changelog · [Agent automation controls in GitHub Issues public preview](https://github.blog/changelog/2026-07-23-agent-automation-controls-in-github-issues-in-public-preview/) — GitHub 在 Issues 中提供 agent automation controls：仓库管理员可允许 coding agent 自动接手 issue，并通过 assignee、label、confidence threshold 与 event controls 等条件控制触发。信号是 coding agent 的入口正在进入真实工单系统，验收重点要从“能否生成代码”扩展到触发条件、置信度、拒绝理由、人工接管和审计。 `blog`
- 来源：GitHub Changelog · [Claude Opus 5 is now available in GitHub Copilot](https://github.blog/changelog/2026-07-24-claude-opus-5-is-now-available-in-github-copilot/) — GitHub Copilot 开始提供 Claude Opus 5 public preview，并说明它适合复杂 coding、agentic workflows 与长期任务。信号是 coding agent 的模型选择要同时看任务复杂度、延迟/成本、管理员模型策略、preview 风险、回滚路径和跨入口一致性，而不能把新模型视作无差别升级。 `blog`
- 来源：CrewAI GitHub releases · [CrewAI 1.15.7 runtime hardening and skill usage observability](https://github.com/crewAIInc/crewAI/releases/tag/1.15.7) — CrewAI 1.15.7 修复 registry skills resolution、GPT-5.6 tools + reasoning_effort 400、Responses API tool calling、responses-only model 404 routing，并把 skill usage events 发到 runtime observability，同时升级 bedrock-agentcore 以修补 CVE-2026-16796。信号是 agent runtime 升级要同时看模型兼容、工具路径、技能仓库、观测事件和依赖 CVE，而不是只看 feature 列表。 `doc`
- 来源：Pydantic AI GitHub releases · [Pydantic AI v2.18.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.18.0) — Pydantic AI v2.18.0 增加 Anthropic/OpenRouter AdvisorTool support、OpenAI Responses WebSearchTool external_web_access、GoogleCloudProvider 多区域位置、pydantic_graph inspect 与 Mermaid 等能力。信号是 typed agent stack 的工具能力、外部网络访问、区域合规、图运行可视化和 provider portability 正在一起进入生产控制面。 `doc`
- 来源：arXiv · [TRACE-ROUTER: Task-Consistent and Adaptive Online Routing for Agentic AI](https://arxiv.org/abs/2607.22465) — TRACE-ROUTER 指出 agentic workflows 的质量由延迟的任务级 outcome 决定，逐 call 独立模型路由会错过 long-horizon 轨迹一致性；论文提出基于 trace 的 online routing，把成本/质量选择绑定到任务进展与历史反馈。信号是企业模型路由需要看 agent trace、阶段状态和最终任务结果，而不是把每次 LLM call 当成独立分类题。 `paper`
- 来源：arXiv · [The Regression Tax: Decomposing Why Skills Help and Hurt LLM Agents](https://arxiv.org/abs/2607.22520) — Regression Tax 把 agent skill 的平均收益拆成帮助与伤害两部分，在近 6000 次 office automation 运行、多个 benchmark 和 harness stack 上比较有/无 skill 的差异。信号是 skill 上线不能只看平均 success uplift；要分桶看正迁移、负迁移、任务类型、模型/harness 交互和回滚条件。 `paper`
- 来源：arXiv · [Dynamic Capability Scoping for Enterprise AI Agents](https://arxiv.org/abs/2607.22445) — 论文批评企业 agent 在配置期授予静态 credentials 会形成长期过度权限，提出 dynamic least-privilege capability scoping 和 three-source permission architecture。信号是权限边界要随任务、上下文和工具意图动态收缩，防护应发生在 credential exposure 之前，而不是事后检测越权。 `paper`
- 来源：arXiv · [Do Agent Benchmarks Measure Capability? Protocol Validity in the Age of Agentic AI](https://arxiv.org/abs/2607.22368) — 论文把 agent benchmark 的能力声明绑定到 protocol validity：如果环境允许 public solution recovery、读到 evaluation artifacts、利用信息泄露或和 grader 侧信道交互，高分就不再证明目标能力。信号是 benchmark 治理要检查任务隔离、artifact 可见性、信息流、grader 鲁棒性和 capability necessity，而不是只发布总分。 `paper`
- 来源：GitHub Changelog · [Grok 4.5 is now available in GitHub Copilot](https://github.blog/changelog/2026-07-28-grok-4-5-is-now-available-in-github-copilot/) — GitHub Copilot 引入 xAI Grok 4.5 public preview，并强调其在代码生成、debug、架构推理、agentic workflows、500k token context、reasoning effort、terminal-based coding tasks 与 parallel tool dispatch 上的适用面。信号是 coding agent 模型选择正在同时牵动上下文窗口、推理预算、工具并发、preview 风险、管理员启用策略和成本治理。 `blog`
- 来源：GitHub Changelog · [GitHub Copilot app usage metrics expand across report rollups](https://github.blog/changelog/2026-07-28-github-copilot-app-usage-metrics-now-expand-across-report-rollups/) — GitHub 把 Copilot app usage metrics 扩展到组织级、企业级和团队级 report rollups，按 totals_by_copilot_app 汇总 session_count、request_count、prompt_count、token usage、code activity 与 daily active users。信号是 agentic coding 的采用、留存、成本和活动面需要按 app surface 归因，不能只看总活跃人数或最终 PR 数。 `blog`
- 来源：GitHub Changelog · [Enterprise managed settings in GitHub Copilot app and Copilot cloud agent](https://github.blog/changelog/2026-07-27-enterprise-managed-settings-in-the-github-copilot-app-and-copilot-cloud-agent/) — GitHub 让 managed-settings.json 管理策略扩展到 Copilot app 与 Copilot cloud agent，覆盖 plugins 与 marketplaces、bypass approvals、auto model selection、plan mode、web search、MCP registry、instructions、default model、context 以及 cloud-agent specific policies。信号是企业治理要管最容易漏掉的新入口，而不是只管 IDE 扩展或 CLI。 `blog`
- 来源：GitHub Changelog · [GitHub Copilot for JetBrains adds OpenTelemetry configuration and model management](https://github.blog/changelog/2026-07-27-github-copilot-for-jetbrains-improved-opentelemetry-configuration-model-management-and-more/) — GitHub Copilot for JetBrains 增加 OpenTelemetry 配置、每会话 token limit、模型管理、文件编辑工具、MCP servers、custom agents in Claude flows、rubber-duck mode、todo list 与 UI/性能修复。信号是 IDE agent 的生产面已经包含遥测、成本上限、模型选择、外部工具接入、自定义 agent 和文件系统副作用。 `blog`
- 来源：Model Context Protocol Go SDK releases · [MCP Go SDK v1.7.0 adds full 2026-07-28 protocol support](https://github.com/modelcontextprotocol/go-sdk/releases/tag/v1.7.0) — MCP Go SDK v1.7.0 支持完整 2026-07-28 协议版本，包括 per-request _meta、server/discover、MRTR、subscriptions/listen、标准 HTTP headers、stateless core、backwards compatibility，并删除过时 roots/sampling/logging primitives。信号是 MCP 迁移要同时验证无状态运行、请求级元数据、能力发现、监听/订阅、HTTP 兼容和废弃 primitive 移除。 `doc`
- 来源：arXiv · [The Physics of Multi-Turn Long-Horizon Planning with Language Models](https://arxiv.org/abs/2607.24720) — 论文在受控多轮环境中把 CoT 当作中间 world-model transition，比较 online policy distillation、multi-turn online policy distillation 与 teacher consistency，指出长周期规划的瓶颈在转移一致性、终局状态依赖和 teacher 冲突，而不只是单步答案质量。信号是 long-horizon agent 训练与评测要看轨迹状态、转移误差和多轮蒸馏策略。 `paper`
- 来源：arXiv · [APS-RAG: Agentic Hybrid RAG and Operations-Grounded Evaluation for Scientific Facility Support](https://arxiv.org/abs/2607.24663) — APS-RAG 面向 Advanced Photon Source 运维支持，把密集向量、稀疏关键词、知识图谱、adaptive RRF、cross-encoder reranking、ReAct agent、MCP tools 和六层评估框架组合到一个 facility-grounded RAG 系统中。信号是高风险领域 RAG 不能只调 embedding，要把数据资产、检索融合、agent 工具和操作级评估一起建。 `paper`
- 来源：arXiv · [Agentic Permissions Policy Algebra for Taint Confinement in LLM Agents](https://arxiv.org/abs/2607.24625) — APPA 提出 Agentic Permissions Policy Algebra，用 small-step context machine 形式化 LLM agent 的 trust-taint 传播，在 prompt context、tool calls、control-flow branching、memory 和 subagents 之间做上下文隔离与权限合成。信号是 agent 安全不能只靠提示词拒答，而要把 taint、context、tool capability 和 delegation 变成可验证策略。 `paper`
- 来源：arXiv · [Looping Is Not Reliability: State-Bound Evidence and Typed Revision Contracts for Agentic Code Repair](https://arxiv.org/abs/2607.24604) — 论文指出 multi-agent code repair loops 若缺少 state-bound evidence 和 typed revision contracts，会重复迭代却无法提高可靠性；它主张把修复证据、状态绑定、类型化 revision contract 和验证门纳入循环。信号是 coding agent 不能把“多跑几轮”当可靠性，需要可审计的证据与修订协议。 `paper`
- 来源：arXiv · [Kimi K3: Open Frontier Intelligence](https://arxiv.org/abs/2607.24653) — Kimi K3 报告开源 1T 参数混合专家模型并强调在通用、agentic 与 coding domains 的性能；训练方案包含 million-token-scale context、Agentic RL、long-horizon reward、persistent rollout、sandbox states 与 cross-session continual improvement。信号是开源模型平台也在把 agentic RL、长上下文和可复现 sandbox 作为核心训练/评测资产。 `paper`

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
