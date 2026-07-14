# 2026-07-10 Agent 内容每日采集同步

## 结论

- 已完成本轮多源资讯采集：news-collector 52/52 源成功，写入 `public.news_items`，本轮 `stored=750`，远端总量 `3718`。
- 已新增 curated frontier 5 条，事实源落到 `knowledge-graph/data/graph.ts`，并派生到知识图谱、课程 README 与 `supabase/seed/frontier_ecosystem_articles.sql`。
- 已新增高频面试题 5 道，事实源落到 `knowledge-graph/data/interview-questions.ts`，并同步到 `docs/career-guide.md` 与 `supabase/seed/interview_questions.sql`。
- 已完成 Supabase 同步：`public.news_items`、`public.frontier_ecosystem_articles`、`public.interview_questions` 均真实写入，并用匿名 key 回读命中新增项。
- 本轮运行日是 2026-07-10（周五），不触发“周一补周末”额外窗口。

## 已验证事实

### 1. 多源资讯流

命令：`node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts`

结果：

- 运行区间：`2026-07-09T23:04:24.655Z -> 2026-07-09T23:04:41.432Z`。
- 52/52 源成功，覆盖 GitHub Changelog、OpenAI、Google AI/DeepMind、Microsoft Source AI、AWS ML、NVIDIA、InfoQ、arXiv、LangGraph、CrewAI、OpenAI Agents、Google ADK、MCP SDK、Pydantic AI、browser-use、OpenHands、Aider、Langfuse、Phoenix、DSPy、Hugging Face 等。
- `fetched=750`，`dedupe=750`，`content=80/750 fetched`，`empty=84`，`failed=0`，`stored=750`。
- Supabase `public.news_items` 回读：`content-range=0-0/3718`。

### 2. 本轮新增 curated frontier

