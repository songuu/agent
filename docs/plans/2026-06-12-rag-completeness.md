---
title: "RAG 系统最完整补充"
type: sprint
status: blocked-on-key
created: "2026-06-12"
updated: "2026-06-12"
checkpoints: 5
tasks_total: 11
tasks_completed: 10
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
  - "npm run rag:eval"
  - "pnpm rag:capstone"
  - "npx tsx rag-advanced/07-contextual-retrieval/index.ts"
  - "npx tsx rag-advanced/08-agentic-rag/index.ts"
  - "npx tsx knowledge-graph/data/visuals.test.mts"
  - "npx tsx knowledge-graph/generate.test.mts"
  - "pnpm typecheck"
  - "pnpm site:build"

deferred:
  - "T2: 02/03/04/05/06 切到真 embedding fixture 仍需 OPENAI_API_KEY 与用户明确授权外部 embedding API；当前 embeddings.json 为空，不能手造假向量。"
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
- [ ] T2 (M) 5 章切离线：02/03/04/05/06 demo 默认走 fixture；graph.ts demo.needsKey 改 "none"；每章 demo 顶部说明"离线真向量 fixture，联网可换真 API"。⏸️ blocked：缺 `OPENAI_API_KEY` 且 `rag:build-fixture` 属外部 embedding API/付费/数据外发动作，需用户明确授权；当前 `embeddings.json` 为空，不能造假向量。
- [x] T3 (M) 严谨化既有章：02 overlap 收益实测、03 加 NDCG/MRR、recall@k；06 持久化条数核对；`evaluate.ts` 容错解析加固。✅ smoke 111→113/0 + typecheck 绿；03/06 已加运行时指标/边界 invariant。
- [x] T4 (M) 新 07-contextual-retrieval（六件套，Anthropic 配方：嵌入/BM25 前给每块补 LLM 上下文）。✅ no-key demo exit 0 + smoke 覆盖 + KG/site 构建绿。
- [x] T5 (L) 新 08-agentic-rag（六件套，gated retrieve→grade→re-retrieve loop）。✅ no-key demo exit 0 + smoke 覆盖 + KG/site 构建绿。
- [x] T6 (M) 新 09-rag-security（六件套，注入检测+隔离 / PII 出口脱敏 / 引用核验；复用第17章概念）。✅ smoke 41→54/0 + tsc/visuals/generate/site:build 全绿 + demo exit 0 + 对抗复核 0 P0/P1。
- [x] T7 (M) 深化 05-eval：recall/precision@k + golden-set + CI 阈值门 + 拒答正确性。✅ `npm run rag:eval` 绿 + smoke 覆盖 gate/failure/refusal。

**SHOULD 块（→ 完成后 checkpoint #2 / Review / Compound）**

- [x] T8 (M) 深化 04-query-transformation：routing + decomposition + step-back。✅ no-key planning helper + 04 demo 前置展示 + smoke 断言覆盖。
- [x] T9 (M) 新 10-index-internals（六件套，brute-force vs ANN/分桶直觉，纯函数可离线对比召回/速度）。✅ smoke 54→62/0 + tsc/visuals/generate/site:build 全绿 + demo exit 0（默认/NLIST=32/JITTER=0.6 三场景）+ 对抗复核 8→4 confirmed 全修。
- [x] T10 (M) 新 11-context-engineering（六件套，去重/压缩/预算/lost-in-the-middle 重排，纯逻辑离线）。✅ smoke 62→86/0（+24 断言）+ tsc/visuals/generate/registry/site:build 全绿 + demo exit 0（默认+极端旋钮四连）+ 对抗复核 3→2 confirmed 全修。
- [x] T11 (M) capstone 仓库内 checkpoint：消除"跳外部 repo"断崖（rag-system-project.md + 可选 `capstone/rag-system/` 最小骨架/checklist）。✅ `pnpm rag:capstone` 绿 + navigation/rag-system-project 接入。

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

### 2026-06-12 T6 · 09-rag-security 新章（离线真 payoff，六件套原子完成）

