# 毕业项目 · 临床问诊分流助手 Agent

> 所属阶段：**毕业项目 · 医疗运营实战**
> 预计用时：4-6 小时 | 难度：⭐⭐⭐⭐⭐
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把患者自述、基础问卷和机构分流规则整理成非诊断型 intake 摘要，帮助人工医护更快接手。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个高安全边界的医疗 intake 工作流，输出症状摘要、紧急信号、缺失信息和人工分流建议。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 分诊护士
- 诊所运营
- 患者服务团队

## 核心流程

```text
收集自述与问卷
  -> 脱敏个人信息
  -> 识别紧急红旗
  -> 匹配分流规则
  -> 列出缺失问题
  -> 生成给医护的摘要
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `IntakeNormalizer` | IntakeNormalizer 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `PiiRedactor` | PiiRedactor 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `RedFlagDetector` | RedFlagDetector 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `TriageRuleMatcher` | TriageRuleMatcher 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ClinicianBriefBuilder` | ClinicianBriefBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `patient-intake.json`
- `triage-rules.json`
- `red-flags.json`
- `clinic-policy.md`

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

- 不做诊断和治疗建议
- 红旗症状必须升级人工/急诊提示
- 输出面向医护而非替代医生
- 健康数据全程脱敏和最小化

## 里程碑

1. M0 intake 归一和脱敏
2. M1 红旗和分流规则
3. M2 医护摘要和人工升级

## 验收清单

- [ ] 红旗症状触发升级
- [ ] 无红旗进入常规分流
- [ ] 缺失信息生成追问
- [ ] PII 被脱敏
- [ ] 诊断词不出现在建议中
- [ ] 规则版本写入报告

## 可扩展方向

- 接预约系统
- 多语言 intake
- 医护确认反馈回流
- 按科室维护规则集

## 如何写进简历

> 实现临床问诊分流助手 Agent：在不诊断的边界内完成 intake 脱敏、红旗识别、分流规则匹配和医护摘要生成。

## 面试追问

1. 为什么该 Agent 不能给诊断？
2. 红旗信号如何改变控制流？
3. 如何证明输出没有泄漏健康隐私？
4. 规则更新后如何回放旧案例？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_clinical_intake_assistant_workflow["非诊断 intake 摘要"]
  n_cp_clinical_intake_assistant_quality["红旗症状升级"]
  n_cp_clinical_intake_assistant_handoff["医护人工分流"]
  n_cp_clinical_intake_assistant_workflow -->|前置| n_cp_clinical_intake_assistant_quality
  n_cp_clinical_intake_assistant_quality -->|前置| n_cp_clinical_intake_assistant_handoff
  class n_cp_clinical_intake_assistant_workflow,n_cp_clinical_intake_assistant_quality,n_cp_clinical_intake_assistant_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
