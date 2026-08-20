# 2026-08-18 Agent 内容每日采集同步

执行时间：2026-08-18T08:38:00+08:00  
自动化：Agent 内容每日采集同步（Automation ID: `agent`）

## 结论

- pgSql 已同步成功：`news_items`、`frontier_ecosystem_articles`、`interview_questions` 均完成写入并通过 SQL 读回验证。
- 本轮不是周一，不做额外周末补采；日常窗口接续 2026-08-17 上次运行后的内容。
- 本地事实源与生成产物已更新：前沿文章 246 条、面试题 189 条。
- 环境阻塞已恢复：首次采集因 `127.0.0.1:55432` 未监听失败；`desktop-linux` Docker context 返回 500，改用健康的 `default` context 启动既有 `agent-build-content-pg` 容器后重试成功。

## 已验证事实

### 1. 采集链路

首次运行 `news-collector` 失败：

```text
Error: connect ECONNREFUSED 127.0.0.1:55432
```

排查与恢复：

- `Test-NetConnection 127.0.0.1 -Port 55432` 初始为 `False`。
- `docker context ls` 显示当前 `desktop-linux` 指向 `npipe:////./pipe/dockerDesktopLinuxEngine`，该 engine 多个 API 调用返回 500。
- `docker --context default ps -a` 可见 `agent-build-content-pg Exited (0) 17 hours ago`。
- `docker --context default start agent-build-content-pg` 成功。
- 恢复后 `127.0.0.1:55432->5432/tcp` 可连。

重试采集结果：

```text
sources: 59/59 ok
fetched=840
dedupe=829
content=80/829 fetched
empty=44
failed=0
stored=829
table=2562
```

SQL 读回：

```text
news_items total=2562
news_items collected_date=2026-08-18 total=829
max_collected_at=2026-08-18 00:36:02.124+00
news_items duplicate_external_ids=0
```

### 2. 前沿文章事实源

新增 4 条前沿内容，均落入 `knowledge-graph/data/graph.ts` 并经 `frontier_ecosystem_articles` 写入 pgSql：

| 来源 | 发布时间 | 模块依据 | 可信度 |
| --- | --- | --- | --- |
| [Claude Code v2.1.234 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.234) | 2026-08-17 | 第 19 章 / security-governance / coding agent 控制面 | high |
| [Pydantic AI v2.31.0 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.31.0) | 2026-08-14 | 第 19 章 / product-ui / AG-UI event stream 与 trace attribution | high |
| [CrewAI 1.15.16 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.16) | 2026-08-14 | 第 19 章 / runtime / flow execution context 与 observability | high |
| [LangChain OpenRouter 0.2.8 release notes](https://github.com/langchain-ai/langchain/releases/tag/langchain-openrouter%3D%3D0.2.8) | 2026-08-14 | 第 19 章 / model-platform / provider usage metadata 与成本归因 | high |

pgSql push：

```text
PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=246, attempted=246, table count=246
```

SQL 读回：

```text
frontier_ecosystem_articles total=246
frontier_ecosystem_articles collected_date=2026-08-18 total=246
frontier_new_urls=4/4
frontier_duplicate_slugs=0
frontier_duplicate_urls=0
```

### 3. 面试题与高频考点

新增 4 道工程类高频题，落入 `knowledge-graph/data/interview-questions.ts`、`docs/career-guide.md` 的 163-166，并经 `interview_questions` 写入 pgSql：

- `claude-code-nt-path-permission-session-governance`
- `pydantic-ai-agui-event-stream-trace-attribution`
- `crewai-flow-execution-context-observability`
- `langchain-provider-usage-metadata-contract`

pgSql push：

```text
PostgreSQL upsert OK. table=interview_questions pushed=189, attempted=189, table count=189
```

SQL 读回：

```text
interview_questions total=189
interview_questions collected_date=2026-08-18 total=189
interview_new_slugs=4/4
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
完成：75 单元 / 365 概念 / 504 关系 / 312 文章

node node_modules\tsx\dist\cli.mjs scripts\generate-frontier-ecosystem-supabase-seed.ts
Wrote 246 frontier articles to supabase\seed\frontier_ecosystem_articles.sql

node node_modules\tsx\dist\cli.mjs scripts\generate-interview-questions-supabase-seed.ts
Wrote 189 interview questions to supabase\seed\interview_questions.sql

npm run content:frontier-push
npm run content:interview-push
npm run typecheck
git diff --check
```

环境阻塞 / 降级：

```text
npm run supabase:frontier-seed
npm run supabase:interview-seed

Error: spawn EPERM
```

判断：这是 Windows 环境中 `tsx/esbuild` worker spawn 权限问题，发生在脚本启动层。已改用 direct `node node_modules\tsx\dist\cli.mjs ...` 入口生成 seed。pgSql 上传脚本 `content:*push` 本轮未触发 EPERM，并已通过直接 SQL readback 验证。

## 未知项

- 未验证外部生产调度器下一次是否会自动选择健康的 Docker `default` context；本轮只验证了当前机器通过 `default` context 启动容器后的 pgSql 写入。
- 工作区在本轮开始前已有 2026-08-14、2026-08-17 的未提交自动化改动；本轮未回滚或重排这些既有改动，只在其后追加今日内容。
