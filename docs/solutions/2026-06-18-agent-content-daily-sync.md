# 2026-06-18 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 新增 5 条 AI Agent 前沿资料。
  - `knowledge-graph/data/interview-questions.ts` 新增 4 道高频面试题。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 的采集批次日期滚到 `2026-06-18`。
- 已完成 Supabase 同步：
  - `public.frontier_ecosystem_articles`：82 行，写入成功。
  - `public.interview_questions`：34 行，写入成功。
- 已修正一个验证脚本偏差：
  - `scripts/read-frontier-ecosystem-from-supabase.ts` 原本查 `chapter_id=19`，会把已迁到第 20 章承载页的数据误报成 0；现已改为 `chapter_id=20`。

## 已验证事实

### 1. 远端配置与可写性

- `.env` 中存在本次同步所需变量：
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_SCHEMA`
  - `SUPABASE_DB_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `npm run supabase:frontier-push` 失败，原因为仓库已知 Windows `tsx/esbuild -> spawn EPERM`，不是 Supabase 认证失败。
- 按仓库约定 fallback：
  - `node scripts/push-frontier-seed-to-supabase.mjs`
  - 结果：`Upsert OK (HTTP 201). pushed=82, table count (content-range)=0-0/82`
- `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` 失败，原因为同一类 `spawn EPERM`。
- 按仓库 README fallback：
  - `node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts`
  - 结果：`Upsert OK (HTTP 201). pushed=34, table count (content-range)=0-0/34`

### 2. 表存在且可回读

- `frontier_ecosystem_articles`：
  - service-role 抽样查询 `chapter_id=20` 返回 200。
  - 最新 3 条样本包含：
    - `sentinelbench-benchmarking-monitoring-agents-in-dynamic-environments`
    - `subtlememory-benchmarking-long-term-relational-memory-in-llm-agents`
    - `can-ai-agents-synthesize-scientific-conclusions-understanding-strategic-generalization-on-`
- `read-frontier-ecosystem-from-supabase.ts` 修正后返回：
  - `rows=82, content-range=0-81/82`
  - layer 分布：
    - `foundation: 6`
    - `model-platform: 8`
    - `protocol: 8`
    - `runtime: 11`
    - `product-ui: 8`
    - `data-memory: 11`
    - `evaluation: 19`
    - `security-governance: 11`
- `interview_questions`：
  - service-role 全量查询 `0-33/34` 返回 200。
  - category 分布：
    - `principle: 9`
    - `engineering: 17`
    - `project: 8`

### 3. 本次新增 frontier 内容（5 条）

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [LangGraph CLI 0.4.30 release notes](https://github.com/langchain-ai/langgraph/releases/tag/langgraph-cli%3D%3D0.4.30) | LangChain | 2026-06-16 | `lessons/12-intro-to-frameworks`、`langgraph-advanced/05-multi-agent-graph`、`lessons/18-deployment`、`lessons/20-agent-frontier-news` | high |
| [RetailBench: A Long-Horizon Benchmark for AI Agents in Retail Management](https://arxiv.org/abs/2606.14545) | arXiv | 2026-06-14 | `lessons/10-reasoning-patterns`、`lessons/15-evaluation-and-testing`、`lessons/20-agent-frontier-news` | medium |
| [Can AI Agents Synthesize Scientific Conclusions? Understanding Strategic Generalization on SciConBench](https://arxiv.org/abs/2606.11337) | arXiv | 2026-06-09 | `capstone/deep-research-agent`、`lessons/15-evaluation-and-testing`、`lessons/20-agent-frontier-news` | medium |
| [SubtleMemory: Benchmarking Long-Term Relational Memory in LLM Agents](https://arxiv.org/abs/2606.05761) | arXiv | 2026-06-04 | `lessons/07-short-term-memory`、`lessons/15-evaluation-and-testing`、`lessons/20-agent-frontier-news` | medium |
| [SentinelBench: Benchmarking Monitoring Agents in Dynamic Environments](https://arxiv.org/abs/2606.05342) | arXiv | 2026-06-03 | `lessons/16-observability-and-cost`、`lessons/18-deployment`、`lessons/20-agent-frontier-news` | medium |

### 4. 本次新增面试题（4 道）

| slug | 对应高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `scientific-synthesis-clean-room-generalization` | clean-room synthesis / strategic generalization / 研究型 agent 泛化 | `10` `15` `capstone` `19` | [SciConBench](https://arxiv.org/abs/2606.11337) |
| `long-horizon-agent-benchmark-vs-single-step-score` | 长周期策略一致性 / 单步成功率失真 | `10` `15` `19` | [RetailBench](https://arxiv.org/abs/2606.14545) |
| `monitoring-agent-timeliness-false-alert-action-chain` | monitoring agent 时效 / 误报漏报 / 自动处置链 | `16` `17` `18` `19` | [SentinelBench](https://arxiv.org/abs/2606.05342) |
| `memory-agent-relational-consistency-vs-keyword-recall` | relational memory 一致性 / recall 不等于记忆正确 | `07` `15` `19` | [SubtleMemory](https://arxiv.org/abs/2606.05761) |

## 模块归属依据

- frontier 文章：
  - 仍遵守既有 SoT：唯一编辑点是 `knowledge-graph/data/graph.ts` 的 `ARTICLES`。
  - 第 20 章 `lessons/20-agent-frontier-news` 是资料承载页，因此 seed 派生后写入 Supabase 的 `chapter_id` 为 `20`。
  - 若某条资料更贴近已有课程/专题/毕设模块，则在 `applicableModules` 中显式挂到最直接消费它的模块。
- 面试题：
  - 仍遵守既有 SoT：唯一编辑点是 `knowledge-graph/data/interview-questions.ts`。
  - 题目按照仓库既有分类落入 `engineering`，因为新增内容都属于 2026 年工程实践/评测口径变化，而不是基础原理或项目复盘题。

## 产物与落地位置

- 本地事实源：
  - `knowledge-graph/data/graph.ts`
  - `knowledge-graph/data/frontier-articles.ts`
  - `knowledge-graph/data/interview-questions.ts`
- 本地 seed：
  - `supabase/seed/frontier_ecosystem_articles.sql`
  - `supabase/seed/interview_questions.sql`
- 远端表：
  - `public.frontier_ecosystem_articles`
  - `public.interview_questions`

## 推断

- 2026 年 6 月新增热点继续集中在 4 条线：
  - runtime/tooling：把部署兼容性、auth、history compaction、tracing 前移到框架/CLI。
  - long-horizon evaluation：开始系统性检验多日、多轮、多动作链的策略稳定性。
  - memory evaluation：从 recall 转向 relational consistency / reuse / contradiction handling。
  - research/monitoring specialized agents：基准越来越贴近高价值垂类，而不是通用 QA。

## 未知项

- 新增的 arXiv 基准目前都属于中可信度趋势源：
  - 一手来源可靠。
  - 但社区采纳、复现成熟度、是否进入主流框架文档或企业实践，还需要后续几周继续跟踪。
- 本轮未做直连 `SUPABASE_DB_URL` 的 `information_schema` 级 schema 巡检：
  - 原因：仓库内无现成 PG 客户端/驱动。
  - 替代证据：两张表都已成功 PostgREST upsert 并回读成功，因此可确认目标列与当前 payload 至少是兼容的。

## 失败项

- 无。
- 本轮最终状态不是“仅本地落地”，而是“本地事实源 + Supabase 双成功”。
