---
title: "RAG 完整补充：进阶检索与生产化"
type: sprint
status: completed
created: "2026-06-09"
updated: "2026-06-10"
checkpoints: 0
tasks_total: 6
tasks_completed: 6
tags: [sprint, rag, retrieval, curriculum]
aliases: ["RAG 进阶", "rag-advanced"]
auto_mode: true

# 本 sprint 立的不变量，后续 sprint 必须保持
invariants:
  - "所有 LLM 调用走 getLLM()（embedding 走 shared embed()）"
  - "lessons/rag-advanced 用显式相对导入 ../../src/shared/rag"
  - "tsc --noEmit 零错误"
  - "shared/rag 每个导出模块至少被 1 章 demo 导入 + barrel 再导出（无 dead code）"
  - "KG 仍是数据驱动单一来源 + 幂等注入；新章节进 CHAPTERS 即自动注入"
  - "进阶章节 README 用「## 五、小结与延伸」作为 KG 注入锚点"

invariant_tests:
  - "npx tsc --noEmit（全量类型）"
  - "npx tsx rag-advanced/smoke.ts（纯函数 chunk/bm25/rrf，免 key）"
  - "npx tsx knowledge-graph/generate.ts（二次跑应『未变』，验证幂等）"

# 继承自上一个 sprint 的债务
deferred:
  - sprint: "2026-06-04-knowledge-graph"
    item: "直接打包部署（tsup/dist + Docker + CI）"
    deadline: "2026-06-30"
    reason: "用户上一轮 pivot 挂起；未过期，保持 deferred，不在本 sprint 处理"
---

# RAG 完整补充：进阶检索与生产化

## Phase 1: 需求分析（Think）

### 背景
课程现有 RAG 资产：第 08 章（embedding/向量检索）、第 09 章（最小 RAG：chunk/overlap/top-k/augment/citation/A-B）、`src/shared/rag/vectorStore.ts`（仅 add/search）、毕设把 RAG 作为 search 工具。`docs/rag-system-project.md` 用一张对照表列出了「真实 RAG 系统会继续扩展」的工程能力，但**课程本身没教**，只指向外部 `songuu/rag-system`。

### 做什么（Scope）
把这张对照表里的能力补成**仓库内可运行的进阶 RAG 教学**：
- 进阶分块（递归/Markdown 感知/按 token 计长）
- 混合检索（BM25 + 向量 + RRF 融合）
- 重排（召回-精排两段式，LLM rerank）
- 查询改写（multi-query、HyDE）
- RAG 评估（context relevance / faithfulness / answer relevance，LLM-as-judge）
- 生产化（metadata 过滤、持久化 save/load、增量 upsert、组合 pipeline）
并把这些能力的「成熟版」沉淀进 `src/shared/rag/`，供章节与毕设复用。

### 不做什么（Non-scope）
- 打包部署（deferred，2026-06-30 前不动）
- 真实向量 DB（pgvector/Pinecone）集成（只留接口 + JSON 持久化 shim）
- 重编号现有 01–19 章
- 改动 provider 抽象 / getLLM
- 外部 songuu/rag-system 实仓代码

### 成功标准
- `tsc --noEmit` 零错误
- 新增 `src/shared/rag/*` 库模块 + 6 个可运行进阶章节（README + demo）
- 纯函数 smoke 免 key 可跑通
- `npm run kg` 重生成后包含新概念，且二次跑幂等（未变）
- README/curriculum/navigation/rag-system-project 全部接线，08/09 正文除指针外不动

## Phase 2: 技术方案（Plan）

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| LLM 抽象 | 所有 LLM 走 getLLM() | rerank/queryTransform/pipeline/evaluate 全部 `getLLM()`，embedding 走 shared `embed()` |
| 导入风格 | 显式相对导入 ../../src/shared | rag-advanced 章节同深度（顶层目录），用 ../../src/shared/rag |
| 类型 | tsc --noEmit 零错 + 禁 any | 全程 strict + noUncheckedIndexedAccess；外部输入用 unknown 收窄 |
| 知识图谱 | 数据驱动单一来源 + 幂等注入 | 新章节/概念/关系/文章只改 graph.ts，npm run kg 自动注入 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 是否成环 |
|--------|----------|--------|--------|----------|
| shared/rag 新模块 | 章节 demo import | barrel `rag/index.ts` + `shared/index.ts` 再导出 | 源码 | ✅ 每个被 ≥1 demo 引用 |
| 6 个进阶章节 | 加入 CHAPTERS | generate.ts injectChapter | README 注入段 | ✅ 自动注入 + nav/curriculum/README 列表 |
| 持久化 demo | save/load | MemoryVectorStore.toJSON/fromJSON | os.tmpdir 临时文件（不入库） | ✅ 跑完即弃 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-04-knowledge-graph | 直接打包部署 | ⏭ 推迟（未过期，保持 deferred） | 2026-06-30 |

