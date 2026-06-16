---
title: "毕业项目扩充（新增 3 个综合实战 capstone + 最全面解析）"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
mode: "--auto + caveman"
tasks_total: 6
tasks_completed: 6
tags: [sprint, capstone, curriculum, content]
aliases: ["毕业项目扩充", "capstone 新增"]

invariants:
  - "KG 唯一编辑点 = knowledge-graph/data/graph.ts；README 的 <!-- KG:START..END --> 区由 npm run kg 自动生成，禁手改"
  - "毕业项目离线确定：needsKey 'none'，输出由构造保证（teaching-demo-deterministic 本能）"
  - "只新增、不改动现有 2 个 capstone（deep-research-agent / rag-system）与 lessons/rag-advanced/langgraph 源码"
  - "新 capstone 复用 src/shared 稳定原语，不 fork 逻辑；typecheck 全绿"
  - "新增 KG 节点/边只追加，不重排现有条目（并行会话安全）"

invariant_tests:
  - "pnpm typecheck（全仓 tsc --noEmit）"
  - "3 个 capstone smoke 入口各自跑通（确定退出码/输出）"
  - "npm run kg 重生成无 diff 漂移（仅新增章节块）"
---

# 毕业项目扩充

## Phase 1: 需求分析
- Scope：给 `capstone/` 新增 3 个综合实战毕业项目，各自可运行、离线确定（needsKey none）、复用 `src/shared`；配 deep-research-agent 同级「最全面解析」README + KG 块；注册 package.json / navigation / curriculum / KG graph.ts。
- Non-scope：不碰现有 2 项目；不改课程章节源码；不推远端；不需 API key。
- Success：3 项目 src+smoke 跑通（确定输出）、typecheck 全绿、KG 重生成一致、导航/大纲挂上。
- 现状基线：capstone/ 仅 2 项 —— deep-research-agent（完整，Plan-Execute 研究型，needsKey embedding）、rag-system（checkpoint，离线，外链 songuu/rag-system）。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承
| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| KG 管线 | graph.ts 唯一 SoT，README KG 区自动生成 | 仅改 graph.ts 追加章节/概念/边，跑 npm run kg 回填 |
| 离线教学 demo | needsKey none、输出构造保证（langgraph/rag-advanced 全离线） | 3 项目纯函数+固定语料+规则裁判，零 key 可跑 |
| 内容增量安全 | 新增只追加不重排 | KG 节点/导航/大纲表格末尾追加 |
| shared 复用 | lesson 用子路径精确导入 | capstone 从 src/shared 子路径导入稳定原语 |

### 入场扫描 - 集成路径
| 改动点 | 触发 | 中间层 | 持久化 | 刷新可见 |
|--------|------|--------|--------|----------|
| 3 个 capstone src + smoke | pnpm <script> | 复用 src/shared 原语 | ✅ 文件落盘 | ✅ 课程导航/大纲挂链 |
| graph.ts +3 章节节点/概念/边 | npm run kg | generate.ts 渲染 | ✅ 各 README KG 块 | ✅ 交互式图谱含新节点 |

链路无 ❌：项目→注册→KG 自动回填，完整闭环。远端 supabase / 推送本 sprint 不做。

### 入场扫描 - 债务清单
| 来源 | 议题 | 本 sprint 决策 |
|------|------|----------------|
| 前序 supabase sprint | 弱 DB 密码对齐平台值（值仅存 .env） | 明确推迟（运维项，非本 content sprint）|
| rag-system | 外链 songuu/rag-system 生产项目 | 不动，本 sprint 只加新项目 |

### 任务表
| Task | 内容 | 风险 |
|------|------|------|
| T1 | capstone/support-copilot：src(记忆+RAG混合检索+工具+HITL审批+注入/PII安全+成本) + smoke + 最全面 README + package script | L2 |
| T2 | capstone/code-review-crew：src(多智能体 supervisor/并行 team + 结构化发现 zod + 严重度排序 + 评审门) + smoke + README + script | L2 |
| T3 | capstone/agent-eval-harness：src(golden 轨迹集 + 离线规则裁判 + 指标 + CI gate exit code) + smoke + README + script | L2 |
| T4 | KG graph.ts 追加 3 章节节点 + 概念节点 + 边；npm run kg 回填各 README KG 块 | L2 |
| T5 | navigation.md + curriculum.md + capstone 索引挂 3 项目链接 | L1 |
| T6 | 终检：pnpm typecheck 全绿 + 3 smoke 跑通 + KG 一致 | L1 |

