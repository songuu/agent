# 毕业项目 · 科研基金申请 Agent

> 所属阶段：**毕业项目 · 科研管理实战**
> 预计用时：4-6 小时 | 难度：⭐⭐⭐⭐☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把基金指南、团队成果、预算规则和时间表整理成申请计划和材料缺口。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个基金申请规划工作流，输出指南匹配、创新点、任务分工、预算风险和提交日程。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 科研 PI
- 科研秘书
- 项目经理

## 核心流程

```text
解析基金指南
  -> 匹配团队成果
  -> 识别材料缺口
  -> 生成研究计划骨架
  -> 检查预算规则
  -> 输出提交日程
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `CallForProposalParser` | CallForProposalParser 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ResearchAssetMatcher` | ResearchAssetMatcher 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `GapPlanner` | GapPlanner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `BudgetRuleChecker` | BudgetRuleChecker 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `SubmissionTimelineBuilder` | SubmissionTimelineBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `grant-call.md`
- `team-publications.json`
- `budget-rules.json`
- `submission-calendar.json`

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

- 不编造成果和论文
- 预算建议必须引用规则
- 合作单位承诺需人工确认
- 生成文本标记为草稿

## 里程碑

1. M0 指南解析和成果匹配
2. M1 缺口和研究计划骨架
3. M2 预算检查和提交日程

## 验收清单

- [ ] 硬性资格条件被抽取
- [ ] 成果匹配含来源
- [ ] 预算超限报警
- [ ] 缺材料生成 owner
- [ ] 草稿标记清晰
- [ ] 时间表倒排合理

## 可扩展方向

- 接 ORCID/Google Scholar 导出
- 生成摘要多版本
- 同步日历提醒
- 按基金类型切模板

## 如何写进简历

> 实现科研基金申请 Agent：解析基金指南，匹配团队成果，生成研究计划骨架、材料缺口、预算风险和提交倒排日程。

## 面试追问

1. 如何避免编造研究成果？
2. 预算规则如何可追溯？
3. 合作承诺为什么必须人工确认？
4. 申请文本如何区分草稿和事实？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_grant_proposal_planner_workflow["基金指南解析"]
  n_cp_grant_proposal_planner_quality["团队成果匹配"]
  n_cp_grant_proposal_planner_handoff["预算规则检查"]
  n_cp_grant_proposal_planner_workflow -->|前置| n_cp_grant_proposal_planner_quality
  n_cp_grant_proposal_planner_quality -->|前置| n_cp_grant_proposal_planner_handoff
  class n_cp_grant_proposal_planner_workflow,n_cp_grant_proposal_planner_quality,n_cp_grant_proposal_planner_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