### 库设计（src/shared/rag/，冻结契约）

- `vectorStore.ts`（扩展，向后兼容）：`search(q,k,{filter})` + `upsert(byId)` + `toJSON()/fromJSON()` + `all()`
- `chunk.ts`（新）：`approxTokens` / `slidingWindowChunk`（= 第09章字符版）/ `recursiveChunk`（递归语义切分）/ `markdownChunk`（标题感知）
- `bm25.ts`（新）：`tokenize`（英文按词 + CJK bigram）/ `BM25Index`
- `fusion.ts`（新）：`reciprocalRankFusion`（RRF）
- `types.ts`（新）：`Retriever` / `RetrievedChunk` 接口
- `hybridRetriever.ts`（新）：`HybridRetriever`（向量 + BM25，RRF 融合）implements Retriever
- `rerank.ts`（新）：`llmRerank`（getLLM，输出有序编号解析）
- `queryTransform.ts`（新）：`multiQuery` / `hyde`（getLLM）
- `ragPipeline.ts`（新）：`answerWithRag`（compose：检索→可选精排→引用增强→生成）/ `asRetriever(store)` / `buildContextBlock`
- `evaluate.ts`（新）：`evaluateRag`（三指标 LLM-judge）
- `index.ts`（新 barrel）；更新 `src/shared/index.ts`
- `tsconfig.json` include += "rag-advanced"

### 章节（rag-advanced/，每章 README + demo）
1. `01-chunking-strategies` — 进阶分块对比
2. `02-hybrid-search` — BM25 + 向量 + RRF
3. `03-reranking` — 召回-精排两段式
4. `04-query-transformation` — multi-query / HyDE
5. `05-rag-evaluation` — 三指标评估
6. `06-production-rag` — metadata 过滤 + 持久化 + 增量 + 全链路 pipeline

### 任务拆解
- [ ] T1 硬化 shared/rag 库（inline，冻结契约）→ tsc 零错
- [ ] T2 纯函数 smoke + rag:smoke 脚本 → 实跑通过
- [ ] T3 6 章 README+demo（workflow 并行）→ tsc + 结构检查
- [ ] T4 扩 KG 数据 + npm run kg → 幂等
- [ ] T5 文档接线（rag-system-project/nav/curriculum/README/lesson09 指针）
- [ ] T6 多维审查（workflow）→ 处理 P0/P1

## Phase 3: 变更日志（Work）

- **T1 库（inline，冻结契约）** ✓ — 新增 `src/shared/rag/`：`chunk.ts`(approxTokens/slidingWindowChunk/recursiveChunk/markdownChunk)、`bm25.ts`(BM25Index/tokenize)、`fusion.ts`(reciprocalRankFusion)、`types.ts`(Retriever/RetrievedChunk)、`hybridRetriever.ts`、`rerank.ts`(llmRerank)、`queryTransform.ts`(multiQuery/hyde)、`ragPipeline.ts`(answerWithRag/asRetriever/buildContextBlock)、`evaluate.ts`(evaluateRag)、`index.ts`(barrel)；扩展 `vectorStore.ts`（search filter / upsert / toJSON·fromJSON / all，全向后兼容）；更新 `src/shared/index.ts`、`tsconfig.json` include。`tsc --noEmit` 零错。
- **T2 纯函数 smoke** ✓ — `rag-advanced/smoke.ts`（24 断言，免 key），`package.json` 加 `rag:smoke`。**smoke 抓出递归分块真实 bug**：overlap 回带整原子致块翻倍（53 tok vs 30）；修法=回带受 overlap 预算约束 + hasFresh 守卫保证推进 + overlap 夹到 ≤chunkSize/2，块上界 ≤1.5×chunkSize。修后 24/24 通过。
- **T3 六章（workflow 并行）** ✓ — `rag-advanced/01..06`（README+demo）。05-rag-evaluation 的 write agent 撞 504 超时（服务端），其 index.ts 已完整、README 由我补齐并校验。其余 5 章经 verify 阶段确认。全量 `tsc` 零错；01 章免 key 实跑通过。
- **T4 KG 数据 + 重生成** ✓ — graph.ts 加 6 CHAPTERS + 28 概念 + 44 关系（含跨章接回 08/09/15/17/18/capstone）+ 7 篇权威文章。`npm run kg`：首跑「更新 13·未变 13」，二跑「更新 0·未变 26」=**幂等达成**。总计 26 单元/165 概念/235 关系/36 文章。
- **T5 文档接线** ✓ — README.md（章节表 + 学习路径图 + 学完之后）、docs/curriculum.md（专题表 + 路径图 + 时长 + 下一步）、docs/navigation.md（快速入口 + 专题区 + 主题跳转）、docs/rag-system-project.md（重定位为「09→专题→毕设→独立项目」）、lessons/09 进阶指针。

