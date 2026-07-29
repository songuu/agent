# 2026-07-29 Agent 内容每日采集同步

## 结论

- Supabase 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成远端写入与匿名 key readback。
- 本轮结构化新增：前沿内容 10 条，面试题 10 条。
- 普通 RSS/新闻采集成功：第 2 次运行成功，58/60 个源成功，`stored=767`，`news_items` 远端总量 `0-0/767`，`collected_date=2026-07-29` 回读 `0-0/767`。
- 今天是 2026-07-29 星期三，不触发“周一补采周末”规则；本轮重点补充 2026-07-27 到 2026-07-28 的官方发布、开源 SDK 动态和研究信号。

## 本轮新增前沿内容

| slug | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `grok-4-5-is-now-available-in-github-copilot` | https://github.blog/changelog/2026-07-28-grok-4-5-is-now-available-in-github-copilot/ | 2026-07-28 | model-platform / Copilot model policy | high |
| `github-copilot-app-usage-metrics-expand-across-report-rollups` | https://github.blog/changelog/2026-07-28-github-copilot-app-usage-metrics-now-expand-across-report-rollups/ | 2026-07-28 | evaluation / usage metrics attribution | high |
| `enterprise-managed-settings-in-github-copilot-app-and-copilot-cloud-agent` | https://github.blog/changelog/2026-07-27-enterprise-managed-settings-in-the-github-copilot-app-and-copilot-cloud-agent/ | 2026-07-27 | security-governance / managed settings | high |
| `github-copilot-for-jetbrains-adds-opentelemetry-configuration-and-model-management` | https://github.blog/changelog/2026-07-27-github-copilot-for-jetbrains-improved-opentelemetry-configuration-model-management-and-more/ | 2026-07-27 | product-ui / IDE agent governance | high |
| `mcp-go-sdk-v1-7-0-adds-full-2026-07-28-protocol-support` | https://github.com/modelcontextprotocol/go-sdk/releases/tag/v1.7.0 | 2026-07-28 | protocol / MCP 2026-07-28 migration | high |
| `the-physics-of-multi-turn-long-horizon-planning-with-language-models` | https://arxiv.org/abs/2607.24720 | 2026-07-27 | foundation / long-horizon planning | medium |
| `aps-rag-agentic-hybrid-rag-and-operations-grounded-evaluation-for-scientific-facility-supp` | https://arxiv.org/abs/2607.24663 | 2026-07-27 | data-memory / agentic hybrid RAG | medium |
| `agentic-permissions-policy-algebra-for-taint-confinement-in-llm-agents` | https://arxiv.org/abs/2607.24625 | 2026-07-27 | security-governance / taint confinement | medium |
| `looping-is-not-reliability-state-bound-evidence-and-typed-revision-contracts-for-agentic-c` | https://arxiv.org/abs/2607.24604 | 2026-07-27 | evaluation / code repair contracts | medium |
| `kimi-k3-open-frontier-intelligence` | https://arxiv.org/abs/2607.24653 | 2026-07-27 | model-platform / open agentic RL model report | medium |

## 本轮新增面试题

- `grok-copilot-model-policy-reasoning-effort`
- `copilot-app-usage-metrics-surface-attribution`
- `managed-settings-least-covered-agent-surface`
- `jetbrains-agent-otel-mcp-custom-agent-governance`
- `mcp-stateless-discover-mrtr-migration`
- `long-horizon-planning-opd-mopd-world-model`
- `facility-agentic-rag-eval-harness`
- `appa-taint-confinement-context-branching`
- `code-repair-loop-evidence-contract`
- `kimi-k3-agentic-rl-sandbox-state-governance`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 10 条。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 10 条，`COLLECTED_DATE=2026-07-29`。
- `docs/career-guide.md`：高频工程题追加 Q105-Q114。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-07-29 / 7月29日 · 星期三`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `npm run kg` 重新生成。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 194 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 137 条 interview seed。
- `docs/solutions/2026-07-29-agent-content-daily-sync.md`：本报告。

## Supabase 同步证据

配置/权限预检：`.env` 中 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_DB_URL` 均存在；写入使用 service role，readback 使用 anon key。

