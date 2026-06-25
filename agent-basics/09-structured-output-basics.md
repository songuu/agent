# B9 · Structured Output 基础

> 目标：结构化输出不是“让模型返回 JSON”这么简单。模型输出永远先当不可信输入处理，再 parse、validate、repair、fallback。

## 为什么需要结构化输出

| 场景 | 非结构化问题 | 结构化收益 |
|------|--------------|------------|
| 路由 | 文本里难判断下一步 | `route` enum 可直接分支 |
| 抽取 | 字段缺失难发现 | schema 能报错 |
| 评估 | judge 输出不稳定 | 固定 score/reason/evidence |
| 工具参数 | 参数自由漂移 | 类型和范围可校验 |

## 基本管线

```text
model output
  -> parse JSON
  -> validate schema
  -> repair or retry
  -> fallback / needs_input
  -> downstream logic
```

任何一步失败都不能静默吞掉。

## Schema 设计

| 设计点 | 建议 |
|--------|------|
| enum | 能枚举就不要自由文本 |
| required | 下游必须用的字段设必填 |
| nullable | 允许缺失时显式建模 |
| confidence | 区分高/中/低置信 |
| evidence | 要求引用输入片段或工具结果 |
| reason | 供人审和调试 |

## Retry-Repair

当 JSON 解析或 schema 校验失败时，可以把错误反馈给模型：

```text
Your JSON failed validation:
- field "priority" must be one of ["low","medium","high"]
Return only corrected JSON.
```

但 retry 有上限。超过上限后应返回 fallback，而不是无限重试。

## 常见误区

1. 只检查是不是 JSON，不检查字段语义。
2. 让模型输出“看起来像 JSON”的 Markdown fenced block。
3. 下游直接信任模型给出的路径、SQL、命令。
4. 修复失败后仍继续执行。

## 课程连接

- 第 13 章：结构化输出与校验。
- 第 15 章：把结构化字段接入 eval。
- 第 17 章：安全策略也需要结构化 verdict。
- code-review-crew：结构化 finding 和 severity。

## 自检练习

为“邮件重要性判断”设计 schema：

- `priority` 应该是哪些 enum？
- `requires_reply` 是 boolean 还是 enum？
- `evidence` 应该引用原文哪部分？
- 模型无法判断时如何表示？

## 记住一句话

JSON 只是文本；通过 schema 验证后，才开始接近可用数据。
