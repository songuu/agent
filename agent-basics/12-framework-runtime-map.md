# B12 · Framework 与 Runtime 地图预备课

> 目标：学 LangGraph、Agents SDK、AI SDK 之前，先知道框架到底替你管理了哪些东西。框架不是魔法，只是把重复的 agent runtime 部件标准化。

## Runtime 部件

| 部件 | 负责什么 | 手写阶段对应 |
|------|----------|--------------|
| Model Client | 调模型、流式、usage | 第 02 章 `getLLM()` |
| Messages State | 管理对话和中间状态 | 第 07 章 memory |
| Tool Registry | 声明、校验、执行工具 | 第 06 章 ToolRegistry |
| Control Flow | 节点、边、循环、路由 | 第 04/10 章 agent loop |
| Checkpointer | 保存和恢复状态 | LangGraph L3 |
| Human Review | 中断、审批、恢复 | LangGraph L4 / 第 17 章 |
| Observability | trace、事件、成本 | 第 16 章 |
| Evaluation | 回归和质量门 | 第 15 章 |

## 框架解决什么

| 痛点 | 框架提供 |
|------|----------|
| 手写循环容易乱 | 标准 graph / runner |
| 工具和状态分散 | 注册表和 state schema |
| 多步任务难恢复 | checkpoint / thread |
| 多 agent 难编排 | supervisor、handoff、subgraph |
| 流式事件难统一 | event stream |
| 生产调试困难 | tracing、callbacks、run metadata |

## 框架不替你解决什么

- 业务边界。
- 权限策略。
- 数据质量。
- eval 样例。
- 成本预算。
- 产品体验。
- 何时拒答。

这些必须由你的应用定义。

## 学习顺序

1. 先手写第 04-07 章，理解 loop、tool、memory。
2. 再看第 12 章，比较框架封装了哪些重复劳动。
3. 用 LangGraph 专题深入 state、routing、checkpoint、HITL、多 agent。
4. 回到第 15-18 章，把框架接入测试、观测、安全和部署。

## 迁移策略

| 手写实现 | 迁移到框架时保留 |
|----------|------------------|
| Tool schema | 继续复用，避免重写工具契约 |
| eval set | 作为迁移验收 |
| trace 字段 | 映射到框架观测字段 |
| memory 策略 | 明确哪些进 state，哪些进 store |
| guardrail | 放到工具前后和节点边界 |

## 常见误区

1. 一上来学框架，以为复制模板就理解 agent。
2. 把业务规则写进框架节点名字，缺少可测试契约。
3. 以为 checkpoint 等于长期记忆。
4. 以为框架自带安全，忽略工具权限和人审。

## 自检练习

把第 04 章手写 agent loop 映射到 runtime 部件：

- 哪部分是 model client？
- 哪部分是 messages state？
- 哪部分是 tool registry？
- 哪部分是 control flow？
- 如果要支持恢复，checkpoint 应保存什么？

## 记住一句话

框架让 agent runtime 更标准；业务正确性仍然靠你的边界、数据和评估。
