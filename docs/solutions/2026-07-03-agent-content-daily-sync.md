# 2026-07-03 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 新增 4 条高信号 Agent 资料：
    - [LangGraph 1.2.7 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.7)
    - [Building a serverless A2A gateway for agent discovery, routing, and access control](https://aws.amazon.com/blogs/machine-learning/building-a-serverless-a2a-gateway-for-agent-discovery-routing-and-access-control/)
    - [Structured memory filtering with metadata in AgentCore Memory](https://aws.amazon.com/blogs/machine-learning/structured-memory-filtering-with-metadata-in-agentcore-memory/)
    - [Can Agents Generalize to the Open World? Unveiling the Fragility of Static Training in Tool Use](https://arxiv.org/abs/2607.01084)
  - `knowledge-graph/data/interview-questions.ts` 新增 4 道工程类高频题。
  - `docs/career-guide.md` 同步追加 4 条人读题单。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 批次日期滚动到 `2026-07-03`。
- 已完成 Supabase 同步：
  - `public.news_items`：本轮 `stored=470`，远端总量 `2381`。
  - `public.frontier_ecosystem_articles`：`HTTP 201`，远端总量 `114`。
  - `public.interview_questions`：`HTTP 201`，远端总量 `560`。
- 本轮最终状态：不是“仅本地落地”，而是“本地事实源 + Supabase 三表同步成功”。

## 已验证事实

### 1. Supabase 配置、目标表结构与写权限

- `.env` 中本轮所需变量可用：
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_SCHEMA`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 目标表结构已在仓库 migration 中存在：
  - `supabase/migrations/20260617120000_create_news_items.sql`
  - `supabase/migrations/20260616090000_create_frontier_ecosystem_articles.sql`
  - `supabase/migrations/20260616120000_create_interview_questions.sql`
- 本地 seed 成功生成：
  - `node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts` -> `Rows: 114`
  - `node --experimental-transform-types scripts/generate-interview-questions-supabase-seed.ts` -> `Rows: 60`
- 远端写权限已通过真实 upsert 验证：
  - `node scripts/push-frontier-seed-to-supabase.mjs` -> `HTTP 201`, `table count=0-0/114`
  - `node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts` -> `HTTP 201`, `table count=0-0/560`
- 远端匿名回读成功：
  - `news_items` -> `HTTP 206`, `content-range=0-0/2381`
  - `frontier_ecosystem_articles` 4 条新增标题都已读回，`collected_date=2026-07-03`
  - `interview_questions` 4 条新增 slug 都已读回，`collected_date=2026-07-03`

### 2. 多源采集结果（news_items）

执行命令：

```powershell
node --env-file=.env --experimental-transform-types news-collector/src/cli-collect.ts
```

已验证事实：

- 运行区间：`2026-07-03T00:32:08.084Z -> 2026-07-03T00:32:34.802Z`
- `31/34` 源成功，`3/34` 源失败但未阻断主任务。
- 成功覆盖的高信号源包含：
  - 官方 release：OpenAI Agents Python / JS、LangGraph、CrewAI、Google ADK、Google Gen AI SDK、Microsoft AutoGen、Semantic Kernel、OpenAI Python、Letta、smolagents
  - 官方博客：Google AI、Microsoft Source、AWS ML、NVIDIA、GitHub Engineering、GitHub Changelog、OpenAI、Hugging Face
  - 研究源：arXiv `cs.AI`、`cs.LG`
  - 社区/媒体补充：量子位、IT之家、TechWeb、少数派、InfoQ、VentureBeat、MIT Technology Review、Ahead of AI、The Decoder
- 本轮 collector 汇总：`fetched=470`，`dedupe=470`，`content fetched=80/470`，`content empty=49`，`content failed=0`，`stored=470`。
- `public.news_items` 已写入远端，当前总量 `2381`。

### 3. 本轮新增 curated frontier 的 4 条内容

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [LangGraph 1.2.7 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.7) | LangChain | 2026-06-30 | `11` `16` `18` `lg-checkpoint` `20` | high |
| [Building a serverless A2A gateway for agent discovery, routing, and access control](https://aws.amazon.com/blogs/machine-learning/building-a-serverless-a2a-gateway-for-agent-discovery-routing-and-access-control/) | AWS | 2026-07-01 | `05` `11` `17` `18` `20` | high |
| [Structured memory filtering with metadata in AgentCore Memory](https://aws.amazon.com/blogs/machine-learning/structured-memory-filtering-with-metadata-in-agentcore-memory/) | AWS | 2026-07-01 | `07` `08` `09` `11` `20` | high |
| [Can Agents Generalize to the Open World? Unveiling the Fragility of Static Training in Tool Use](https://arxiv.org/abs/2607.01084) | arXiv | 2026-07-01 | `05` `10` `15` `18` `20` | medium |

摘要：

- LangGraph `1.2.7`：核心不是“又发了一个 patch”，而是 checkpoint / delta state / API task id 这些持久化细节被当成生产边界修正，说明图式 agent 的回放与恢复正确性正在从内部实现问题升级为线上稳定性问题。
- A2A gateway：AWS 直接把 A2A 落地拆成 management / control / execution 三层，证明协议标准化之后，企业里真正难的是 discoverability、scope 授权、统一路由与流控，而不是 agent 之间能不能发消息。
- AgentCore Memory metadata filtering：长期记忆系统不能只靠向量相似度；先按 metadata 过滤再检索，才有机会把权限边界、时间边界和业务 namespace 真正落实到检索面。
- OpenAgent open-world tool-use：论文明确说明静态 benchmark 高分并不等于线上可靠，因为真实环境里的 query / action / observation / domain 都会漂移，tool-use 泛化必须单独测。

远端回读验证：

- `langgraph-1-2-7-release-notes`
- `building-a-serverless-a2a-gateway-for-agent-discovery-routing-and-access-control`
- `structured-memory-filtering-with-metadata-in-agentcore-memory`
- `can-agents-generalize-to-the-open-world-unveiling-the-fragility-of-static-training-in-tool`

四条都已在 `public.frontier_ecosystem_articles` 读回成功，`collected_date=2026-07-03`。

### 4. 本轮新增 4 道面试题

| slug | 高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `checkpoint-delta-state-roundtrip-vs-production-replay` | checkpoint / delta state / replay correctness | `11` `16` `18` `19` | LangGraph 1.2.7 |
| `a2a-gateway-vs-point-to-point-agent-mesh` | protocol vs gateway / discoverability / authz | `05` `11` `17` `18` `19` | AWS A2A gateway |
| `metadata-prefiltering-vs-pure-semantic-memory-retrieval` | metadata pre-filter / memory boundary / RAG recall | `07` `08` `09` `11` `19` | AgentCore Memory |
| `open-world-tool-use-fragility-vs-static-benchmark-score` | open-world shift / tool-use generalization / offline vs online | `05` `10` `15` `18` `19` | OpenAgent |

远端回读验证：

- `checkpoint-delta-state-roundtrip-vs-production-replay`
- `a2a-gateway-vs-point-to-point-agent-mesh`
- `metadata-prefiltering-vs-pure-semantic-memory-retrieval`
- `open-world-tool-use-fragility-vs-static-benchmark-score`

四条都已在 `public.interview_questions` 读回成功，`collected_date=2026-07-03`。

### 5. 模块归属依据

- 最新资讯流：继续走 `news-collector -> news_items -> lessons/20-agent-frontier-news`，因为这是仓库已有的多源日采集主通道。
- curated frontier：继续落到 `knowledge-graph/data/graph.ts`，因为这是课程生态资料的单一事实源；第 20 章再由 `frontier-articles.ts` 派生消费。
- 面试题：继续落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，因为这是结构化题库 + 人读清单双轨。
- 本轮新增条目的模块选择遵循仓库现有结构：
  - checkpoint / replay / delta state -> `11` `16` `18`
  - A2A gateway / discoverability / access control -> `05` `11` `17` `18`
  - metadata-first memory retrieval -> `07` `08` `09` `11`
  - open-world tool-use evaluation -> `05` `10` `15` `18`

## 重试与失败细节

### 已发生失败（未阻断主任务）

1. `npm run kg`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 处理：切到 `node node_modules\tsx\dist\cli.mjs knowledge-graph/generate.ts`，成功重生成知识图谱与 README 注入产物。

2. `npm run supabase:frontier-seed`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 处理：切到 `node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts`，成功生成 `114` 行 seed。

3. `npm run supabase:interview-seed`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 处理：切到 `node --experimental-transform-types scripts/generate-interview-questions-supabase-seed.ts`，成功生成 `60` 行 seed。

4. `npm run supabase:frontier-push`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：Windows 受管环境对子进程拉起有限制，不是 frontier 数据错误。
   - 处理：按约束切换到 `node scripts/push-frontier-seed-to-supabase.mjs`，第 `1/3` 次即成功，`HTTP 201`。

5. `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 处理：切到 `node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts`，第 `1/3` 次即成功，`HTTP 201`。

6. 以下源在 collector 中重试后仍失败：
   - `hn-ai` -> `Status code 502`（3/3）
   - `linuxdo-latest` -> `Status code 403`（1/3 后提前停止）
   - `deepmind` -> `Client network socket disconnected before secure TLS connection was established` / `fetch failed`（5/5）
   - 判断：源站 / TLS / 访问策略问题，不是 Supabase 写入问题。

### 未触发的失败项

- 本轮没有出现“Supabase 未同步成功”。
- `frontier_ecosystem_articles` 与 `interview_questions` 没有出现字段冲突、权限拒绝或约束冲突；最终都返回 `HTTP 201`。

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
- `docs/solutions/2026-07-03-agent-content-daily-sync.md`

## 已上传 Supabase

- `public.news_items`
- `public.frontier_ecosystem_articles`
- `public.interview_questions`

## 失败 / 未知项

### 失败项

- `hn-ai`、`linuxdo-latest`、`deepmind` 本轮采集失败，但不影响三张 Supabase 表最终同步成功。
- 根目录临时文件 `.tmp-agent-daily-edit.cjs` 已清空，但 Windows 本轮多次返回 `Access is denied`，暂未删除；属于低风险本地清理项，不影响数据同步结果。

### 未知项

- `deepmind` 的 TLS 失败究竟是临时网络波动、证书链问题还是源站策略变化，本轮未进一步拆分。
- `public.interview_questions` 当前远端总量为 `560`，明显高于本地 seed `60`；说明远端已累计更多历史/外部题目，本轮只验证新增 4 条已成功 upsert，没有做全表去重或历史清洗。

## Git 边界

### 初始 `git status --short`

```text
<empty>
```

### 末尾 `git status --short`

```text
 M .vitepress/config.mts
 M docs/career-guide.md
 M docs/knowledge-graph.md
 M docs/navigation.md
 M index.md
 M knowledge-graph/data/frontier-articles.ts
 M knowledge-graph/data/graph.ts
 M knowledge-graph/data/interview-questions.ts
 M knowledge-graph/output/index.html
 M lessons/19-agent-ecosystem-and-frontier/README.md
 M scripts/codefather-interview-cron.ts
 M scripts/codefather-interview-ecosystem.config.cjs
 M scripts/sync-codefather-interview-to-supabase.test.mts
 M scripts/sync-codefather-interview-to-supabase.ts
 M supabase/seed/frontier_ecosystem_articles.sql
 M supabase/seed/interview_questions.sql
?? .tmp-agent-daily-edit.cjs
?? .tmp/
?? docs/plans/2026-07-03-chatgpt-sidebar-features.md
?? docs/projects.md
?? docs/scheduled.md
?? docs/solutions/2026-07-03-daily-project-summary.md
```

说明：

- 本轮明确新增 / 修改并验证过的文件集中在：
  - `knowledge-graph/data/graph.ts`
  - `knowledge-graph/data/frontier-articles.ts`
  - `knowledge-graph/data/interview-questions.ts`
  - `docs/career-guide.md`
  - `docs/knowledge-graph.md`
  - `knowledge-graph/output/index.html`
  - `lessons/19-agent-ecosystem-and-frontier/README.md`
  - `supabase/seed/frontier_ecosystem_articles.sql`
  - `supabase/seed/interview_questions.sql`
- 其余 `scripts/codefather-*`、`.vitepress/config.mts`、`docs/navigation.md`、`index.md`、`.tmp/`、`docs/plans/2026-07-03-chatgpt-sidebar-features.md`、`docs/projects.md`、`docs/scheduled.md`、`docs/solutions/2026-07-03-daily-project-summary.md` 不属于本轮采集同步主改动，保持原样未回退。