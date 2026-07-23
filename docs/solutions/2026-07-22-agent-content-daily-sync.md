# 2026-07-22 Agent 内容每日采集同步

## 结论

- Supabase 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成远端 readback。
- 本轮结构化新增：前沿文章 6 条，面试题 6 条。
- 本地生成成功：`knowledge-graph/output/index.html`、`docs/knowledge-graph.md`、`supabase/seed/frontier_ecosystem_articles.sql`、`supabase/seed/interview_questions.sql`。
- 普通 RSS/新闻采集成功 58/60 个源，写入 `news_items`；OpenAI News 与 Hugging Face Blog RSS 在本轮采集内置 5 次重试后仍超时，见“失败/未知项”。

## 本轮新增前沿内容

| slug | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `openai-agents-sdk-python-v0-18-3-release-notes` | https://github.com/openai/openai-agents-python/releases/tag/v0.18.3 | 2026-07-17 | runtime / observability / security | high |
| `pydantic-ai-2-14-1-release` | https://pypi.org/project/pydantic-ai/ | 2026-07-21 | runtime / structured output / evals | high |
| `crewai-1-15-5-skill-registry-authentication-release` | https://github.com/crewAIInc/crewAI/releases/tag/1.15.5 | 2026-07-20 | skill registry / supply-chain governance | high |
| `openai-codex-npm-packages-0-145-0-release-train` | https://www.npmjs.com/org/openai | 2026-07-22 | coding agent SDK / release governance | medium |
| `ai-credit-pools-for-cost-centers-in-the-billing-ui` | https://github.blog/changelog/2026-07-20-ai-credit-pools-for-cost-centers-in-the-billing-ui/ | 2026-07-20 | cost governance / enterprise controls | high |
| `openai-agents-sdk-javascript-0-13-5-release` | https://www.npmjs.com/package/@openai/agents | 2026-07-19 | JS agent runtime / package provenance | high |

## 本轮新增面试题

- `task-turn-tracing-realtime-usage-session-isolation`
- `pydantic-ai-capabilities-stack-vs-monolithic-agent`
- `skill-registry-authentication-and-promotion-boundary`
- `codex-cli-sdk-embedded-agent-release-risk`
- `ai-credit-pool-cost-center-governance`
- `agents-js-package-surface-and-supply-chain-provenance`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿文章事实源追加 6 条。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 6 条，`COLLECTED_DATE=2026-07-22`。
- `docs/career-guide.md`：高频工程题追加 Q82-Q87。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示日期更新为 `2026-07-22 / 7月22日 · 星期三`。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 167 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 110 条 interview seed。

## Supabase 同步证据

- `npm run supabase:frontier-push`：失败于 Windows `tsx/esbuild spawn EPERM`，未写库。
- `node scripts\push-frontier-seed-to-supabase.mjs`：成功，`Upsert OK (HTTP 201). pushed=167, table count=0-0/167`。
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts`：失败于 Windows `tsx/esbuild spawn EPERM`，未写库。
- `node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts`：成功，`Upsert OK (HTTP 201). pushed=110, table count=0-0/617`。
- `node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts`：主要流程写入成功，`stored=766 table=0-0/5959`；工具层因进程未及时退出判 timeout。
- 独立 PostgREST readback：`frontier_ecosystem_articles=0-0/167`、`interview_questions=0-0/617`、`news_items=0-0/5959`。
- 本轮 6 条 frontier slug 与 6 条 interview slug 均已按 slug 抽样读回。

## 验证

- `node --experimental-transform-types` direct import 断言：通过，`ARTICLES=228`、`FRONTIER_ARTICLES=167`、`INTERVIEW_QUESTIONS=110`，本轮 slug 存在且无重复。
- `node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts`：通过，生成 167 条。
- `node --experimental-transform-types scripts/generate-interview-questions-supabase-seed.ts`：通过，生成 110 条。
- `node node_modules\tsx\dist\cli.mjs ...`：当前根 `node_modules` 没有普通 tsx 入口，不能作为验证依据。
- `node --experimental-transform-types --test ...`：失败于 Node test runner `spawn EPERM`，属于本机沙箱/进程启动限制。
- `node node_modules\.pnpm\typescript@5.9.3\node_modules\typescript\bin\tsc --noEmit`：失败于缺少 `@types/node`，属于依赖环境问题。

## 失败/未知项

- Supabase 同步：已成功，无未同步表。
- RSS 源失败：`Hugging Face Blog` 与 `OpenAI News` 在采集器内置 5 次重试后仍超时；本轮结构化内容已通过 GitHub release、npm、PyPI、GitHub Changelog 等一手来源补齐 OpenAI / Hugging Face 相关 Agent 信号。
- 本地测试：数据完整性已用 direct import 断言；标准 test runner 和 typecheck 当前被本机工具链/依赖阻塞，未作为通过项声明。

## 运行时间

- 写入时间：2026-07-22T08:59:19.1547663+08:00