- **T6 新 09-rag-security** ✅（smoke 41→54/0，+13 安全断言；tsc 0；visuals/generate ok；site:build ok；demo exit 0）
  - 新增 `src/shared/rag/security.ts`：三道**确定性纯函数**防线——
    - `detectInjection`/`quarantineInjectedChunks`：内置 6 条中英文注入规则（覆盖既有指令/角色劫持/诱导泄密），命中即隔离，可疑片段不进提示拼装。
    - `redactPii`：脱敏邮箱/手机/身份证/银行卡，「规则优先级 + 区间去重」解决 18 位身份证 vs 银行卡的重叠歧义；返回审计命中清单。
    - `verifyCitations`：引用编号越界=幻觉引用，未引用来源=unused，确定性可进 CI。
  - 接入 barrel `src/shared/rag/index.ts`（4 值 + 9 类型导出）。
  - 新增 `rag-advanced/09-rag-security/index.ts`：构造 s1正常/s2投毒/s3含PII + 引用越界答案，每段结论 `invariant()` 运行时核对（不写死）。
  - 新增 `rag-advanced/09-rag-security/README.md`（手写 mermaid flowchart + `npm run kg` 注入 KG 段）。
  - `rag-advanced/smoke.ts` 加「RAG 安全护栏」13 条断言（注入检出/不误报/隔离/三类 PII/身份证优先/引用越界）。
  - 数据源：`graph.ts` 加 CHAPTERS(rag-security, needsKey:"none") + CONCEPTS(cragsec-* 5) + RELATIONS(章内5+跨章6，接回 c17-*/c09-citation) + ARTICLES(OWASP LLM Top10 + Simon Willison)；`visuals.ts` 加 CONCEPT_VISUALS(kind:shield) + 高亮(core+warning)。
  - 跨章边使 `lessons/09`、`lessons/17` README 由 `npm run kg` 幂等回链（数据驱动设计预期行为）。
  - **对抗复核**（workflow `wf_5ce60756-15a`，3 视角并行+逐条验证）：4 raw → 1 confirmed P2（练习3 `[-1]` 预期落空，`\d+` 不匹配负号），已改为对照式练习讲清「引用抽取边界由正则决定」；0 P0/P1。
  - 编号说明：07-contextual / 08-agentic 需 key 暂缺，09 先行占号位（课程逻辑序，避免日后 URL churn）。

### 执行序调整（按 key 约束，2026-06-12）

> 发现：embedding fixture 只解决「向量」离线；03/04/05 章还调 **LLM-chat**（rerank/multiQuery/hyde/judge/answer），用假 LLM stub 会造**假结论**（违反教学确定性本能）。
> 决策：先做**离线真 payoff** 的纯函数任务（指标 ✅、07-contextual BM25 对照、08-agentic gated loop、09-security、10-index 合成向量、11-context-eng 纯逻辑、T3/T7 指标层）。**T2 的 02/03/04/05/06 真 embedding fixture 切换**仍必须等 `OPENAI_API_KEY` 与用户明确授权外部 embedding API 后生成真向量；当前不半做、不伪造。

### 2026-06-12 T7/T8/T11 · eval gate / query planning / capstone checkpoint

- **T7 深化 05-eval** ✅（`npm run rag:eval` 绿；smoke 覆盖 gate/failure/refusal）
  - 新增 `src/shared/rag/evalGate.ts`：golden-set 单条/聚合报告、recall/precision/MRR/nDCG、拒答正确性、阈值门 `checkGoldenGate()`。
  - 新增 `rag-advanced/05-rag-evaluation/eval-gate.ts` + `package.json` `rag:eval`，固定 golden set 可作为 CI gate，退化时 exit 1。
  - smoke 加 golden gate 断言：达标 ok、阈值过高 failure、拒答/非拒答识别、非法 k 抛错。
- **T8 深化 04-query-transformation** ✅（smoke 覆盖 routing/decomposition/step-back）
  - `queryTransform.ts` 新增 `DEFAULT_QUERY_ROUTES`、`routeQuery()`、`decomposeQuery()`、`stepBackQuery()`、`planQuery()`，全部纯函数离线确定。
  - 04 demo 前置打印 query planning，再进入原 multiQuery/HyDE key 路径；README 补 routing/decomposition/step-back 说明。
  - 修复 `decomposeQuery()` split regex 的捕获组问题，避免分隔符进入 parts 造成 `undefined`/重复碎片。