| 标题 | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [OpenAI's GPT-5.6 Sol, Terra, and Luna are now available in GitHub Copilot](https://github.blog/changelog/2026-07-09-openais-gpt-5-6-sol-terra-and-luna-are-now-available-in-github-copilot/) | GitHub Changelog | 2026-07-09 | 12 / 16 / 18 / 20 | high |
| [Ask Copilot for a repository overview](https://github.blog/changelog/2026-07-09-ask-copilot-for-a-repository-overview/) | GitHub Changelog | 2026-07-09 | 07 / 12 / 16 / capstone / 20 | high |
| [Enterprise-managed OpenTelemetry export for VS Code and CLI](https://github.blog/changelog/2026-07-08-enterprise-managed-opentelemetry-export-for-vs-code-and-cli/) | GitHub Changelog | 2026-07-08 | 16 / 17 / 18 / 20 | high |
| [CrewAI 1.15.2 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.2) | CrewAI | 2026-07-08 | 11 / 12 / 14 / 17 / 18 / 20 | high |
| [Beyond the Leaderboard](https://arxiv.org/abs/2607.05775) | arXiv | 2026-07-07 | 05 / 10 / 11 / 15 / 17 / 18 / 20 | medium |

模块选择依据：

- GPT-5.6 Copilot -> 模型族、入口覆盖、usage-based billing、企业策略，归 12/16/18/20。
- Repository overview -> 仓库理解、onboarding、README 生成和事实复核，归 07/12/16/capstone/20。
- Enterprise OTel -> CLI agent host、prompt/response/tool content 观测、header 隔离和企业托管配置，归 16/17/18/20。
- CrewAI 1.15.2 -> flow / skill / repository agents / streaming / supply-chain hardening，归 11/12/14/17/18/20。
- Beyond the Leaderboard -> failure taxonomy、benchmark validity、tool/planning/context/coordination/safety failure buckets，归 05/10/11/15/17/18/20。

去重说明：

- `CrewAI 1.15.2` 与既有 `CrewAI 1.15.2a2` prerelease 高度相关；本轮保留 stable release 作为 superseding 信号，并在可信度说明中显式标注关系。
- 本轮未重复收录 2026-07-08 已落库的 OpenAI Agents SDK / Google ADK / LangGraph / Microsoft rollout 4 条。

### 3. 本轮新增面试题

| slug | 高频考点 | 关联模块 |
| --- | --- | --- |
| `copilot-model-family-policy-and-job-fit` | agentic coding 模型族 / 任务匹配 / billing / 管理员策略 | 12 / 16 / 18 / 19 |
| `repository-overview-onboarding-vs-source-truth` | 仓库 overview / onboarding / 事实源复核 | 07 / 12 / 16 / 19 / capstone |
| `managed-otel-agent-host-vs-local-env-telemetry` | managed OTel / agent host / prompt-tool trace / header 隔离 | 16 / 17 / 18 / 19 |
| `stable-crewai-flow-skill-runtime-hardening` | CrewAI stable runtime / flow / skill / repo agent / supply-chain | 11 / 12 / 14 / 17 / 18 / 19 |
| `agent-failure-taxonomy-vs-leaderboard-score` | leaderboard 局限 / failure taxonomy / 回归分桶 | 05 / 10 / 11 / 15 / 17 / 18 / 19 |

### 4. 生成与 Supabase 上传

标准 `tsx` 入口失败（本机已知 runtime blocker）：

- `npm run kg` -> `Error: spawn EPERM`
- `npm run supabase:frontier-seed` -> `Error: spawn EPERM`
- `npm run supabase:interview-seed` -> `Error: spawn EPERM`
- `npm run supabase:frontier-push` -> `Error: spawn EPERM`
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` -> `Error: spawn EPERM`

Fallback 成功：

- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts` -> `65 单元 / 329 概念 / 457 关系 / 192 文章`
- `node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts` -> `Wrote 131 frontier articles`
- `node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts` -> `Wrote 77 interview questions`
- `node scripts\push-frontier-seed-to-supabase.mjs` -> `Upsert OK (HTTP 201), pushed=131, table count=0-0/131`
- `node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts` -> `Upsert OK (HTTP 201), pushed=77, table count=0-0/580`

新增 frontier 回读命中：

- `openai-s-gpt-5-6-sol-terra-and-luna-are-now-available-in-github-copilot`
- `ask-copilot-for-a-repository-overview`
- `enterprise-managed-opentelemetry-export-for-vs-code-and-cli`
- `crewai-1-15-2-release-notes`
- `beyond-the-leaderboard-a-synthesis-of-agentic-ai-benchmarking-failure-taxonomies-and-evalu`

新增 interview 回读命中：

- `copilot-model-family-policy-and-job-fit`
- `repository-overview-onboarding-vs-source-truth`
- `managed-otel-agent-host-vs-local-env-telemetry`
- `stable-crewai-flow-skill-runtime-hardening`
- `agent-failure-taxonomy-vs-leaderboard-score`

## 本地落地位置

- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/career-guide.md`
- `docs/knowledge-graph.md`
- `knowledge-graph/output/index.html`
- `lessons/19-agent-ecosystem-and-frontier/README.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`
- `docs/solutions/2026-07-10-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`：成功，匿名回读 `0-0/3718`。
- `public.frontier_ecosystem_articles`：成功，上传 131 行，匿名回读 `0-0/131`，新增 5/5 命中。
- `public.interview_questions`：成功，上传 77 行，匿名回读 `0-0/580`，新增 5/5 命中。

## 失败 / 未知项

### 失败项

- `tsx/esbuild spawn EPERM` 仍存在；已按既定 fallback 完成生成与上传，不影响 Supabase 最终同步。

### 未知项

- `Beyond the Leaderboard` 是 arXiv 预印本，结论仍需后续同行评审和具体 benchmark 复核。
- CrewAI stable release 与已收录 prerelease 部分重叠；本轮已按 stable superseding 信号记录，但未删除旧 prerelease 行，避免破坏已有 slug / source_url 历史。

## 测试 / 校验

- news collector -> 52/52 源成功，stored=750。
- schema / env -> `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 均存在；迁移显示 frontier 用 `slug/source_url` 唯一，interview 用 `slug` 唯一。
- local data import -> frontier `131/131` slug 唯一；interview `77/77` slug 唯一。
- knowledge graph generation -> 通过。
- frontier seed -> 131 行。
- interview seed -> 77 行。
- Supabase service_role upsert -> 通过。
- Supabase anon readback -> frontier 5/5，interview 5/5。
- `npm run typecheck` -> 通过。