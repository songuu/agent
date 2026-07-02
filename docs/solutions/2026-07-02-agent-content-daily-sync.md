# 2026-07-02 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 新增 3 条高信号 Agent 资料：
    - [Microsoft Agent Framework Python 1.10.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/python-1.10.0)
    - [TUA-Bench: A Benchmark for General-Purpose Terminal-Use Agents](https://arxiv.org/abs/2506.17537)
    - [Securing the AI Agent: A Unified Framework for Multi-Layer Agent Red Teaming](https://arxiv.org/abs/2506.19396)
  - `knowledge-graph/data/interview-questions.ts` 新增 3 道工程类高频题。
  - `docs/career-guide.md` 同步追加 3 条人读题单。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 批次日期滚动到 `2026-07-02`。
- 已完成 Supabase 同步：
  - `public.news_items`：本轮 `stored=393`，远端总量 `2220`。
  - `public.frontier_ecosystem_articles`：`HTTP 201`，远端总量 `110`。
  - `public.interview_questions`：`HTTP 201`，远端总量 `556`。
- 本轮最终状态：不是“仅本地落地”，而是“本地事实源 + Supabase 三表同步成功”。

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
- 本地 seed 成功生成：
  - `node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts` -> `Rows: 110`
  - `node --experimental-transform-types scripts/generate-interview-questions-supabase-seed.ts` -> `Rows: 56`
- 远端写权限已通过真实 upsert 验证：
  - `node scripts/push-frontier-seed-to-supabase.mjs` -> `HTTP 201`, `table count=0-0/110`
  - `node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts` -> `HTTP 201`, `table count=0-0/556`
- 远端回读成功：
  - `news_items` -> `HTTP 206`, `content-range=0-0/2220`
  - `frontier_ecosystem_articles` 新增 3 条 slug 全部读回，`collected_date=2026-07-02`
  - `interview_questions` 新增 3 条 slug 全部读回，`content-range=0-0/3`

### 2. 多源采集结果（news_items）

执行命令：

```powershell
node --env-file=.env --experimental-transform-types news-collector/src/cli-collect.ts
```

已验证事实：

- 运行区间：`2026-07-02T00:43:46.910Z -> 2026-07-02T00:44:57.123Z`
- `26/34` 源成功，`8/34` 源失败但未阻断主任务。
- 成功覆盖的高信号源包含：
  - 官方 release：OpenAI Agents Python / JS、LangGraph、CrewAI、Google ADK、Google Gen AI SDK、Microsoft AutoGen、Semantic Kernel、Letta、smolagents
  - 官方博客：Google AI、Google DeepMind、Microsoft Source、AWS ML、NVIDIA、GitHub Changelog
  - 研究源：arXiv `cs.AI`、`cs.LG`
  - 社区/媒体补充：量子位、IT之家、TechWeb、少数派、InfoQ、Ahead of AI、The Decoder
- 本轮 collector 汇总：`fetched=393`，`dedupe=393`，`content fetched=80/393`，`content empty=9`，`content failed=0`，`stored=393`。
- `public.news_items` 已写入远端，当前总量 `2220`。

### 3. 本轮新增 curated frontier 的 3 条内容

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [Microsoft Agent Framework Python 1.10.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/python-1.10.0) | Microsoft | 2026-06-30 | `05` `11` `16` `18` `20` | high |
| [TUA-Bench: A Benchmark for General-Purpose Terminal-Use Agents](https://arxiv.org/abs/2506.17537) | arXiv | 2026-06-27 | `10` `15` `18` `20` | medium |
| [Securing the AI Agent: A Unified Framework for Multi-Layer Agent Red Teaming](https://arxiv.org/abs/2506.19396) | arXiv | 2026-06-27 | `11` `15` `17` `18` `20` | medium |

摘要：

- Microsoft Agent Framework Python `1.10.0`：把 background agent loop provider 解析、available resources/scripts 暴露与 skill/resource error 透传放进同一次 release，信号是 production harness 开始把“可调试、自纠错、可回放”前移成 runtime 默认职责。
- TUA-Bench：terminal-use agent 不再只在 coding task 上打分，而是覆盖文档、邮件、研究、内容创作与运维，评测目标从“会不会写代码”扩展为“能不能持续完成真实知识工作”。
- AI-Infra-Guard：agent 红队被拆成 infrastructure / protocol / agent / model 四层，说明生产 agent 的安全验证不能只做 prompt jailbreak，还要覆盖身份、协议调用与工具编排。

远端回读验证：

- `microsoft-agent-framework-python-1-10-0-release-notes`
- `tua-bench-a-benchmark-for-general-purpose-terminal-use-agents`
- `securing-the-ai-agent-a-unified-framework-for-multi-layer-agent-red-teaming`

三条都已在 `public.frontier_ecosystem_articles` 读回成功，`collected_date=2026-07-02`。

### 4. 本轮新增 3 道面试题

| slug | 高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `debuggable-harness-boundary-in-background-agent-runtime` | harness 调试边界 / background loop / provider 解析 / 自纠错 | `05` `11` `16` `18` `19` | Microsoft Agent Framework Python `1.10.0` |
| `terminal-use-agent-benchmark-needs-real-work-breadth` | terminal-use benchmark / long-horizon work / cross-tool task | `10` `15` `18` `19` | TUA-Bench |
| `multi-layer-agent-red-teaming-vs-single-jailbreak-metric` | multi-layer red teaming / infra-protocol-agent-model | `11` `15` `17` `18` `19` | AI-Infra-Guard |

远端回读验证：

- `debuggable-harness-boundary-in-background-agent-runtime`
- `terminal-use-agent-benchmark-needs-real-work-breadth`
- `multi-layer-agent-red-teaming-vs-single-jailbreak-metric`

三条都已在 `public.interview_questions` 读回成功，`collected_date=2026-07-02`。

### 5. 模块归属依据

- 最新资讯流：继续走 `news-collector -> news_items -> lessons/20-agent-frontier-news`，因为这是仓库已有的多源日采集主通道。
- curated frontier：继续落到 `knowledge-graph/data/graph.ts`，因为这是课程生态资料的单一事实源；第 20 章再由 `frontier-articles.ts` 派生消费。
- 面试题：继续落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，因为这是结构化题库 + 人读清单双轨。
- 本轮新增条目的模块选择遵循仓库现有结构：
  - background runtime / harness 调试边界 -> `05` `11` `16` `18`
  - terminal-use agent 评测 -> `10` `15` `18`
  - multi-layer red teaming -> `11` `15` `17` `18`

## 重试与失败细节

### 已发生失败（未阻断主任务）

1. `npm run supabase:frontier-push`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：Windows 受管环境对子进程拉起有限制，不是 frontier 数据错误。
   - 处理：按约束切换到 `node scripts/push-frontier-seed-to-supabase.mjs`，从已生成 SQL seed 直接 PostgREST upsert。

2. 以下源在 collector 中重试后仍失败：
   - `hn-ai`
   - `hn-frontpage`
   - `linuxdo-latest`
   - `github-engineering`
   - `venturebeat-ai`
   - `mit-tr`
   - `huggingface`
   - `openai`
   - 共性错误：`Client network socket disconnected before secure TLS connection was established` 或 `fetch failed`
   - 判断：源站/TLS/网络链路问题，不是 Supabase 写入问题。

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
- `docs/solutions/2026-07-02-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`
- `public.frontier_ecosystem_articles`
- `public.interview_questions`

## 失败 / 未知项

### 失败项

- `hnrss`、`linux.do`、`github.blog/engineering`、`venturebeat`、`technologyreview`、`huggingface`、`openai news` 本轮采集失败，但不影响三张 Supabase 表最终同步成功。
- 本轮临时核验脚本 `.tmp-supabase-verify.mjs` 在本地被占用，删除失败；已清空内容，但仍残留在仓库根目录，属于低风险本地清理项，不影响数据同步结果。

### 未知项

- 多个 TLS 失败源是否为临时网络波动、源站配置变化，还是本环境握手兼容问题，本轮未进一步人工拆分验证。
- `public.interview_questions` 当前远端总量为 `556`，明显高于本地 seed `56`；说明远端已累计更多历史/外部题目，本轮只验证新增 3 条已成功 upsert，没有做全表去重或历史清洗。

## Git 边界

### 初始 `git status --short`

```text
 M .vitepress/config.mts
 M .vitepress/theme/custom.css
 M .vitepress/theme/index.ts
 M .vitepress/theme/interview-clinic-data.test.mts
 M .vitepress/theme/interview-clinic-data.ts
 M .vitepress/theme/interview-clinic-filter.test.mts
 M .vitepress/theme/interview-clinic-filter.ts
 M .vitepress/theme/interview-clinic.ts
 M docs/career-guide.md
 M knowledge-graph/data/graph.ts
 M knowledge-graph/data/interview-questions.ts
 M knowledge-graph/data/visuals.ts
 M package.json
 M scripts/codefather-interview-cron.ts
 M scripts/codefather-interview-ecosystem.config.cjs
 M scripts/generate-interview-questions-supabase-seed.ts
 M scripts/push-interview-questions-to-supabase.ts
 M scripts/sync-codefather-interview-to-supabase.test.mts
 M scripts/sync-codefather-interview-to-supabase.ts
 M supabase/seed/interview_questions.sql
?? .vitepress/theme/interview-article-detail.test.mts
?? .vitepress/theme/interview-article-detail.ts
?? .vitepress/theme/interview-clinic-chapters.ts
?? .vitepress/theme/interview-similarity.ts
?? docs/solutions/2026-07-01-daily-project-summary.md
?? interview/
?? pnpm-workspace.yaml
?? scripts/deploy-codefather-interview-sync.ps1
?? scripts/run-codefather-interview-cron.sh
?? tmp-edit-codefather.js
?? tmp-read-codefather.mjs
```

### 末尾 `git status --short`

```text
 M .vitepress/config.mts
 M .vitepress/theme/custom.css
 M .vitepress/theme/index.ts
 M .vitepress/theme/interview-clinic-data.test.mts
 M .vitepress/theme/interview-clinic-data.ts
 M .vitepress/theme/interview-clinic-filter.test.mts
 M .vitepress/theme/interview-clinic-filter.ts
 M .vitepress/theme/interview-clinic.ts
 M docs/career-guide.md
 M knowledge-graph/data/frontier-articles.ts
 M knowledge-graph/data/graph.ts
 M knowledge-graph/data/interview-questions.ts
 M knowledge-graph/data/visuals.ts
 M package.json
 M scripts/codefather-interview-cron.ts
 M scripts/codefather-interview-ecosystem.config.cjs
 M scripts/generate-interview-questions-supabase-seed.ts
 M scripts/push-interview-questions-to-supabase.ts
 M scripts/sync-codefather-interview-to-supabase.test.mts
 M scripts/sync-codefather-interview-to-supabase.ts
 M supabase/seed/frontier_ecosystem_articles.sql
 M supabase/seed/interview_questions.sql
?? .tmp-supabase-verify.mjs
?? .vitepress/theme/interview-article-detail.test.mts
?? .vitepress/theme/interview-article-detail.ts
?? .vitepress/theme/interview-clinic-chapters.ts
?? .vitepress/theme/interview-similarity.ts
?? docs/solutions/2026-07-01-daily-project-summary.md
?? docs/solutions/2026-07-02-agent-content-daily-sync.md
?? docs/solutions/2026-07-02-daily-project-summary.md
?? interview/
?? pnpm-workspace.yaml
?? scripts/deploy-codefather-interview-sync.ps1
?? scripts/run-codefather-interview-cron.sh
?? tmp-edit-codefather.js
?? tmp-read-codefather.mjs
```
