# 从零到上框架：AI Agent 开发完整学习路径（TypeScript）

> 一套**面向初学者**、**从零手写 → 再上框架**的 AI Agent 开发课程。
> 用 TypeScript 打通底层原理，再衔接主流框架，学完可直接用于**求职**（作品集 + 面试）与**创业**（demo → 产品）。

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%E2%89%A520-339933)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 这套课程解决什么问题

市面上的 Agent 教程，要么**只调 API 浅尝辄止**，要么**直接堆框架不讲原理**——面试一问底层就露怯，创业一遇成本/幻觉就抓瞎。

本课程的取舍：

- 🧱 **先手写，后框架**：先纯手写 agent loop、工具调用、记忆、RAG、多智能体，**理解每一行为什么存在**；再引入 LangGraph.js / Vercel AI SDK，知其所以然。
- 🪜 **三层学习路线**：每章都分成「极简 → 进阶 → 真实实践」，先跑通最小闭环，再理解原理边界，最后映射到真实项目。
- ▶️ **每章可运行**：`npx tsx` 直接跑，零编译、零环境折腾。
- 🗺️ **先看图，再看代码**：每章都有可缩放的 `图解学习地图` / Mermaid 图（默认就放到可读尺度，不必手动放大），并自动插入「抽象概念可视化」模块——每个概念按类型渲染专属的内联 SVG 动画场景（循环环 / 传送带 / 双路汇流 / 语义空间…）；本章概念图谱还会高亮本章焦点、按关系类型给连线配色。所有图片由代码内联绘制（零外部图片资源），用流程图、示意图、轻量动画、彩色加粗重点和外部阅读链接先建立心智模型，再进入原理讲解和代码走读。
- 🔌 **厂商无关**：统一的 `getLLM()` 抽象，换 Claude / OpenAI 只改一行 `.env`。
- 💼 **能写进简历**：毕业项目是一个完整可演示的小产品；附**求职指南**（简历模板 + 面试题）与**创业指南**（demo → 产品）。

> 适合：有基础 JS/TS、想入行或转行做 AI 应用 / Agent 工程的同学。

---

## 快速开始

```bash
git clone https://github.com/songuu/agent.git
cd agent
pnpm install

# 配置 key（至少一个厂商）
cp .env.example .env        # Windows: Copy-Item .env.example .env
#  → 编辑 .env 填入 ANTHROPIC_API_KEY 或 OPENAI_API_KEY

# 验证（不需要 key）
pnpm typecheck

# 跑第一个例子（需要 key）
npx tsx lessons/02-first-llm-call/index.ts
```

详细步骤见 [**第 00 章 · 环境搭建**](./docs/setup.md)。

### 📖 用网页方式学习（课程站点）

整套课程内置了一个美观的网页站点（总览首页 + 全部课程 + 全文搜索 + 暗色模式 + Mermaid 图渲染）：

```bash
pnpm site:dev       # 本地开发：http://localhost:5173
pnpm site:build     # 构建静态站点到 .vitepress/dist
pnpm site:preview   # 预览构建产物
```

> 站点目录由 `knowledge-graph/data/graph.ts` 的 `CHAPTERS` 数据驱动——新增章节自动出现在侧边栏，无需改站点配置。

### ▶️ 在网页里直接运行 demo

开发时可以启动带本地运行器的站点，在课程页面的 demo 位置直接点「运行」，并在网页终端里实时查看 stdout/stderr 与 AI 流式输出：

```bash
pnpm site:live
```

它会同时启动：

- VitePress 课程站点：`http://localhost:5173`
- dev-only 本地运行器：`http://127.0.0.1:5174`

运行器只读取本机 `.env` 配置，支持现有 Anthropic/OpenAI 配置，也支持 `LLM_PROVIDER=ollama` 的本地 Ollama 模式。它不会把 key 明文返回给浏览器。

安全边界：这个运行器只能用于本地开发学习，默认只绑定 `127.0.0.1`，不要部署、反代或暴露到公网。普通 `pnpm site:build` 仍然生成可独立部署的静态站；没有启动 runner 时，页面只会显示友好的不可用提示。

---

## 全局导航

想直接跳到具体课程，走 [**全局课程导航**](./docs/navigation.md)。它按顺序、按主题同时整理了第 00–19 章、毕业项目和 RAG 系统实战项目。

---

## 学习路径

每章都按「三层学习路线」设计，保证不是只看懂概念，而是一路走到能用在真实项目里：

| 层级 | 目标 | 产出 |
|------|------|------|
| 极简 | 跑通本章最小闭环，先建立“我会用了”的手感 | 一个能运行、能解释输入输出的小例子 |
| 进阶 | 追问原理、边界、失败模式和取舍 | 能说清为什么这样设计，以及哪里会坏 |
| 真实实践 | 把本章能力映射到产品、团队或生产系统 | 一份可迁移到真实项目的设计判断或 checklist |

每一层都建议按这个顺序学：

