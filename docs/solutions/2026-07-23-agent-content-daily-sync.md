# 2026-07-23 Agent 内容每日采集同步

## 结论

- Supabase 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成远端写入与匿名 key readback。
- 本轮结构化新增：前沿内容 7 条，面试题 7 条。
- 普通 RSS/新闻采集成功：60/60 个源，`stored=795`，`news_items` 远端总量 `0-0/6171`，`collected_date=2026-07-23` 回读 `0-0/912`。
- 今天是 2026-07-23 星期四，不触发周一补采周末窗口。

## 本轮新增前沿内容

| slug | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `new-copilot-usage-metrics-impact-dashboard` | https://github.blog/changelog/2026-07-22-new-copilot-usage-metrics-impact-dashboard/ | 2026-07-22 | evaluation / rollout metrics | high |
| `gemini-3-6-flash-is-now-available-in-github-copilot` | https://github.blog/changelog/2026-07-21-gemini-3-6-flash-is-now-available-in-github-copilot/ | 2026-07-21 | model-platform / coding agent model picker | high |
| `building-verification-loops-in-claude-code-with-skills` | https://claude.com/blog/building-verification-loops-in-claude-code-with-skills | 2026-07-22 | evaluation / skills / CI verification | high |
| `coderescue-budget-calibrated-recovery-routing-for-coding-agents` | https://arxiv.org/abs/2607.19338 | 2026-07-21 | evaluation / cost-aware recovery | medium |
| `researcharena-evaluating-sabotage-and-monitoring-in-automated-ai-r-d` | https://arxiv.org/abs/2607.19321 | 2026-07-21 | security-governance / research agent monitoring | medium |
| `skillware-a-software-ontology-and-engineering-lifecycle-for-persistent-behavioral-artifact` | https://arxiv.org/abs/2607.18970 | 2026-07-21 | runtime / skill lifecycle | medium |
| `data-leakage-prevention-in-agentic-applications-via-preemptive-hardening` | https://arxiv.org/abs/2607.18847 | 2026-07-21 | security-governance / pre-deployment hardening | medium |

## 本轮新增面试题

- `copilot-impact-dashboard-adoption-cohorts-vs-active-users`
- `gemini-36-flash-model-picker-effort-parallel-tools`
- `verification-loop-skills-vs-manual-checks`
- `coderescue-budget-calibrated-recovery-routing`
- `researcharena-sabotage-monitor-artifact-control`
- `skillware-lifecycle-vs-prompt-snippet`
- `preemptive-hardening-vs-runtime-policy-only`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 7 条。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 7 条，`COLLECTED_DATE=2026-07-23`。
- `docs/career-guide.md`：高频工程题追加 Q88-Q94。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-07-23 / 7月23日 · 星期四`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `knowledge-graph/generate.ts` 重新生成。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 174 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 117 条 interview seed。

## Supabase 同步证据

配置/权限预检：`.env` 中 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 均存在；迁移显示 `frontier_ecosystem_articles.slug`、`interview_questions.slug`、`news_items.external_id` 为 upsert 冲突键，三表均允许 public select。

标准路径与降级路径：

- `npm run supabase:frontier-seed` -> `tsx/esbuild spawn EPERM`，未生成。
- `npm run supabase:interview-seed` -> `tsx/esbuild spawn EPERM`，未生成。
- `node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts` -> `Wrote 174 frontier articles`。
- `node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts` -> `Wrote 117 interview questions`。
- `npm run supabase:frontier-push` -> `tsx/esbuild spawn EPERM`，未写库。
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` -> `tsx/esbuild spawn EPERM`，未写库。
- `node scripts\push-frontier-seed-to-supabase.mjs` -> `Upsert OK (HTTP 201). pushed=174, table count=0-0/174`。
- `node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts` -> `Upsert OK (HTTP 201). pushed=117, table count=0-0/625`。
- `node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts` -> `sources=60/60 ok`, `stored=795`, `table=0-0/6171`。

匿名 key 独立 readback：

- `frontier_ecosystem_articles`：总量 `0-0/174`，本轮 7/7 slug 均命中。
- `interview_questions`：总量 `0-0/625`，本轮 7/7 slug 均命中。
- `news_items`：总量 `0-0/6171`，`collected_date=2026-07-23` 为 `0-0/912`。

## 验证

- `node --experimental-transform-types` direct import：通过，`FRONTIER_ARTICLES=174`、`INTERVIEW_QUESTIONS=117`、本轮 slug 存在且无重复。
- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts`：通过，刷新 `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`，并注入 README：`更新 1 · 未变 64 · 缺失 0`。
- Seed 生成：frontier 174 行、interview 117 行。
- RSS/新闻：60/60 源成功，无失败源。

## 失败/未知项

- Supabase 同步：已成功，无未同步表。
- 标准 `npm run ...` / `npx tsx ...` 路径：本机 Windows 环境仍受 `tsx/esbuild spawn EPERM` 影响；已按任务要求使用 direct Node / seed PostgREST fallback，不影响远端成功。
- 工作树：进入本轮前已有大量未提交改动；本轮只追加 agent 内容同步相关事实源、派生文件、seed 和本报告，未回滚并行改动。

## 运行时间

- 写入时间：2026-07-23T08:43:20.4056550+08:00