# 2026-07-13 Agent 内容每日采集同步

## 结论

- 已完成周一补周末窗口采集：本轮覆盖 2026-07-10 至 2026-07-13，重点补充上次 2026-07-10 运行后出现的官方 release、GitHub Changelog 和 arXiv 内容。
- 已完成 news collector 多源采集并写入 Supabase：51/52 源成功，`stored=658`，`public.news_items` 匿名回读 `0-0/3989`。
- 已新增 curated frontier 5 条，事实源落到 `knowledge-graph/data/graph.ts`，并派生到知识图谱、课程 README 与 `supabase/seed/frontier_ecosystem_articles.sql`。
- 已新增高频面试题 5 道，事实源落到 `knowledge-graph/data/interview-questions.ts`，并同步到 `docs/career-guide.md` 与 `supabase/seed/interview_questions.sql`。
- 已完成 Supabase 硬同步：`public.frontier_ecosystem_articles` 上传 136 行，`public.interview_questions` 上传 82 行，新增 slug 均用 anon key 回读命中。

## 已验证事实

### 1. 多源资讯流

命令：`node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts`

结果：

- 运行区间：`2026-07-13T00:37:24.795Z -> 2026-07-13T00:37:42.940Z`。
- 51/52 源成功；失败源为 `36kr-feed`，错误为 `parseURL: Unexpected close tag`。
- `fetched=660`，`dedupe=658`，`content=80/658 fetched`，`empty=83`，`failed=0`，`stored=658`。
- Supabase `public.news_items` 回读：`content-range=0-0/3989`。

### 2. 本轮新增 curated frontier

