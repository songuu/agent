# 2026-08-21 Agent 内容每日采集同步

执行时间：2026-08-21T08:45:28+08:00  
自动化：Agent 内容每日采集同步（Automation ID: `agent`）

## 结论

- pgSql 已同步成功：`news_items`、`frontier_ecosystem_articles`、`interview_questions` 均完成写入并通过 SQL 读回验证。
- 今天是 2026-08-21 星期五，不触发周一周末补采窗口；本轮接续 2026-08-20 运行后的新增内容。
- 本地事实源与生成产物已更新：前沿文章 271 条、面试题 214 条。
- 本轮优先采用官方 release、AWS 官方博客和 arXiv 一手来源；社区/资讯源只用于新闻流，不作为精选事实源的主要依据。

## 已验证事实

### 1. 采集链路

首次 `npm run news:collect` 进入业务逻辑，但 pgSql writer 连接失败：

```text
Error: connect ECONNREFUSED 127.0.0.1:55432
target=pgSql news_items writer
```

诊断与处理：

```text
docker version -> client=29.7.2 server=29.7.2
docker ps -> agent-build-content-pg Exited (0) 17 hours ago
docker start agent-build-content-pg -> agent-build-content-pg
postgres_ok=1
```

重试 `npm run news:collect` 成功：

```text
sources: 59/60 ok
failed source: 量子位 (qbitai), socket hang up / fetch failed, attempts=3/3
fetched=847
dedupe=837
content=80/837 fetched
empty=44
failed=0
stored=837
table=3121
```

SQL 读回：

```text
news_total=3121
news_today=837
news_dup_external=0
news_source_failures=0
```

判断：qbitai 是单一普通 feed 的采集失败；不影响 `news_items` 的 pgSql 写入成功结论。

### 2. 前沿文章事实源

新增 10 条精选前沿内容，均落入 `knowledge-graph/data/graph.ts` 并写入 `frontier_ecosystem_articles`：

| 来源 | 发布时间 | 模块依据 | 可信度 |
| --- | --- | --- | --- |
| [OpenAI Codex 0.149.0 release notes](https://github.com/openai/codex/releases/tag/rust-v0.149.0) | 2026-08-20 | 第 11/12/14/16/17/18/20 章，任务 dashboard、queue、权限恢复、WebRTC 恢复 | high |
| [Claude Code v2.1.238 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.238) | 2026-08-20 | 第 11/12/14/16/17/18/20 章，插件认证、自托管 runner、proxy auth、长会话内存 | high |
| [Vercel AI SDK Workflow 2.0.1 release notes](https://github.com/vercel/ai/releases/tag/%40ai-sdk/workflow%402.0.1) | 2026-08-20 | 第 12/14/15/16/18/20 章，WorkflowAgent stream resume 与 UI chunk index | high |
| [AgentCore Dogwood policy authoring](https://aws.amazon.com/blogs/machine-learning/authoring-dogwood-policies-from-natural-language-in-amazon-bedrock-agentcore/) | 2026-08-20 | 第 5/15/17/18/20 章，policy、time constraint、fail-closed | high |
| [Scaling agentic AI without vendor lock-in](https://aws.amazon.com/blogs/machine-learning/scaling-agentic-ai-enterprise-patterns-without-vendor-lock-in/) | 2026-08-20 | 第 11/12/16/18/20 章，企业多 agent 抽象与可替换性 | high |
| [Scaling cloud migrations with AgentCore](https://aws.amazon.com/blogs/machine-learning/scaling-cloud-migrations-with-agentic-ai-on-amazon-bedrock-agentcore/) | 2026-08-20 | 第 11/12/15/16/18/20 章，迁移 discovery/assessment/planning 多 agent workflow | high |
| [AWS vector solutions](https://aws.amazon.com/blogs/machine-learning/aws-vector-solutions-build-agentic-ai-where-your-data-lives/) | 2026-08-20 | 第 8/9/15/18/20 章与 RAG 专题，数据所在地向量检索 | high |
| [Adversarial Review](https://arxiv.org/abs/2608.18167) | 2026-08-16 | 第 11/15/16/20 章，structured disagreement 与 code review agent | medium |
| [Looped Language Models Improve Compositional Tool Calling](https://arxiv.org/abs/2608.18171) | 2026-08-17 | 第 5/10/12/15/20 章，recurrent depth 与组合式工具调用 | medium |
| [ComponentBench](https://arxiv.org/abs/2608.18307) | 2026-08-18 | 第 14/15/17/20 章，computer-use agent 的 component-level eval | medium |

pgSql push：

```text
PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=271, attempted=271, table count=271
```

SQL 读回：

```text
frontier_total=271
frontier_today=271
frontier_new_urls=10
frontier_dup_slug=0
frontier_dup_url=0
```

### 3. 面试题与高频考点

新增 10 道工程类高频题，落入 `knowledge-graph/data/interview-questions.ts` 和 `docs/career-guide.md` 的 182-191：

- `codex-agents-dashboard-queue-permission-recovery`
- `claude-code-plugin-headers-runner-lifecycle-memory`
- `workflowagent-resume-ui-chunk-indexes`
- `agentcore-dogwood-policy-natural-language-governance`
- `enterprise-agentic-ai-vendor-lockin-abstraction`
- `agentic-cloud-migration-multi-agent-workflow`
- `vector-search-where-data-lives-agentic-rag`
- `adversarial-review-structured-disagreement-code-agent`
- `looped-language-models-compositional-tool-calling`
- `componentbench-computer-use-agent-observation-action-space`

pgSql push：

```text
PostgreSQL upsert OK. table=interview_questions pushed=214, attempted=214, table count=214
```

SQL 读回：

```text
interview_total=214
interview_today=214
interview_new_slugs=10
interview_dup_slug=0
```

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

## 生成与验证命令

成功：

```text
npm run news:collect
node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts
node node_modules\tsx\dist\cli.mjs scripts\generate-frontier-ecosystem-supabase-seed.ts
node node_modules\tsx\dist\cli.mjs scripts\generate-interview-questions-supabase-seed.ts
node node_modules\tsx\dist\cli.mjs --env-file=.env scripts\push-frontier-ecosystem-to-postgres.ts
node node_modules\tsx\dist\cli.mjs --env-file=.env scripts\push-interview-questions-to-postgres.ts
npm run typecheck
git diff --check
```

环境阻塞 / 降级：

```text
first npm run news:collect -> ECONNREFUSED 127.0.0.1:55432
docker ps initially required elevated Docker npipe access
docker start agent-build-content-pg
```

## 失败 / 未知项

- pgSql 上传失败项：无，最终三张表均已成功读回。
- 采集源失败项：`量子位 (qbitai)`，`socket hang up` / `fetch failed`，3 次重试后失败。
- 正文提取失败项：0；正文空结果 44 条，feed 元数据已入库。
- 未知项：外部生产调度器是否自动启动本地 PostgreSQL 容器未验证；本轮仅验证当前工作区和本机 pgSql writer。
- 本轮未提交代码，未回滚任何既有文件。
