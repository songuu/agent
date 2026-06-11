# 课程大纲 · 从零到上框架：AI Agent 开发完整学习路径（TypeScript）

> 一句话：**先用纯 TypeScript 手写出 agent 的每一个零件，再衔接主流框架，最后落地成一个能放进简历、能给投资人演示的真实项目。**

---

## 这门课是给谁的

| 你是… | 这门课能帮你… |
|------|---------------|
| 想转行做 AI 应用 / Agent 工程的开发者 | 从底层原理补齐，面试问到 agent loop、RAG、成本不再露怯 |
| 已经会调 API、但只会「堆框架」的人 | 把黑盒打开，理解 LangGraph / AI SDK 每一行背后在做什么 |
| 想做 AI 产品 / 创业的独立开发者 | 拿到一个可演示的 MVP 骨架，知道成本、护栏、部署怎么做 |

**前置要求**：基础 JavaScript / TypeScript（异步、模块、类型）。不需要机器学习背景，不需要数学。

**不适合**：完全没写过代码的零基础；只想要「复制粘贴能跑」而不关心原理的人。

### 这门课的取舍（为什么和别的教程不一样）

- **先手写，后框架**：第二到四部分全部用纯 TS 手写 agent loop、工具系统、记忆、RAG、多智能体——**理解每一行为什么存在**，之后才在第五部分引入框架。
- **每章三层学习路线**：极简先跑通，进阶讲原理和边界，真实实践连接产品、团队和生产系统。
- **每章可直接运行**：`npx tsx lessons/xx/index.ts` 即可，零编译、零环境折腾。
- **厂商无关**：统一的 `getLLM()` 抽象，换 Claude / OpenAI 只改 `.env` 里一行。
- **能写进简历 / 能做 demo**：毕业项目是一个完整可演示的小产品，配套求职与创业指南。

---

## 怎么学（学习方式）

1. **按顺序学**：章节有强依赖（后面的章节会复用前面手写的能力），不建议跳读。第一次学请从第 00 章开始。
2. **每章三层走**：
   - `极简`：先跑通本章最小闭环，知道输入是什么、输出是什么、代码从哪里开始；
   - `进阶`：再追问原理、边界、失败模式和工程取舍，避免只会复制 demo；
   - `真实实践`：最后把本章能力映射到真实产品、团队流程或生产系统，形成可迁移判断。
3. **每层三步读**：
   - 先看 `图解学习地图`，用流程图建立整体心智模型；
   - 再读 `原理展开` 和 `README.md` 主体，理解「为什么」和「怎么做」；
   - `npx tsx` 跑通该章的 `index.ts`，观察真实输出；
   - 动手改一处参数 / 加一个小功能，验证你真的懂了。
4. **手写阶段不要偷懒看 `src/shared/`**：第二、三部分的「从零」章节，先在本章目录里亲手实现，理解后再去看 `src/shared/` 里沉淀的成熟版——这正是真实工程「先理解、再抽象、后复用」的路径。
5. **风险越高、测试越认真**：到了生产化部分（第 15–18 章），把测试 / 评估 / 护栏当成代码的一部分，而不是事后补丁。

> 提示：全程用便宜模型（如 `gpt-4o-mini` / `claude-haiku`）跑完成本很低；第 16 章会专门教你怎么算账和省钱。

想直接跳到任意课程，使用 [全局课程导航](./navigation.md)。它按顺序、按主题整理了第 00–19 章、毕业项目、RAG 架构蓝图和 RAG 系统实战项目。

### 三层学习法

| 层级 | 学习重点 | 适合的自检问题 |
|------|----------|----------------|
| 极简 | 先把本章最小路径跑起来,不要一开始追求完整系统 | 我能不能不看讲义,用自己的话复述输入、处理和输出? |
| 进阶 | 解释机制、边界、失败模式、成本和替代方案 | 如果结果错了,我知道应该先查 prompt、工具、检索、上下文还是模型吗? |
| 真实实践 | 对齐真实项目的权限、数据、评估、部署和团队协作 | 这个能力放进一个线上产品时,需要哪些日志、测试、护栏和回滚方案? |

