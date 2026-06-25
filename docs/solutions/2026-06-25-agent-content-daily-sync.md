# 2026-06-25 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 补充 4 条最新高信号 Agent 生态动态：
    - OpenAI Agents Python `v0.17.7`
    - OpenAI Agents JS `v0.12.0`
    - Microsoft Agent Framework `.NET 1.11.0`
    - CrewAI `1.14.8a4`（prerelease）
  - `knowledge-graph/data/interview-questions.ts` 新增 3 道工程类高频题。
  - `docs/career-guide.md` 同步追加 3 条新题的人读清单。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 批次日期滚动到 `2026-06-25`。
- 已完成 Supabase 同步：
  - `public.news_items`：本轮 `stored=440`，远端总量 `1054`。
  - `public.frontier_ecosystem_articles`：远端总量 `97`，写入成功。
  - `public.interview_questions`：远端总量 `44`，写入成功。
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
- 远端匿名读回成功：
  - `news_items`：`HTTP 206`，`content-range=0-0/1054`
  - `frontier_ecosystem_articles`：`HTTP 206`，`content-range=0-0/97`
  - `interview_questions`：`HTTP 206`，`content-range=0-0/44`
- 远端写权限已通过真实 upsert 验证：
  - `npm run supabase:frontier-push` 最终 `HTTP 201`
  - `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` `HTTP 201`

### 2. 多源采集结果（文章 / 技术实践 / 开源动态）

执行命令：

```powershell
node node_modules/tsx/dist/cli.mjs --env-file=.env news-collector/src/cli-collect.ts
```

已验证事实：

- 运行区间：`2026-06-25T00:32:55.371Z -> 2026-06-25T00:33:12.615Z`
- `28/28` 源成功，无失败源。
- `fetched=440`，`dedupe=440`，`stored=440`。
- `news_items` 已写入远端，当前总量 `1054`。
- 本轮覆盖的高信号源包含：
  - 官方 release：OpenAI Agents Python / JS、LangGraph、CrewAI、Google ADK、Semantic Kernel、Letta、smolagents
  - 官方博客：AWS ML、OpenAI、Google AI、DeepMind、Microsoft Source、NVIDIA、Hugging Face
  - 研究源：arXiv `cs.AI`
  - 社区/媒体补充：The Decoder、InfoQ、MIT Technology Review、Hacker News · AI、量子位、AIBase

### 3. 本轮新增 curated frontier 的 4 条内容

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [OpenAI Agents Python v0.17.7 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.17.7) | OpenAI | 2026-06-24 | `11` `14` `17` `18` `20` | high |
| [OpenAI Agents JS v0.12.0 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.12.0) | OpenAI | 2026-06-24 | `05` `11` `17` `18` `20` | high |
| [Microsoft Agent Framework .NET 1.11.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.0) | Microsoft | 2026-06-23 | `05` `11` `17` `18` `20` | high |
| [CrewAI 1.14.8a4 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a4) | CrewAI | 2026-06-24 | `11` `17` `18` `20` | medium |

摘要：

- OpenAI Agents Python `v0.17.7`：重点不在新能力表面，而在 runtime 稳定性边界补齐，包括 buffered tool-call streaming、realtime multi-agent dispatch 歧义修复、guardrail sibling cancellation 与 sandbox sink buffering。
- OpenAI Agents JS `v0.12.0`：核心信号是审批状态机与 guardrail 并发收尾继续收紧，`resolved tool approvals` 不再重复求值，适合映射到高权限工具执行边界。
- Microsoft Agent Framework `.NET 1.11.0`：把 file-access approval、looping、refreshable MCP auth headers、durable hosting 进一步压到 harness/runtime 层，说明长流程 agent 的权限壳层和协议基座继续下沉。
- CrewAI `1.14.8a4`：虽然是 prerelease，但 path traversal 修复与 declarative flow path 校验很有信号，说明 workflow DSL 与本地文件边界已成为真实攻击面。

