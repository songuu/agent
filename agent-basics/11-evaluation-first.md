# B11 · Evaluation 先行

> 目标：Agent demo 很容易看起来能跑。真正能迭代，需要最小 eval 集告诉你每次改动有没有退化。

## 为什么先做 Eval

Prompt、模型、检索、工具、排序、上下文都会影响结果。没有 eval，你只能靠感觉判断“好像更好了”。

Eval 的作用：

- 固化关键行为。
- 捕获回归。
- 比较模型和参数。
- 暴露失败类型。
- 让发布前有质量门。

## Eval 类型

| 类型 | 测什么 | 示例 |
|------|--------|------|
| 规则断言 | 结构和硬性字段 | JSON 能 parse，route 在 enum 内 |
| Golden Set | 固定输入的期望行为 | 客服问题应该拒绝退款越权 |
| LLM-as-judge | 语义质量 | 答案是否忠实于证据 |
| RAG Eval | 检索和引用 | 是否召回正确文档、引用是否匹配 |
| Agent Trace Eval | 多步行为 | 是否在预算内选对工具并停止 |

## 最小 Eval 集

不要一开始追求 1000 条。先覆盖高价值失败：

1. 正常路径。
2. 边界输入。
3. 无证据场景。
4. 工具错误场景。
5. prompt injection 场景。
6. 高风险动作需要确认场景。

## 失败分类

| 失败 | 说明 | 优先排查 |
|------|------|----------|
| Retrieval miss | 没检索到证据 | chunk、query、top-k、rerank |
| Context pollution | 带入了错误资料 | 过滤、排序、去重 |
| Format drift | 输出不符合 schema | prompt、schema、repair |
| Tool misuse | 调错工具或参数错 | tool 描述、schema、权限 |
| Over-answer | 无证据也回答 | refusal policy、citation check |
| Budget overrun | 步数或 token 超限 | maxSteps、上下文压缩 |

## CI 策略

| 时机 | 跑什么 |
|------|--------|
| 每次提交 | smoke eval、schema test、关键单元测试 |
| 发布前 | 完整 golden set、RAG eval、安全样例 |
| 定时任务 | 漂移监控、成本和延迟基线 |
| 事故后 | 新增回归样例 |

## 课程连接

- 第 15 章：评估与测试。
- 第 16 章：trace 和指标。
- agent-eval-harness：离线回归门。
- code-review-crew：结构化 finding 作为可测输出。

## 自检练习

为一个“知识库问答 agent”写 6 条 eval：

- 2 条正常问答。
- 1 条无答案拒答。
- 1 条 prompt injection。
- 1 条引用必须匹配来源。
- 1 条检索不到时不能编造。

## 记住一句话

没有 eval 的 agent 只能演示；有 eval 的 agent 才能迭代。
