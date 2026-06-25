# B7 · Workflow vs Agent

> 目标：知道什么时候应该用固定流程，什么时候才需要让模型自主决策。不是所有 AI 应用都应该做成 agent。

## 定义

| 形态 | 控制流 | 适合任务 |
|------|--------|----------|
| Workflow | 开发者写死步骤和分支 | 稳定、可预测、低风险流程 |
| Agent | 模型决定下一步行动 | 开放、多步、不确定任务 |

## 决策表

| 问题 | 如果答案是“是” | 倾向 |
|------|----------------|------|
| 步骤是否固定？ | 是 | Workflow |
| 数据源是否固定？ | 是 | Workflow |
| 是否需要模型选择工具？ | 是 | Agent |
| 是否需要反复观察再决策？ | 是 | Agent |
| 错误代价是否高？ | 是 | Workflow + 人审 |
| 是否只是分类/抽取/改写？ | 是 | Workflow |

## 常见架构

### 固定 Workflow

```text
input -> classify -> retrieve -> generate -> validate -> output
```

优点是可测试、可预估成本、好排查。

### Agent Loop

```text
goal -> think -> tool/action -> observe -> think -> ... -> final
```

优点是适应开放任务；代价是成本、延迟和不可预测性上升。

### 混合模式

多数生产系统是混合模式：

- 外层 workflow 控制权限、预算、日志和验收。
- 内层某一步允许模型规划或选工具。
- 高风险动作回到固定审批流程。

## 失败模式

| 失败 | 原因 | 修复 |
|------|------|------|
| 过度自治 | 固定任务也让模型自由决定 | 改回 workflow |
| 循环失控 | 没有 maxSteps 和预算 | 加停止条件 |
| 工具乱用 | 工具描述模糊 | 收紧 schema 和使用条件 |
| 难以调试 | 没有 trace | 记录每轮 thought/action/observation |

## 课程连接

- 第 10 章：ReAct、Plan-Execute、Reflection。
- 第 11 章：多 agent 协作。
- LangGraph 专题：把 workflow 和 agent loop 都建成状态图。
- 第 15/16 章：用 eval 和 trace 管住不确定性。

## 自检练习

判断下面需求该用 workflow 还是 agent：

- “把用户输入分类到 5 个固定标签。”
- “帮我调研一个陌生行业并输出引用报告。”
- “根据库存状态自动下单补货。”
- “从一封邮件中抽取发票金额。”

## 记住一句话

能用 workflow 稳定解决的事，不要为了显得智能而升级成 agent。