- **T11 capstone 仓库内 checkpoint** ✅（`pnpm rag:capstone` 绿）
  - 新增 `capstone/rag-system/src/checkpoint.ts`：BM25 检索、golden gate、引用核验、拒答分支组成最小 RAG 系统验收。
  - 新增 `capstone/rag-system/README.md`，并把 `docs/rag-system-project.md` / `docs/navigation.md` 从“直接跳外部 repo”改为“先跑仓库内 checkpoint，再连接外部项目”。

### 2026-06-12 T3 · 既有章节严谨化（无 key 可验证部分完成）

- **T3 严谨化既有章** ✅（`npm run rag:smoke` 111→113/0；`pnpm typecheck` 绿）
  - smoke 加 overlap 收益实测：构造边界事实，无 overlap 时完整事实被切断，有 overlap 时被完整保留。
  - `evaluate.ts` 新增 `parseJudgeOutput()`：兼容 JSON、`SCORE/REASON`、中文“分数/理由”，统一 0~1 clamp；smoke 加 4 条离线回归。
  - 03-reranking 加 `retrievalMetricsAtK()` 实测：召回 top-8 与精排 top-3 打印 recall/MRR/nDCG，并在漏掉 golden 片段 `c1` 时置 `process.exitCode=1`。
  - 06-production-rag 加 `invariant()`：入库条数、持久化 JSON 条数、fromJSON 条数、upsert 覆盖不新增、过滤检索非空且不越权；最终 `answerWithRag` 改用 tenant-scoped retriever，确保注入上下文也不跨租户。

### 2026-06-12 T4 · 07-contextual-retrieval 新章（离线真 payoff，六件套原子完成）

- **T4 新 07-contextual-retrieval** ✅（demo exit 0；smoke 覆盖；visuals/generate/site:build 绿）
  - 新增 `src/shared/rag/contextualRetrieval.ts`：`contextualizeChunk()`/`contextualizeChunks()`、固定语料、raw vs contextual BM25 对照。
  - 新增 `rag-advanced/07-contextual-retrieval/index.ts`：构造“账号删除规则”干扰 raw top1，补文档/章节上下文后 top1 命中生命周期目标，且原文保留可审计。
  - 新增 README + graph/visuals/ARTICLE（Anthropic Contextual Retrieval）+ smoke 4 条断言，`demo.needsKey:"none"`。

### 2026-06-12 T5 · 08-agentic-rag 新章（离线真 payoff，六件套原子完成）

- **T5 新 08-agentic-rag** ✅（demo exit 0；smoke 覆盖；visuals/generate/site:build 绿）
  - 新增 `src/shared/rag/agenticRag.ts`：BM25 retriever、`gradeRetrieval()`、`rewriteForAgenticRetrieval()`、`runAgenticRetrieval()`、固定 corpus。
  - 新增 `rag-advanced/08-agentic-rag/index.ts`：首轮口语 query `"坏了咋办"` 无命中 → grade retry → 改写成 SLA/补偿检索词 → 二轮命中并 answer；无答案 golden 直接 refuse。
  - 新增 README + graph/visuals/ARTICLE（Self-RAG、CRAG）+ smoke 5 条断言，`demo.needsKey:"none"`。

### 2026-06-12 T2 · 真 embedding fixture blocker（未完成）

- **T2 仍未完成，原因是外部依赖/授权而非代码遗漏** ⏸️
  - 当前环境没有 `OPENAI_API_KEY`，`src/shared/rag/fixtures/embeddings.json` 仍为 `{ "model": "", "dim": 0, "vectors": {} }`。
  - `npm run rag:build-fixture` 会把登记文本发送到外部 embedding API 并可能产生费用；本次执行请求被安全策略拒绝，需用户明确授权后再跑。
  - 由于 invariant 明确要求“离线 embedding 走预计算真向量 fixture，不得返回手造假向量”，因此不能把 02/03/04/05/06 的 `demo.needsKey` 改为 `"none"`，也不能提交假 fixture。

### 2026-06-12 T9 · 10-index-internals 新章（离线真 payoff，六件套原子完成）

