# 毕业项目 · 合同风险审阅 Agent

> 所属阶段：**毕业项目 · 法务协作实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐⭐☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把合同条款、公司 playbook 和谈判历史变成风险清单，帮助业务先定位付款、责任、终止和数据条款风险。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个合同条款审阅工作流，输出风险等级、证据条款、建议改写和需法务确认的问题。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 法务运营
- 销售负责人
- 采购负责人

## 核心流程

```text
导入合同文本
  -> 按条款类型切分
  -> 匹配 playbook
  -> 计算风险等级
  -> 生成 redline 建议
  -> 整理法务确认清单
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `ClauseSegmenter` | ClauseSegmenter 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `PlaybookMatcher` | PlaybookMatcher 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `RiskScorer` | RiskScorer 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `RewriteAdvisor` | RewriteAdvisor 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `LegalReviewQueue` | LegalReviewQueue 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `msa-sample.md`
- `vendor-dpa.md`
- `legal-playbook.json`
- `negotiation-history.json`

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

- 只做辅助审阅不提供法律意见
- 高风险条款必须标记人工确认
- 建议改写必须保留原条款引用
- 不同司法辖区规则不能混用

## 里程碑

1. M0 条款切分和类型识别
2. M1 playbook 匹配和风险评分
3. M2 redline 建议和法务队列

## 验收清单

- [ ] 付款条款缺失被识别
- [ ] 无限责任标为高风险
- [ ] 数据处理条款触发 DPA 检查
- [ ] 未知辖区进入人工确认
- [ ] 建议改写带原文引用
- [ ] 低风险条款不误报

## 可扩展方向

- 接 Docx/PDF 抽取
- 接入审批系统
- 按客户等级调风险阈值
- 生成谈判邮件草稿

## 如何写进简历

> 实现合同风险审阅 Agent：按 playbook 识别付款、责任、终止、数据处理等风险，输出证据引用、改写建议和人工确认队列。

## 面试追问

1. 为什么合同审阅 Agent 必须保留人工法务确认？
2. playbook 和模型判断冲突时听谁？
3. 如何证明建议来自哪条原文？
4. 如何处理跨辖区合同？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_contract_risk_reviewer_workflow["合同条款切分"]
  n_cp_contract_risk_reviewer_quality["Playbook 风险匹配"]
  n_cp_contract_risk_reviewer_handoff["法务确认队列"]
  n_cp_contract_risk_reviewer_workflow -->|前置| n_cp_contract_risk_reviewer_quality
  n_cp_contract_risk_reviewer_quality -->|前置| n_cp_contract_risk_reviewer_handoff
  class n_cp_contract_risk_reviewer_workflow,n_cp_contract_risk_reviewer_quality,n_cp_contract_risk_reviewer_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