| 标题 | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [OpenAI Agents SDK Python v0.18.2 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.18.2) | OpenAI | 2026-07-11 | 12 / 14 / 17 / 18 / 20 | high |
| [LangGraph 1.2.9 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.9) | LangGraph | 2026-07-10 | 07 / 11 / 15 / 16 / 18 / 20 | high |
| [Pydantic AI v2.9.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.9.0) | Pydantic AI | 2026-07-10 | 05 / 13 / 16 / 17 / 18 / 20 | high |
| [Per-user states for multi-user budgets in the REST API](https://github.blog/changelog/2026-07-10-per-user-states-for-multi-user-budgets-in-the-rest-api/) | GitHub Changelog | 2026-07-10 | 16 / 18 / 20 | high |
| [Agentic AI and Retrieval-Augmented Models in Straight-Through Underwriting](https://arxiv.org/abs/2607.07858) | arXiv | 2026-07-08 | 09 / 10 / 11 / 15 / 17 / 18 / 20 | medium |

模块选择依据：

- OpenAI Agents SDK -> hosted multi-agent、sandbox lifecycle、realtime、content-filter refusal，可归 12/14/17/18/20。
- LangGraph 1.2.9 -> checkpoint/delta/updateState metadata 与 counters，可归 07/11/15/16/18/20。
- Pydantic AI -> AG-UI tool-call 安全公告、approval、usage limits、GPT-5.6 支持，可归 05/13/16/17/18/20。
- GitHub budget API -> 用户级 AI budget 状态、limit、override、成本预警，可归 16/18/20。
- Agentic RAG underwriting -> RAG、多步推理、多 agent、评估、安全治理、行业部署，可归 09/10/11/15/17/18/20。

去重说明：

- 已跳过 2026-07-10 报告中已收录的 GitHub GPT-5.6 Copilot、Copilot repo overview、Enterprise OTel、CrewAI 1.15.2、Beyond the Leaderboard。
- arXiv underwriting 论文发布时间为 2026-07-08，但未在 2026-07-10 本地 curated 集合中出现；本轮作为周一补采遗漏行业落地信号保留。

### 3. 本轮新增面试题

| slug | 高频考点 | 关联模块 |
| --- | --- | --- |
| `hosted-multi-agent-sdk-sandbox-ownership` | hosted multi-agent / sandbox ownership / realtime / refusal visibility | 12 / 14 / 17 / 18 / 19 |
| `delta-channel-metadata-counters-replay` | delta channel / updateState / replay / observability | 07 / 11 / 15 / 16 / 18 / 19 |
| `agent-ui-tool-call-approval-cwe863` | AG-UI tool-call security / approval / authorization / usage limits | 05 / 13 / 16 / 17 / 18 / 19 |
| `multi-user-ai-budget-state-api-cost-governance` | per-user budget state / cost governance / downgrade / enablement | 16 / 18 / 19 |
| `agentic-rag-underwriting-human-governance` | regulated Agentic RAG / third-party checks / rule evaluation / HITL | 09 / 10 / 11 / 15 / 17 / 18 / 19 |

### 4. 本轮修复

初次运行 collector 写 `news_items` 失败：

- 请求目标：`POST /rest/v1/news_items?on_conflict=external_id`
- 表名：`public.news_items`
- 错误：`HTTP 400 {"code":"PGRST102","message":"Empty or invalid json"}`
- 判断：非网络/权限错误；定位到第 5 批 `rows=400-499`，外部 release/feed 内容包含 PostgREST 不接受的脏 Unicode 情况。

已修复：

- `news-collector/src/store.ts` 改为 100 行一批写入，错误信息包含 table/chunk/rows/http detail。
- 写 PostgREST 前递归清洗 NUL 与孤立 surrogate，保留有效 surrogate pair/emoji。
- 新增 `news-collector/__tests__/store.test.mts`，验证 205 条记录拆成 100/100/5 三批，并验证坏字符被清洗、正常 emoji 保留。

### 5. 生成与 Supabase 上传

生成：

- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts` -> `65 单元 / 329 概念 / 457 关系 / 197 文章`
- `node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts` -> `Wrote 136 frontier articles`
- `node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts` -> `Wrote 82 interview questions`

标准上传入口失败（本机已知 runtime blocker）：

- `npm run supabase:frontier-push` -> `tsx/esbuild spawn EPERM`
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` -> `tsx/esbuild spawn EPERM`

Fallback 成功：

- `node scripts\push-frontier-seed-to-supabase.mjs` -> `Upsert OK (HTTP 201). pushed=136, table count=0-0/136`
- `node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts` -> `Upsert OK (HTTP 201). pushed=82, table count=0-0/587`

匿名回读命中：

- `public.news_items`：`0-0/3989`
- `public.frontier_ecosystem_articles`：`0-0/136`；新增 5/5 rows=1
- `public.interview_questions`：`0-0/587`；新增 5/5 rows=1

## 本地落地位置

- `news-collector/src/store.ts`
- `news-collector/__tests__/store.test.mts`
- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/career-guide.md`
- `docs/knowledge-graph.md`
- `knowledge-graph/output/index.html`
- `lessons/19-agent-ecosystem-and-frontier/README.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`
- `docs/solutions/2026-07-13-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`：成功，`stored=658`，匿名回读 `0-0/3989`。
- `public.frontier_ecosystem_articles`：成功，上传 136 行，匿名回读 `0-0/136`，新增 5/5 命中。
- `public.interview_questions`：成功，上传 82 行，匿名回读 `0-0/587`，新增 5/5 命中。

## 失败 / 未知项

### 失败项

- `36kr-feed` 本轮解析失败：`Unexpected close tag`。collector 故障隔离后继续执行，不影响其他 51 个源和 Supabase 写入。
- 标准 `tsx/esbuild` 上传入口仍触发 `spawn EPERM`。已按既定 fallback 完成生成与上传，不影响 Supabase 最终同步。

### 未知项

- arXiv underwriting 论文为预印本，行业外推仍需同行评审和真实生产数据验证。
- 工作树在本轮开始前已有 `.vitepress/theme/daily-news-article-detail.*`、历史日报/同步报告等未提交变更；本报告只描述本轮内容同步与 news collector 出库补丁。

## 测试 / 校验

- Supabase env -> `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 均存在。
- schema -> frontier 唯一键 `slug/source_url`，interview 唯一键 `slug`。
- news collector -> 51/52 源成功，`stored=658`。
- knowledge graph generation -> 通过。
- frontier seed -> 136 行。
- interview seed -> 82 行。
- Supabase service_role upsert -> 通过。
- Supabase anon readback -> 三表 count + 新增 slug 10/10 命中。
- `node --experimental-transform-types news-collector\__tests__\store.test.mts` -> 通过。
- `npm run typecheck` -> 通过。