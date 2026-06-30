# 全局课程导航

> 用法：从任意章节点回这里，再直接跳到目标课程。第一次学习建议按顺序走；复习、查漏、项目实践时可以按主题跳转。

## 快速入口

| 入口 | 适合什么时候用 | 链接 |
|------|----------------|------|
| 完整大纲 | 想看课程目标、时长、章节简介 | [课程大纲](./curriculum.md) |
| 知识图谱 | 想看概念之间的依赖和延伸阅读 | [全局知识图谱](./knowledge-graph.md) |
| 环境搭建 | 还没装依赖、没配 key、例子跑不起来 | [第 00 章 · 环境搭建](./setup.md) |
| 基础概念扩展 | 01-03 学完后，想补 messages、token、tool calling、workflow vs agent 等底层词汇 | [基础概念扩展专题](../agent-basics/README.md) |
| Agent 学习指南 | 想按 agent 类型、岗位目标或生产能力倒推学习路线 | [Agent 学习指南与分类地图](./agent-learning-guides.md) |
| 源码解析 | 想从调用框架升级到读懂 LangChain / LangGraph / LlamaIndex 源码 | [第 21 章 · 源码解析](../source-analysis/README.md) |
| 前沿文章库 | 想按日期、体系层浏览 agent 前沿资料和原文入口 | [第 20 章 · Agent 前沿文章库](../lessons/20-agent-frontier-news/README.md) |
| 毕业项目 | 想把前面能力组装成完整作品 | [毕业项目总览（28 个）](../capstone/README.md) · [Deep Research Agent](../capstone/deep-research-agent/README.md) · [客服 Copilot](../capstone/support-copilot/README.md) · [代码评审团](../capstone/code-review-crew/README.md) · [Agent 评测与回归门](../capstone/agent-eval-harness/README.md) · [告警响应](../capstone/incident-responder/README.md) · [反馈洞察](../capstone/feedback-intelligence/README.md) · [销售线索研究](../capstone/sales-lead-researcher/README.md) · [企业知识库 Agent](../capstone/enterprise-knowledge-base-agent/README.md) |
| 进阶 RAG 专题 | 想把最小 RAG 补成生产级（分块/混合/精排/改写/评估/生产化） | [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/README.md) |
| 进阶 LangGraph 专题 | 想把第 12 章的框架入门补成状态图、持久化、HITL、多 agent 与生产化路线 | [进阶 LangGraph 专题](../langgraph-advanced/README.md) |
| RAG 完整架构 | 想把 RAG 从 demo 设计成可维护系统 | [RAG 完整架构蓝图](./rag-architecture.md) |
| 企业知识库 Agent | 想把 RAG、记忆、工具、流式 UX、评估和部署串成一个企业级作品集 | [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md) · [企业知识库 Agent Capstone](../capstone/enterprise-knowledge-base-agent/README.md) |
| RAG 实战项目 | 想从课程最小 RAG 走向生产级知识库系统 | [仓库内 checkpoint](../capstone/rag-system/README.md) · [songuu/rag-system 连接指南](./rag-system-project.md) |

## 按顺序学习

