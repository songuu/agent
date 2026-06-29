# 仓库矩阵解析器

> 目标：参考 [DeepWiki](https://deepwiki.com/) 的“热门仓库入口 -> 仓库 -> Wiki 目录 -> Relevant source files -> 源码引用问答”形态，把本章从三篇静态源码解析升级成可换仓库、可提问、可溯源的源码阅读工具。

这个解析器不会把仓库克隆到服务器，也不会调用模型自动总结。它在浏览器里读取公开 GitHub repo tree 和候选 raw source，然后用确定性规则生成七类结果：

| 结果 | 用途 | 判断依据 |
|------|------|----------|
| 热门库直接解读 | 像 DeepWiki 首页一样从热门 repo 卡片直接进入解析 | 预置热门仓库清单 + GitHub live tree |
| 仓库总览 | 确认 repo、默认分支、索引时间、核心复杂度 | GitHub repo meta + 文件路径特征 |
| 语言与文件构成 | 判断先看实现、测试还是文档 | 文件扩展名、docs/tests/config 规则 |
| 仓库矩阵 | 把目录/包映射到入口、运行时、状态、工具、检索、测试、文档等层 | 路径关键词 + 文件计数 |
| Relevant Source Files | 给出首轮应该读的高信号文件 | runtime/tool/retriever/state/test/config 评分 |
| 源码对话 | 连续输入问题后检索候选源码，返回文件行号、源码片段和解释 | 问题关键词扩展 + raw source 行窗口评分 |
| CodeMap | 把区域、职责层、高信号文件和当前问题焦点映射成源码地图 | 仓库矩阵 + Relevant Source Files + 当前问题候选文件 |

## 热门库直接解读

打开后先看到 DeepWiki 首页式热门仓库卡片；点任意卡片会直接加载该仓库的 GitHub tree，再生成源码矩阵、源码对话和 CodeMap 入口。也可以在搜索框粘贴任意公开 GitHub 仓库。

<div data-source-analysis-explorer></div>

## 矩阵字段怎么读

| 字段 | 解释 |
|------|------|
| 区域 | top-level 目录、monorepo package，或核心源码目录。 |
| 层 | 当前区域主要承担的工程职责。 |
| 文件 / 代码 / 测试 / 文档 | 规模和验证密度。测试多的区域适合从断言反推契约。 |
| 信号 | 读这层源码时最该搜索的关键对象。 |
| 先读 | 第一批打开的 GitHub 文件入口。 |

## 与三篇静态源码解析的关系

| 内置仓库 | 矩阵作用 | 深入页 |
|----------|----------|--------|
| `langchain-ai/langchain` | 找 `create_agent`、Runnable、Tool、middleware 的装配边界。 | [LangChain 源码解析](./langchain.md) |
| `langchain-ai/langgraph` | 找 `StateGraph`、Pregel runtime、ToolNode、checkpoint 的执行边界。 | [LangGraph 源码解析](./langgraph.md) |
| `run-llama/llama_index` | 找 QueryEngine、Retriever、ResponseSynthesizer、Workflow 的 data-first 边界。 | [LlamaIndex 源码解析](./llamaindex.md) |

## 边界

- 输入必须是公开 GitHub 仓库：热门卡片、`owner/repo` 或 `https://github.com/owner/repo`。
- GitHub API 限流或网络失败时，三套内置仓库回退到本地矩阵；源码对话需要 raw source 可读取。
- 动态仓库矩阵、源码对话和 CodeMap 来自路径、文件名、关键词和源码行窗口启发式，不等于 DeepWiki 的 LLM 索引结果；它负责“首轮源码定位 + 可点击证据”，不是最终结论。
- 真正写报告时，仍要打开 GitHub 文件，沿函数调用和测试断言验证；对话回答只引用已检索源码；没有源码证据时只提示候选文件或读取失败，不编造未命中的实现。

## 练习

1. 从热门库卡片点 `microsoft/playwright`，观察它的测试 runner、浏览器协议和工具 runtime 被矩阵分到哪些层。
2. 解析 `langchain-ai/langgraph`，先读 `StateGraph` 和 Pregel runtime 两行。
3. 解析你自己的 GitHub 仓库，找出矩阵里“运行时”和“状态”层是否真的有测试。
4. 在源码对话里问 `ToolNode 如何执行工具调用？`，检查回答是否给出 `tool_node.py` 的行号引用，再切到 CodeMap 看工具层是否聚焦同一文件。
5. 对比 [LangChain 源码解析](./langchain.md) 的手写阅读路径，检查动态矩阵是否能定位同一批入口。