1. 先读可缩放的 `图解学习地图` 和「抽象概念可视化」，把流程、数据流、控制流装进脑子；彩色加粗的「核心判断 / 易错边界」先记住，外部理解链接用于课后补背景。
2. 再读 `原理展开`，理解为什么这样设计，以及它解决了 LLM 的哪个边界。
3. 最后看 `代码走读` 并运行 `npx tsx lessons/NN-xxx/index.ts`，把图里的每个节点对应到真实代码。

```
第00章 环境搭建
   │
   ▼
第一部分 · 基础概念 ───────► 第二部分 · 从零手写核心
 01 什么是 Agent             04 手写 Agent 循环 (ReAct)
 02 第一次 LLM 调用          05 工具调用基础
 03 提示工程                 06 从零构建工具系统
                            07 短期记忆与上下文
   │                                │
   ▼                                ▼
第三部分 · 知识与检索        第四部分 · 进阶模式
 08 Embedding 与向量检索     10 推理范式 (ReAct/Plan/Reflect)
 09 从零实现 RAG             11 多智能体编排
   │                                │
   ▼                                ▼
第五部分 · 工程化与框架       第六部分 · 生产化
 12 上框架 (LangGraph/AI SDK) 15 评估与测试
 13 结构化输出与校验          16 可观测性与成本
 14 流式输出与 UX            17 安全与护栏
                            18 部署：变成服务
   │
   ▼
第七部分 · 前沿与生态
 19 Agent 前沿发展与生态拆解
   │
   ▼
🎓 毕业项目 · Deep Research Agent（综合实战）
   │
   ▼
🔬 进阶 RAG 专题 · rag-advanced（分块/混合/精排/改写/评估/生产化）
   │
   ▼
📚 进阶项目 · songuu/rag-system（生产级 RAG 系统）
   │
   ▼
💼 求职指南   🚀 创业指南
```

完整大纲见 [**docs/curriculum.md**](./docs/curriculum.md)。

🗺️ 想看概念之间怎么串联？[**全局知识图谱**](./docs/knowledge-graph.md)（每章末尾也有各自的概念图谱与延伸阅读，交互版见 `knowledge-graph/output/index.html`）。

---

## 章节一览

| # | 章节 | 难度 | 你将学到 |
|---|------|------|----------|
| 00 | [环境搭建](./docs/setup.md) | ⭐ | Node/pnpm/key 配置，跑通第一个例子 |
| **第一部分** | **基础概念** | | |
| 01 | [什么是 Agent](./lessons/01-what-is-an-agent/) | ⭐ | LLM vs Agent，循环心智模型 |
| 02 | [第一次 LLM 调用](./lessons/02-first-llm-call/) | ⭐ | provider 无关客户端、chat/stream、token |
| 03 | [提示工程](./lessons/03-prompt-engineering/) | ⭐ | system/few-shot/CoT/temperature |
| **第二部分** | **从零手写核心** | | |
| 04 | [手写 Agent 循环 (ReAct)](./lessons/04-the-agent-loop/) | ⭐⭐ | Thought/Action/Observation 循环 |
| 05 | [工具调用基础](./lessons/05-tool-use-basics/) | ⭐⭐ | 原生 function calling、tool 往返 |
| 06 | [从零构建工具系统](./lessons/06-building-a-tool-system/) | ⭐⭐⭐ | zod schema、注册表、安全执行 |
| 07 | [短期记忆与上下文](./lessons/07-short-term-memory/) | ⭐⭐ | 滑动窗口、摘要压缩、成本 |
| **第三部分** | **知识与检索** | | |
| 08 | [Embedding 与向量检索](./lessons/08-embeddings-and-vector-search/) | ⭐⭐ | 向量、余弦相似度、语义搜索 |
| 09 | [从零实现 RAG](./lessons/09-rag-from-scratch/) | ⭐⭐⭐ | 分块、检索、注入、引用溯源 |
| **第四部分** | **进阶模式** | | |
| 10 | [推理范式](./lessons/10-reasoning-patterns/) | ⭐⭐⭐ | ReAct / Plan-Execute / Reflection |
| 11 | [多智能体编排](./lessons/11-multi-agent-orchestration/) | ⭐⭐⭐⭐ | supervisor + worker 协作 |
| **第五部分** | **工程化与框架** | | |
| 12 | [上框架](./lessons/12-intro-to-frameworks/) | ⭐⭐⭐ | LangGraph.js、Vercel AI SDK |
| 13 | [结构化输出与校验](./lessons/13-structured-output/) | ⭐⭐⭐ | JSON、zod、retry-repair |
| 14 | [流式输出与 UX](./lessons/14-streaming-and-ux/) | ⭐⭐ | 打字机、步骤流、可取消 |
| **第六部分** | **生产化** | | |
| 15 | [评估与测试](./lessons/15-evaluation-and-testing/) | ⭐⭐⭐ | eval 集、LLM-as-judge、回归 |
| 16 | [可观测性与成本](./lessons/16-observability-and-cost/) | ⭐⭐ | trace、token 核算、费用估算 |
| 17 | [安全与护栏](./lessons/17-safety-and-guardrails/) | ⭐⭐⭐ | prompt injection、人工确认 |
| 18 | [部署：变成服务](./lessons/18-deployment/) | ⭐⭐⭐ | HTTP API、SSE、部署清单 |
| **第七部分** | **前沿与生态** | | |
| 19 | [Agent 前沿发展与生态拆解](./lessons/19-agent-ecosystem-and-frontier/) | ⭐⭐⭐ | MCP、A2A、Agents SDK、LangGraph、生态选型 |
| 🎓 | [毕业项目 · Deep Research Agent](./capstone/deep-research-agent/) | ⭐⭐⭐⭐ | 综合所有能力的实战项目 |
| **进阶专题** | **RAG 生产化（rag-advanced）** | | |
| R1 | [进阶分块策略](./rag-advanced/01-chunking-strategies/) | ⭐⭐⭐ | 递归语义切分、Markdown 感知、按 token 控大小（纯函数，免 key 可跑） |
| R2 | [混合检索](./rag-advanced/02-hybrid-search/) | ⭐⭐⭐ | 向量 + BM25 + RRF 融合 |
| R3 | [召回-精排](./rag-advanced/03-reranking/) | ⭐⭐⭐ | 两段式检索、LLM 重排 |
| R4 | [查询改写](./rag-advanced/04-query-transformation/) | ⭐⭐⭐ | multi-query、HyDE |
| R5 | [RAG 评估](./rag-advanced/05-rag-evaluation/) | ⭐⭐⭐ | 上下文相关性 / 忠实度 / 答案相关性 |
| R6 | [生产化 RAG](./rag-advanced/06-production-rag/) | ⭐⭐⭐⭐ | metadata 过滤、持久化、增量、全链路 |
| 📚 | [RAG 系统实战项目](./docs/rag-system-project.md) | ⭐⭐⭐⭐ | 连接到 `songuu/rag-system`，从课程最小 RAG 走向生产级知识库系统 |