### 图文阅读法

每章新增的 Mermaid 流程图不是装饰，而是学习顺序的一部分：

| 图中元素 | 你要追问的问题 |
|----------|----------------|
| 节点 | 这一步由模型、工具、本地代码还是外部服务负责？ |
| 箭头 | 数据在这里发生了什么转换？消息、schema、向量、工具结果分别流向哪里？ |
| 分支 | 系统什么时候继续、什么时候停止、什么时候降级或报错？ |

读完图后再看代码，会更容易把 `messages`、`ToolRegistry`、`MemoryVectorStore`、`runAgent`、`stream()` 这些抽象放到同一张系统图里。

---

## 总时长估算

| 部分 | 章节 | 预计时长 |
|------|------|----------|
| 第 00 章 · 环境搭建 | 1 章 | ~30 分钟 |
| 第一部分 · 基础概念 | 01–03 | ~2.5 小时 |
| 第二部分 · 从零手写核心 | 04–07 | ~5 小时 |
| 第三部分 · 知识与检索 | 08–09 | ~3 小时 |
| 第四部分 · 进阶模式 | 10–11 | ~3.5 小时 |
| 第五部分 · 工程化与框架 | 12–14 | ~3.5 小时 |
| 第六部分 · 生产化 | 15–18 | ~5 小时 |
| 第七部分 · 前沿与生态 | 19 | ~1 小时 |
| 🎓 毕业项目 · Deep Research Agent | 综合 | ~6–10 小时 |
| 🔬 进阶 RAG 专题 | rag-advanced ×6 | ~4–5 小时 |
| 🧭 RAG 完整架构蓝图 | 架构阅读 | ~1 小时 |
| **合计** | **19 章 + 毕业项目 + RAG 专题 + 架构蓝图** | **约 36–42 小时**（不含动手扩展） |

> 按每天投入 1–1.5 小时算，大约 **3–4 周**可以完整走完一遍。建议分散学、多动手，比一口气刷完更扎实。

---

## 学习路径图

```text
                        ┌─────────────────────────┐
                        │  第 00 章 · 环境搭建      │
                        │  Node / pnpm / API key   │
                        └────────────┬─────────────┘
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第一部分 · 基础概念                                   │
        │  01 什么是 Agent → 02 第一次 LLM 调用 → 03 提示工程    │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第二部分 · 从零手写核心                               │
        │  04 Agent 循环 → 05 工具调用基础 →                    │
        │  06 工具系统 → 07 短期记忆                            │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第三部分 · 知识与检索                                 │
        │  08 Embedding 与向量检索 → 09 从零实现 RAG            │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第四部分 · 进阶模式                                   │
        │  10 推理范式 → 11 多智能体编排                        │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第五部分 · 工程化与框架                               │
        │  12 上框架 → 13 结构化输出 → 14 流式与 UX             │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第六部分 · 生产化                                     │
        │  15 评估与测试 → 16 可观测与成本 →                    │
        │  17 安全与护栏 → 18 部署                              │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第七部分 · 前沿与生态                                 │
        │  19 Agent 前沿发展与生态拆解                           │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
                  ┌──────────────────────────────────┐
                  │  🎓 毕业项目 · Deep Research Agent │
                  │     综合所有能力的实战            │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🔬 进阶 RAG 专题 (rag-advanced)   │
                  │  分块/混合/精排/改写/评估/生产化   │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🧭 RAG 完整架构蓝图              │
                  │     写入/查询/eval/治理/部署      │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  📚 进阶项目 · songuu/rag-system   │
                  │     生产级 RAG 系统连接            │
                  └────────────────┬─────────────────┘
                                   ▼
                       💼 求职指南    🚀 创业指南
```

---

## 章节详解

