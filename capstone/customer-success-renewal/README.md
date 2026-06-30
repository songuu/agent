# 毕业项目 · 客户成功续约 Agent

> 所属阶段：**毕业项目 · 客户成功实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐☆☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把使用量、工单、健康度和合同信息整理成续约风险和 QBR 议程，帮助 CSM 提前干预。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个续约健康工作流，输出风险分层、证据、推荐动作、QBR 议程和 follow-up。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- CSM
- 客户成功负责人
- 销售

## 核心流程

```text
导入账号使用数据
  -> 计算健康度
  -> 关联工单情绪
  -> 识别续约风险
  -> 生成 QBR 议程
  -> 输出行动计划
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `UsageSignalLoader` | UsageSignalLoader 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `TicketSentimentSummarizer` | TicketSentimentSummarizer 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `HealthScoreCalculator` | HealthScoreCalculator 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `RenewalRiskClassifier` | RenewalRiskClassifier 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `QbrAgendaBuilder` | QbrAgendaBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `account-usage.json`
- `support-tickets.json`
- `contract-renewals.json`
- `playbook.json`

最小输出契约：

```ts
type CapstoneResult = {
  status: "ok" | "needs_review" | "blocked";
  summary: string;
  evidence: Array<{ source: string; quote: string; confidence: "low" | "medium" | "high" }>;
  actions: Array<{ owner: string; nextStep: string; due?: string; requiresApproval: boolean }>;
  risks: Array<{ level: "low" | "medium" | "high"; reason: string }>;
};
```

## 护栏与人工确认

- 不暴露客户敏感联系人信息
- 风险判断必须带信号证据
- 低使用量和产品问题分开归因
- 折扣建议不自动生成

## 里程碑

1. M0 健康度计算
2. M1 风险归因和动作推荐
3. M2 QBR 议程和跟进计划

## 验收清单

- [ ] 低使用量触发风险
- [ ] 负面工单提高风险
- [ ] 合同临近提高优先级
- [ ] 联系人脱敏
- [ ] 健康账号不误报
- [ ] QBR 包含证据

## 可扩展方向

- 接 CRM/CS 平台
- 生成客户邮件草稿
- 按 segment 调阈值
- 对比上季度趋势

## 如何写进简历

> 实现客户成功续约 Agent：聚合使用量、工单和合同信号，输出健康分、续约风险、推荐动作和 QBR 议程。

## 面试追问

1. 续约风险如何避免只看使用量？
2. 客户敏感信息如何脱敏？
3. QBR 议程如何可追溯？
4. 折扣为什么不自动建议？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_customer_success_renewal_workflow["客户健康评分"]
  n_cp_customer_success_renewal_quality["续约风险归因"]
  n_cp_customer_success_renewal_handoff["QBR 议程生成"]
  n_cp_customer_success_renewal_workflow -->|前置| n_cp_customer_success_renewal_quality
  n_cp_customer_success_renewal_quality -->|前置| n_cp_customer_success_renewal_handoff
  class n_cp_customer_success_renewal_workflow,n_cp_customer_success_renewal_quality,n_cp_customer_success_renewal_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