- **T9 新 10-index-internals** ✅（smoke 54→62/0，+8 索引断言；tsc 0；visuals/generate ok；site:build ok；demo exit 0）
  - 新增 `src/shared/rag/annIndex.ts`：纯函数、确定性、离线——
    - `mulberry32` 带种子 PRNG（Math.imul/位运算，跨平台一致）+ `makeSyntheticCorpus`（带簇结构的合成确定向量 + 确定性 Fisher-Yates 打乱，防 IVF 初始化按簇作弊）。
    - `bruteForceSearch`：暴力精确，比较次数恒=N，作召回金标。
    - `buildIvfIndex`：确定性 k-means（均匀间隔初始化 + 空簇保留旧质心）分 nlist 桶；`ivfSearch`：只比最近 nprobe 桶，诚实计量「质心扫描 + 桶内」比较次数。
  - 接入 barrel `src/shared/rag/index.ts`（5 值 + 7 类型导出）。
  - 新增 `rag-advanced/10-index-internals/index.ts`：构造合成语料，暴力金标 vs IVF 多档 nprobe；结论 ①~④ 由构造保证用 `invariant()` 运行时核对（nprobe=1 省算 / 比较数单调 / 召回单调 / nprobe=nlist 退化为暴力且更贵），⑤ 甜点为**软结论 + else 诊断**（数据依赖，不硬断言）。
  - 新增 `rag-advanced/10-index-internals/README.md`（手写 mermaid flowchart + `npm run kg` 注入 KG 段）。
  - `rag-advanced/smoke.ts` 加「向量索引」8 条断言（确定可复现/分桶覆盖全集/暴力=N/nprobe=1 省算/nprobe=nlist 退化精确且更贵/召回单调）。
  - 数据源：`graph.ts` 加 CHAPTERS(rag-index, needsKey:"none") + CONCEPTS(cragidx-* 5) + RELATIONS(章内5+跨章6，接回 c08-*/crageval/cragprod) + ARTICLES(FAISS 工程博客 + HNSW 论文)；`visuals.ts` 加 CONCEPT_VISUALS(kind:pipeline) + 高亮(core+warning)。
  - 教学 payoff（固定种子 seed=42, NLIST=16, N=192）：nprobe 1→16 比较数 35→208、recall@10 0.838→1.0 单调升；nprobe=nlist 退化为暴力但更贵(208>192)；甜点 nprobe=1 省 5.6×。
  - **对抗复核**（workflow `wf_ad3a04b5-259`，3 视角并行+逐条对抗验证）：8 raw → 4 confirmed 全修：
    - P1 练习1 改 NLIST=32 时写死 `NPROBE_SWEEP` 末档不再=nlist → invariant④ 误报崩 → 改为**派生 sweep**（末档恒=NLIST，对任意 NLIST 成立）；NLIST=32 实测 exit 0。
    - P2a 练习4 改 JITTER=0.6 簇坍缩 → 无甜点 → invariant⑤ 抛错 → 降为**软结论 + else 诊断**；JITTER=0.6 实测 exit 0 打印「无甜点」（正是 ANN 需簇结构的教学点）。
    - P2b rag-index 用 kind:"space" → 章节页注入 ch08 写死的 Embedding 插画（主题串味）→ 改 **kind:"pipeline"**（steps 驱动、主题中性）。
    - P3 demo `rows.comparisons` 死字段 + 误导注释 → 删除。
  - 编号说明：07-contextual / 08-agentic 需 key 暂缺，09→10 先行占号位（保持课程逻辑序，避免 URL churn）。

### 2026-06-12 T10 · 11-context-engineering 新章（离线真 payoff，六件套原子完成）