难度图例：⭐ 入门 · ⭐⭐ 基础 · ⭐⭐⭐ 进阶 · ⭐⭐⭐⭐ 挑战

### 第 00 章 · 环境搭建

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 00 | 环境搭建 | ⭐ | 30 分钟 | 装好 Node/pnpm、配置 API key、跑通第一个例子，确认全链路畅通 | [./setup.md](./setup.md) |

### 第一部分 · 基础概念

> 目标：建立正确的心智模型——知道 Agent 到底是什么、LLM 怎么调、怎么把话说清楚让模型听懂。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 01 | 什么是 Agent | ⭐ | 40 分钟 | 厘清 LLM 与 Agent 的区别，理解「感知-决策-行动」循环这个核心心智模型 | [../lessons/01-what-is-an-agent/README.md](../lessons/01-what-is-an-agent/README.md) |
| 02 | 第一次 LLM 调用 | ⭐ | 50 分钟 | 用 provider 无关的客户端发起第一次对话，理解 chat / stream / token 三件事 | [../lessons/02-first-llm-call/README.md](../lessons/02-first-llm-call/README.md) |
| 03 | 提示工程 | ⭐ | 50 分钟 | system prompt、few-shot、思维链(CoT)、temperature——把模型的能力调出来 | [../lessons/03-prompt-engineering/README.md](../lessons/03-prompt-engineering/README.md) |

### 第二部分 · 从零手写核心

> 目标：不依赖任何框架，亲手写出一个能思考、能调工具、有记忆的 agent。这是整门课的地基。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 04 | Agent 循环 | ⭐⭐ | 75 分钟 | 手写 Thought → Action → Observation 循环，让模型自己决定下一步做什么 | [../lessons/04-the-agent-loop/README.md](../lessons/04-the-agent-loop/README.md) |
| 05 | 工具调用基础 | ⭐⭐ | 60 分钟 | 用原生 function calling 完成一次完整的工具往返，让模型能「动手」 | [../lessons/05-tool-use-basics/README.md](../lessons/05-tool-use-basics/README.md) |
| 06 | 工具系统 | ⭐⭐⭐ | 75 分钟 | 用 zod 定义 schema、建工具注册表、安全地执行——把零散工具变成可扩展系统 | [../lessons/06-building-a-tool-system/README.md](../lessons/06-building-a-tool-system/README.md) |
| 07 | 短期记忆 | ⭐⭐ | 50 分钟 | 滑动窗口、摘要压缩、上下文成本——让 agent 在长对话里不失忆也不爆预算 | [../lessons/07-short-term-memory/README.md](../lessons/07-short-term-memory/README.md) |

### 第三部分 · 知识与检索

> 目标：让 agent 用上「它没见过」的知识——从理解向量，到亲手搭一套 RAG。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 08 | Embedding 与向量检索 | ⭐⭐ | 75 分钟 | 把文本变成向量，用余弦相似度做语义搜索——RAG 的数学基础 | [../lessons/08-embeddings-and-vector-search/README.md](../lessons/08-embeddings-and-vector-search/README.md) |
| 09 | 从零 RAG | ⭐⭐⭐ | 105 分钟 | 分块 → 检索 → 注入 → 引用溯源，手写一条完整的检索增强生成链路 | [../lessons/09-rag-from-scratch/README.md](../lessons/09-rag-from-scratch/README.md) |

### 第四部分 · 进阶模式

> 目标：从「单个 agent 跑一遍」升级到「会规划、会反思、会协作」的高级模式。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 10 | 推理范式 | ⭐⭐⭐ | 90 分钟 | ReAct / Plan-Execute / Reflection 三种范式对比，知道何时该用哪一种 | [../lessons/10-reasoning-patterns/README.md](../lessons/10-reasoning-patterns/README.md) |
| 11 | 多智能体编排 | ⭐⭐⭐⭐ | 120 分钟 | supervisor + worker 协作模式，让多个 agent 分工完成复杂任务 | [../lessons/11-multi-agent-orchestration/README.md](../lessons/11-multi-agent-orchestration/README.md) |

