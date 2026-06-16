# 基础概念扩章地图（2026-06-16）

## 已验证事实

- 当前正式课程第一部分只有 01-03 三章：`什么是 Agent`、`第一次 LLM 调用`、`提示工程`。
- 现有课程后续已经覆盖 agent loop、工具、记忆、RAG、结构化输出、评估、安全、部署和生态。
- 因此本次扩章不应重排 01-19 编号；更低风险的方式是新增 `agent-basics/README.md` 作为基础概念扩展专题首页。

## 收集来源

| 来源 | 可抽取主题 |
|------|------------|
| OpenAI Text generation guide | messages、roles、上下文、采样参数、token 预算 |
| OpenAI Function calling guide | tool schema、tool call、参数校验、工具结果回填 |
| OpenAI Agents SDK docs | agent、tool、handoff、guardrail、runtime 的现代术语 |
| OpenAI Model Spec | 指令层级、安全边界、模型行为规范 |
| Anthropic Building effective agents | workflow vs agent、何时增加自主性、何时保持固定流程 |
| LangChain.js agents overview | agent execution、tools、middleware、持久上下文 |
| Model Context Protocol introduction | agent 连接外部上下文和工具的协议化视角 |

## 候选章节池

| 优先级 | 候选章节 | 理由 | 依赖现有章节 |
|--------|----------|------|--------------|
| P0 | LLM 是预测器，不是数据库 | 先纠正事实性和幻觉心智模型 | 01/02 |
| P0 | Messages、roles 与上下文窗口 | 解释调用 API 时真正传入模型的结构 | 02 |
| P0 | Token、延迟与成本直觉 | 为后续上下文、RAG、成本章做铺垫 | 02/16 |
| P0 | 采样参数与可重复性 | 避免把 temperature 当成唯一调优旋钮 | 02/03/15 |
| P1 | 指令、约束与输出契约 | 把提示工程从文案技巧提升为接口设计 | 03/13 |
| P1 | Tool calling 心智模型 | 进入工具章前先区分请求和执行 | 04/05/06 |
| P1 | Workflow vs Agent | 避免所有问题都上自主 agent | 01/04/10 |
| P1 | Memory、RAG 与上下文不是一回事 | 防止把聊天历史、知识库、长期记忆混在一起 | 07/08/09 |
| P2 | Structured Output 基础 | 给第 13 章预埋 schema/validation 语言 | 13 |
| P2 | Guardrails 入门 | 给第 17 章预埋权限/确认/过滤语言 | 17 |
| P2 | Evaluation 先行 | 给第 15 章预埋 regression/eval 语言 | 15 |
| P2 | Framework 地图预备课 | 给第 12/19 章预埋 runtime/SDK 语言 | 12/19 |

## 本次落地

- 新增 `agent-basics/README.md`：收集 12 个基础概念候选章节，并说明与现有 01-19 章的关系。
- 更新课程大纲、导航、首页和 README：让读者可以从“基础概念”入口进入扩展专题。
- 更新 VitePress rewrite：让 `/agent-basics/` 生成可访问的 `index.html`。
- 验证：`pnpm typecheck` 通过；`pnpm site:build` 在 Windows sandbox 命中已知 `spawn EPERM`，用 WSL + Windows node/pnpm 复跑通过，并确认 `.vitepress/dist/agent-basics/index.html` 存在。

## 后续建议

1. 先完整写 B1-B4，优先做无需 API key 的概念练习。
2. B5-B8 与现有第 03-07 章联动，避免重复讲工具/记忆。
3. B9-B12 作为第 13-17 章预备阅读，后续可在生产化章节反向引用。
