# 2026-07-28 Agent 内容每日采集同步

## 结论

- Supabase 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成远端写入与匿名 key readback。
- 本轮结构化新增：前沿内容 10 条，面试题 10 条。
- 普通 RSS/新闻采集成功：60/60 个源，`stored=776`，`news_items` 远端总量 `0-0/6591`，`collected_date=2026-07-28` 回读 `0-0/776`。
- 今天是 2026-07-28 星期二，不触发“周一补采周末”规则；但本轮结构化内容覆盖 2026-07-24 到 2026-07-27 的周末/周一信号，因为本地事实源没有 2026-07-24 之后的 frontier 条目。

## 本轮新增前沿内容

| slug | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `openai-agents-sdk-python-v0-19-0-release-notes` | https://github.com/openai/openai-agents-python/releases/tag/v0.19.0 | 2026-07-27 | runtime / programmatic tool calling | high |
| `mcp-typescript-sdk-2-0-packages-add-2026-07-28-specification-support` | https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/%40modelcontextprotocol%2Fnode%402.0.0 | 2026-07-27 / 2026-07-28 spec | protocol / MCP v2 migration | high |
| `agent-automation-controls-in-github-issues-public-preview` | https://github.blog/changelog/2026-07-23-agent-automation-controls-in-github-issues-in-public-preview/ | 2026-07-23 | product-ui / issue automation gates | high |
| `claude-opus-5-is-now-available-in-github-copilot` | https://github.blog/changelog/2026-07-24-claude-opus-5-is-now-available-in-github-copilot/ | 2026-07-24 | model-platform / Copilot model policy | high |
| `crewai-1-15-7-runtime-hardening-and-skill-usage-observability` | https://github.com/crewAIInc/crewAI/releases/tag/1.15.7 | 2026-07-26 | runtime / skill observability / CVE patch | high |
| `pydantic-ai-v2-18-0-release-notes` | https://github.com/pydantic/pydantic-ai/releases/tag/v2.18.0 | 2026-07-24 | runtime / typed agent stack | high |
| `trace-router-task-consistent-and-adaptive-online-routing-for-agentic-ai` | https://arxiv.org/abs/2607.22465 | 2026-07-24 | evaluation / cost-aware routing | medium |
| `the-regression-tax-decomposing-why-skills-help-and-hurt-llm-agents` | https://arxiv.org/abs/2607.22520 | 2026-07-24 | evaluation / skill regression | medium |
| `dynamic-capability-scoping-for-enterprise-ai-agents` | https://arxiv.org/abs/2607.22445 | 2026-07-24 | security-governance / dynamic least privilege | medium |
| `do-agent-benchmarks-measure-capability-protocol-validity-in-the-age-of-agentic-ai` | https://arxiv.org/abs/2607.22368 | 2026-07-24 | evaluation / benchmark validity | medium |

## 本轮新增面试题

- `programmatic-tool-calling-execution-boundary`
- `mcp-2026-07-28-spec-migration-contract`
- `github-issues-agent-automation-confidence-gates`
- `copilot-opus-model-governance-and-policy-boundary`
- `crewai-runtime-model-tool-skill-observability-upgrade`
- `pydantic-ai-external-web-access-region-typed-agent-governance`
- `trace-router-task-level-routing-vs-call-routing`
- `skill-regression-tax-vs-average-uplift`
- `dynamic-capability-scoping-vs-static-credentials`
- `benchmark-protocol-validity-vs-score-claim`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 10 条。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 10 条，`COLLECTED_DATE=2026-07-28`。
- `docs/career-guide.md`：高频工程题追加 Q95-Q104。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-07-28 / 7月28日 · 星期二`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `npm run kg` 重新生成。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 184 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 127 条 interview seed。
- `docs/solutions/2026-07-28-agent-content-daily-sync.md`：本报告。

## Supabase 同步证据

配置/权限预检：`.env` 中 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 均存在；使用 service role 写入，使用 anon key 独立 readback。

执行路径：

- `node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts` -> `sources=60/60 ok`, `stored=776`, `table=0-0/6591`。
- `npm run supabase:frontier-seed` -> `Wrote 184 frontier articles`。
- `npm run supabase:interview-seed` -> `Wrote 127 interview questions`。
- `npm run supabase:frontier-push` -> 首次 `HTTP 201`；替换 404 来源并迁移旧 slug 后重跑为 `Upsert OK (HTTP 200). pushed=184, table count=0-0/184`。
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` -> 首次 `HTTP 201`；替换 404 来源并迁移旧 slug 后重跑为 `Upsert OK (HTTP 200). pushed=127, table count=0-0/635`。

匿名 key 独立 readback：

- `frontier_ecosystem_articles`：总量 `0-0/184`，本轮 10/10 slug 均命中，range `0-9/10`；旧错误 slug `github-mcp-server-supports-oauth-in-public-preview` 回读 `*/0`。
- `interview_questions`：总量 `0-0/635`，本轮 10/10 slug 均命中，range `0-9/10`；旧错误 slug `mcp-oauth-token-lifecycle-vs-static-pat` 回读 `*/0`。
- `news_items`：总量 `0-0/6591`，`collected_date=2026-07-28` 为 `0-0/776`。

## 验证

- 本地 direct import：`ARTICLES=245`、`INTERVIEW_QUESTIONS=127`，新增标题/slug 均存在，面试题 slug 无重复。
- 文章标题重复 2 个为历史基础资料中的 `ReAct` 与 `Reflexion` 双收录，不是本轮新增。
- `npm run kg`：通过，完成 `65 单元 / 329 概念 / 457 关系 / 245 文章`，README 注入 `更新 1 · 未变 64 · 缺失 0`。
- `npm run typecheck`：通过。
- Seed 生成和 Supabase 写入/readback：通过。

## 失败/未知项

- Supabase 同步：已成功，无未同步表。
- 链接校验修正：首次写入后发现 `github-mcp-server-supports-oauth-in-public-preview` 推导 URL 为 404，已替换为已验证 HTTP 200 的 GitHub Changelog `Claude Opus 5 is now available in GitHub Copilot`，并重新生成 seed、迁移远端旧 slug、重新 push/readback。
- Windows 沙箱层：初始 PowerShell 在 sandbox 内出现 `CreateProcessAsUserW failed: 5`，后续经审批使用非沙箱 shell 完成；这不是仓库脚本或 Supabase 失败。
- `apply_patch` 工具：受 Windows sandbox writable-root 包装限制失败，文件编辑改用 marker 校验的 Node 写入脚本完成；每次写入均以唯一 marker 校验，未触碰已有未跟踪脚本。
- `npm` 输出 `Unknown project config "shamefully-hoist"` warning；命令退出码均为 0，未影响本轮验证。

## 运行时间

- 写入时间：2026-07-28T09:09:23.4482599+08:00
