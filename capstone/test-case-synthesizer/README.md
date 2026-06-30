# 毕业项目 · 测试用例生成 Agent

> 所属阶段：**毕业项目 · 质量工程实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐⭐☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把需求、接口契约和历史缺陷转成测试矩阵，生成正常、边界、异常和回归用例。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个测试设计工作流，输出覆盖矩阵、测试数据、优先级、自动化候选和缺口。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- QA 工程师
- 开发者
- 测试负责人

## 核心流程

```text
解析需求和接口
  -> 抽取业务规则
  -> 生成覆盖矩阵
  -> 设计测试数据
  -> 标记自动化价值
  -> 生成回归清单
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `RequirementParser` | RequirementParser 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ContractAnalyzer` | ContractAnalyzer 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `CoverageMatrixBuilder` | CoverageMatrixBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `BoundaryCaseGenerator` | BoundaryCaseGenerator 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `AutomationRanker` | AutomationRanker 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `requirements.md`
- `openapi.json`
- `bug-history.json`
- `risk-tags.json`

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

- 不生成无法执行的空泛用例
- 每个用例必须映射需求或缺陷
- 高风险路径优先
- 自动化建议要说明维护成本

## 里程碑

1. M0 需求/接口解析
2. M1 覆盖矩阵和测试数据
3. M2 自动化优先级和回归清单

## 验收清单

- [ ] 每条需求有覆盖
- [ ] 边界值包含最小/最大/空值
- [ ] 历史缺陷进入回归
- [ ] 无来源用例被拒绝
- [ ] 高风险优先排序
- [ ] 输出可转 CSV

## 可扩展方向

- 生成 Playwright/Vitest skeleton
- 接 TestRail/Xray
- 按风险生成 smoke/regression 套件
- 失败用例回流需求缺口

## 如何写进简历

> 实现测试用例生成 Agent：从需求、OpenAPI 和缺陷历史生成覆盖矩阵、边界数据、回归清单和自动化优先级。

## 面试追问

1. 测试用例为什么必须有来源映射？
2. 自动化价值如何排序？
3. 如何避免生成不可执行用例？
4. 历史缺陷如何转成回归资产？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_test_case_synthesizer_workflow["需求覆盖矩阵"]
  n_cp_test_case_synthesizer_quality["边界测试数据"]
  n_cp_test_case_synthesizer_handoff["回归缺陷清单"]
  n_cp_test_case_synthesizer_workflow -->|前置| n_cp_test_case_synthesizer_quality
  n_cp_test_case_synthesizer_quality -->|前置| n_cp_test_case_synthesizer_handoff
  class n_cp_test_case_synthesizer_workflow,n_cp_test_case_synthesizer_quality,n_cp_test_case_synthesizer_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
