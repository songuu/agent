# 全局课程导航

> 用法：从任意章节点回这里，再直接跳到目标课程。第一次学习建议按顺序走；复习、查漏、项目实践时可以按主题跳转。

## 快速入口

| 入口 | 适合什么时候用 | 链接 |
|------|----------------|------|
| 完整大纲 | 想看课程目标、时长、章节简介 | [课程大纲](./curriculum.md) |
| 知识图谱 | 想看概念之间的依赖和延伸阅读 | [全局知识图谱](./knowledge-graph.md) |
| 环境搭建 | 还没装依赖、没配 key、例子跑不起来 | [第 00 章 · 环境搭建](./setup.md) |
| 毕业项目 | 想把前面能力组装成完整作品 | [Deep Research Agent](../capstone/deep-research-agent/README.md) |
| 进阶 RAG 专题 | 想把最小 RAG 补成生产级（分块/混合/精排/改写/评估/生产化） | [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/README.md) |
| RAG 完整架构 | 想把 RAG 从 demo 设计成可维护系统 | [RAG 完整架构蓝图](./rag-architecture.md) |
| RAG 实战项目 | 想从课程最小 RAG 走向生产级知识库系统 | [仓库内 checkpoint](../capstone/rag-system/README.md) · [songuu/rag-system 连接指南](./rag-system-project.md) |

## 按顺序学习

| # | 阶段 | 课程 | 核心能力 |
|---|------|------|----------|
| 00 | 环境搭建 | [环境搭建](./setup.md) | Node / pnpm / API key / 第一次运行 |
| 01 | 基础概念 | [什么是 Agent](../lessons/01-what-is-an-agent/README.md) | LLM vs Agent、循环心智模型 |
| 02 | 基础概念 | [第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | provider 无关客户端、chat、stream、token |
| 03 | 基础概念 | [提示工程](../lessons/03-prompt-engineering/README.md) | system prompt、few-shot、CoT、temperature |
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
| 🎓 | 综合实战 | [Deep Research Agent](../capstone/deep-research-agent/README.md) | 工具、RAG、多智能体、评估、护栏端到端整合 |
| 🧭 | 架构蓝图 | [RAG 完整架构蓝图](./rag-architecture.md) | ingestion、query、eval、governance、deployment 系统边界 |
| 📚 | 进阶项目 | [RAG System Checkpoint](../capstone/rag-system/README.md) → [RAG 系统实战项目](./rag-system-project.md) | 仓库内验收最小 RAG 系统闭环，再连接 `songuu/rag-system` |

## 进阶 RAG 专题（rag-advanced）

> 第 08/09 章打地基后的生产级深化。六章各自可运行；第 R1 章为纯函数 demo，免 API key 即可跑。

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

## 按主题跳转

| 主题 | 推荐学习顺序 |
|------|--------------|
| Agent 最小闭环 | [01](../lessons/01-what-is-an-agent/README.md) → [02](../lessons/02-first-llm-call/README.md) → [04](../lessons/04-the-agent-loop/README.md) |
| 工具调用与工具系统 | [04](../lessons/04-the-agent-loop/README.md) → [05](../lessons/05-tool-use-basics/README.md) → [06](../lessons/06-building-a-tool-system/README.md) |
| 记忆与 RAG | [07](../lessons/07-short-term-memory/README.md) → [08](../lessons/08-embeddings-and-vector-search/README.md) → [09](../lessons/09-rag-from-scratch/README.md) → [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/README.md) → [RAG 完整架构](./rag-architecture.md) → [RAG System Checkpoint](../capstone/rag-system/README.md) → [RAG 实战项目](./rag-system-project.md) |
| 多步推理与协作 | [10](../lessons/10-reasoning-patterns/README.md) → [11](../lessons/11-multi-agent-orchestration/README.md) → [12](../lessons/12-intro-to-frameworks/README.md) |
| 生产化上线 | [13](../lessons/13-structured-output/README.md) → [14](../lessons/14-streaming-and-ux/README.md) → [15](../lessons/15-evaluation-and-testing/README.md) → [16](../lessons/16-observability-and-cost/README.md) → [17](../lessons/17-safety-and-guardrails/README.md) → [18](../lessons/18-deployment/README.md) |
| 生态选型 | [12](../lessons/12-intro-to-frameworks/README.md) → [18](../lessons/18-deployment/README.md) → [19](../lessons/19-agent-ecosystem-and-frontier/README.md) |
