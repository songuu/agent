# 毕业项目 · 现场服务调度 Agent

> 所属阶段：**毕业项目 · 服务交付实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐⭐☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把工单、技师技能、地理区域、备件和 SLA 整理成派单建议，降低迟到和重复上门。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个派单调度工作流，输出工单优先级、技师匹配、备件检查、路线建议和 SLA 风险。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 服务调度员
- 现场技师
- 售后负责人

## 核心流程

```text
导入工单队列
  -> 识别技能和备件需求
  -> 匹配技师可用性
  -> 计算 SLA 风险
  -> 生成派单建议
  -> 输出客户沟通摘要
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `WorkOrderLoader` | WorkOrderLoader 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `SkillRequirementParser` | SkillRequirementParser 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `PartsAvailabilityChecker` | PartsAvailabilityChecker 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `TechnicianMatcher` | TechnicianMatcher 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `SlaRiskPlanner` | SlaRiskPlanner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `work-orders.json`
- `technicians.json`
- `parts-inventory.json`
- `sla-policy.json`

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

- 不自动确认上门时间
- 客户隐私地址最小展示
- 技能不匹配不派单
- 备件缺失必须提示

## 里程碑

1. M0 工单和技能解析
2. M1 技师/备件/SLA 匹配
3. M2 派单建议和客户摘要

## 验收清单

- [ ] 技能不匹配被拒绝
- [ ] 备件缺失报警
- [ ] SLA 临期提高优先级
- [ ] 地址脱敏展示
- [ ] 不可用技师不被推荐
- [ ] 摘要不泄漏内部备注

## 可扩展方向

- 接地图 API
- 同步日历
- 移动端技师确认
- 用历史维修时长校准排程

## 如何写进简历

> 实现现场服务调度 Agent：根据工单、技能、备件、技师可用性和 SLA 生成派单建议、风险提示和客户沟通摘要。

## 面试追问

1. 为什么不能自动确认上门？
2. 技能和备件哪个先过滤？
3. SLA 风险如何改变优先级？
4. 客户地址如何最小化展示？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_field_service_dispatch_workflow["工单技能匹配"]
  n_cp_field_service_dispatch_quality["备件可用性检查"]
  n_cp_field_service_dispatch_handoff["SLA 派单风险"]
  n_cp_field_service_dispatch_workflow -->|前置| n_cp_field_service_dispatch_quality
  n_cp_field_service_dispatch_quality -->|前置| n_cp_field_service_dispatch_handoff
  class n_cp_field_service_dispatch_workflow,n_cp_field_service_dispatch_quality,n_cp_field_service_dispatch_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
