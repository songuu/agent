# Agent 学习指南与分类地图

> 这页把仓库里的课程、专题和毕业项目重新按学习目标分类。你可以按顺序学习，也可以按要做的 agent 类型倒推该补哪些能力。

## 适合怎么用

| 你现在的目标 | 先看 | 然后看 | 产出 |
|--------------|------|--------|------|
| 刚入门 agent | [基础概念扩展专题](../agent-basics/) | [第 04 章 Agent 循环](../lessons/04-the-agent-loop/) | 能解释 LLM、messages、tool、memory 的边界 |
| 想做一个工具型 agent | [B6 Tool calling](../agent-basics/06-tool-calling-mental-model.md) | [第 05/06 章工具系统](../lessons/06-building-a-tool-system/) | 一个有 schema、校验、错误回传的工具注册表 |
| 想做知识库 / Copilot | [B8 Memory/RAG/Context](../agent-basics/08-memory-rag-context.md) | [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/) | 一条可评估、可拒答、可引用的 RAG 管线 |
| 想做多 agent 协作 | [B7 Workflow vs Agent](../agent-basics/07-workflow-vs-agent.md) | [第 11 章](../lessons/11-multi-agent-orchestration/) + [LangGraph 专题](../langgraph-advanced/) | supervisor/worker 拆分与失败处理协议 |
| 想读框架源码 | [第 12 章上框架](../lessons/12-intro-to-frameworks/) | [第 21 章 · 源码解析](../source-analysis/) | 能沿入口函数读懂 LangChain / LangGraph / LlamaIndex runtime |
| 想上线生产 | [B10 Guardrails](../agent-basics/10-guardrails-intro.md) + [B11 Evaluation](../agent-basics/11-evaluation-first.md) | [第 15-18 章](../lessons/15-evaluation-and-testing/) | 评估门、权限边界、成本与部署清单 |
| 想做作品集 | [毕业项目总览](./curriculum.md#-毕业项目8-个综合实战可直接放进作品集) | 任选 capstone | 可演示的端到端项目 |

## 分类 1: 按学习阶段

| 阶段 | 核心问题 | 对应内容 | 完成标准 |
|------|----------|----------|----------|
| A. 模型接口 | LLM 到底会什么、不会什么 | B1-B4、01-03 | 能解释 hallucination、role、context、token、sampling |
| B. Agent 最小闭环 | agent 如何从一次调用变成循环 | 04-07 | 能手写 Thought / Action / Observation 循环 |
| C. 工具与权限 | 模型如何调用真实世界能力 | B5-B6、05-06、17 | 能把 tool schema、校验、确认和错误回传串起来 |
| D. 知识与记忆 | agent 如何用外部知识和长期状态 | B8、08-09、rag-advanced | 能区分聊天历史、长期记忆、RAG、上下文打包 |
| E. 编排与框架 | 复杂流程如何拆成可维护图 | B7、10-12、langgraph-advanced | 能说明 workflow、agent、graph、runtime 的取舍 |
| F. 质量与生产 | 怎么知道 agent 没退化、可上线 | B9-B11、13-18 | 有 eval、guardrail、observability、deploy checklist |
| G. 前沿与选型 | 当前生态各层解决什么问题 | B12、source-analysis、19-20 | 能按需求选择 SDK、协议、runtime、数据层，并能读源码验证框架边界 |

## 分类 2: 按 Agent 类型

| Agent 类型 | 典型任务 | 必修能力 | 关键风险 |
|------------|----------|----------|----------|
| Chat Assistant | 问答、解释、改写 | messages、instruction、sampling、streaming | 把模型当事实库、无引用输出 |
| Tool Agent | 查天气、查数据库、发请求、执行脚本 | tool schema、参数校验、错误回传、权限确认 | 模型请求不等于可以执行 |
| Workflow Agent | 固定流程中插入模型判断 | routing、structured output、fallback | 过度自治导致成本和不稳定上升 |
| Research Agent | 搜索、阅读、综合、引用 | planning、RAG、citation、eval | 引用漂移、低质量来源混入上下文 |
| Knowledge Copilot | 企业资料问答、工单辅助 | ingestion、ACL、hybrid search、context builder | 权限泄露、过时知识、检索注入 |
| Multi-agent Team | 多角色并行分析、评审、协作 | supervisor、worker、handoff、merge policy | 角色重叠、无仲裁、并行结果不可合并 |
| Coding Agent | 读仓库、改代码、跑测试、发 PR | repository guidance、tool safety、test gate | 找错文件、破坏用户改动、用测试代理完成目标 |
| Monitoring Agent | 定时巡检、告警解释、触发后续动作 | scheduling、observability、incident policy；对应 capstone/incident-responder | 误报/漏报、权限过大、无审计日志 |

## 分类 3: 按工程能力拆解

### 1. 输入与指令层

- 明确 system / developer / user 的职责边界。
- 把输出格式写成可测试契约，而不是自然语言愿望。
- 为不可满足请求定义拒答或降级路径。
- 把示例当接口测试，覆盖正常、边界、失败三类输入。

### 2. 控制流层

- 能用固定 workflow 就先用 workflow。
- 只有任务需要模型自己选择下一步时，才引入 agent autonomy。
- 每个循环必须有停止条件、预算上限、可观测事件。
- planner 输出必须被校验，不直接当执行计划。

### 3. 工具层

- schema 是模型和代码之间的 ABI。
- 所有工具参数都按不可信输入处理。
- 副作用工具需要权限、确认、幂等和回滚策略。
- 工具错误要变成模型可理解的 observation，而不是吞掉。

### 4. 知识层

- 聊天历史解决短期连续性，不解决事实更新。
- 长期记忆解决用户偏好和历史状态，不等于知识库。
- RAG 解决外部知识 grounding，但检索内容仍是不可信输入。
- context builder 负责排序、去重、压缩和引用保真。

### 5. 质量层

- eval 集先覆盖高价值失败，而不是追求数量。
- 结构化输出要测 parse、validate、repair、fallback。
- RAG 要分别测召回、忠实度、引用、拒答。
- agent loop 要测步数、预算、工具错误、自我纠错。

### 6. 生产层

- trace 必须串起 prompt、tool call、retrieval、cost、latency。
- guardrails 分输入、检索、工具、输出、人审多层。
- 部署前先定义 rollback、rate limit、timeout、日志保留。
- 生产事故复盘要回流到 eval 和 guardrail，而不只改 prompt。

## 角色学习路线

### 后端工程师路线

1. B1-B6: 模型接口、messages、token、tool calling。
2. 04-06: 手写 agent loop 和工具系统。
3. 13、15、16、18: 结构化输出、测试、观测、部署。
4. capstone/code-review-crew 或 capstone/agent-eval-harness。

### 前端 / 产品工程师路线

1. B1-B5: 理解模型行为和输出契约。
2. 14: 流式 UX、取消、步骤事件。
3. 17: 人工确认和危险操作边界。
4. support-copilot: 用完整交互闭环理解 agent 产品形态。
5. feedback-intelligence: 用真实反馈流练主题聚类、加权和 roadmap 输出。

### RAG / 知识库路线

1. B8: 区分 memory、RAG、context。
2. 08-09: 从零写 embedding、retrieval、citation。
3. rag-advanced R1-R11: 生产化检索链路。
4. enterprise-knowledge-base-agent + rag-system-project。

### 多 Agent / 编排路线

1. B7: workflow vs agent。
2. 10-11: reasoning pattern 和 multi-agent orchestration。
3. langgraph-advanced L1-L5。
4. code-review-crew: 多角色评审和合并策略。
5. sales-lead-researcher: 用 B2B 线索研究练证据链、评分和受约束话术。

### 框架源码路线

1. 12: 先理解 LangGraph.js / Vercel AI SDK 帮你托管了哪些运行时能力。
2. langgraph-advanced L1-L5: 先用可运行小例子看 StateGraph、checkpoint、HITL、多 agent。
3. source-analysis: 先用仓库矩阵解析器定位任意 GitHub 仓库，再用源码对话检索源码行号证据，再用 CodeMap 对照文件职责，最后顺着官方源码入口读 LangChain、LangGraph、LlamaIndex。
4. 19-20: 回到生态地图和前沿文章库，用源码视角判断框架边界和选型风险。

### 生产负责人路线

1. B9-B11: structured output、guardrails、evaluation。
2. 15-18: 评估、观测、成本、安全、部署。
3. agent-eval-harness: 回归门。
4. docs/enterprise-knowledge-base-agent.md: 纵向系统验收清单。
5. incident-responder: 用故障处理练审批边界、客户话术和 postmortem 回流。

## 选型决策表

| 问题 | 优先选 | 何时升级 |
|------|--------|----------|
| 只是固定步骤中需要一次模型判断 | workflow | 步骤需要动态选择、重试、分支时升级 agent |
| 只需要当前对话连续性 | short-term memory | 需要跨会话偏好和事实时拆长期记忆或 RAG |
| 只查少量内部文本 | 简单向量检索 | 召回不稳时升级 hybrid search、rerank、contextual retrieval |
| 只要稳定 JSON | structured output + schema | 业务关键时加 retry-repair、fallback、human review |
| 只是 demo | console trace + smoke test | 上线前加 eval、成本、权限、审计、回滚 |

## 自检清单

- 我能说出这个 agent 哪些步骤是固定流程，哪些步骤让模型自主决策。
- 我能指出每个工具的权限边界、参数校验和失败回传。
- 我能解释上下文里哪些信息可信，哪些来自不可信检索或用户输入。
- 我有最小 eval 集验证关键失败模式。
- 我知道上线后如何追踪一次错误回答从 prompt 到工具到检索的路径。

## 下一步

从 [基础概念扩展专题](../agent-basics/) 进入 B1-B12。每篇按“概念边界 → 工程拆解 → 常见误区 → 自检练习”组织，读完再回到主线第 04 章会更顺。学完第 12 章后，再走 [源码解析](../source-analysis/)：先用热门库卡片快速进入真实仓库，再把 LangChain / LangGraph / LlamaIndex 的框架黑盒打开。