| # | 阶段 | 课程 | 核心能力 |
|---|------|------|----------|
| 00 | 环境搭建 | [环境搭建](./setup.md) | Node / pnpm / API key / 第一次运行 |
| 01 | 基础概念 | [什么是 Agent](../lessons/01-what-is-an-agent/README.md) | LLM vs Agent、循环心智模型 |
| 02 | 基础概念 | [第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | provider 无关客户端、chat、stream、token |
| 03 | 基础概念 | [提示工程](../lessons/03-prompt-engineering/README.md) | system prompt、few-shot、CoT、temperature |
| B1-B12 | 基础概念扩展 | [基础概念扩章地图](../agent-basics/README.md) | 12 篇详细指南：messages、roles、context、sampling、tool calling、workflow vs agent、guardrails、evaluation |
| 04 | 从零手写核心 | [手写 Agent 循环](../lessons/04-the-agent-loop/README.md) | Thought / Action / Observation、ReAct loop |
| 05 | 从零手写核心 | [工具调用基础](../lessons/05-tool-use-basics/README.md) | function calling、tool request、tool result |
| 06 | 从零手写核心 | [从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | zod schema、ToolRegistry、安全执行 |
| 07 | 从零手写核心 | [短期记忆与上下文](../lessons/07-short-term-memory/README.md) | 历史窗口、摘要压缩、token budget |
| 08 | 知识与检索 | [Embedding 与向量检索](../lessons/08-embeddings-and-vector-search/README.md) | embedding、余弦相似度、top-k 检索 |
| 09 | 知识与检索 | [从零实现 RAG](../lessons/09-rag-from-scratch/README.md) | chunk、retrieve、augment、citation |
| 10 | 进阶模式 | [推理范式](../lessons/10-reasoning-patterns/README.md) | ReAct、Plan-Execute、Reflection |
| 11 | 进阶模式 | [多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | supervisor、worker、协作协议 |
| 12 | 工程化与框架 | [上框架](../lessons/12-intro-to-frameworks/README.md) | LangGraph.js、Vercel AI SDK、迁移边界 |
| 13 | 工程化与框架 | [结构化输出与校验](../lessons/13-structured-output/README.md) | JSON、zod、retry-repair、schema contract |
| 14 | 工程化与框架 | [流式输出与 UX](../lessons/14-streaming-and-ux/README.md) | streaming、事件流、取消、进度反馈 |
| 15 | 生产化 | [评估与测试](../lessons/15-evaluation-and-testing/README.md) | eval dataset、LLM-as-judge、回归测试 |
| 16 | 生产化 | [可观测性与成本](../lessons/16-observability-and-cost/README.md) | trace、token cost、latency、预算告警 |
| 17 | 生产化 | [安全与护栏](../lessons/17-safety-and-guardrails/README.md) | prompt injection、防护分层、人工确认 |
| 18 | 生产化 | [部署：变成服务](../lessons/18-deployment/README.md) | HTTP API、SSE、timeout、并发、部署清单 |
| 19 | 前沿与生态 | [Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | MCP、A2A、Agents SDK、生态选型 |
| 20 | 前沿与生态 | [Agent 前沿文章库](../lessons/20-agent-frontier-news/README.md) | 日期筛选、体系层列表、文章卡片、原文追踪 |
| 21 | 源码解析 | [源码解析](../source-analysis/README.md) | 从入口函数、runtime、状态/工具/检索和停止条件读懂框架实现 |
| 🎓 | 综合实战 | [Deep Research Agent](../capstone/deep-research-agent/README.md) | 工具、RAG、多智能体、评估、护栏端到端整合 |
| 🎓 | 综合实战 | [客服 Copilot](../capstone/support-copilot/README.md) | 记忆、RAG、工具、HITL 审批、注入/PII 安全、成本可观测的纵深防御管线（离线可跑） |
| 🎓 | 综合实战 | [代码评审团](../capstone/code-review-crew/README.md) | 多智能体并行评审、结构化发现、严重度排序、critical 即 BLOCK 的评审门（离线可跑） |
| 🎓 | 综合实战 | [Agent 评测与回归门](../capstone/agent-eval-harness/README.md) | golden 测试集、离线裁判、通过率/拒答准确率/成本指标、CI 回归门（离线可跑） |
| 🎓 | 运维实战 | [告警响应 Agent](../capstone/incident-responder/README.md) | 告警分级、runbook 匹配、审批分层、客户话术与 postmortem（离线可跑） |
| 🎓 | 产品实战 | [用户反馈洞察 Agent](../capstone/feedback-intelligence/README.md) | 多渠道反馈安全清洗、主题聚类、价值加权、roadmap ticket（离线可跑） |
| 🎓 | 增长实战 | [销售线索研究 Agent](../capstone/sales-lead-researcher/README.md) | ICP 评分、业务信号证据链、合规风险、销售下一步动作（离线可跑） |
| 🎓 | 纵向全栈实战 | [企业知识库 Agent](../capstone/enterprise-knowledge-base-agent/README.md) | ingestion、ACL、Agentic RAG、事件流、trace/eval、定时知识巡检 |
| 🎓 | 项目总览 | [毕业项目总览（28 个）](../capstone/README.md) | 8 个既有综合项目 + 20 个新增实践项目，按领域选择作品集题目 |
| 🎓 | 协作效率实战 | [会议行动项 Agent](../capstone/meeting-action-agent/README.md) | 一个可离线演示的 meeting-to-action 工作流，能输出行动项、风险、跟进提醒和复盘摘要。 |
| 🎓 | 法务协作实战 | [合同风险审阅 Agent](../capstone/contract-risk-reviewer/README.md) | 一个合同条款审阅工作流，输出风险等级、证据条款、建议改写和需法务确认的问题。 |
| 🎓 | 数据平台实战 | [数据质量哨兵 Agent](../capstone/data-quality-sentinel/README.md) | 一个数据质量巡检工作流，输出异常、影响报表、可能根因、回滚建议和通知摘要。 |
| 🎓 | HR 与团队运营实战 | [新员工入职教练 Agent](../capstone/onboarding-coach-agent/README.md) | 一个入职教练工作流，输出学习路径、任务节奏、导师检查点和风险提醒。 |
| 🎓 | 售前方案实战 | [RFP 方案标书 Agent](../capstone/rfp-proposal-writer/README.md) | 一个 RFP 响应工作流，输出需求映射、差距清单、方案大纲、风险和评审 checklist。 |
| 🎓 | 医疗运营实战 | [临床问诊分流助手 Agent](../capstone/clinical-intake-assistant/README.md) | 一个高安全边界的医疗 intake 工作流，输出症状摘要、紧急信号、缺失信息和人工分流建议。 |
| 🎓 | 企业法务实战 | [法务证据发现 Agent](../capstone/legal-discovery-assistant/README.md) | 一个 e-discovery 工作流，输出证据候选、相关性理由、时间线和 privilege/敏感标记。 |
| 🎓 | 财务运营实战 | [财务月结助手 Agent](../capstone/finance-close-assistant/README.md) | 一个月结巡检工作流，输出差异列表、解释候选、责任人、截止日期和审计包。 |
| 🎓 | 安全运营实战 | [安全告警分诊 Agent](../capstone/security-triage-analyst/README.md) | 一个安全分诊工作流，输出严重度、攻击链阶段、证据、误报理由、containment 建议和升级队列。 |
| 🎓 | 合规治理实战 | [合规政策监控 Agent](../capstone/compliance-policy-monitor/README.md) | 一个合规变更影响分析工作流，输出政策差异、影响流程、owner、deadline 和审计说明。 |
| 🎓 | 研发效率实战 | [开发者入仓引导 Agent](../capstone/developer-onboarding-guide/README.md) | 一个 repo onboarding 工作流，输出环境检查、关键目录、首个任务、代码阅读路径和风险提醒。 |
| 🎓 | 质量工程实战 | [测试用例生成 Agent](../capstone/test-case-synthesizer/README.md) | 一个测试设计工作流，输出覆盖矩阵、测试数据、优先级、自动化候选和缺口。 |
| 🎓 | 客户成功实战 | [客户成功续约 Agent](../capstone/customer-success-renewal/README.md) | 一个续约健康工作流，输出风险分层、证据、推荐动作、QBR 议程和 follow-up。 |
| 🎓 | 电商运营实战 | [电商选品运营 Agent](../capstone/ecommerce-merchandising-planner/README.md) | 一个 merchandising 工作流，输出商品分层、库存风险、内容缺口、活动建议和监控指标。 |
| 🎓 | 教育科技实战 | [自适应学习教练 Agent](../capstone/adaptive-learning-tutor/README.md) | 一个学习教练工作流，输出知识点掌握度、下一题推荐、讲解计划和家长/导师摘要。 |
| 🎓 | 招聘运营实战 | [招聘初筛 Agent](../capstone/recruiting-screener/README.md) | 一个招聘初筛工作流，输出岗位匹配证据、缺口、面试问题和人工复核队列。 |
| 🎓 | 科研管理实战 | [科研基金申请 Agent](../capstone/grant-proposal-planner/README.md) | 一个基金申请规划工作流，输出指南匹配、创新点、任务分工、预算风险和提交日程。 |
| 🎓 | 供应链管理实战 | [供应链风险雷达 Agent](../capstone/supply-chain-risk-radar/README.md) | 一个供应链风险工作流，输出风险评分、影响 SKU、替代供应商、行动建议和监控节奏。 |
| 🎓 | 服务交付实战 | [现场服务调度 Agent](../capstone/field-service-dispatch/README.md) | 一个派单调度工作流，输出工单优先级、技师匹配、备件检查、路线建议和 SLA 风险。 |
| 🎓 | 隐私合规实战 | [隐私数据请求 Agent](../capstone/privacy-dsr-automation/README.md) | 一个隐私请求处理工作流，输出请求分类、身份验证缺口、系统清单、导出/删除计划和审计记录。 |
| 🧭 | 架构蓝图 | [RAG 完整架构蓝图](./rag-architecture.md) | ingestion、query、eval、governance、deployment 系统边界 |
| 🏢 | 纵向蓝图 | [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md) | RAG、记忆、Agent runtime、事件流、定时任务、部署里程碑 |
| 📚 | 进阶项目 | [RAG System Checkpoint](../capstone/rag-system/README.md) → [RAG 系统实战项目](./rag-system-project.md) | 仓库内验收最小 RAG 系统闭环，再连接 `songuu/rag-system` |

## 进阶 RAG 专题（rag-advanced）

> 第 08/09 章打地基后的生产级深化。十一章各自可运行；第 R1 章为纯函数 demo，免 API key 即可跑。

| # | 专题 | 链接 | 核心能力 |
|---|------|------|----------|
| R1 | 进阶分块策略 | [01-chunking-strategies](../rag-advanced/01-chunking-strategies/README.md) | 递归语义切分、Markdown 标题感知、按 token 控大小 |
| R2 | 混合检索 | [02-hybrid-search](../rag-advanced/02-hybrid-search/README.md) | 向量 + BM25 + RRF 融合 |
| R3 | 召回-精排 | [03-reranking](../rag-advanced/03-reranking/README.md) | 两段式检索、LLM 重排、信噪比 |
| R4 | 查询改写 | [04-query-transformation](../rag-advanced/04-query-transformation/README.md) | multi-query、HyDE |
| R5 | RAG 评估 | [05-rag-evaluation](../rag-advanced/05-rag-evaluation/README.md) | 上下文相关性 / 忠实度 / 答案相关性 |
| R6 | 生产化 RAG | [06-production-rag](../rag-advanced/06-production-rag/README.md) | metadata 过滤、持久化、增量、全链路 |
| R7 | Contextual Retrieval | [07-contextual-retrieval](../rag-advanced/07-contextual-retrieval/README.md) | 文档/章节上下文前缀、孤立 chunk 召回修复 |
| R8 | Agentic RAG | [08-agentic-rag](../rag-advanced/08-agentic-rag/README.md) | gated retrieve、证据打分、改写重试、拒答 |
| R9 | RAG 安全护栏 | [09-rag-security](../rag-advanced/09-rag-security/README.md) | 注入检测、PII 脱敏、引用核验 |
| R10 | 向量索引内部机制 | [10-index-internals](../rag-advanced/10-index-internals/README.md) | 暴力精确检索、IVF/ANN、recall@k 权衡 |
| R11 | 上下文工程 | [11-context-engineering](../rag-advanced/11-context-engineering/README.md) | 去重、压缩、预算打包、lost-in-the-middle 重排 |

## 进阶 LangGraph 专题（langgraph-advanced）

> 第 12 章打地基后的状态图深化。已完成 L1-L5；生产化扩章 L6-L11 先收集在专题首页，待逐章补齐六件套后再进入知识图谱。

| # | 专题 | 链接 | 核心能力 |
|---|------|------|----------|
| L1 | 手写 StateGraph | [01-stategraph-basics](../langgraph-advanced/01-stategraph-basics/README.md) | State / reducer / node / edge / compile / invoke |
| L2 | 条件边与路由 | [02-conditional-routing](../langgraph-advanced/02-conditional-routing/README.md) | 分支、循环、`recursionLimit`、`Send` 扇出 |
| L3 | Checkpointer 持久化与时间旅行 | [03-checkpointing](../langgraph-advanced/03-checkpointing/README.md) | thread、checkpoint、history、time travel |
| L4 | Human-in-the-Loop | [04-human-in-the-loop](../langgraph-advanced/04-human-in-the-loop/README.md) | `interrupt`、payload、`Command(resume)` |
| L5 | 多 Agent 编排 | [05-multi-agent-graph](../langgraph-advanced/05-multi-agent-graph/README.md) | supervisor、worker routing、parallel team |
| L6-L11 | 生产化扩章地图 | [专题首页](../langgraph-advanced/README.md#生产化扩章地图) | event streaming、store、subgraph、fault tolerance、test/migration、deploy/observability |

## 第 21 章 · 源码解析（source-analysis）

> 第 12 章和 LangGraph 专题之后的源码阅读路线。目标不是背 API，而是看清主流框架如何实现 agent loop、状态图、RAG query engine 和 workflow runtime。

| # | 专题 | 链接 | 核心能力 |
|---|------|------|----------|
| 21 | 源码解析 | [source-analysis](../source-analysis/README.md) | 建立“入口函数 -> runtime -> 状态/工具/检索 -> 停止条件”的读法 |
| 21.0 | 热门仓库与源码对话 | [repository-matrix](../source-analysis/repository-matrix.md) | 从热门库卡片或输入 GitHub 仓库进入，生成目录矩阵、Relevant Source Files、源码对话、CodeMap 和阅读路径 |
| 21.1 | LangChain 源码解析 | [langchain](../source-analysis/langchain.md) | `create_agent`、Runnable、middleware、structured output |
| 21.2 | LangGraph 源码解析 | [langgraph](../source-analysis/langgraph.md) | `StateGraph`、Pregel runtime、prebuilt ReAct agent、ToolNode |
| 21.3 | LlamaIndex 源码解析 | [llamaindex](../source-analysis/llamaindex.md) | QueryEngine、Retriever、ResponseSynthesizer、Workflow / MultiAgentWorkflow |

## 基础概念扩展专题（agent-basics）

> 第 01-03 章之后的概念补强层。它不重排主课编号，而是收集进入 agent loop 前最容易误解的底层概念。

| # | 专题 | 链接 | 核心能力 |
|---|------|------|----------|
| B1 | LLM 是预测器，不是数据库 | [阅读](../agent-basics/01-llm-as-predictor.md) | 事实性边界、引用、拒答 |
| B2 | Messages、Roles 与上下文窗口 | [阅读](../agent-basics/02-messages-roles-context.md) | role 分工、message array、context 装配 |
| B3 | Token、延迟与成本直觉 | [阅读](../agent-basics/03-token-latency-cost.md) | token budget、步骤成本、压缩策略 |
| B4 | 采样参数与可重复性 | [阅读](../agent-basics/04-sampling-repeatability.md) | temperature、top_p、eval stability |
| B5 | 指令、约束与输出契约 | [阅读](../agent-basics/05-instructions-output-contracts.md) | prompt 作为接口协议 |
| B6 | Tool Calling 心智模型 | [阅读](../agent-basics/06-tool-calling-mental-model.md) | schema、参数校验、工具错误回传 |
| B7 | Workflow vs Agent | [阅读](../agent-basics/07-workflow-vs-agent.md) | 固定流程、自主循环、混合模式 |
| B8 | Memory、RAG 与 Context | [阅读](../agent-basics/08-memory-rag-context.md) | 记忆、检索、上下文打包边界 |
| B9 | Structured Output 基础 | [阅读](../agent-basics/09-structured-output-basics.md) | parse、validate、repair、fallback |
| B10 | Guardrails 入门 | [阅读](../agent-basics/10-guardrails-intro.md) | 输入、检索、工具、输出、人审护栏 |
| B11 | Evaluation 先行 | [阅读](../agent-basics/11-evaluation-first.md) | golden set、失败分类、回归门 |
| B12 | Framework 与 Runtime 地图 | [阅读](../agent-basics/12-framework-runtime-map.md) | runtime 部件、框架边界、迁移策略 |

## Agent 学习指南与分类地图

| 分类方式 | 链接 | 用途 |
|----------|------|------|
| 按学习阶段 | [Agent 学习指南](./agent-learning-guides.md#分类-1-按学习阶段) | 从模型接口到生产化逐层补能力 |
| 按 Agent 类型 | [Agent 类型分类](./agent-learning-guides.md#分类-2-按-agent-类型) | Chat、Tool、Workflow、Research、Copilot、Multi-agent、Coding、Monitoring |
| 按工程能力 | [工程能力拆解](./agent-learning-guides.md#分类-3-按工程能力拆解) | 输入、控制流、工具、知识、质量、生产六层拆解 |
| 按角色路线 | [角色学习路线](./agent-learning-guides.md#角色学习路线) | 后端、前端、RAG、多 agent、生产负责人路线 |

## 按主题跳转

| 主题 | 推荐学习顺序 |
|------|--------------|
| Agent 最小闭环 | [01](../lessons/01-what-is-an-agent/README.md) → [02](../lessons/02-first-llm-call/README.md) → [基础概念扩展](../agent-basics/README.md) → [04](../lessons/04-the-agent-loop/README.md) |
| 工具调用与工具系统 | [04](../lessons/04-the-agent-loop/README.md) → [05](../lessons/05-tool-use-basics/README.md) → [06](../lessons/06-building-a-tool-system/README.md) |
| 记忆与 RAG | [07](../lessons/07-short-term-memory/README.md) → [08](../lessons/08-embeddings-and-vector-search/README.md) → [09](../lessons/09-rag-from-scratch/README.md) → [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/README.md) → [RAG 完整架构](./rag-architecture.md) → [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md) → [企业知识库 Agent Capstone](../capstone/enterprise-knowledge-base-agent/README.md) → [RAG System Checkpoint](../capstone/rag-system/README.md) → [RAG 实战项目](./rag-system-project.md) |
| 多步推理与协作 | [10](../lessons/10-reasoning-patterns/README.md) → [11](../lessons/11-multi-agent-orchestration/README.md) → [12](../lessons/12-intro-to-frameworks/README.md) → [进阶 LangGraph 专题](../langgraph-advanced/README.md) |
| 生产化上线 | [13](../lessons/13-structured-output/README.md) → [14](../lessons/14-streaming-and-ux/README.md) → [15](../lessons/15-evaluation-and-testing/README.md) → [16](../lessons/16-observability-and-cost/README.md) → [17](../lessons/17-safety-and-guardrails/README.md) → [18](../lessons/18-deployment/README.md) |
| 企业知识库全栈 | [07](../lessons/07-short-term-memory/README.md) → [14](../lessons/14-streaming-and-ux/README.md) → [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/README.md) → [进阶 LangGraph 专题](../langgraph-advanced/README.md) → [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md) → [企业知识库 Agent Capstone](../capstone/enterprise-knowledge-base-agent/README.md) → [RAG 系统实战项目](./rag-system-project.md) |
| 生态选型 | [12](../lessons/12-intro-to-frameworks/README.md) → [源码解析](../source-analysis/README.md) → [18](../lessons/18-deployment/README.md) → [19](../lessons/19-agent-ecosystem-and-frontier/README.md) → [20](../lessons/20-agent-frontier-news/README.md) |
