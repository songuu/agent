---
title: "RAG 系统最完整补充"
type: sprint
status: checkpoint-1
created: "2026-06-12"
updated: "2026-06-12"
checkpoints: 1
tasks_total: 11
tasks_completed: 1
tags: [sprint, rag, curriculum, documentation, code]
aliases: ["RAG 补全", "rag-completeness"]

invariants:
  - "rag-advanced 每章 demo 必须能离线跑（needsKey:'none'），或在 graph.ts 显式标注并说明为何仍需 key"
  - "离线 embedding 走预计算【真】向量 fixture（一次性真 API 抓取后提交），离线 cosine 仍是真计算；不得返回手造假向量"
  - "新章节六件套齐全：graph.ts(CHAPTERS+CONCEPTS+RELATIONS) + visuals.ts(CONCEPT_VISUALS + core/warning 高亮 + ≥1 引用) + README(含 mermaid) + index.ts demo + smoke 覆盖"
  - "教学 demo 结论由构造保证或运行时核对，绝不写死（沿用 02 章 BM25 零字面重合范式）"
  - "shared/rag 任何改动先过 rag:smoke 再谈联网端到端"
  - "CHAPTERS 是章节单一事实源；sidebar/demo标记/concept-visual 全自动派生，不手改 config sidebar"

invariant_tests:
  - "npx tsx rag-advanced/smoke.ts"
  - "npx tsx knowledge-graph/data/visuals.test.mts"
  - "npx tsx knowledge-graph/generate.test.mts"
  - "pnpm typecheck"
  - "pnpm site:build"

deferred: []
deadcode_until: []
---

# RAG 系统最完整补充

## Phase 1: 需求分析（CEO 视角）

### 背景

仓库已有成熟 RAG 子系统：lessons 08/09（向量检索 + 从零 RAG，含可运行 .ts）、`rag-advanced` 6 章（01 分块 / 02 混合 / 03 精排 / 04 查询改写 / 05 评估 / 06 生产化，各含 README + 可运行 index.ts + 共享 smoke）、完整 `src/shared/rag` 库（vectorStore/bm25/fusion/hybridRetriever/rerank/queryTransform/ragPipeline/evaluate/chunk）、`docs/rag-architecture.md` 架构蓝图、`docs/rag-system-project.md` 实战项目。

15-agent 审计（workflow `wf_eac2ef34-1e2`）暴露两类高影响缺口：
1. **确定性 + eval 严谨度**：02/03/04/05/06 五章 demo 全需 `OPENAI_API_KEY`（无离线路径）；eval 缺 recall/precision、无 golden-set CI gate、无拒答校验；多处结论是"文字断言"而非"运行时实测"。
2. **SOTA 缺失 + capstone 断崖**：无 contextual retrieval（Anthropic 配方）、无 agentic/gated RAG、无 RAG 安全（检索内容注入防御/引用核验/PII）；capstone 指向外部 repo，仓库内无可跟做 checkpoint。

### Scope（本轮做）— 用户选定 MUST + SHOULD

- **离线可跑**：用预计算真向量 fixture 让 5 个需 key 的 rag-advanced 章节离线可跑（保留联网真 API 路径）。
- **严谨化**：把断言式结论改为运行时实测（overlap 收益 / NDCG·MRR / recall@k / 持久化条数）。
- **3 个新 MUST 章节**：07 contextual-retrieval、08 agentic-rag、09 rag-security。
- **深化 05-eval**：recall/precision@k + golden-set + CI 阈值门 + 拒答正确性。
- **2 个新 SHOULD 章节**：10 index-internals、11 context-engineering；**深化 04** routing/decomposition/step-back；**capstone 仓库内 checkpoint**。

### Non-scope（本轮不做）

- 多模态 RAG（仅在架构文档提一句）。
- 接真实外部向量库（保持 MemoryVectorStore；只在文档讲迁移）。
- 训练 / 微调 embedding 或 reranker。
- GraphRAG / structured-SQL RAG / 语义分块 / cost-observability（列入 COULD backlog，不在本轮）。
- 改 `src/shared/llm` 厂商默认或 demo-runner 安全模型。

### 成功标准

