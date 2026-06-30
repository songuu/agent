# 2026-06-30 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 新增 3 条高信号 Agent 资料：
    - [Semantic Kernel Python 1.43.1 release notes](https://github.com/microsoft/semantic-kernel/releases/tag/python-1.43.1)
    - [Towards Automating Scientific Review with Google's Paper Assistant Tool](https://arxiv.org/abs/2606.28277)
    - [Govern the Repository, Not the Agent: Measuring Ecosystem-Level Risk in AI-Native Software](https://arxiv.org/abs/2606.28235)
  - `knowledge-graph/data/interview-questions.ts` 新增 3 道工程类高频题。
  - `docs/career-guide.md` 同步追加 3 条人读题单。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 批次日期滚动到 `2026-06-30`。
- 已完成 Supabase 同步：
  - `public.news_items`：本轮 `stored=509`，远端总量 `1976`。
  - `public.frontier_ecosystem_articles`：远端总量 `107`，写入成功。
  - `public.interview_questions`：远端总量 `53`，写入成功。
- 本轮最终状态：不是“仅本地落地”，而是“本地事实源 + Supabase 三表同步全部成功”。

## 已验证事实

### 1. Supabase 配置、目标表结构与写权限

- `.env` 中本轮所需变量可用：
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_SCHEMA`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 目标表结构已在仓库 migration 中存在：
  - `supabase/migrations/20260617120000_create_news_items.sql`
  - `supabase/migrations/20260616090000_create_frontier_ecosystem_articles.sql`
  - `supabase/migrations/20260616120000_create_interview_questions.sql`
- 远端读回成功：
  - `news_items`：`HTTP 206`，`content-range=0-0/1976`
  - `frontier_ecosystem_articles`：`HTTP 206`，`content-range=0-0/107`
  - `interview_questions`：`HTTP 206`，`content-range=0-0/53`
- 远端写权限已通过真实 upsert 验证：
  - `npm run supabase:frontier-push`：`HTTP 201`
  - `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts`：`HTTP 201`

### 2. 多源采集结果（news_items）

执行命令：

```powershell
node --env-file=.env --experimental-transform-types news-collector/src/cli-collect.ts
```

已验证事实：

- 运行区间：`2026-06-29T23:10:02.972Z -> 2026-06-29T23:10:29.752Z`
- `32/34` 源成功；失败源为：
  - `Google AI Blog (google-ai)`：`Client network socket disconnected before secure TLS connection was established`，`attempts=5/5`，`retry-exhausted`
  - `Google DeepMind Blog (deepmind)`：`Client network socket disconnected before secure TLS connection was established`，`attempts=5/5`，`retry-exhausted`
- 成功覆盖的高信号源包含：
  - 官方 release：OpenAI Agents Python / JS、LangGraph、CrewAI、Google ADK、Google Gen AI SDK、Microsoft AutoGen、Semantic Kernel、Letta、smolagents
  - 官方博客：AWS ML、OpenAI、Microsoft Source、NVIDIA、Hugging Face、GitHub Engineering / Changelog
  - 研究源：arXiv `cs.AI`、`cs.LG`
  - 社区/媒体补充：The Decoder、InfoQ、MIT Technology Review、VentureBeat、Hacker News · AI、量子位、IT之家、TechWeb、少数派、LinuxDo
- 本轮 collector 汇总：`fetched=510`，`dedupe=509`，`content fetched=80/509`，`content empty=75`，`content failed=0`，`stored=509`。
- `public.news_items` 已写入远端，当前总量 `1976`。

### 3. 本轮新增 curated frontier 的 3 条内容

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [Semantic Kernel Python 1.43.1 release notes](https://github.com/microsoft/semantic-kernel/releases/tag/python-1.43.1) | Microsoft | 2026-06-17 | `05` `11` `17` `18` `20` | high |
| [Towards Automating Scientific Review with Google's Paper Assistant Tool](https://arxiv.org/abs/2606.28277) | arXiv | 2026-06-26 | `10` `15` `capstone` `20` | medium |
| [Govern the Repository, Not the Agent: Measuring Ecosystem-Level Risk in AI-Native Software](https://arxiv.org/abs/2606.28235) | arXiv | 2026-06-26 | `12` `15` `16` `18` `20` | medium |

摘要：

- Semantic Kernel `1.43.1`：把 Assistant agent 的 `function_choice_behavior` 增强与 OpenAPI plugin 对 encoded dot-segment path 的拒绝放在同一 release，说明“更强调度能力”和“更紧路径边界”必须同步治理。
- Google PAT：paper review agent 不再只是摘要器，而是面向理论/实验核查的 inference-scaling 验证流水线，并明确保留人类最终裁决。
- Repository-level risk：大规模 agent-authored PR 研究显示风险会沉积在仓库层，而不只在单个 agent 或单个任务上，适合映射到 coding agent 的评测与治理口径。

远端回读验证：

- 3 条标题均已在 `public.frontier_ecosystem_articles` 读回成功。
- 远端元数据中：
  - `Semantic Kernel Python 1.43.1 release notes` -> `publishedAt=2026-06-17`、`collected_date=2026-06-30`、`confidence=high`
  - `Towards Automating Scientific Review with Google's Paper Assistant Tool` -> `publishedAt=2026-06-26`、`collected_date=2026-06-30`、`confidence=medium`
  - `Govern the Repository, Not the Agent: Measuring Ecosystem-Level Risk in AI-Native Software` -> `publishedAt=2026-06-26`、`collected_date=2026-06-30`、`confidence=medium`

### 4. 本轮新增 3 道面试题

| slug | 高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `assistant-function-choice-vs-openapi-path-canonicalization` | function choice / OpenAPI path normalization / encoded dot-segment / SSRF | `05` `11` `17` `18` `19` | Semantic Kernel `1.43.1` |
| `scientific-review-agent-needs-inference-scaling-and-human-final-say` | inference scaling / scientific review / HITL final control | `10` `15` `19` `capstone` | Google PAT |
| `repository-level-friction-vs-single-agent-win-rate` | coding agent eval / repository integration friction / ecosystem risk | `12` `15` `16` `18` `19` | repository-level risk 论文 |

远端回读验证：

- `assistant-function-choice-vs-openapi-path-canonicalization`
- `scientific-review-agent-needs-inference-scaling-and-human-final-say`
- `repository-level-friction-vs-single-agent-win-rate`

三条都已在 `public.interview_questions` 读回成功，`collected_date=2026-06-30`。

### 5. 模块归属依据

- 最新资讯流：继续走 `news-collector -> news_items -> lessons/20-agent-frontier-news`，因为这是仓库已有的多源日采集主通道。
- curated frontier：继续落到 `knowledge-graph/data/graph.ts`，因为这是课程生态资料的单一事实源；第 20 章再由 `frontier-articles.ts` 派生消费。
- 面试题：继续落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，因为这是结构化题库 + 人读清单双轨。
- 本轮新增条目的模块选择遵循仓库现有结构：
  - tool choice / plugin path boundary -> `05` `11` `17` `18`
  - review / research agent eval -> `10` `15` `capstone`
  - coding agent repo-level governance -> `12` `15` `16` `18`

## 重试与失败细节

### 已发生失败（未阻断主任务）

1. `npm run supabase:frontier-seed`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：Windows 受管环境对子进程拉起有限制，不是 frontier 数据错误。
   - 处理：改用 `node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts`

2. `npm run supabase:interview-seed`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：同上，不是 interview 数据错误。
   - 处理：改用 `node --experimental-transform-types scripts/generate-interview-questions-supabase-seed.ts`

3. `Google AI Blog (google-ai)`
   - 失败原因：`Client network socket disconnected before secure TLS connection was established`
   - 重试结果：`attempts=5/5`，`retry-exhausted`
   - 判断：源站/TLS 握手问题，不是 Supabase 写入问题。

4. `Google DeepMind Blog (deepmind)`
   - 失败原因：`Client network socket disconnected before secure TLS connection was established`
   - 重试结果：`attempts=5/5`，`retry-exhausted`
   - 判断：源站/TLS 握手问题，不是 Supabase 写入问题。

### 未触发的失败项

- 本轮没有出现“Supabase 未同步成功”。
- `frontier_ecosystem_articles` 与 `interview_questions` 没有出现字段冲突、权限拒绝或约束冲突；最终都返回 `HTTP 201`。

## 本地落地位置

- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/career-guide.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`
- `docs/solutions/2026-06-30-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`
- `public.frontier_ecosystem_articles`
- `public.interview_questions`

## 失败 / 未知项

### 失败项

- `Google AI Blog (google-ai)` 本轮采集失败，但不影响三张 Supabase 表最终同步成功。
- `Google DeepMind Blog (deepmind)` 本轮采集失败，但不影响三张 Supabase 表最终同步成功。

### 未知项

- 两个 Google 官方源的 TLS 失败是否为临时网络条件、源站配置变化，还是本环境握手兼容问题，本轮未进一步人工拆分验证。
- 本轮 curated frontier 只提升了 3 条最高信号内容；其余多源采集结果已保留在 `public.news_items`，后续是否继续上浮取决于课程节奏。

## Git 边界

### 初始 `git status --short`

```text
<clean>
```

### 末尾 `git status --short`

```text
 M docs/career-guide.md
 M knowledge-graph/data/frontier-articles.ts
 M knowledge-graph/data/graph.ts
 M knowledge-graph/data/interview-questions.ts
 M supabase/seed/frontier_ecosystem_articles.sql
 M supabase/seed/interview_questions.sql
```