- **T10 新 11-context-engineering** ✅（smoke 62→86/0，+24 断言；tsc 0；visuals/generate/registry ok；site:build ok 新章入站无死链；demo exit 0）
  - 新增 `src/shared/rag/contextAssembly.ts`：纯函数、零随机、离线——
    - `dedupeChunks`：按 Jaccard（复用 BM25 `tokenize`，仅取长度≥2 词元）删近重复整片冗余，保留先出现者；返回 kept/dropped 分区。
    - `compressChunk`：抽取式压缩——按句末标点贪心保留整句到预算内，结果恒 ≤ maxTokens 且为原文前缀（单句超预算时字符级硬截断兜底）。
    - `positionalWeights`/`effectiveRelevance`/`reorderForAttention`：U 形位置权重（首尾=1、正中最低）建模 lost-in-the-middle；按**重排不等式**把高相关配高权重位，保证有效相关性 ≥ 原序。
    - `packWithinBudget`：token 预算内贪心打包（relevance / density 两策略），恒不超预算；`makeContextCorpus` 固定合成语料（含 2 近重复 + 1 超长 + 1 噪声）。
  - 接入 barrel `src/shared/rag/index.ts`（8 值 + 7 类型导出）。
  - 新增 `rag-advanced/11-context-engineering/index.ts`：去重→压缩→预算→重排全流程；结论分两类——**构造保证腿** ①②③④⑤ 用 `invariant()` 硬核对（去重分区 / 打包不超预算 / 压缩≤预算且前缀 / 重排是排列且有效相关性不降 / 位置权重 U 形对称），**数据依赖腿** ⑥⑦ 用软结论 + else 诊断（去重是否腾名额 / 重排是否有正增益）。
  - 新增 `rag-advanced/11-context-engineering/README.md`（手写 mermaid flowchart + `npm run kg` 注入 KG 段）。
  - `rag-advanced/smoke.ts` 加「上下文工程」24 条断言（Jaccard 间隙 / 去重分区+幂等+阈值健壮 / 压缩≤预算+前缀 / 权重对称 / 重排排列+不降+退化 / 打包不超预算×预算网格×双策略 / 端到端去重压缩 payoff）。
  - 数据源：`graph.ts` 加 CHAPTERS(rag-context, needsKey:"none") + CONCEPTS(cragctx-* 5) + RELATIONS(章内5+跨章6，接回 c07/c09/cragrerank/crageval) + ARTICLES(Lost-in-the-Middle 论文 + LangChain LongContextReorder 文档)；`visuals.ts` 加 CONCEPT_VISUALS(kind:pipeline，避开 space/compare 硬编码文案) + 高亮(core+warning)。
  - 教学 payoff（默认 DEDUP_THRESHOLD=0.6, COMPRESS_CAP=40, BUDGET=130, MIDDLE_WEIGHT=0.4）：去重丢 dup1/dup2；long1 压缩 91→28；同预算工程打包覆盖 4 条唯一信息(rel 3.56) vs 朴素 2 条(1.88，朴素相关性之和 2.78 虚高含重复)；重排有效相关性 3.938→4.296(+0.358)。
  - **对抗复核**（workflow `wf_dec1b47a-ec9`，3 视角并行 + 逐条对抗验证）：3 raw → 2 confirmed 全修 + 复验（1 正确驳回「第05章指代」）：
    - P2 README 练习①「调小到 70 看朴素被高分重复吃名额」与实跑相反——70 预算下 dup1(49tok) 在 u1+u2=69 后挤不进、永远落选，⑥ 反走 else「未腾出名额」；「重复吃名额」只在 BUDGET∈[118,~370]、默认 130 本就在窗口内 → 改写练习①对齐默认工作点（实跑 110/120/400 核对 ⑥ 分支后定稿）。
    - P3 `makeContextCorpus` 注释称 dup 为 u 的「逐字超集副本」，实则句末「。→，」改写非字符前缀 → 改注释为「近重复副本，去重靠 Jaccard 词元集不依赖前缀」。

## Phase 4: 审查结果

### 2026-06-12 验证记录

- ✅ `npm run rag:smoke`：113 通过 / 0 失败。
- ✅ `npm run rag:eval`：golden-set gate 通过（meanRecall=1.00, meanPrecision=0.33, meanMRR=1.00, meanNDCG=1.00, refusalAccuracy=1.00）。
- ✅ `pnpm rag:capstone`：RAG system checkpoint 通过。
- ✅ `npx tsx rag-advanced/07-contextual-retrieval/index.ts`：raw top1 被干扰项抢走，contextual top1 命中目标片段，原文保留。
- ✅ `npx tsx rag-advanced/08-agentic-rag/index.ts`：首轮 retry、二轮 answer、无答案 refuse 分支均通过。
- ✅ `npx tsx knowledge-graph/data/visuals.test.mts`：ok。
- ✅ `npx tsx knowledge-graph/generate.test.mts`：ok。
- ✅ `pnpm typecheck`：通过。
- ✅ `pnpm site:build`：通过；仅有 VitePress chunk size warning。
- ⚠️ sandbox 内 tsx / VitePress 多次触发 esbuild `spawn EPERM`；按同一命令在沙箱外重跑通过，判定为本机 sandbox 子进程权限限制，不是代码回归。
- ⏸️ `npm run rag:build-fixture` 未执行：该命令会调用外部 embedding API/可能产生费用和数据外发，本轮未获明确授权；T2 保持 blocked。

## Phase 5: 复利记录

（Compound 阶段填写）