- `rag-advanced` 全部章节 `needsKey:"none"` 离线可跑，且离线 cosine 用真向量。
- 新增 5 章六件套齐全，全部 invariant_tests 绿。
- 05-eval 的 CI gate 能在指标退化时 exit 1。
- 学习路径无外部断崖：capstone 有仓库内 checkpoint。
- `pnpm typecheck` + `pnpm site:build` 通过。

## Phase 2: 技术方案（架构师视角）

### 入场扫描 - Invariants 继承

| 子系统 | 既有 invariant | 本 sprint 如何保持 |
|--------|----------------|--------------------|
| CHAPTERS 单一事实源 | 改 `knowledge-graph/data/graph.ts` 即自动派生 sidebar/demo标记/visual；不手改 README | 新章节只改 graph.ts + visuals.ts，sidebar 自动出 |
| 视觉不变量 | `visuals.test.mts`：CONCEPT_VISUALS.length===CHAPTERS.length，每章 core+warning 高亮 + ≥1 引用 + README 含 mermaid | 每新章同步补 1 个 CONCEPT_VISUALS + 2 高亮 + 引用 + README mermaid |
| 免 key 安全网 | `rag-advanced/smoke.ts` 验纯函数（分块/BM25/RRF/cosine） | 新增纯逻辑（grade/contextualize/PII/recall@k）一并进 smoke |
| 教学确定性 | 02 章：BM25 零字面重合→构造保证漏召，结论运行时核对 | 新 demo 全部按"构造保证 + 运行时判定"写 payoff |
| shared/rag 向后兼容 | vectorStore 的 metadata filter/upsert/toJSON 向后兼容 | embeddings 离线 fixture 路径不改既有 key 路径签名 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| embeddings 离线 fixture | demo 跑 / 网页一键运行 | `embed()` 命中 fixture → 真向量 | `src/shared/rag/fixtures/*.json`（提交） | ✅ 离线即跑 |
| 新章节 07/08/09/10/11 | 用户从 sidebar 点击 | CHAPTERS 派生路由 | graph.ts + visuals.ts + README/index.ts | ✅ |
| 05-eval CI gate | `npm run rag:eval` / CI | evaluate + 规则指标 | exit code | ✅ 退化变红 |
| capstone 仓库内 checkpoint | 学完 rag-advanced 跟做 | rag-system-project.md + 仓库内骨架 | Markdown + 可选 `capstone/` 骨架 | ✅ |

### 入场扫描 - 债务清单

无继承债务（上一个 RAG sprint `2026-06-11-rag-architecture-enrichment` 已 completed，deferred 为空）。

### 关键技术决策

1. **离线 embedding fixture（基建，T1）**：在 `src/shared/llm/embeddings.ts` 增加 fixture-backed 路径——离线模式（无 key 或显式开关）下 `embed()` 先查预计算 fixture（text→真向量），命中即返回真向量，离线 cosine 真算；未命中给明确报错（指引跑 fixture 生成脚本）。新增 `scripts/build-embedding-fixture.ts`（需 key 一次性跑，把各章 corpora+queries 真向量落盘提交）。**现有 key 路径签名不变**。
   - ⚠️ **依赖**：fixture 首次生成需一次性可用 `OPENAI_API_KEY`。这是本轮唯一外部依赖，gate 时确认。
2. **新章节六件套**：graph.ts(CHAPTERS+CONCEPTS+RELATIONS+可选 ARTICLES) → visuals.ts(CONCEPT_VISUALS 选合适 kind + 2 高亮 + 引用) → README(含 mermaid) → index.ts(离线 fixture demo) → smoke 扩展。
3. **新 demo payoff 全确定性**：07 contextual（raw chunk 漏 / contextual 命中由构造保证）；08 agentic（首轮检索构造为必不足→grade 必判 retry→改写后命中）；09 security（注入文档"忽略指令"→防御前被劫持 vs 防御后拒绝，确定性对比）。
4. **05-eval 严谨化**：recall/precision@k 用规则可算（免 LLM、确定）；golden-set 固定样本；CI gate 低于阈值 `process.exitCode=1`；拒答正确性（无关问题该答"资料中未提及"）。

### 任务拆解

**MUST 块（→ 完成后 checkpoint #1）**

