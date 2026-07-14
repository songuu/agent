# 2026-07-07 Agent 内容每日采集同步

## 结论

- 已完成本轮多源资讯采集：`news-collector` 50/50 源成功，写入 `public.news_items`，本轮 `stored=638`，远端总量 `2929`。
- 已新增 curated frontier 4 条，事实源落到 `knowledge-graph/data/graph.ts`，并派生到知识图谱、课程 README 与 `supabase/seed/frontier_ecosystem_articles.sql`。
- 已新增高频面试题 4 道，事实源落到 `knowledge-graph/data/interview-questions.ts`，并派生到 `supabase/seed/interview_questions.sql`。
- 已完成 Supabase 同步：`public.news_items`、`public.frontier_ecosystem_articles`、`public.interview_questions` 均真实写入，并用匿名 key 回读命中新增项。
- 本轮是周二（2026-07-07），不触发“周一补周末”额外窗口；上次运行（2026-07-06）已做周末补采。

## 已验证事实

### 1. 多源资讯流

命令：

```powershell
node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts
```

结果：

- 运行区间：`2026-07-07T00:27:55.969Z -> 2026-07-07T00:28:46.060Z`。
- `50/50` 源成功，覆盖 GitHub Changelog、OpenAI、AWS ML、LangGraph、CrewAI、Microsoft Agent Framework、Semantic Kernel、Vercel AI、MCP SDK、Pydantic AI、browser-use、OpenHands、Aider、Langfuse、Phoenix、DSPy 等。
- `fetched=640`，`dedupe=638`，`content=76/638 fetched`，`empty=88`，`failed=4`，`stored=638`。
- Supabase `public.news_items` 回读：`content-range=0-0/2929`。

### 2. 本轮新增 curated frontier

| 标题 | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [Set AI credit session limits in Copilot CLI and SDK](https://github.blog/changelog/2026-07-01-set-ai-credit-session-limits-in-copilot-cli-and-sdk/) | GitHub Changelog | 2026-07-01 | `11` `16` `18` `20` | high |
| [Browser tools for GitHub Copilot in VS Code are generally available](https://github.blog/changelog/2026-07-01-browser-tools-for-github-copilot-in-vs-code-are-generally-available/) | GitHub Changelog | 2026-07-01 | `05` `11` `17` `18` `20` | high |
| [Microsoft Agent Framework .NET 1.13.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.13.0) | Microsoft | 2026-07-03 | `05` `11` `17` `18` `20` | high |
| [Agentic generation of verifiable rules for deterministic, self-expanding reaction classification](https://arxiv.org/abs/2607.01061) | arXiv | 2026-07-01 | `10` `15` `capstone` `20` | medium |

模块选择依据：

- Copilot session limits -> 成本、自动化运行边界、observability，归 `11/16/18/20`。
- Copilot browser tools GA -> browser-use 工具、权限隔离、企业网络控制，归 `05/11/17/18/20`。
- Microsoft Agent Framework .NET 1.13.0 -> session isolation、file editing tools、approval harness，归 `05/11/17/18/20`。
- arXiv verified-rule generation -> 多 agent 验证环、可回归规则生成、研究型 agent，归 `10/15/capstone/20`。

### 3. 本轮新增面试题

| slug | 高频考点 | 关联模块 |
| --- | --- | --- |
| `session-credit-limit-vs-global-budget-for-automation-agents` | session 级成本上限 / subagents / compaction 成本边界 | `11` `16` `18` `19` |
| `browser-agent-permission-isolation-and-network-domain-controls` | browser-use agent 权限隔离 / cookie 隔离 / allow-deny 域控制 | `05` `11` `17` `18` `19` |
| `file-editing-tools-session-isolation-and-approval-harness-defaults` | file editing tools / per-user session isolation / approval harness 默认值 | `05` `11` `17` `18` `19` |
| `verified-rule-generation-loop-vs-freeform-agent-output` | verified rule generation / corpus verification loop / 可回归工件 | `10` `15` `19` `capstone` |

### 4. 生成与 Supabase 上传

标准 `tsx` 入口失败（本机已知 runtime blocker）：

- `npm run kg` -> `Error: spawn EPERM`
- `npm run supabase:frontier-seed` -> `Error: spawn EPERM`
- `npm run supabase:interview-seed` -> `Error: spawn EPERM`
- `npm run supabase:frontier-push` -> `Error: spawn EPERM`
- `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts` -> `Error: spawn EPERM`

Fallback 成功：

```powershell
node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts
# 完成：65 单元 / 329 概念 / 457 关系 / 183 文章

node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts
# Wrote 122 frontier articles

node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts
# Wrote 68 interview questions

node scripts\push-frontier-seed-to-supabase.mjs
# Upsert OK (HTTP 201). pushed=122, table count=0-0/122

node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts
# Upsert OK (HTTP 201). pushed=68, table count=0-0/570
```

匿名回读验证：

- `public.news_items`：`content-range=0-0/2929`
- `public.frontier_ecosystem_articles`：`content-range=0-0/122`
- `public.interview_questions`：`content-range=0-0/570`

新增 frontier 回读命中：

- `set-ai-credit-session-limits-in-copilot-cli-and-sdk`
- `browser-tools-for-github-copilot-in-vs-code-are-generally-available`
- `microsoft-agent-framework-net-1-13-0-release-notes`
- `agentic-generation-of-verifiable-rules-for-deterministic-self-expanding-reaction-classific`

新增 interview 回读命中：

- `session-credit-limit-vs-global-budget-for-automation-agents`
- `browser-agent-permission-isolation-and-network-domain-controls`
- `file-editing-tools-session-isolation-and-approval-harness-defaults`
- `verified-rule-generation-loop-vs-freeform-agent-output`

## 本地落地位置

- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/knowledge-graph.md`
- `docs/career-guide.md`
- `knowledge-graph/output/index.html`
- `lessons/19-agent-ecosystem-and-frontier/README.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`
- `docs/solutions/2026-07-07-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`：成功。
- `public.frontier_ecosystem_articles`：成功。
- `public.interview_questions`：成功。

## 失败 / 未知项

### 失败项

- `tsx/esbuild spawn EPERM` 仍存在；已按既定 fallback 完成生成与上传，不影响 Supabase 最终同步。
- 回读脚本第一次因 Node 24 stdin 模块格式歧义失败（`require() + top-level await`），包进 `async main` 后成功；不是 Supabase 网络、权限或表结构失败。

### 未知项

- arXiv 2607.01061 属于化学反应分类垂直领域，作为“验证环 + 符号规则生成”方法论样本可信，但对通用 agent 的外推强度仍需后续观察。

## 测试 / 校验

- `npm run typecheck` -> 通过。
- seed 生成 -> 通过。
- Supabase service_role upsert -> 通过。
- Supabase anon readback -> 通过。

## Git 边界

本轮未提交。运行前已有未跟踪项 `.tmp/` 与 `docs/solutions/2026-07-06-daily-project-summary.md` 未触碰；本轮运行后出现 `docs/solutions/2026-07-07-daily-project-summary.md`，不属于本次 Agent 内容同步核心变更。
