# 毕业项目 · 数据质量哨兵 Agent

> 所属阶段：**毕业项目 · 数据平台实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐⭐☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把数据表快照、质量规则和下游报表依赖串成巡检流程，发现 schema 漂移、空值暴涨、口径异常和影响范围。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个数据质量巡检工作流，输出异常、影响报表、可能根因、回滚建议和通知摘要。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 数据工程师
- 分析师
- 业务负责人

## 核心流程

```text
读取数据 profile
  -> 执行质量规则
  -> 检测 schema 漂移
  -> 映射下游依赖
  -> 归因异常窗口
  -> 生成影响通告
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `DatasetProfiler` | DatasetProfiler 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `RuleRunner` | RuleRunner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `SchemaDriftDetector` | SchemaDriftDetector 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `LineageMapper` | LineageMapper 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ImpactReporter` | ImpactReporter 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `orders-profile.json`
- `warehouse-rules.json`
- `lineage-map.json`
- `incident-window.json`

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

- 不自动删除或修复生产数据
- 异常结论必须带样本和规则 id
- 影响范围按 lineage 计算不靠猜测
- 统计口径变化单独标记

## 里程碑

1. M0 profile 与规则执行
2. M1 schema/分布漂移检测
3. M2 lineage 影响报告

## 验收清单

- [ ] 空值率超过阈值报警
- [ ] 新增字段被识别为漂移
- [ ] 下游报表影响可追溯
- [ ] 无异常时报告为空
- [ ] 规则缺失时报配置错误
- [ ] 样本值脱敏展示

## 可扩展方向

- 接 dbt manifest
- 接 Great Expectations
- 写入 Slack/飞书告警
- 生成修复 PR 草稿

## 如何写进简历

> 实现数据质量哨兵 Agent：用 profile、规则和 lineage 识别 schema/分布异常，输出影响范围、样本证据、根因假设和安全通告。

## 面试追问

1. 为什么质量 Agent 不能自动改生产数据？
2. schema drift 和业务口径变化怎么区分？
3. lineage 在告警里解决什么问题？
4. 如何降低空值异常误报？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_data_quality_sentinel_workflow["数据质量规则"]
  n_cp_data_quality_sentinel_quality["Schema 漂移检测"]
  n_cp_data_quality_sentinel_handoff["Lineage 影响报告"]
  n_cp_data_quality_sentinel_workflow -->|前置| n_cp_data_quality_sentinel_quality
  n_cp_data_quality_sentinel_quality -->|前置| n_cp_data_quality_sentinel_handoff
  class n_cp_data_quality_sentinel_workflow,n_cp_data_quality_sentinel_quality,n_cp_data_quality_sentinel_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
