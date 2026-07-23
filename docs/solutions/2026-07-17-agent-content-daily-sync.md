---
title: "Agent 内容每日采集同步 (2026-07-17)"
date: 2026-07-17
tags: [agent, content-sync, frontier, interview, supabase]
related_instincts: []
aliases: ["Agent 内容每日采集同步 2026-07-17"]
---

# Agent 内容每日采集同步 (2026-07-17)

## 结论

- 本轮 Supabase 同步已成功，不是仅本地落地。
- 今天是周五，不触发“周一补采周末文章”；采集重点覆盖上次运行后到 `2026-07-17` 的最新 Agent 生态内容，并顺手收口了上轮已落在本地但未完成远端写入的 7 月中旬 frontier/interview 数据。
- 本轮新增 curated frontier `6` 条，Supabase 读回 `6/6`。
- 本轮新增高频面试题 `6` 条，Supabase 读回 `6/6`。
- `news-collector` 采集 `52/52` 来源成功，写入 `749` 条去重新闻，Supabase `news_items` 表读到总量 `4889`。

## 本轮新增 Frontier 内容

| article_id | 标题 | 来源 | 发布时间 | 模块 | 可信度 |
|---|---|---|---|---|---|
| `frontier-150` | [OpenAI Agents SDK JS v0.13.4 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.13.4) | OpenAI GitHub release | 2026-07-15 | runtime / structured output / streaming / observability | high |
| `frontier-151` | [OpenHands cloud 1.46.2 release notes](https://github.com/OpenHands/OpenHands/releases/tag/cloud-1.46.2) | OpenHands GitHub release | 2026-07-15 | production SaaS / MCP auth / observability | high |
| `frontier-152` | [Langfuse v3.218.0 release notes](https://github.com/langfuse/langfuse/releases/tag/v3.218.0) | Langfuse GitHub release | 2026-07-16 | evaluation / tracing / export safety | high |
| `frontier-153` | [Pydantic AI v2.11.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.11.0) | Pydantic GitHub release | 2026-07-15 / GitHub 2026-07-16 | runtime / history processing / provider-native schema | high |
| `frontier-154` | [Agent-Safety Evaluations as Load-Bearing Evidence](https://arxiv.org/abs/2607.12469) | arXiv preprint | 2026-07-14 | evaluation / safety / reconstructability | medium |
| `frontier-155` | [Coding-agents can replicate scientific machine learning papers](https://arxiv.org/abs/2607.02134) | arXiv preprint | 2026-07-02 / revised 2026-07-10 | coding agent evaluation / provenance | medium |

模块选择依据：仓库现有 Agent 课程把第 `19` 章作为 frontier 生态入口，具体内容再按 runtime、structured output、streaming、observability、evaluation、safety、deployment 等标签挂到相关课程与 capstone。预印本保留为 medium，原因是来源一手但尚需同行评审和独立复现。

## 本轮新增面试题

| question_id | slug | 对应主题 |
|---|---|---|
| `iq-85` | `stream-usage-schema-failfast-provider-normalization` | Agents SDK 流式 usage、schema fail-fast、provider response normalization |
| `iq-86` | `settings-roundtrip-mcp-auth-secrets-and-saas-observability` | OpenHands MCP auth secret、PostHog distinct_id、DB pool defaults |
| `iq-87` | `observability-eval-export-trace-io-ssrf-fail-closed` | Langfuse event stream filters、eval export、SSRF/export fail-closed |
| `iq-88` | `history-processing-usage-errors-native-schema-contract` | Pydantic AI HistoryProcessor、usage/tool retry errors、native schema transform |
| `iq-89` | `agent-safety-reconstructability-vs-final-score` | Agent safety reconstructability、Evidence Sufficiency Cards |
| `iq-90` | `paper-replication-workspace-evidence-vs-final-message` | Coding agent paper replication、workspace evidence、validation checks |

## 本地落地位置

- `knowledge-graph/data/graph.ts`：frontier 事实源，新增 `6` 条本轮 curated 条目，并将上轮本地未上传的 `8` 条 7 月中旬条目移动到已存在的 AIDev 条目之后，避免远端 `article_id` 唯一约束冲突。
- `knowledge-graph/data/frontier-articles.ts`：采集日期推进到 `2026-07-17`，展示标签为 `7月17日 · 星期五`。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源，新增 `6` 条题目与本地答案摘要，采集日期推进到 `2026-07-17`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由知识图谱生成器同步刷新。
- `supabase/seed/frontier_ecosystem_articles.sql`：由 frontier seed 生成器刷新，总计 `155` 条。
- `supabase/seed/interview_questions.sql`：由 interview seed 生成器刷新，总计 `98` 条。

## Supabase 配置与表结构检查

- `.env` 中 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA` 均存在。
- 本地迁移显示 `frontier_ecosystem_articles` 与 `interview_questions` 的 upsert 身份应以 `slug` 为准。
- 远端实际返回过 `frontier_ecosystem_articles_article_id_key` 唯一约束冲突，说明远端还保留了 `article_id` unique schema drift；本轮通过 append-only 顺序修正避免冲突，未静默跳过。

## Supabase 上传与读回证据

### 新闻采集

```text
node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts
sources: 52/52 ok
fetched=750 dedupe=749 content=80/749 fetched empty=81 failed=0 enriched=0 stored=749 table=0-0/4889
```

### Frontier seed 生成与上传

```text
node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts
Wrote 155 frontier articles to C:\project\my\agent-build\supabase\seed\frontier_ecosystem_articles.sql
```

标准上传命令：

```text
npm run supabase:frontier-push
Error: spawn EPERM
```

按自动化要求改用 seed fallback：

```text
node scripts\push-frontier-seed-to-supabase.mjs
```

首次 fallback 失败：

```text
HTTP 409
code: 23505
details: Key (article_id)=(frontier-141) already exists.
table: frontier_ecosystem_articles
request target: /rest/v1/frontier_ecosystem_articles?on_conflict=slug
failed field: article_id
判断: 不是网络或权限问题，是远端 article_id unique 与本地按数组派生 article_id 的顺序漂移冲突。
```

修正后再次上传成功：

```text
Upsert OK (HTTP 201). pushed=155, table count (content-range)=0-0/155
```

读回新增 `6/6`：

```text
frontier-150 openai-agents-sdk-js-v0-13-4-release-notes
frontier-151 openhands-cloud-1-46-2-release-notes
frontier-152 langfuse-v3-218-0-release-notes
frontier-153 pydantic-ai-v2-11-0-release-notes
frontier-154 agent-safety-evaluations-as-load-bearing-evidence-a-vendor-neutral-cross-harness-reconstru
frontier-155 coding-agents-can-replicate-scientific-machine-learning-papers
```

### Interview seed 生成与上传

```text
node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts
Wrote 98 interview questions to C:\project\my\agent-build\supabase\seed\interview_questions.sql
```

标准上传命令：

```text
npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts
Error: spawn EPERM
```

改用 direct node fallback：

```text
node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts
Upsert OK (HTTP 201). pushed=98, table count (content-range)=0-0/603
```

读回新增 `6/6`：

```text
iq-85 stream-usage-schema-failfast-provider-normalization
iq-86 settings-roundtrip-mcp-auth-secrets-and-saas-observability
iq-87 observability-eval-export-trace-io-ssrf-fail-closed
iq-88 history-processing-usage-errors-native-schema-contract
iq-89 agent-safety-reconstructability-vs-final-score
iq-90 paper-replication-workspace-evidence-vs-final-message
```

## 验证命令

```text
node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts
完成：65 单元 / 329 概念 / 457 关系 / 216 文章

npm run typecheck
退出码 0

node node_modules\tsx\dist\cli.mjs --test news-collector\__tests__\store.test.mts scripts\sync-codefather-interview-to-supabase.test.mts .vitepress\theme\daily-news-article-detail.test.mts
26 tests / 26 pass / 0 fail
```

## 失败与未知项

- `npm run supabase:frontier-push` 与 `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` 在 Windows 当前环境仍被 `spawn EPERM` 阻断；已按要求使用 direct node / seed fallback 完成 Supabase 上传，因此不构成本轮硬失败。
- 远端 `frontier_ecosystem_articles` 仍存在 `article_id` unique 约束，而本地迁移注释说明 `article_id` 不应作为唯一身份。当前最小动作已完成：保持 append-only 顺序并成功写入。长期最小修复是对齐远端 schema，或把 `article_id` 改成稳定、非数组下标派生的标识。
- 两篇 arXiv 论文是 medium confidence：一手来源可追溯，但仍需后续同行评审或独立复现。

## Trace Appendix

```powershell
node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts
node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts
node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts
node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts
npm run supabase:frontier-push
node scripts\push-frontier-seed-to-supabase.mjs
npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts
node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts
npm run typecheck
node node_modules\tsx\dist\cli.mjs --test news-collector\__tests__\store.test.mts scripts\sync-codefather-interview-to-supabase.test.mts .vitepress\theme\daily-news-article-detail.test.mts
```
