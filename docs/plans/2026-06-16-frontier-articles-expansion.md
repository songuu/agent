---
title: "前沿与生态文章扩充（数量+质量）"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
mode: "--auto + caveman"
tasks_total: 4
tasks_completed: 4
tags: [sprint, content, frontier, curation]
aliases: ["前沿文章扩充", "ch19 文章新增"]

invariants:
  - "ch19 文章唯一编辑点 = graph.ts ARTICLES（chapters 含 19）；frontier-articles.ts 只派生不手填"
  - "新增只追加、不重排现有条目（并行 frontier 会话安全）"
  - "URL 必须真实可达；source/layer 准确；不与现存 59 篇重复"
  - "frontier-NN / sortOrder 是按下标派生的代理键，seed 的 on-conflict 只用 slug（位置代理键不加 unique，P2 教训）"

invariant_tests:
  - "tsx 派生 FRONTIER_ARTICLES（layer/kind 分布 + dup url/slug = none）"
  - "npm run supabase:frontier-seed 重生成 seed 一致"
---

# 前沿与生态文章扩充

## Phase 1: 需求分析
- Scope：给第 19 章「前沿与生态」新增真实前沿文章，优先补薄弱层拉平生态地图；质量门槛 = URL 真实、source/layer 准、note 贴合、不重复。
- Non-scope：不碰 interview_questions/其他章；不改派生器/UI 结构；不推远端。
- Success：净增 ~11 篇真实文章，8 层每层 ≥4（最薄从 3→6），无 dup，seed 重生成一致，tsx 跑通。
- 现状基线：59 篇；层分布 foundation 3 / model-platform 4 / protocol 8 / runtime 6 / product-ui 8 / data-memory 5 / evaluation 14 / security-governance 11（evaluation+security 占 42% 失衡）。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承
| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| frontier 管线 | graph.ts 唯一 SoT，frontier-articles.ts 派生 | 只改 graph.ts ARTICLES，追加显式 ecosystemLayer 项 |
| seed 代理键 | 位置代理键(frontier-NN)不加 unique，只 slug unique | 不动 seed 约束；仅追加文章后重生成 |
| 并行会话安全 | 不重排现有条目 | 新增插在 869 行后（显式 layer 块末），现有顺序不变 |

### 入场扫描 - 集成路径
| 改动点 | 触发 | 中间层 | 持久化 | 刷新可见 |
|--------|------|--------|--------|----------|
| graph.ts +11 文章 | 派生 FRONTIER_ARTICLES | frontier-articles.ts map | ✅ seed.sql 重生成 | ✅ 课程页/seed 一致 |

链路无 ❌：新增文章经派生→seed 完整闭环。远端 supabase 同步本 sprint 不做（需用户显式 go，复用既有 push 流程）。

### 入场扫描 - 债务清单
| 来源 | 议题 | 本 sprint 决策 | 
|------|------|----------------|
| 前序 supabase sprint | 弱 DB 密码轮换（值仅存 .env，不入文档） | 明确推迟（运维项，非本 content sprint）|
| 并行 frontier 会话 | 33→59/layer 演进 | 已落地，本 sprint 基于 59 增量 |

### 任务表
| Task | 内容 | 风险 |
|------|------|------|
| T1 | graph.ts 追加 11 篇真实文章（已 web 核验 URL/source/layer） | L2 |
| T2 | 派生校验：tsx 跑 FRONTIER_ARTICLES，确认 70 篇/无 dup/层分布 | L1 |
| T3 | 重生成 seed：npm run supabase:frontier-seed，确认 70 行 | L1 |
| T4 | 更新 supabase/README.md（59→70 + 层数） | L0 |

验证策略：纯数据+派生，离线确定。无需远端、无 key。

## Phase 3: 变更日志
- T1 ✅ graph.ts 追加 11 篇真实文章（插入 869 行后，显式 ecosystemLayer，现有顺序不动）。
- T2 ✅ tsx 派生：70 篇，dup url/slug=none，最薄层 6≥4。
- T3 ✅ npm run supabase:frontier-seed → seed 70 行，frontier-60..70 齐。
- T4 ✅ supabase/README.md 59→70 + 层分布。
- 回归：tsc --noEmit 全绿（graph.ts 下游导入未破坏）。

## Phase 4: 审查结果
P0: 无。P1: 无。
- 架构：SoT 守住（仅 graph.ts 编辑，frontier-articles.ts 纯派生）。
- 安全：URL 均公开来源，无 secret/凭据泄漏。
- 质量（用户核心诉求）：11 条 URL 全部经 WebSearch/WebFetch 核验为真实条目（无编造 arXiv ID）；source/layer 准确；与现存 59 篇零重复（派生器 dup 检查 + 标题比对）。
- 第6视角（集成连续性）：只追加不重排 → 并行会话安全；位置代理键 unique 约束未动（P2 教训保持）；seed 重生成一致，闭环无断点。
- P2（记入不展开）：foundation/data-memory 仍是相对增量，evaluation(14) 仍偏重——后续可继续补 protocol/foundation 经典（如 Toolformer、A2A 里程碑）拉更平。

## Phase 5: 复利记录
- 经验沿用既有本能：[[kg-data-driven-doc-generation]]（单一 SoT 派生）、[[teaching-demo-deterministic-payoff]]（构造保证/真实性）。
- 新增策展方法（已含于上述本能，不另建以免重复）：扩充前先算层/类目分布定位失衡 → web 核验真实 URL → 只增量追加（派生器 dup 兜底）。
- 无新本能/无新 solution doc（纯增量数据，无非平凡 bug）。
- status → completed。
