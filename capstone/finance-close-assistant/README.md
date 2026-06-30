# 毕业项目 · 财务月结助手 Agent

> 所属阶段：**毕业项目 · 财务运营实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐⭐☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把总账、应收应付、银行对账和月结 checklist 串起来，找出差异、缺凭证和需要人工确认的分录。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个月结巡检工作流，输出差异列表、解释候选、责任人、截止日期和审计包。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 财务会计
- 财务经理
- 审计协作人

## 核心流程

```text
加载账表快照
  -> 执行月结 checklist
  -> 匹配银行流水
  -> 识别异常分录
  -> 生成责任人队列
  -> 输出审计包
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `LedgerLoader` | LedgerLoader 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `CloseChecklistRunner` | CloseChecklistRunner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ReconciliationMatcher` | ReconciliationMatcher 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `JournalAnomalyDetector` | JournalAnomalyDetector 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `AuditPackBuilder` | AuditPackBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `general-ledger.csv`
- `bank-statement.csv`
- `close-checklist.json`
- `owner-map.json`

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

- 不自动过账或改账
- 金额差异必须带原始行号
- 高金额异常必须人工确认
- 输出避免泄漏银行完整账号

## 里程碑

1. M0 checklist 和流水匹配
2. M1 异常分录和责任队列
3. M2 审计包和脱敏报告

## 验收清单

- [ ] 银行差异被识别
- [ ] 缺凭证进入队列
- [ ] 高金额异常升级
- [ ] 账号脱敏
- [ ] 平衡账表不误报
- [ ] 审计包包含行号证据

## 可扩展方向

- 接 ERP 导出
- 生成 Slack 提醒
- 接审批附件
- 按实体和币种拆分月结

## 如何写进简历

> 实现财务月结助手 Agent：执行月结 checklist、银行对账、异常分录识别和审计包生成，所有差异保留行号证据和人工确认边界。

## 面试追问

1. 为什么财务 Agent 不能自动改账？
2. 金额差异证据如何保真？
3. 如何处理多币种对账？
4. 脱敏和审计追溯如何兼顾？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_finance_close_assistant_workflow["月结 checklist"]
  n_cp_finance_close_assistant_quality["银行流水对账"]
  n_cp_finance_close_assistant_handoff["审计包生成"]
  n_cp_finance_close_assistant_workflow -->|前置| n_cp_finance_close_assistant_quality
  n_cp_finance_close_assistant_quality -->|前置| n_cp_finance_close_assistant_handoff
  class n_cp_finance_close_assistant_workflow,n_cp_finance_close_assistant_quality,n_cp_finance_close_assistant_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