---

## 仓库结构

```
agent/
├── README.md                  # 你在这里
├── .env.example               # 复制成 .env 填 key
├── docs/
│   ├── setup.md               # 第 00 章 · 环境搭建
│   ├── curriculum.md          # 完整教学大纲
│   ├── glossary.md            # 术语表
│   ├── career-guide.md        # 💼 求职指南
│   └── startup-guide.md       # 🚀 创业指南
├── src/shared/                # 跨课程共享的「标准库」（provider 无关）
│   ├── llm/                   #   统一 LLM 抽象 + Anthropic/OpenAI 实现 + embedding
│   ├── agent/                 #   工具系统 (tool) + 可复用 agent 循环 (loop)
│   ├── rag/                   #   内存向量库
│   └── util/                  #   env / logger / ui
├── lessons/                   # 19 章课程，每章 README + 可运行代码
│   ├── 01-what-is-an-agent/
│   └── ...
└── capstone/
    └── deep-research-agent/   # 🎓 毕业项目
```

> 💡 **设计说明**：第二、三部分「从零手写」时，各章在自己目录里**亲手实现**核心逻辑以理解原理；
> 这些能力的「成熟版」沉淀在 `src/shared/`，供后续章节与毕业项目复用——这正是真实项目里
> 「先理解、再抽象、后复用」的工程演进路径。

---

## 学完之后

- 💼 [**求职指南**](./docs/career-guide.md)：岗位画像、技能清单、用本项目写简历、高频面试题。
- 🚀 [**创业指南**](./docs/startup-guide.md)：机会判断、MVP 裁剪、成本控制、上线 checklist。
- 🔬 [**进阶 RAG 专题**](./rag-advanced/01-chunking-strategies/)：分块策略、混合检索、重排、查询改写、评估、生产化六章，把第 08/09 章的最小 RAG 补成生产级，能力沉淀在 `src/shared/rag/`。
- 📚 [**RAG 系统实战项目**](./docs/rag-system-project.md)：连接到 [songuu/rag-system](https://github.com/songuu/rag-system)，把第 08/09 章的最小 RAG 扩展成独立知识库系统。

---

## 常见问题

- **必须用 Claude 吗？** 不。`.env` 里把 `LLM_PROVIDER` 设成 `openai` 即可，课程代码一行不用改。
- **必须用 pnpm 吗？** 不。`npm install` / `yarn` 也行，把命令里的 `pnpm` 换掉即可。
- **要花多少钱？** 全程用便宜模型（如 `gpt-4o-mini` / `claude-haiku`）跑完成本很低；第 16 章专门讲成本控制。
- **没有 TS 基础能学吗？** 建议先掌握基础 JS/TS（异步、模块、类型），再开始第 01 章。

---

## License

[MIT](./LICENSE) © songuu
