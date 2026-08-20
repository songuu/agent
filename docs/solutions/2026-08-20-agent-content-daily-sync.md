# 2026-08-20 Agent 内容每日采集同步

执行时间：2026-08-20T15:06:00+08:00  
自动化：Agent 内容每日采集同步（Automation ID: `agent`）

## 结论

- pgSql 已同步成功：`news_items`、`frontier_ecosystem_articles`、`interview_questions` 均完成写入并通过 SQL 读回验证。
- 今天是 2026-08-20 星期四，不触发周一周末补采窗口；本轮接续 2026-08-19 上次运行后的新增内容。
- 本地事实源与生成产物已更新：前沿文章 261 条、面试题 204 条。
- 当前仓库生产 writer 是 PostgreSQL content writer；旧 `supabase:frontier-push` 脚本和 `scripts/push-interview-questions-to-supabase.ts` 在本仓库不存在，不能作为今天的成功边界。

## 已验证事实

### 1. 采集链路

首次 `npm run news:collect` 未进入业务逻辑，失败于 Windows `tsx/esbuild` 启动层：

```text
Error: spawn EPERM
```

随后改用 direct `node node_modules\tsx\dist\cli.mjs --env-file=.env news-collector\src\cli-collect.ts`。第一次 direct run 进入业务逻辑但写库失败：

```text
Error: connect ECONNREFUSED 127.0.0.1:55432
target=pgSql news_items writer
```

处理：启动 Docker Desktop，确认既有容器 `agent-build-content-pg` 存在并启动；`pg_isready` 返回 accepting connections。重试成功：

```text
sources: 59/59 ok
fetched=841
dedupe=830
content=75/830 fetched
empty=44
failed=5
stored=830
table=2981
```

SQL 读回：

```text
news_total=2981
news_today=830
news_dup_external=0
news_content_failed=5
news_content_empty=44
```

正文抓取失败 5 条，但 feed 元数据已入库；失败均为正文 reader/direct fetch 层，不是 pgSql 上传失败：

| 来源 | 标题 | 错误 |
| --- | --- | --- |
| AIBase 新闻 | Meta推出Mac版AI助手，支持屏幕共享和语音输入功能 | direct timeout; reader HTTP 403 |
| AIBase 新闻 | OpenAI升级Codex安全防护，新增危险操作拦截与权限控制 | direct timeout; reader HTTP 403 |
| AIBase 新闻 | 京东发布机器人战略，2028年前投入百亿资源布局产业生态 | direct timeout; reader HTTP 403 |
| AIBase 新闻 | 冲击5万亿参数终极目标！字节跳动Seed基模团队架构大洗牌，四大核心一级部门浮出水面 | direct timeout; reader HTTP 403 |
| 量子位 | 完美世界2026半年报：《异环》全球流水破20亿 Q3起释放业绩 | direct timeout; reader HTTP 403 |

### 2. 前沿文章事实源

新增 10 条前沿内容，均落入 `knowledge-graph/data/graph.ts` 并经 `frontier_ecosystem_articles` 写入 pgSql：

| 来源 | 发布时间 | 模块依据 | 可信度 |
| --- | --- | --- | --- |
| [OpenAI Agents Python v0.22.0 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.22.0) | 2026-08-19 | 第 12/13/15/16/17/20 章，guardrail replay、RunState usage、provider config | high |
| [OpenAI Agents JS v0.17.0 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.17.0) | 2026-08-19 | 第 12/13/15/16/17/20 章，output-guardrail fail-closed 与 replay 安全 | high |
| [Mastra core 1.60.0 release notes](https://github.com/mastra-ai/mastra/releases/tag/%40mastra/core%401.60.0) | 2026-08-19 | 第 7/11/12/15/16/18/20 章，durable agents、MCP、sandbox checkpoint | high |
| [Claude Code v2.1.237 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.237) | 2026-08-20 | 第 3/14/16/20 章，gateway prompt caching 与 output style | high |
| [CrewAI 1.15.17 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.17) | 2026-08-20 | 第 5/11/12/15/17/18/20 章，conversational flow、MCP、SSRF、tool error | high |
| [Pydantic AI v2.32.1 release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.32.1) | 2026-08-20 | 第 10/12/13/14/15/20 章，同步回调、thinking signature、FunctionModel | high |
| [Vercel AI SDK Workflow 2.0.0 release notes](https://github.com/vercel/ai/releases/tag/%40ai-sdk%2Fworkflow%402.0.0) | 2026-08-19 | 第 12/14/15/16/18/20 章，Workflow major upgrade 与 retry UI projection | high |
| [FraudBench](https://arxiv.org/abs/2608.18136) | 2026-08-20 | 第 5/9/15/17/18/20 章，policy-grounded banking agent 安全评测 | medium |
| [Multi-Agent Systems Should Prioritize Concurrency Control](https://arxiv.org/abs/2608.18092) | 2026-08-20 | 第 7/11/12/15/16/20 章，共享状态并发控制 | medium |
| [Behavioral Systems Require Behavioral Tests](https://arxiv.org/abs/2608.18081) | 2026-08-20 | 第 10/11/15/16/20 章，行为过程评测 | medium |

pgSql push：

```text
PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=261, attempted=261, table count=261
```

SQL 读回：

```text
frontier_total=261
frontier_today=261
frontier_new_urls=10
frontier_dup_slug=0
frontier_dup_url=0
```

### 3. 面试题与高频考点

新增 10 道工程类高频题，落入 `knowledge-graph/data/interview-questions.ts`、`docs/career-guide.md` 的 172-181，并经 `interview_questions` 写入 pgSql：

- `openai-agents-python-output-guardrail-runstate`
- `openai-agents-js-output-guardrail-replay-fail-closed`
- `mastra-durable-agents-api-sandbox-checkpoints`
- `claude-code-gateway-prompt-cache-output-style`
- `crewai-conversational-flows-tool-error-ssrf`
- `pydantic-ai-agent-run-sync-thinking-signature`
- `ai-sdk-workflow-retry-ui-parts`
- `fraudbench-policy-grounded-banking-agents`
- `multi-agent-concurrency-control-shared-state`
- `behavioral-agent-tests-process-observation`

pgSql push：

```text
PostgreSQL upsert OK. table=interview_questions pushed=204, attempted=204, table count=204
```

SQL 读回：

```text
interview_total=204
interview_today=204
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
node node_modules\tsx\dist\cli.mjs --env-file=.env news-collector\src\cli-collect.ts
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
npm run news:collect

Error: spawn EPERM
```

旧命令状态：

```text
npm run supabase:frontier-push
Missing script: "supabase:frontier-push"

scripts/push-interview-questions-to-supabase.ts
missing

scripts/push-frontier-seed-to-supabase.mjs
missing
```

判断：这是当前仓库从旧 Supabase/PostgREST writer 迁移到 PostgreSQL content writer 后的命名残留；本轮真实上传边界以 pgSql writer 与 SQL readback 为准。

## 失败 / 未知项

- pgSql 上传失败项：无。
- 采集源失败项：无，`sources=59/59 ok`。
- 正文提取失败项：5 条，均为 direct timeout / reader HTTP 403；feed 元数据已入库，正文全文不可用。
- 未知项：外部生产调度器是否已经内置 direct `node_modules\tsx\dist\cli.mjs` 回退路径未验证；本轮仅验证当前工作区可用。
- 工作区在本轮开始前已有多项未提交改动与 2026-08-14、2026-08-17、2026-08-18、2026-08-19 自动化报告；本轮未回滚或重排既有改动，只追加 2026-08-20 内容。
