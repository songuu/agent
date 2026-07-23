---
title: "Agent 内容每日采集同步 (2026-07-20)"
date: 2026-07-20
tags: [agent, content-sync, frontier, interview, supabase]
related_instincts: []
aliases: ["Agent 内容每日采集同步 2026-07-20"]
---

# Agent 内容每日采集同步 (2026-07-20)

## 结论

- 本轮 Supabase 同步已成功，不是仅本地落地。
- 本轮按周一补采口径处理，覆盖周末窗口与上轮未进入 curated frontier 的 2026-07-16 至 2026-07-20 Agent 内容。
- 新增 curated frontier `6` 条，Supabase 读回 `6/6`。
- 新增高频面试题 `6` 条，Supabase 读回 `6/6`。
- `news-collector` 首次运行因关键 GitHub/HF/OpenAI 源 timeout 且进程超时，只视为不干净结果；提升网络权限重跑后写入 Supabase 成功：`46/50` 源成功，`stored=628`，`public.news_items` 回读 `0-0/5409`。

## 本轮新增 Frontier 内容

| article_id | 标题 | 来源 | 发布时间 | 模块 | 可信度 |
|---|---|---|---|---|---|
| `frontier-156` | [Security incident disclosure — July 2026](https://huggingface.co/blog/security-incident-july-2026) | Hugging Face | 2026-07-16 | security-governance / incident response / tool execution | high |
| `frontier-157` | [What building Shippy taught us about building agents](https://huggingface.co/blog/allenai/shippy-tech-blog) | Ai2 / Hugging Face | 2026-07-15 | runtime / sandbox / eval pipeline | high |
| `frontier-158` | [Recursive Harness Self-Improvement](https://arxiv.org/abs/2607.15524) | arXiv / Hugging Face Papers | 2026-07-17 / submitted 2026-07-20 | evaluation / harness optimization | medium |
| `frontier-159` | [AgentLens: Production-Assessed Trajectory Reviews for Coding Agent Evaluation](https://arxiv.org/abs/2607.06624) | arXiv / Hugging Face Papers | 2026-07-07 / submitted 2026-07-09 | coding-agent eval / trajectory review | medium |
| `frontier-160` | [DeepSWE](https://deepswe.datacurve.ai/) | Datacurve | 2026-07-17 leaderboard update | coding-agent benchmark / cost / harness context | high |
| `frontier-161` | [ToFu: A White-Box, Token-Efficient Agent Harness for Researchers](https://arxiv.org/abs/2607.11423) | arXiv / Hugging Face Papers | 2026-07-13 | white-box coding harness / local deployment | medium |

模块选择依据：仓库现有 Agent 课程把第 `19` 章作为 frontier 生态入口，第 `20` 章作为文章库承载页；新内容按 runtime、evaluation、security-governance 继续挂到对应课程和 capstone。论文/benchmark 预印本保守标为 medium；官方安全披露、企业技术复盘和一手 leaderboard 标为 high。

## 本轮新增面试题

| question_id | slug | 对应主题 |
|---|---|---|
| `iq-91` | `autonomous-agent-incident-response-guardrail-lockout` | autonomous agent 入侵、数据处理执行面、凭证轮换、本地取证模型 |
| `iq-92` | `domain-agent-cli-sandbox-eval-pipeline` | 行业 agent CLI 工具壳、ephemeral sandbox、真实数据 eval pipeline |
| `iq-93` | `recursive-harness-self-improvement-vs-prompt-tuning` | harness 自改进、trajectory quality、训练数据与推理成本 |
| `iq-94` | `trajectory-review-vs-pass-fail-coding-agent-eval` | coding agent 轨迹审查、nightly regression、失败模式诊断 |
| `iq-95` | `coding-agent-leaderboard-cost-harness-context` | DeepSWE 榜单解释、harness/cost/steps/output token 边界 |
| `iq-96` | `white-box-agent-harness-vs-black-box-saas-coding-agent` | white-box harness、本地部署、复现实验与黑盒 SaaS 取舍 |

## 本地落地位置

- `knowledge-graph/data/graph.ts`：frontier 事实源，append-only 新增 `6` 条。
- `knowledge-graph/data/frontier-articles.ts`：采集日期推进到 `2026-07-20`，展示标签为 `7月20日 · 星期一`。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源新增 `6` 条，并补齐本地答案摘要。
- `docs/career-guide.md`：人读版高频面试题新增第 `76` 至 `81` 条。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由知识图谱生成器刷新。
- `supabase/seed/frontier_ecosystem_articles.sql`：由 frontier seed 生成器刷新，总计 `161` 条。
- `supabase/seed/interview_questions.sql`：由 interview seed 生成器刷新，总计 `104` 条。

## Supabase 配置与表结构检查

- `.env` 中 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA` 均存在。
- 本地迁移显示 `frontier_ecosystem_articles` 的 upsert 身份为 `slug`，另有 `source_url` unique；`article_id` 是按数组下标派生的展示键，不应作为唯一身份。
- 本地迁移显示 `interview_questions` 的 upsert 身份为 `slug`；`question_id` 是展示键，不设 unique。
- 本轮实际写入使用 service role，经 PostgREST `HTTP 201` 与定向 slug 读回确认写入权限有效。

## Supabase 上传与读回证据

### 新闻采集

首次运行：

```text
node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts
exit=124 timeout
sources: 20/50 ok
stored=358 table=0-0/5388
判断: 不干净结果，关键 GitHub/HF/OpenAI 源大量 timeout 且进程被超时终止。
```

提升网络权限重试成功：

```text
node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts
sources: 46/50 ok
fetched=630 dedupe=628 content=80/628 fetched empty=28 failed=0 enriched=0 stored=628 table=0-0/5409
```

仍失败的 4 个源：`openai-agents-python-releases`、`openai-agents-js-releases`、`langgraph-releases`、`crewai-releases`，均为 GitHub Atom timeout after 15000ms / retry-exhausted。新闻表 Supabase 写入成功，但这些 release feed 的最新性仍为未知项。

### Frontier seed 生成与上传

```text
node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts
Wrote 161 frontier articles to C:\project\my\agent-build\supabase\seed\frontier_ecosystem_articles.sql
```

标准上传入口失败：

```text
npm run supabase:frontier-push
Error: spawn EPERM
判断: Windows 当前环境的 tsx/esbuild worker 启动失败，不是 Supabase 网络、权限或约束错误。
```

按自动化要求改用 seed fallback：

```text
node scripts\push-frontier-seed-to-supabase.mjs
Upsert OK (HTTP 201). pushed=161, table count (content-range)=0-0/161
```

定向读回新增 `6/6`：

```text
frontier-156 security-incident-disclosure-july-2026
frontier-157 what-building-shippy-taught-us-about-building-agents
frontier-158 recursive-harness-self-improvement
frontier-159 agentlens-production-assessed-trajectory-reviews-for-coding-agent-evaluation
frontier-160 deepswe
frontier-161 tofu-a-white-box-token-efficient-agent-harness-for-researchers
```

### Interview seed 生成与上传

```text
node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts
Wrote 104 interview questions to C:\project\my\agent-build\supabase\seed\interview_questions.sql
```

标准上传入口失败：

```text
npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts
Error: spawn EPERM
判断: Windows 当前环境的 tsx/esbuild worker 启动失败，不是 Supabase 网络、权限或约束错误。
```

direct-node fallback 成功：

```text
node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts
Upsert OK (HTTP 201). pushed=104, table count (content-range)=0-0/610
```

定向读回新增 `6/6`：

```text
iq-91 autonomous-agent-incident-response-guardrail-lockout
iq-92 domain-agent-cli-sandbox-eval-pipeline
iq-93 recursive-harness-self-improvement-vs-prompt-tuning
iq-94 trajectory-review-vs-pass-fail-coding-agent-eval
iq-95 coding-agent-leaderboard-cost-harness-context
iq-96 white-box-agent-harness-vs-black-box-saas-coding-agent
```

## 验证命令

```text
node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts
完成：65 单元 / 329 概念 / 457 关系 / 222 文章

npm run typecheck
退出码 0

node node_modules\tsx\dist\cli.mjs --test .vitepress\theme\interview-clinic-data.test.mts .vitepress\theme\interview-article-detail.test.mts knowledge-graph\generate.test.mts
14 tests / 14 pass / 0 fail
```

## 已上传 Supabase

- `public.news_items`：成功，重试后 `stored=628`，回读 `0-0/5409`。
- `public.frontier_ecosystem_articles`：成功，上传 `161` 行，新增 frontier `6/6` 定向读回命中。
- `public.interview_questions`：成功，上传 `104` 行，新增 interview `6/6` 定向读回命中。

## 失败 / 未知项

### 失败项

- `npm run supabase:frontier-push` 与 `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` 均触发 `spawn EPERM`。已按自动化规则使用 direct-node / seed fallback 完成 Supabase 上传，因此不构成本轮硬失败。

### 未知项

- 新闻采集重试后仍有 4 个 GitHub Atom release 源 timeout：OpenAI Agents Python、OpenAI Agents JS、LangGraph、CrewAI。它们的 release feed 最新性没有通过 `news-collector` 自动管道验证；本轮 curated frontier 通过独立 web/source 搜索补采 Hugging Face、Ai2、arXiv/Hugging Face Papers、Datacurve 等来源。
- Recursive Harness Self-Improvement、AgentLens、ToFu 为预印本/benchmark 论文，可信度为 medium；可作为趋势和面试考点，生产结论仍需后续复现和同行评审。

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
node node_modules\tsx\dist\cli.mjs --test .vitepress\theme\interview-clinic-data.test.mts .vitepress\theme\interview-article-detail.test.mts knowledge-graph\generate.test.mts
```