- [x] T1 (L) 离线 embedding fixture 基建：`embeddings.ts` 离线路径 + `scripts/build-embedding-fixture.ts` + `src/shared/rag/fixtures/` + rag:smoke 加离线确定性断言。✅ smoke 29/0 + tsc 绿。
- [ ] T2 (M) 5 章切离线：02/03/04/05/06 demo 默认走 fixture；graph.ts demo.needsKey 改 "none"；每章 demo 顶部说明"离线真向量 fixture，联网可换真 API"。
- [ ] T3 (M) 严谨化既有章：02 overlap 收益实测、03 加 NDCG/MRR、recall@k；06 持久化条数核对；`evaluate.ts` 容错解析加固。
- [ ] T4 (M) 新 07-contextual-retrieval（六件套，Anthropic 配方：嵌入/BM25 前给每块补 LLM 上下文）。
- [ ] T5 (L) 新 08-agentic-rag（六件套，gated retrieve→grade→re-retrieve loop）。
- [ ] T6 (M) 新 09-rag-security（六件套，注入防御 wrapUntrusted + 引用核验 + PII 脱敏；复用第17章概念）。
- [ ] T7 (M) 深化 05-eval：recall/precision@k + golden-set + CI 阈值门 + 拒答正确性。

**SHOULD 块（→ 完成后 checkpoint #2 / Review / Compound）**

- [ ] T8 (M) 深化 04-query-transformation：routing + decomposition + step-back。
- [ ] T9 (M) 新 10-index-internals（六件套，brute-force vs ANN/分桶直觉，纯函数可离线对比召回/速度）。
- [ ] T10 (M) 新 11-context-engineering（六件套，片段排序/去重/压缩/lost-in-the-middle/预算分配）。
- [ ] T11 (M) capstone 仓库内 checkpoint：消除"跳外部 repo"断崖（rag-system-project.md + 可选 `capstone/rag-system/` 最小骨架/checklist）。

> 任务数 11 > 8 且含 2 个 L → 人工 gate 保留（无 --auto）。Task 5 后自动评估 checkpoint。

## Phase 3: 变更日志

### 2026-06-12 离线基建块（无 key 可验证部分）

- **T1 离线 embedding fixture 基建** ✅（rag:smoke 29→41/0 + tsc 绿）
  - 新增 `src/shared/llm/embeddingFixture.ts`：fixture 类型 + 纯查表 helper（`fixtureKey`/`lookupInFixture`/`loadEmbeddingFixture`），model 入 key 防串。
  - 改 `src/shared/llm/embeddings.ts`：`embed()` 改为**离线优先**（命中真向量 fixture→返回；未覆盖且有 key→仅为缺口联网；未覆盖且无 key→可操作报错）；导出 `embedViaApi`。
  - 新增 `scripts/build-embedding-fixture.ts` + `package.json` `rag:build-fixture`（需 key 跑一次，生成真向量落盘）。
  - 新增 `src/shared/rag/fixtures/embeddings.json`（空，待生成）+ `rag-advanced/embedding-fixture-registry.ts`（待嵌文本单一来源）。
  - ch02 作参考接线：抽 `rag-advanced/02-hybrid-search/corpus.ts`，demo 与注册表共用同一份字符串（杜绝漂移）。
- **检索质量指标模块**（T7/T3 地基）✅
  - 新增 `src/shared/rag/metrics.ts`：`recallAtK/precisionAtK/f1AtK/hitRateAtK/reciprocalRank/ndcgAtK/retrievalMetricsAtK`，纯函数、离线确定。
  - 接入 barrel `src/shared/rag/index.ts`；smoke 加 12 条手算断言（含 nDCG=0.9197 折损、理想序=1、全漏=0）。

### 执行序调整（按 key 约束，2026-06-12）

> 发现：embedding fixture 只解决「向量」离线；03/04/05 章还调 **LLM-chat**（rerank/multiQuery/hyde/judge/answer），用假 LLM stub 会造**假结论**（违反教学确定性本能）。
> 决策：先做**离线真 payoff** 的纯函数任务（指标 ✅、09-security、10-index 合成向量、11-context-eng 纯逻辑、T3/T7 指标层）；把 **02 翻 needsKey / 07-contextual / 03/04/05 端到端 / 08 grading** 推到 key 可用时一并实现+验证（不半做、不假证）。原 11 task 范围不变，仅执行顺序按可验证性重排。

## Phase 4: 审查结果

（Review 阶段填写，含第 6 视角集成连续性）

## Phase 5: 复利记录

（Compound 阶段填写）
