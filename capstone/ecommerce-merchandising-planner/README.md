# 毕业项目 · 电商选品运营 Agent

> 所属阶段：**毕业项目 · 电商运营实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐☆☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把商品表现、库存、评价和活动日历整理成选品、定价和内容优化建议。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个 merchandising 工作流，输出商品分层、库存风险、内容缺口、活动建议和监控指标。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 电商运营
- 商品经理
- 增长负责人

## 核心流程

```text
加载商品表现
  -> 关联库存和评价
  -> 识别机会商品
  -> 检测内容缺口
  -> 规划活动组合
  -> 生成运营看板摘要
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `ProductPerformanceLoader` | ProductPerformanceLoader 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `InventoryRiskDetector` | InventoryRiskDetector 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ReviewThemeMiner` | ReviewThemeMiner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `AssortmentPlanner` | AssortmentPlanner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `CampaignBriefBuilder` | CampaignBriefBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `product-performance.csv`
- `inventory.json`
- `reviews.json`
- `campaign-calendar.json`

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

- 不自动改价格或库存
- 推荐必须带销售/库存证据
- 评价中的 PII 脱敏
- 合规敏感类目单独标记

## 里程碑

1. M0 商品表现和库存风险
2. M1 评价主题和内容缺口
3. M2 活动组合和摘要

## 验收清单

- [ ] 高销量低库存触发风险
- [ ] 差评主题被聚类
- [ ] 机会商品可解释
- [ ] PII 脱敏
- [ ] 敏感类目不自动推荐促销
- [ ] 活动建议含 KPI

## 可扩展方向

- 接 Shopify/淘宝导出
- 生成商品详情优化稿
- 接 BI 看板
- 按季节和节日调策略

## 如何写进简历

> 实现电商选品运营 Agent：聚合商品表现、库存、评价和活动日历，输出机会商品、库存风险、内容缺口和活动建议。

## 面试追问

1. 为什么不能让 Agent 自动改价格？
2. 商品机会如何解释？
3. 评价文本有什么安全风险？
4. 库存和营销建议如何联动？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_ecommerce_merchandising_planner_workflow["商品机会分层"]
  n_cp_ecommerce_merchandising_planner_quality["库存风险检测"]
  n_cp_ecommerce_merchandising_planner_handoff["活动组合建议"]
  n_cp_ecommerce_merchandising_planner_workflow -->|前置| n_cp_ecommerce_merchandising_planner_quality
  n_cp_ecommerce_merchandising_planner_quality -->|前置| n_cp_ecommerce_merchandising_planner_handoff
  class n_cp_ecommerce_merchandising_planner_workflow,n_cp_ecommerce_merchandising_planner_quality,n_cp_ecommerce_merchandising_planner_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