## Phase 4: 审查结果（Review）

**方式**：workflow 多维并行审查（4 维度：库正确性 / demo 正确性 / 一致性与集成连续性(第6视角) / 教学质量），每条 finding 由独立 agent 对抗验证（默认怀疑、须亲自复现）。17 agents / 13 条原始 findings → 对抗验证后 **仅 1 条确认 P1**，其余为误报或 P2。

### 确认的 P0/P1 及处置

P1:
- rag-advanced/02-hybrid-search/index.ts:99: bug: 教学 payoff 失效——查询「FW-2024.11 这台设备最多能接多少终端？」与语义改写目标 d2「…上万台终端设备…」共享大量中文二元组（设备/终端/这台…），验证 agent 离线复现纯 BM25 排序为 **d2:7.59 居第 1**，「BM25 漏语义改写」的核心论点被自己的输出推翻；固定断言式小结照常打印。修复：① d2 改写为与查询**零字面重合**的措辞（「承载上万台客户机」，不含 终端/最多/接/能/少/设备 任何查询字符）；② 查询去掉「这台设备」；③ 小结改为按实际名次**动态判定**（bm25MissedD2 && fusedHasBoth 才打 success，否则打诊断信息）；④ README 同步（原理段、ASCII 图、语料片段、预期输出，新增「对照实验要控变量」提示框）。零重合 → BM25 零分 → d2 必然未召回，修复为**确定性**而非碰运气。✅ **已修并离线复现确认**：`_check-bm25.ts` 输出 `d2 与查询共享词元（无）✓ / BM25 top-4: d1:6.549 d3:4.952 d4:2.145 d6:0.957 / PASS`（d2 未召回、d1 居首；含「终端」字面的 d3 反排第 2，恰好佐证「字面命中≠语义正确」）。验证脚本用后即删。

### 验证链最终结果（2026-06-10，shell 恢复后补跑）

- `tsc --noEmit`：**0 错**
- `rag:smoke`：**24/24 通过**
- KG `npm run kg` 二跑：**更新 0 · 未变 26**（幂等）
- 02 章 BM25 修复离线复现：**PASS**
- 01 章 demo 免 key 实跑：通过

### 第 6 视角（集成连续性）结论

- invariants 全部保持：getLLM() 全覆盖（grep 无直连 SDK）、相对导入 ../../src/shared 一致、无 any、tsc 零错。
- dead code：无。MemoryVectorStore.all() 被 04 章 HyDE 手算检索使用；buildContextBlock 被 ragPipeline 内部使用并导出供扩展。
- KG 标记 26 章全配对，幂等验证通过。
- 与 goal 无漂移：全部改动都在「rag 相关完整补充」范围内。

### P2（记录不修，详见 workflow transcript wf_4221bdbe-46d）

- 若干风格/措辞级建议（评审产生 13 条，对抗验证后 12 条判 not-real 或 P2——多数是「理论上可能但实际被上游保证」的防御性建议）。

## Phase 5: 复利记录（Compound）

### 经验沉淀（写入记忆系统）

1. **新增** `teaching-demo-deterministic-payoff`（feedback）：对比/盲区类教学 demo 的结论必须①由构造保证（确定性腿：纯函数/零字面重合/固定输入）或②由代码按实际结果动态判定（波动腿：embedding/LLM），绝不写死 success 断言；中文 BM25 对照样本须自检 tokenize 零交集。另：纯函数 smoke 是免 key 安全网（本次当场抓出 recursiveChunk overlap 回带翻倍 bug）。
2. **更新** `project-agent-curriculum`：补 rag-advanced 专题 + shared/rag 扩展 + rag:smoke + KG 新规模（26/165/235/36）。
3. **更新** `MEMORY.md` 索引。

### 模式确认（复用自往期 sprint，本次再验证）

- 冻结契约 + 并行 fan-out（API 参考字符串喂给每个 write agent + verify 阶段对照），6 章 0 类型错。
- 对抗验证的价值再次量化：13 条 findings → 仅 1 条真 P1（误报率 92%），但那 1 条是「demo 自我推翻」级别、非对抗复现根本抓不到。
- workflow 单点 504：write:05 超时但 index.ts 已落盘，**人工补 README 比重跑整个 workflow 便宜**——失败粒度=文件，恢复粒度也应=文件。

### 本 sprint 立的 invariants（见 frontmatter）

LLM 全走 getLLM / 相对导入 ../../src/shared / tsc 零错 / shared-rag 无 dead export / KG 数据驱动幂等 / 进阶章 README 用「## 五、小结与延伸」锚点。invariant_tests：tsc、rag:smoke、kg 二跑幂等。
