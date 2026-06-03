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
- ▶️ **每章可运行**：`npx tsx` 直接跑，零编译、零环境折腾。
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

---

## 学习路径

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
🎓 毕业项目 · Deep Research Agent（综合实战）
   │
   ▼
💼 求职指南   🚀 创业指南
```

完整大纲见 [**docs/curriculum.md**](./docs/curriculum.md)。

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
| 🎓 | [毕业项目 · Deep Research Agent](./capstone/deep-research-agent/) | ⭐⭐⭐⭐ | 综合所有能力的实战项目 |

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
├── lessons/                   # 18 章课程，每章 README + 可运行代码
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

---

## 常见问题

- **必须用 Claude 吗？** 不。`.env` 里把 `LLM_PROVIDER` 设成 `openai` 即可，课程代码一行不用改。
- **必须用 pnpm 吗？** 不。`npm install` / `yarn` 也行，把命令里的 `pnpm` 换掉即可。
- **要花多少钱？** 全程用便宜模型（如 `gpt-4o-mini` / `claude-haiku`）跑完成本很低；第 16 章专门讲成本控制。
- **没有 TS 基础能学吗？** 建议先掌握基础 JS/TS（异步、模块、类型），再开始第 01 章。

---

## License

[MIT](./LICENSE) © songuu