### 第五部分 · 工程化与框架

> 目标：把手写经验迁移到主流框架，并补齐结构化输出、流式 UX 这些「上生产」必备能力。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 12 | 上框架 | ⭐⭐⭐ | 90 分钟 | 引入 LangGraph.js 与 Vercel AI SDK，对照手写版理解框架帮你省了什么 | [../lessons/12-intro-to-frameworks/README.md](../lessons/12-intro-to-frameworks/README.md) |
| 13 | 结构化输出 | ⭐⭐⭐ | 60 分钟 | 让模型稳定吐 JSON：zod 校验 + retry-repair，把不确定的输出变成可靠数据 | [../lessons/13-structured-output/README.md](../lessons/13-structured-output/README.md) |
| 14 | 流式与 UX | ⭐⭐ | 50 分钟 | 打字机效果、步骤流、可取消——让 agent 用起来「像个真产品」 | [../lessons/14-streaming-and-ux/README.md](../lessons/14-streaming-and-ux/README.md) |

### 第六部分 · 生产化

> 目标：从「能跑的 demo」到「敢上线的服务」——评估、成本、安全、部署一个都不能少。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 15 | 评估测试 | ⭐⭐⭐ | 90 分钟 | 建 eval 数据集、用 LLM-as-judge 打分、做回归测试——给 agent 质量上锁 | [../lessons/15-evaluation-and-testing/README.md](../lessons/15-evaluation-and-testing/README.md) |
| 16 | 可观测与成本 | ⭐⭐ | 60 分钟 | 加 trace 追踪每一步、核算 token、估算费用——上线前先把账算明白 | [../lessons/16-observability-and-cost/README.md](../lessons/16-observability-and-cost/README.md) |
| 17 | 安全护栏 | ⭐⭐⭐ | 60 分钟 | 防 prompt injection、敏感操作人工确认、输出过滤——别让 agent 闯祸 | [../lessons/17-safety-and-guardrails/README.md](../lessons/17-safety-and-guardrails/README.md) |
| 18 | 部署 | ⭐⭐⭐ | 75 分钟 | 把 agent 包成 HTTP API、用 SSE 推流、过一遍部署清单——正式变成服务 | [../lessons/18-deployment/README.md](../lessons/18-deployment/README.md) |

### 第七部分 · 前沿与生态

> 目标：把前面学到的 agent 零件放回 2026 年真实生态里，理解 MCP、A2A、Agents SDK、LangGraph、CrewAI、LlamaIndex、Vercel AI SDK 各自解决哪一层问题。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 19 | Agent 前沿发展与生态拆解 | ⭐⭐⭐ | 70 分钟 | 从模型接口、工具协议、Agent SDK、编排 runtime、RAG、UI、观测、安全八层拆解当前生态，并练习按需求选型 | [../lessons/19-agent-ecosystem-and-frontier/README.md](../lessons/19-agent-ecosystem-and-frontier/README.md) |

### 🎓 毕业项目 · Deep Research Agent

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 🎓 | Deep Research Agent | ⭐⭐⭐⭐ | 6–10 小时 | 综合 agent 循环、工具、RAG、多智能体、评估、护栏的实战项目，可直接放进作品集 | [../capstone/deep-research-agent/README.md](../capstone/deep-research-agent/README.md) |

### 🧭 RAG 完整架构蓝图

> 目标：把仓库里的最小 RAG、进阶 RAG 和毕业项目 RAG 工具，整理成可落地到独立知识库产品的系统架构。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 🧭 | RAG 完整架构蓝图 | ⭐⭐⭐⭐ | 60 分钟 | 从 ingestion、retrieval、rerank、context builder、generation、eval、governance 到 deployment，画清生产级 RAG 的边界 | [./rag-architecture.md](./rag-architecture.md) |

