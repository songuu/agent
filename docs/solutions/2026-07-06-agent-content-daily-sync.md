# 2026-07-06 Agent 内容每日采集同步

## 结论

- 已完成周一补周末窗口采集：`news-collector` 远端写入 `public.news_items`，本轮 `stored=467`，远端总量 `2622`。
- 已新增 curated frontier 4 条，落到 `knowledge-graph/data/graph.ts`，并派生到 `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`、`supabase/seed/frontier_ecosystem_articles.sql`。
- 已新增高频面试题 4 道，落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，并派生到 `supabase/seed/interview_questions.sql`。
- 已完成 Supabase 同步：`public.frontier_ecosystem_articles`、`public.interview_questions` 均真实 upsert 成功，并用 anon key 回读命中新增项。
- 本轮最终状态：不是仅本地落地；Supabase 三张表同步与前端匿名读回均已验证。

## 已验证事实

### 1. 多源资讯流

命令：

```powershell
node --env-file=.env --experimental-transform-types news-collector/src/cli-collect.ts
```

结果：

- 运行区间：`2026-07-06T00:41:40.777Z -> 2026-07-06T00:41:52.641Z`
- `33/34` 源成功。
- `fetched=470`，`dedupe=467`，`content=80/467 fetched`，`empty=81`，`failed=0`，`stored=467`。
- Supabase `public.news_items`：`content-range=0-0/2622`。
- 周末窗口回读 `published_date >= 2026-07-04` 命中 HN、The Decoder、IT之家、少数派等来源；其中 `Sakana Fugu` 由 2026-07-05 HN AI 流发现后进入 curated 候选。

失败源：

- `linuxdo-latest`：`https://linux.do/latest.rss` 返回 `403`，按配置 `attempts=1/3; stopped-early`。不影响 Supabase 写入。

### 2. 本轮新增 curated frontier

