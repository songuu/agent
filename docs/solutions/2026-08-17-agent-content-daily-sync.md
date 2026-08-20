# 2026-08-17 Agent 内容每日采集同步

执行时间：2026-08-17T09:16:30+08:00  
自动化：Agent 内容每日采集同步（Automation ID: `agent`）

## 结论

- pgSql 已同步成功：`news_items`、`frontier_ecosystem_articles`、`interview_questions` 均完成写入并通过 SQL 读回验证。
- 周一补采已覆盖周末窗口：本轮重点补入 2026-08-15、2026-08-16 的 OpenAI Agents SDK / browser-use release，并补上 2026-08-14 上次运行后的 Claude Code、Pydantic AI、Cloudflare、AWS AgentCore 内容。
- 本地事实源与生成产物已更新：前沿文章 242 条、面试题 185 条。
- 环境阻塞已恢复：首次采集因本地 PostgreSQL 端口未监听失败，启动既有 Docker 容器后重试成功。

## 已验证事实

### 1. 采集链路

首次运行 `news-collector` 失败：

```text
Error: connect ECONNREFUSED 127.0.0.1:55432
```

排查结果：

- `127.0.0.1:55432` 初始不可连。
- `agent-build-content-pg` 容器处于 Exited 状态。
- Docker Desktop 启动后，通过 `docker start agent-build-content-pg` 恢复端口。

重试结果：

```text
sources: 59/59 ok
fetched=780
dedupe=770
content=80/770 fetched
empty=44
failed=0
stored=770
table=2377
```

SQL 读回：

```text
news_items total=2377
news_items collected_date=2026-08-17 total=770
max_collected_at=2026-08-17 01:07:27.215+00
news_items collected_date=2026-08-17 duplicate_external_ids=0
```

### 2. 前沿文章事实源

新增 / 补采 9 条前沿内容，均落入 `knowledge-graph/data/graph.ts` 并经 `frontier_ecosystem_articles` 写入 pgSql：

| 来源 | 发布时间 | 模块依据 | 可信度 |
| --- | --- | --- | --- |
| OpenAI Agents Python v0.21.0 release notes | 2026-08-15 | 第 19 章 / evaluation / agent eval harness | high |
| OpenAI Agents JS v0.16.0 release notes | 2026-08-15 | 第 19 章 / evaluation / TS agent regression | high |
| OpenAI Agents Python v0.21.1 release notes | 2026-08-16 | 第 19 章 / runtime / sandbox governance | high |
| OpenAI Agents JS v0.16.1 release notes | 2026-08-16 | 第 19 章 / runtime / cross-SDK sandbox governance | high |
| Claude Code v2.1.233 release notes | 2026-08-14 | 第 19 章 / security-governance / coding agent control plane | high |
| Pydantic AI v2.30.0 release notes | 2026-08-14 | 第 19 章 / security-governance / local dev UI attack surface | high |
| browser-use 0.13.8 release notes | 2026-08-16 | 第 19 章 / product-ui / browser agent trajectory reliability | high |
| Cloudflare MCP security updates | 2026-08-14 | 第 19 章 / protocol / MCP network governance | high |
| AWS SageMaker AI + Bedrock AgentCore workflow | 2026-08-14 | 第 19 章 / runtime / enterprise multi-agent workflow | high |

pgSql push：

```text
PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=242, attempted=242, table count=242
```

SQL 读回：

```text
frontier_ecosystem_articles total=242
frontier_ecosystem_articles collected_date=2026-08-17 total=242
frontier_new_urls=9/9
frontier_duplicate_slugs=0
frontier_duplicate_urls=0
```

### 3. 面试题与高频考点

新增 8 道工程类高频题，落入 `knowledge-graph/data/interview-questions.ts`、`docs/career-guide.md` 的 155-162，并经 `interview_questions` 写入 pgSql：

- `openai-agents-deterministic-testing-contract`
- `openai-agents-js-standard-schema-testing`
- `openai-agents-timeout-run-scoped-sandbox`
- `claude-code-identity-resource-path-control`
- `pydantic-ai-local-dev-ui-dns-rebinding`
- `browser-use-tool-argument-recovery-domain-actions`
- `cloudflare-mcp-traffic-detection-shadow-tools`
- `sagemaker-agentcore-model-routing-workflows`

pgSql push：

```text
PostgreSQL upsert OK. table=interview_questions pushed=185, attempted=185, table count=185
```

SQL 读回：

```text
interview_questions total=185
interview_questions collected_date=2026-08-17 total=185
interview_new_slugs=8/8
interview_duplicate_slugs=0
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
node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts
完成：75 单元 / 365 概念 / 504 关系 / 308 文章

node node_modules\tsx\dist\cli.mjs scripts\generate-frontier-ecosystem-supabase-seed.ts
Wrote 242 frontier articles to supabase\seed\frontier_ecosystem_articles.sql

node node_modules\tsx\dist\cli.mjs scripts\generate-interview-questions-supabase-seed.ts
Wrote 185 interview questions to supabase\seed\interview_questions.sql

node --env-file=.env node_modules\tsx\dist\cli.mjs scripts\push-frontier-ecosystem-to-postgres.ts
node --env-file=.env node_modules\tsx\dist\cli.mjs scripts\push-interview-questions-to-postgres.ts

npm run typecheck
git diff --check
```

环境阻塞 / 降级：

```text
npm run content:frontier-seed
npm run content:interview-seed

Error: spawn EPERM
```

判断：这是 Windows 环境中 `tsx/esbuild` worker spawn 权限问题，发生在脚本启动层。已改用 direct `node node_modules\tsx\dist\cli.mjs ...` 入口生成 seed，并已通过 pgSql push/readback 验证。

## 未知项

- 未验证外部生产调度器是否会在下一次自动触发时自动启动 Docker 容器；本轮只验证了当前机器上的容器恢复和 pgSql 写入。
- Cloudflare 与 AWS 两条官方博客的正文快照以仓库采集器抓取的标题、日期和摘要为准；链接为官方域名，可信度高，但本轮浏览器直接重开正文不是主要证据面。
