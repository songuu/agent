# 2026-06-29 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 新增 3 条高信号 Agent 资料：
    - [Microsoft Agent Framework .NET 1.11.1 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.1)
    - [CrewAI 1.15.1 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.1)
    - [Benchmarking AI Agents for Addressing Scientific Challenges Across Scales](https://arxiv.org/abs/2606.12736)
  - `knowledge-graph/data/interview-questions.ts` 新增 3 道工程类高频题。
  - `docs/career-guide.md` 同步追加 3 条人读题单。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 批次日期滚动到 `2026-06-29`。
- 已完成 Supabase 同步：
  - `public.news_items`：本轮 `stored=479`，远端总量 `1753`。
  - `public.frontier_ecosystem_articles`：远端总量 `104`，写入成功。
  - `public.interview_questions`：远端总量 `50`，写入成功。
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
  - `news_items`：`HTTP 206`，`content-range=0-0/1753`
  - `frontier_ecosystem_articles`：`HTTP 206`，`content-range=0-0/104`
  - `interview_questions`：`HTTP 206`，`content-range=0-0/50`
- 远端写权限已通过真实 upsert 验证：
  - `npx tsx --env-file=.env scripts/push-frontier-ecosystem-to-supabase.ts`：`HTTP 201`
  - `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts`：`HTTP 201`

### 2. 多源采集结果（news_items）

执行命令：

```powershell
node --env-file=.env --experimental-transform-types news-collector/src/cli-collect.ts
```

已验证事实：

- 运行区间：`2026-06-29T00:32:54.910Z -> 2026-06-29T00:33:26.985Z`
- `33/34` 源成功；失败源为：
  - `Google AI Blog (google-ai)`：`Client network socket disconnected before secure TLS connection was established`，`attempts=5/5`，`retry-exhausted`
- 成功覆盖的高信号源包含：
  - 官方 release：OpenAI Agents Python / JS、LangGraph、CrewAI、Google ADK、Google Gen AI SDK、Microsoft AutoGen、Semantic Kernel、Letta、smolagents
  - 官方博客：AWS ML、OpenAI、Hugging Face、Microsoft Source、GitHub Engineering / Changelog、Google DeepMind、NVIDIA
  - 研究源：arXiv `cs.AI`、`cs.LG`
  - 社区/媒体补充：The Decoder、InfoQ、MIT Technology Review、VentureBeat、Hacker News · AI、量子位、IT之家、TechWeb、少数派、LinuxDo
- 本轮 collector 汇总：`fetched=480`，`dedupe=479`，`content fetched=80/479`，`content empty=78`，`content failed=0`，`stored=479`。
- `public.news_items` 已写入远端，当前总量 `1753`。

### 3. 本轮新增 curated frontier 的 3 条内容

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [Microsoft Agent Framework .NET 1.11.1 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.1) | Microsoft | 2026-06-25 | `05` `11` `17` `18` `20` | high |
| [CrewAI 1.15.1 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.1) | CrewAI | 2026-06-27 | `11` `17` `18` `20` | high |
| [Benchmarking AI Agents for Addressing Scientific Challenges Across Scales](https://arxiv.org/abs/2606.12736) | arXiv | 2026-06-10 | `10` `15` `capstone` `20` | medium |

摘要：

- Microsoft Agent Framework `1.11.1`：默认把 skill/provider tools 拉回 `require approval`，并补 checkpoint 兼容性，信号是生产 agent 的默认授权姿态和持久化恢复正在变成硬边界。
- CrewAI `1.15.1`：一边收紧项目定义与自动 Git 初始化，一边修 SSRF redirect bypass，说明 coding/deploy agent 的项目边界与网络边界都在继续收紧。
- SciAgentArena：把 stepwise verification + interactive environment 引入约 200 个科学任务，说明研究型 agent 评测不能只看最终答案，还要看过程控制、探索稳定性和开放式任务失败模式。

远端回读验证：

- 3 条标题均已在 `public.frontier_ecosystem_articles` 读回成功。
- 远端元数据中：
  - `Microsoft Agent Framework .NET 1.11.1 release notes` -> `publishedAt=2026-06-25`、`collected_date=2026-06-29`、`confidence=high`
  - `CrewAI 1.15.1 release notes` -> `publishedAt=2026-06-27`、`collected_date=2026-06-29`、`confidence=high`
  - `Benchmarking AI Agents for Addressing Scientific Challenges Across Scales` -> `publishedAt=2026-06-10`、`collected_date=2026-06-29`、`confidence=medium`

### 4. 本轮新增 3 道面试题

| slug | 高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `approval-by-default-for-agent-skills-and-tools` | default approval / tool trust boundary / audit & replay | `05` `11` `17` `18` `19` | Microsoft Agent Framework `1.11.1` |
| `redirect-based-ssrf-in-agent-fetch-and-scraping-tools` | fetch tool SSRF / redirect chain / metadata leakage | `05` `11` `17` `18` `19` | CrewAI `1.15.1` |
| `stepwise-verification-and-interactive-benchmarks-for-research-agents` | stepwise eval / interactive benchmark / research-agent failure modes | `10` `15` `19` `capstone` | SciAgentArena |

远端回读验证：

- `approval-by-default-for-agent-skills-and-tools`
- `redirect-based-ssrf-in-agent-fetch-and-scraping-tools`
- `stepwise-verification-and-interactive-benchmarks-for-research-agents`

三条都已在 `public.interview_questions` 读回成功，`collected_date=2026-06-29`。

### 5. 模块归属依据

- 最新资讯流：继续走 `news-collector -> news_items -> lessons/20-agent-frontier-news`，因为这是仓库已有的多源日采集主通道。
- curated frontier：继续落到 `knowledge-graph/data/graph.ts`，因为这是课程生态资料的单一事实源；第 20 章再由 `frontier-articles.ts` 派生消费。
- 面试题：继续落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，因为这是结构化题库 + 人读清单双轨。
- 本轮新增条目的模块选择遵循仓库现有结构：
  - default approval / runtime trust boundary -> `05` `11` `17` `18`
  - fetch/search/browser 网络边界 -> `05` `11` `17` `18`
  - reasoning / evaluation / deep research benchmark -> `10` `15` `capstone`

## 重试与失败细节

### 已发生失败（未阻断主任务）

1. `Google AI Blog (google-ai)`
   - 失败原因：`Client network socket disconnected before secure TLS connection was established`
   - 重试结果：`attempts=5/5`，`retry-exhausted`
   - 判断：源站/TLS 握手问题，不是 Supabase 写入问题。

2. `node node_modules/tsx/dist/cli.mjs scripts/generate-frontier-ecosystem-supabase-seed.ts`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：Windows 受管环境对子进程拉起有限制，不是 frontier / interview 数据错误。
   - 处理：改用 `node --experimental-transform-types` 直接执行 TS 生成脚本；frontier/interview seed 都生成成功。

3. `node --experimental-transform-types knowledge-graph/generate.ts`
   - 失败原因：`ERR_MODULE_NOT_FOUND`，因为脚本内部使用无扩展名 `./data/graph` import，Node fallback 不走 `tsx` 的解析补偿。
   - 判断：这是本地派生产物生成链兼容性问题，不影响本轮 Supabase 三表同步成功。

### 未触发的失败项

- 本轮没有出现 “Supabase 未同步成功”。
- `frontier_ecosystem_articles` 与 `interview_questions` 没有出现字段冲突、权限拒绝或约束冲突；最终都返回 `HTTP 201`。

## 本地落地位置

- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/career-guide.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`
- `docs/solutions/2026-06-29-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`
- `public.frontier_ecosystem_articles`
- `public.interview_questions`

## 失败 / 未知项

### 失败项

- `Google AI Blog (google-ai)` 本轮采集失败，但不影响三张 Supabase 表最终同步成功。
- `knowledge-graph/generate.ts` 本轮没有拿到成功证据，因此 `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md` 的更新来自当前工作区既有脏变更或其它执行链，不能把它们当作本轮已重新验证成功的派生产物。

### 未知项

- `arXiv cs.AI` / `cs.LG` 本轮都返回 `0 items`；这更像当天源结果为空而非采集失败，但未进一步人工复核源端是否确实无新增。
- 现有工作区还带着 `src/shared/llm/*.ts`、`docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md` 等旧脏改动；它们不是本轮 Supabase 成功条件的一部分。

## Git 边界

### 初始 `git status --short`

```text
 M docs/career-guide.md
 M knowledge-graph/data/frontier-articles.ts
 M knowledge-graph/data/graph.ts
 M knowledge-graph/data/interview-questions.ts
 M src/shared/llm/anthropic.ts
 M src/shared/llm/index.ts
 M src/shared/llm/openai.ts
 M src/shared/llm/openaiCompatible.ts
 M supabase/seed/frontier_ecosystem_articles.sql
 M supabase/seed/interview_questions.sql
?? docs/solutions/2026-06-26-agent-content-daily-sync.md
?? docs/solutions/2026-06-26-daily-project-summary.md
?? tmp-agent-daily-edit.mjs
```

### 末尾 `git status --short`

```text
 M docs/career-guide.md
 M docs/knowledge-graph.md
 M knowledge-graph/data/frontier-articles.ts
 M knowledge-graph/data/graph.ts
 M knowledge-graph/data/interview-questions.ts
 M knowledge-graph/output/index.html
 M lessons/19-agent-ecosystem-and-frontier/README.md
 M src/shared/llm/anthropic.ts
 M src/shared/llm/index.ts
 M src/shared/llm/openai.ts
 M src/shared/llm/openaiCompatible.ts
 M supabase/seed/frontier_ecosystem_articles.sql
 M supabase/seed/interview_questions.sql
?? docs/solutions/2026-06-26-agent-content-daily-sync.md
?? docs/solutions/2026-06-26-daily-project-summary.md
?? docs/solutions/2026-06-29-daily-project-summary.md
?? docs/solutions/2026-06-29-agent-content-daily-sync.md
?? tmp-agent-daily-edit.mjs
```