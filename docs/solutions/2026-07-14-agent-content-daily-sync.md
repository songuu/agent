# 2026-07-14 Agent 内容每日采集同步

## 结论

- 已完成 2026-07-14 日常采集；今天是周二，不触发周一周末补采规则。本轮重点覆盖 2026-07-13 上次运行后资讯流，并补入近期已核验但未进入 curated frontier 的 benchmark / harness / coding-agent 数据集内容。
- 已完成 news collector 多源采集并写入 Supabase：52/52 源成功，`stored=746`，`public.news_items` 回读 `0-0/4246`。
- 已新增 curated frontier 5 条，事实源落到 `knowledge-graph/data/graph.ts`，并派生到知识图谱、课程 README 与 `supabase/seed/frontier_ecosystem_articles.sql`。
- 已新增高频面试题 4 道，事实源落到 `knowledge-graph/data/interview-questions.ts`，并同步到 `docs/career-guide.md` 与 `supabase/seed/interview_questions.sql`。
- 已完成 Supabase 硬同步：`public.frontier_ecosystem_articles` 上传 141 行，`public.interview_questions` 上传 86 行，新增 slug 均读回命中。

## 已验证事实

### 1. 多源资讯流

命令：`node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts`

结果：

- 运行区间：`2026-07-14T00:28:00.069Z -> 2026-07-14T00:28:09.203Z`。
- 52/52 源成功。
- `fetched=750`，`dedupe=746`，`content=80/746 fetched`，`empty=81`，`failed=0`，`stored=746`。
- Supabase `public.news_items` 回读：`content-range=0-0/4246`。

### 2. 本轮新增 curated frontier

| 标题 | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [HealthAgentBench: A Unified Benchmark Suite of Realistic Agentic Healthcare Environments for Challenging Frontier AI Agents](https://arxiv.org/abs/2606.31179) | arXiv | 2026-06-30 | 10 / 11 / 15 / 17 / 18 / 20 / clinical-intake | medium |
| [microsoft/HealthAgentBench](https://github.com/microsoft/HealthAgentBench) | Microsoft | 2026-07-03 | 15 / 16 / 17 / agent-eval-harness / clinical-intake / 20 | high |
| [Automated Benchmark Auditing for AI Agents and Large Language Models](https://arxiv.org/abs/2605.26079) | arXiv | 2026-05-26 | 15 / 16 / 18 / agent-eval-harness / 20 | medium |
| [Harness Engineering for Agentic AI Coding Tools: An Exploratory Study](https://arxiv.org/abs/2602.14690) | arXiv | 2026-06-30 | 05 / 11 / 12 / 16 / 20 / developer-onboarding | medium |
| [AIDev: Studying AI Coding Agents on GitHub](https://arxiv.org/abs/2602.09185) | arXiv | 2026-02-09 | 11 / 15 / 16 / 18 / 20 | medium |

模块选择依据：

- HealthAgentBench -> 长流程医疗 agent、终端任务、领域 verifier、防作弊与治理，挂 10/11/15/17/18/20 与 clinical-intake。
- microsoft/HealthAgentBench -> 公开 benchmark 仓库、Harbor 任务结构、运行命令、数据凭证与 verifier，挂 15/16/17/agent-eval-harness/clinical-intake/20。
- Auto Benchmark Audit -> benchmark 质量审计、评分脚本、环境依赖与模型排名漂移，挂 15/16/18/agent-eval-harness/20。
- Harness Engineering -> AGENTS.md、context files、skills、subagents 与 coding-agent harness 配置，挂 05/11/12/16/20/developer-onboarding。
- AIDev -> 大规模 Agentic-PR 数据集、采用与协作研究，不等同生产率证明，挂 11/15/16/18/20。

去重说明：

- 已确认本地已有 OpenAI Agents SDK v0.18.2、LangGraph 1.2.9、Pydantic AI v2.9.0、GitHub budget API、underwriting Agentic RAG 等 2026-07-10 至 2026-07-11 条目。
- 本轮外部核验未发现 2026-07-13 之后更近的 OpenAI Agents SDK / LangGraph / Pydantic AI / Google ADK / CrewAI 官方 release。
- `SciAgentArena` 已存在于本地事实源，未重复加入。

### 3. 本轮新增面试题

| slug | 高频考点 | 关联模块 |
| --- | --- | --- |
| `health-agent-benchmark-terminal-verifier-governance` | healthcare agent benchmark / terminal environment / verifier / data credentials / anti-cheating | 10 / 11 / 15 / 16 / 17 / 18 / 19 |
| `benchmark-audit-vs-assuming-ground-truth-is-clean` | benchmark auditing / ground-truth trust / fragile graders / ranking drift | 15 / 16 / 18 / 19 |
| `agents-md-skills-subagents-harness-engineering` | AGENTS.md / context files / skills / subagents / harness boundaries | 05 / 11 / 12 / 15 / 16 / 19 |
| `agentic-pr-dataset-vs-productivity-claim` | Agentic-PR dataset / adoption evidence / productivity caveat | 11 / 15 / 16 / 18 / 19 |

### 4. 生成与 Supabase 上传

生成：

- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts` -> `65 单元 / 329 概念 / 457 关系 / 202 文章`
- `node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts` -> `Wrote 141 frontier articles`
- `node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts` -> `Wrote 86 interview questions`

标准上传入口失败（本机已知 runtime blocker）：

- `npm run supabase:frontier-push` -> `tsx/esbuild spawn EPERM`
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` -> `tsx/esbuild spawn EPERM`

Fallback 成功：

- `node scripts\push-frontier-seed-to-supabase.mjs` -> `Upsert OK (HTTP 201). pushed=141, table count=0-0/141`
- `node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts` -> `Upsert OK (HTTP 201). pushed=86, table count=0-0/591`

读回命中：

- `public.news_items`：`0-0/4246`
- `public.frontier_ecosystem_articles`：`0-0/141`，新增 5/5 slug 命中
- `public.interview_questions`：`0-0/591`，新增 4/4 slug 命中

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
- `docs/solutions/2026-07-14-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`：成功，`stored=746`，匿名/服务端回读 `0-0/4246`。
- `public.frontier_ecosystem_articles`：成功，上传 141 行，回读 `0-0/141`，新增 5/5 命中。
- `public.interview_questions`：成功，上传 86 行，回读 `0-0/591`，新增 4/4 命中。

## 失败 / 未知项

### 失败项

- 标准 `tsx/esbuild` 上传入口仍触发 `spawn EPERM`。已按既定 fallback 完成生成与上传，不影响 Supabase 最终同步。

### 未知项

- HealthAgentBench、Auto Benchmark Audit、Harness Engineering、AIDev 均为论文/预印本或研究数据集，可信度保守标为 medium；工程趋势可采纳，生产结论需结合后续同行评审、真实业务指标和仓库审查。
- 工作树在本轮开始前已有 `.vitepress/theme/daily-news-article-detail.*`、`news-collector/src/store.ts`、历史报告等未提交变更；本报告只描述本轮内容同步新增和生成产物。

## 测试 / 校验

- Supabase env -> `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA` 存在。
- schema -> frontier 唯一键 `slug/source_url`，interview 唯一键 `slug`。
- news collector -> 52/52 源成功，`stored=746`。
- knowledge graph generation -> 通过。
- frontier seed -> 141 行。
- interview seed -> 86 行。
- Supabase upsert -> 通过。
- Supabase readback -> 三表 count + 新增 slug 9/9 命中。
- `npm run typecheck` -> 通过。