验证策略：纯离线确定。每项目 smoke 入口跑出固定结果（断言/退出码）；typecheck 守类型；npm run kg 守 KG 一致。无需远端、无 key。

## Phase 3: 变更日志
- T1 ✅ capstone/support-copilot：5 文件（knowledgeBase/session/policy/copilot/scenario）+ cli + smoke。单轮纵深管线：安全→记忆→路由→RAG/工具→HITL→脱敏→Tracer。smoke 7 轮全绿，工具调用 3 次。
- T2 ✅ capstone/code-review-crew：samples/reviewers/crew + cli + smoke。多智能体并行评审（security/perf/style）+ zod 校验 + 去重排序 + 评审门。smoke 11 发现/4 critical/BLOCK。
- T3 ✅ capstone/agent-eval-harness：subject/goldenSet/harness + cli + smoke。golden 集 + 离线裁判 + 指标聚合 + 回归门。smoke：合规 PASS、退化 BLOCK（拒答准确率 0）。
- T4 ✅ graph.ts +3 章节 +17 概念 +30 边；npm run kg → 39 单元/238 概念/381 关系；3 README KG 块注入；幂等复跑 0 更新。
- T5 ✅ navigation.md（快速入口 + 顺序表 3 行）+ curriculum.md（汇总 + 项目表 4 行 + 合计时长）。
- T6 ✅ 终检：tsc 0 err；3 CLI 实跑符合预期；KG 幂等；前置链接 12/12 存在；sidebar 由 graph.ts CHAPTERS 派生→新项目自动进网站。
- 清理：删除 reviewers.ts 未用的 PERFORMANCE_RULES（dead code，复核前自清）。

## Phase 4: 审查结果（6 视角）
P0: 无。P1: 无（dead code 已在复核前清）。
- 架构：3 项目复用 src/shared 稳定原语零 fork；编排/执行解耦（规则占位，接口不变可换 LLM）。KG SoT 守住（仅改 graph.ts）。
- 安全：无 secret（评审样本 `sk-live-AbCd…` 是演示占位符非真密钥）；无 .env 改动；注入/PII 复用 shared 纯函数。
- 性能：纯离线确定，BM25/规则扫描 O(n)，无回归。
- 代码质量：immutable session；显式类型；console.log 仅 cli/smoke 入口（符合既有 capstone 惯例）。
- 测试覆盖：每项目 smoke 断言全分支 + 非零退出码；tsc 全绿；L2 风险 smoke 足够。
- 第6视角（集成连续性）：graph.ts/导航/大纲均末尾追加不重排→并行会话安全；KG 自动回填闭环；新 capstone 经 CHAPTERS 自动进 sidebar（无需手改 config.mts，该文件改动属并行 langgraph 会话）；package script 齐；无破坏既有 invariant。
- P2（记入不展开）：support-copilot 的 RAG 用 BM25 词法检索（非向量/混合），README 已诚实标注「可换向量」；后续可加 embeddingFixture 离线向量版。

## Phase 5: 复利记录
- 经验沿用既有本能：[[teaching-demo-deterministic-payoff]]（离线确定 + 构造保证）、[[kg-data-driven-doc-generation]]（单一 SoT 派生）、[[ts-heterogeneous-tool-registry]]（defineTool 类型擦除）。
- 增量更新 2 条本能：
  - teaching-demo-deterministic-payoff += 「毕业项目离线化模式」：把 LLM 决策点（意图路由/风控/裁判）替换成确定性规则占位，项目得以 smoke 可回归；真实接入只换实现、编排骨架不动（接口不变实现可换）。+ 意图关键词路由的 question-gating 坑（「退款」会误吞「退款几天到账」咨询）。
  - kg-data-driven-doc-generation += VitePress sidebar 由 graph.ts CHAPTERS 单源派生：加章节只改 graph.ts，网站/KG/README 全自动，无需手改 config.mts。
- 无新 solution doc（纯新增、无非平凡 bug）。
- status → completed。

> ⚠️ 提交边界：working tree 有并行会话改动（.vitepress/config.mts、navigation.md 部分行、langgraph-advanced/README.md、langgraph-production-* 文档、handoff-11）。提交前必须挑拣**仅本 sprint 的 capstone/* 新文件 + 我改的 graph.ts/导航/大纲/package.json/KG 产物**，勿卷入并行会话改动。push/commit 为强制人工 gate，待用户 go。