### 📚 进阶项目 · RAG 系统实战

> 目标：把第 08/09 章的最小 RAG 和毕业项目中的 RAG 工具，连接到独立的生产级 RAG 系统项目。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 📚 | songuu/rag-system | ⭐⭐⭐⭐ | 持续迭代 | 从课程最小 RAG 走向生产级知识库系统，重点看 ingestion、chunking、embedding、retrieval、rerank、citation、eval 与治理 | [./rag-system-project.md](./rag-system-project.md) |

### 🔬 进阶 RAG 专题（rag-advanced）

> 目标：把第 08/09 章的「最小可解释 RAG」补成**生产级 RAG**。六章各自可运行，沉淀进 `src/shared/rag/` 复用。建议学完第 09 章后按序深入；其中第 01 章为纯函数 demo，**无需任何 API key** 即可跑通。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| R1 | 进阶分块策略 | ⭐⭐⭐ | 45 分钟 | 字符滑窗 vs 递归语义切分 vs Markdown 标题感知，按 token 控大小 | [../rag-advanced/01-chunking-strategies/README.md](../rag-advanced/01-chunking-strategies/README.md) |
| R2 | 混合检索 | ⭐⭐⭐ | 50 分钟 | 向量 + BM25 双路召回，用 RRF 融合，补齐单路检索的盲区 | [../rag-advanced/02-hybrid-search/README.md](../rag-advanced/02-hybrid-search/README.md) |
| R3 | 召回-精排两段式 | ⭐⭐⭐ | 45 分钟 | 廉价多召回 + LLM 精排到少数最相关，提升上下文信噪比 | [../rag-advanced/03-reranking/README.md](../rag-advanced/03-reranking/README.md) |
| R4 | 查询改写 | ⭐⭐⭐ | 45 分钟 | multi-query 多路改写与 HyDE 假设答案检索，提升召回覆盖 | [../rag-advanced/04-query-transformation/README.md](../rag-advanced/04-query-transformation/README.md) |
| R5 | RAG 评估 | ⭐⭐⭐ | 50 分钟 | 上下文相关性 / 忠实度 / 答案相关性三指标，定位坏在哪一环 | [../rag-advanced/05-rag-evaluation/README.md](../rag-advanced/05-rag-evaluation/README.md) |
| R6 | 生产化 RAG | ⭐⭐⭐⭐ | 60 分钟 | metadata 过滤、持久化、增量 upsert、端到端管线组合 | [../rag-advanced/06-production-rag/README.md](../rag-advanced/06-production-rag/README.md) |

---

## 学完之后的下一步

恭喜走到这里——你已经具备从底层原理到生产部署的完整 Agent 工程能力。接下来选一条路：

- 💼 **找工作 / 转行** → 看 [求职指南](./career-guide.md)：岗位画像、技能清单、用本项目（尤其毕业项目）写简历、高频面试题拆解。
- 🚀 **做产品 / 创业** → 看 [创业指南](./startup-guide.md)：怎么判断机会、如何把毕业项目裁剪成 MVP、成本控制、上线 checklist。
- 🔬 **进阶 RAG（仓库内）** → 看 [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/README.md)：分块策略、混合检索、重排、查询改写、评估、生产化六章，把第 08/09 章的最小 RAG 补成生产级，能力沉淀在 `src/shared/rag/`。
- 🧭 **RAG 架构设计** → 看 [RAG 完整架构蓝图](./rag-architecture.md)：把 demo 能力组织成写入路径、查询路径、数据模型、安全治理、质量闭环和部署拓扑。
- 📚 **深挖 RAG（独立项目）** → 看 [RAG 系统实战项目](./rag-system-project.md)：连接到 [songuu/rag-system](https://github.com/songuu/rag-system)，把课程里的 RAG 原理升级成独立系统。

> 不确定走哪条？建议两份都读一遍——求职和创业需要的底层能力是同一套，区别只在你把它用在哪。