### 4. 本轮新增 3 道面试题

| slug | 高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `approval-state-idempotency-and-guardrail-race-cancellation` | approval state idempotency / sibling guardrail cancellation / 并发副作用 | `11` `14` `17` `18` `19` | OpenAI Agents Python `v0.17.7` + JS `v0.12.0` |
| `read-only-file-access-still-needs-explicit-approval` | file-access approval / harness loop / 读权限外泄 | `05` `11` `17` `18` `19` | Microsoft Agent Framework `.NET 1.11.0` + Python `1.9.0` |
| `declarative-workflow-path-validation-vs-runtime-filesystem-boundary` | symlink traversal / flow definition path validation / runtime 文件边界 | `11` `17` `18` `19` | CrewAI `1.14.8a4` |

远端回读验证：

- `approval-state-idempotency-and-guardrail-race-cancellation`
- `read-only-file-access-still-needs-explicit-approval`
- `declarative-workflow-path-validation-vs-runtime-filesystem-boundary`

三条都已在 `public.interview_questions` 读回成功。

### 5. 模块归属依据

- 最新资讯流：继续走 `news-collector -> news_items -> lessons/20-agent-frontier-news`，因为这是仓库已有的多源日采集主通道。
- curated frontier：继续落到 `knowledge-graph/data/graph.ts`，因为这是课程生态资料的单一事实源。
- 面试题：继续落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，因为这是结构化题库 + 人读清单双轨。
- 新增条目的模块选择遵循仓库现有结构：
  - runtime / orchestration / deployment -> `11` `18`
  - approval / guardrail / identity / file boundary -> `17` `18`
  - streaming / realtime dispatch -> `14`
  - protocol / tool-use boundary -> `05`

## 重试与失败细节

### 已发生失败（已修复）

1. `npm run supabase:frontier-seed`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：Windows 受管环境对子进程拉起有限制，不是源数据错误。
   - 处理：改用 `node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts`

2. `npm run supabase:interview-seed`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：同上。
   - 处理：改用 `node --experimental-transform-types scripts/generate-interview-questions-supabase-seed.ts`

3. `npm run supabase:frontier-push` 第 1 次
   - 请求目标：`/rest/v1/frontier_ecosystem_articles?on_conflict=slug`
   - 表：`public.frontier_ecosystem_articles`
   - 失败：`HTTP 409` / `code=23505`
   - 失败字段：`article_id`
   - 具体冲突：`Key (article_id)=(frontier-90) already exists`
   - 判断：不是权限问题；是我本轮新增条目时破坏了既有 `article_id` 稳定性。

4. `npm run supabase:frontier-push` 第 2 次
   - 失败：同样 `HTTP 409` / `article_id=frontier-90`
   - 判断：第一次修正只解决了部分顺序，仍把原有 `CrewAI 1.14.8a3` 替成了 `a4`。
   - 最小修复动作：恢复旧 `a3` 行保持远端兼容，再把 `a4` 作为新条目追加。

5. `npm run supabase:frontier-push` 第 3 次
   - 结果：`HTTP 201`，`pushed=97`，成功。

## 本地落地位置

- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/career-guide.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`

## 已上传 Supabase

- `public.news_items`
- `public.frontier_ecosystem_articles`
- `public.interview_questions`

## 失败 / 未知项

### 失败项

- 无。
- 本轮没有出现“Supabase 未同步成功”。

### 未知项

- `CrewAI 1.14.8a4` 是 prerelease，已收录但只给 `medium` 可信度；后续需继续看稳定版是否保留相同安全边界。
- `news_items` 中还有大量社区/媒体级内容，本轮未全部提升进 curated frontier；它们已保留在 `public.news_items` 供后续筛选。
- `news_items` 远端总量从 `867` 增长到 `1054`，本轮新增并非全部是 2026-06-25 当天首发，而是按采集窗口统一去重入库；是否继续提炼更多高信号条目，取决于后续课程内容节奏。