目标表结构检查：

- 首次 `npm run news:collect` 失败：PostgREST `HTTP 404 PGRST205`，目标表 `public.news_items` 不在 schema cache。
- 同一 REST 目标下 `frontier_ecosystem_articles`、`interview_questions`、`news_items` 均返回 `PGRST205`。
- 直连 `SUPABASE_DB_URL` 查询 `information_schema.tables` 返回空数组，确认当前 Supabase 目标实例缺少必需表。
- 已按仓库已有迁移 DDL 应用：`20260616090000_create_frontier_ecosystem_articles.sql`、`20260616112000_add_frontier_ecosystem_article_layers.sql`、`20260616120000_create_interview_questions.sql`、`20260617120000_create_news_items.sql`、`20260624113000_add_news_item_content_fields.sql`，并执行 `notify pgrst, 'reload schema'`。
- 迁移后 REST 可见性：`frontier_ecosystem_articles` 为 `0-0/0`，`interview_questions` 为 `0-0/0`；`news_items` 探针因误选 `slug` 字段返回 `42703`，表本身已可见，正确冲突/查询字段为 `external_id`。

执行路径：

- `npm run kg` -> 通过，`65 单元 / 329 概念 / 457 关系 / 255 文章`，README 注入 `更新 1 · 未变 64 · 缺失 0`。
- `npm run supabase:frontier-seed` -> `Wrote 194 frontier articles`。
- `npm run supabase:interview-seed` -> `Wrote 137 interview questions`。
- `npm run news:collect` 第 1 次 -> 失败，`news_items upsert failed: chunk=1/8 rows=0-99 HTTP 404 PGRST205`。
- 应用目标表迁移后，`npm run news:collect` 第 2 次 -> 成功，`sources=58/60 ok`，`fetched=778`，`dedupe=767`，`content=80/767 fetched empty=21 failed=0`，`stored=767`，`table=0-0/767`。
- `npm run supabase:frontier-push` -> `Upsert OK (HTTP 201). pushed=194, table count=0-0/194`。
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` -> `Upsert OK (HTTP 201). pushed=137, table count=0-0/137`。

匿名 key 独立 readback：

- `frontier_ecosystem_articles`：总量 `0-0/194`，本轮 10/10 slug 均命中。
- `interview_questions`：总量 `0-0/137`，本轮 10/10 slug 均命中。
- `news_items`：总量 `0-0/767`，`collected_date=2026-07-29` 为 `0-0/767`。

## 验证

- 本地 direct import：`ARTICLES=255`、`FRONTIER_ARTICLES=194`、`INTERVIEW_QUESTIONS=137`。
- `frontierSlugDups=[]`、`interviewSlugDups=[]`。
- 文章标题重复 2 个为历史基础资料中的 `ReAct` 与 `Reflexion` 双收录，不是本轮新增。
- `npm run typecheck`：通过。
- `git diff --check`：通过。
- Seed 生成和 Supabase 写入/readback：通过。

## 失败/未知项

- Supabase 同步：已成功，无未同步表。
- 初始失败：当前 Supabase 目标实例缺少三张目标表；已用仓库迁移 DDL 修复并重试成功。
- RSS 源失败：`Google DeepMind Blog`、`Hugging Face Blog` 在 `news:collect` 第 2 次中各重试 5 次后超时/连接失败；其余 58/60 源成功，且命令整体完成远端写入。
- Windows 沙箱层：初始 PowerShell 在 sandbox 内出现 `CreateProcessAsUserW failed: 5`，后续经审批使用非沙箱 shell 完成；这不是仓库脚本或 Supabase 失败。
- `apply_patch` 工具：受 Windows sandbox writable-root 包装限制失败，文件编辑改用 marker 校验的 PowerShell 写入脚本完成。
- `npm` 输出 `Unknown project config "shamefully-hoist"` warning；命令退出码为 0 的验证/同步命令未受影响。

## 运行时间

- 写入时间：2026-07-29T09:07:49+08:00