| 标题 | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [Copilot agent session streaming is now in public preview](https://github.blog/changelog/2026-07-02-copilot-agent-session-streaming-is-now-in-public-preview/) | GitHub Changelog | 2026-07-02 | `11` `16` `17` `18` `20` | high |
| [CrewAI 1.15.2a2 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a2) | CrewAI | 2026-07-01 | `11` `12` `14` `18` `20` | medium |
| [Sakana Fugu](https://github.com/SakanaAI/fugu) | SakanaAI | 2026-07-05 weekend discovery; upstream latest release 2026-06-26 | `04` `11` `12` `18` `20` | medium |
| [Registry-Governed Agent Lifecycle: Completing EDDOps with Evaluation-Driven Registration, Promotion, and Retirement on AWS AgentCore](https://arxiv.org/abs/2607.00345) | arXiv | 2026-07-01 | `15` `16` `18` `20` | medium |

模块选择依据：

- Copilot session streaming -> agent session 可观测、审计、治理，归 `11/16/17/18/20`。
- CrewAI release -> runtime、framework、streaming、部署兼容，归 `11/12/14/18/20`。
- Sakana Fugu -> multi-agent 编排封装成单 API，归 `04/11/12/18/20`。
- EDDOps / AgentCore -> eval、observability、deployment lifecycle，归 `15/16/18/20`。

### 3. 本轮新增面试题

| slug | 高频考点 | 关联模块 |
| --- | --- | --- |
| `copilot-agent-session-streaming-audit-vs-chat-logs` | agent session telemetry / tool-call audit / SIEM | `11` `16` `17` `18` `19` |
| `flow-agent-runtime-prerelease-signal-vs-stable-baseline` | prerelease release-note 解读 / runtime 风险分层 | `11` `12` `14` `18` `19` |
| `single-api-multi-agent-system-vs-app-level-orchestration` | 单 API 多 agent vs 应用层编排 / 可观测与 lock-in | `04` `11` `12` `16` `18` `19` |
| `eddops-registry-promotion-retirement-vs-one-time-eval` | EDDOps / registry / promotion / retirement / trace-native observability | `15` `16` `18` `19` |

### 4. 生成与 Supabase 上传

`tsx/esbuild` 入口失败：

- `npm run kg` -> `Error: spawn EPERM`
- `npm run supabase:frontier-seed` -> `Error: spawn EPERM`
- `npm run supabase:interview-seed` -> `Error: spawn EPERM`
- `npm run supabase:frontier-push` -> `Error: spawn EPERM`
- `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` -> `Error: spawn EPERM`

fallback 成功：

```powershell
node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts
# Wrote 118 frontier articles

node --experimental-transform-types scripts/generate-interview-questions-supabase-seed.ts
# Wrote 64 interview questions

node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts
# 完成：65 单元 / 329 概念 / 457 关系 / 179 文章

node scripts\push-frontier-seed-to-supabase.mjs
# Upsert OK (HTTP 201). pushed=118, table count=0-0/118

node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts
# Upsert OK (HTTP 201). pushed=64, table count=0-0/565
```

匿名回读验证：

- `public.news_items`：`HTTP 206`，`content-range=0-0/2622`
- `public.frontier_ecosystem_articles`：`HTTP 200`，`content-range=0-117/118`
- `public.interview_questions`：`HTTP 200`，`content-range=0-564/565`

新增 frontier 回读命中：

- `copilot-agent-session-streaming-is-now-in-public-preview`
- `crewai-1-15-2a2-release-notes`
- `sakana-fugu`
- `registry-governed-agent-lifecycle-completing-eddops-with-evaluation-driven-registration-pr`

新增 interview 回读命中：

- `copilot-agent-session-streaming-audit-vs-chat-logs`
- `flow-agent-runtime-prerelease-signal-vs-stable-baseline`
- `single-api-multi-agent-system-vs-app-level-orchestration`
- `eddops-registry-promotion-retirement-vs-one-time-eval`

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
- `docs/solutions/2026-07-06-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`：成功。
- `public.frontier_ecosystem_articles`：成功。
- `public.interview_questions`：成功。

## 失败 / 未知项

### 失败项

- `linuxdo-latest` RSS 返回 `403`；已按最小处理在 `news-collector/src/sources.ts` 保留注册但设为 `enabled: false`，避免后续每日采集持续产生同一类 Cloudflare challenge 噪音。
- `tsx/esbuild spawn EPERM` 仍存在；已按既定 fallback 完成生成与上传。

### 未知项

- `linuxdo-latest` 的 `403` 已复现为 Cloudflare `cf-mitigated: challenge`；后续只有拿到官方允许的公开 feed/API 或源站放行当前环境后再恢复。
- `Sakana Fugu` 作为新项目，真实生产边界、评测结果和长期维护质量仍需后续观察。

## 测试 / 校验

- `npm run typecheck` -> 通过。
- seed 生成 -> 通过。
- Supabase service_role upsert -> 通过。
- Supabase anon readback -> 通过。

## Git 边界

本轮未提交。当前存在一个非本轮文件：`docs/solutions/2026-07-06-daily-project-summary.md` 为运行前已存在的未跟踪文件，未修改。
## 后续处理：补充 RSS 源

2026-07-06 追加处理：在禁用 `linuxdo-latest` 后，补充 17 个已通过 `fetchFeed` live probe 的公开 Atom release feeds。所有新增源本轮验证结果均为 `ok=true`、`items=10`；只加入 `enabled: true` 的可解析源。

新增源：

- `vercel-ai-releases` -> Vercel AI SDK release feed
- `mcp-typescript-sdk-releases` -> MCP TypeScript SDK release feed
- `mcp-python-sdk-releases` -> MCP Python SDK release feed
- `mastra-releases` -> Mastra release feed
- `pydantic-ai-releases` -> Pydantic AI release feed
- `browser-use-releases` -> browser-use release feed
- `stagehand-releases` -> Browserbase Stagehand release feed
- `openhands-releases` -> OpenHands release feed
- `swe-agent-releases` -> SWE-agent release feed
- `aider-releases` -> Aider release feed
- `mem0-releases` -> Mem0 release feed
- `graphiti-releases` -> Graphiti release feed
- `humanlayer-releases` -> HumanLayer release feed
- `langfuse-releases` -> Langfuse release feed
- `phoenix-releases` -> Arize Phoenix release feed
- `llamaindex-python-releases` -> LlamaIndex Python release feed
- `dspy-releases` -> DSPy release feed

验证命令：

```powershell
node --experimental-transform-types -e "import { fetchFeed } from './news-collector/src/rss.ts'; import { findSource } from './news-collector/src/sources.ts'; /* probe new source keys */"
node --experimental-transform-types news-collector\__tests__\sources.test.mts
npm run typecheck
```

结果：

- 新增 17 个源全部 live probe 通过。
- `sources.test.mts` 通过：3/3。
- `npm run typecheck` 通过。