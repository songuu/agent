# 2026-06-26 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 新增 4 条高信号 Agent 资料：
    - [OpenAI research: How agents are transforming work](https://openai.com/index/how-agents-are-transforming-work)
    - [CrewAI 1.15.0 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.0)
    - [Retrofit, don't rebuild: Agentic overlays for transforming legacy enterprise services](https://aws.amazon.com/blogs/machine-learning/retrofit-dont-rebuild-agentic-overlays-for-transforming-legacy-enterprise-services/)
    - [Building agentic AI applications with a modern data mesh strategy on AWS](https://aws.amazon.com/blogs/machine-learning/building-agentic-ai-applications-with-a-modern-data-mesh-strategy-on-aws/)
  - `knowledge-graph/data/interview-questions.ts` 新增 3 道工程类高频题。
  - `docs/career-guide.md` 同步追加 3 条新题的人读清单。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 批次日期滚动到 `2026-06-26`。
- 已完成 Supabase 同步：
  - `public.news_items`：本轮 `stored=510`，远端总量 `1474`。
  - `public.frontier_ecosystem_articles`：远端总量 `101`，写入成功。
  - `public.interview_questions`：远端总量 `47`，写入成功。
- 本轮最终状态：不是“仅本地落地”，而是“本地事实源 + Supabase 三表同步全部成功”。

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
- 远端读回成功：
  - `news_items`：`HTTP 206`，`content-range=0-0/1474`
  - `frontier_ecosystem_articles`：`HTTP 206`，`content-range=0-0/101`
  - `interview_questions`：`HTTP 206`，`content-range=0-0/47`
- 远端写权限已通过真实 upsert 验证：
  - `node scripts/push-frontier-seed-to-supabase.mjs`：`HTTP 201`
  - `node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts`：`HTTP 201`

### 2. 多源采集结果（news_items）

执行命令：

```powershell
node --env-file=.env --experimental-transform-types news-collector/src/cli-collect.ts
```

已验证事实：

- 运行区间：`2026-06-26T00:34:57.615Z -> 2026-06-26T00:35:23.428Z`
- `32/34` 源成功；失败源为：
  - `Google AI Blog (google-ai)`：`Client network socket disconnected before secure TLS connection was established`，`attempts=5/5`，`retry-exhausted`
  - `Google DeepMind Blog (deepmind)`：`Client network socket disconnected before secure TLS connection was established`，`attempts=5/5`，`retry-exhausted`
- 成功覆盖的高信号源包含：
  - 官方 release：OpenAI Agents Python / JS、LangGraph、CrewAI、Google ADK、Google Gen AI SDK、Microsoft AutoGen、Semantic Kernel、Letta、smolagents
  - 官方博客：AWS ML、OpenAI、Hugging Face、Microsoft Source、GitHub Engineering / Changelog
  - 研究源：arXiv `cs.AI`、`cs.LG`
  - 社区/媒体补充：The Decoder、InfoQ、MIT Technology Review、Hacker News · AI、量子位、IT之家、TechWeb、少数派、LinuxDo
- 本轮 collector 汇总：`fetched=510`，`dedupe=510`，`content fetched=80/510`，`content empty=70`，`content failed=0`，`stored=510`。
- `public.news_items` 已写入远端，当前总量 `1474`。

### 3. 本轮新增 curated frontier 的 4 条内容

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [OpenAI research: How agents are transforming work](https://openai.com/index/how-agents-are-transforming-work) | OpenAI | 2026-06-25 | `11` `15` `16` `18` `20` | high |
| [CrewAI 1.15.0 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.0) | CrewAI | 2026-06-25 | `11` `16` `18` `20` | high |
| [Retrofit, don't rebuild: Agentic overlays for transforming legacy enterprise services](https://aws.amazon.com/blogs/machine-learning/retrofit-dont-rebuild-agentic-overlays-for-transforming-legacy-enterprise-services/) | AWS | 2026-06-25 | `05` `11` `17` `18` `20` | high |
| [Building agentic AI applications with a modern data mesh strategy on AWS](https://aws.amazon.com/blogs/machine-learning/building-agentic-ai-applications-with-a-modern-data-mesh-strategy-on-aws/) | AWS | 2026-06-25 | `08` `09` `16` `17` `18` `20` | high |

摘要：

- OpenAI `How agents are transforming work`：重点不在新模型 API，而在工作形态评估口径变化，说明 agent 的价值衡量正从单轮问答转向长任务、复杂工作流和跨角色协同。
- CrewAI `1.15.0`：开始系统化追踪 conversational flow turn usage、统一 declarative flow loading，并把 conversational flows 贯通到 CLI/TUI，信号是 workflow 已进入可观测、可回放、可统一运维阶段。
- AWS `Agentic overlays`：强调“改造遗留服务”不该默认重写，而应通过薄包装层把 REST 能力、安全边界和渐进迁移拆开，这是企业工具化落地的现实路径。
- AWS `data mesh strategy`：把 governed data mesh 作为 production agentic AI 的数据底座，说明 agent 真正难点不是“能查数据”，而是 identity、catalog、policy、knowledge base 与 retrieval 的联合治理。

远端回读验证：

- 4 条标题均已在 `public.frontier_ecosystem_articles` 读回成功。
- 远端元数据中 `publishedAt=2026-06-25`、`collected_date=2026-06-26`、`confidence=high` 均可读回。

### 4. 本轮新增 3 道面试题

| slug | 高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `conversational-flow-telemetry-and-unified-loader-boundary` | workflow telemetry / declarative flow loader / replay & billing consistency | `11` `16` `18` `19` | CrewAI `1.15.0` |
| `agentic-overlay-vs-rebuild-for-legacy-enterprise-services` | legacy system overlay / integration boundary / permission shell / rollout risk | `05` `11` `17` `18` `19` | AWS `Agentic overlays` |
| `governed-data-mesh-for-agentic-ai-vs-direct-source-access` | data mesh / identity / catalog / policy / knowledge base governance | `08` `09` `16` `17` `18` `19` | AWS `data mesh strategy` |

远端回读验证：

- `conversational-flow-telemetry-and-unified-loader-boundary`
- `agentic-overlay-vs-rebuild-for-legacy-enterprise-services`
- `governed-data-mesh-for-agentic-ai-vs-direct-source-access`

三条都已在 `public.interview_questions` 读回成功，`collected_date=2026-06-26`。

### 5. 模块归属依据

- 最新资讯流：继续走 `news-collector -> news_items -> lessons/20-agent-frontier-news`，因为这是仓库已有的多源日采集主通道。
- curated frontier：继续落到 `knowledge-graph/data/graph.ts`，因为这是课程生态资料的单一事实源；第 20 章再由 `frontier-articles.ts` 派生消费。
- 面试题：继续落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，因为这是结构化题库 + 人读清单双轨。
- 本轮新增条目的模块选择遵循仓库现有结构：
  - workflow / orchestration / replay / runtime telemetry -> `11` `16` `18`
  - tool boundary / legacy service wrapping / guardrail shell -> `05` `17` `18`
  - retrieval / governed data mesh / knowledge base -> `08` `09` `16` `17` `18`

## 重试与失败细节

### 已发生失败（已修复）

1. `npm run supabase:frontier-push`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：Windows 受管环境对子进程拉起有限制，不是 frontier 数据本身错误。
   - 处理：按既定回退路径改用 `node scripts/push-frontier-seed-to-supabase.mjs`，基于已生成 SQL seed 直接 PostgREST upsert。

2. `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts`
   - 失败原因：`tsx/esbuild -> spawn EPERM`
   - 判断：同上，不是 interview 数据错误。
   - 处理：改用 `node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts`，保持同一事实源与同一 upsert 逻辑。

3. `news-collector` 源级失败
   - 失败源：`google-ai`、`deepmind`
   - 重试结果：都已跑满 `5/5` 次，仍报 `Client network socket disconnected before secure TLS connection was established`
   - 判断：是源站/网络握手问题，不是 Supabase 写入问题；其余 `32/34` 源已成功，主任务未被阻断。

### 未触发的失败项

- 本轮没有出现 “Supabase 未同步成功”。
- frontier / interview 没有出现表约束冲突、字段冲突或权限拒绝；最终都返回 `HTTP 201`。

## 本地落地位置

- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/career-guide.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`
- `src/shared/llm/index.ts`
- `src/shared/llm/anthropic.ts`
- `src/shared/llm/openai.ts`
- `src/shared/llm/openaiCompatible.ts`

## 已上传 Supabase

- `public.news_items`
- `public.frontier_ecosystem_articles`
- `public.interview_questions`

## 失败 / 未知项

### 失败项

- 无阻断性失败。
- 两个源站 (`google-ai`, `deepmind`) 本轮采集失败，但不影响三张 Supabase 表最终同步成功。

### 未知项

- `OpenAI research: How agents are transforming work` 在当前采集结果里只有官方摘要，没有正文抽取；已保留原文链接，后续若源页开放稳定正文抓取，可再补充更细粒度结论。
- `CrewAI 1.15.0` 的 release 摘要已经足够支撑 workflow telemetry / declarative loader 判断，但具体 breaking changes 仍建议在升级前逐项对照 release notes 原文。
- `news_items` 当前总量从 `1377` 增长到 `1474`，本轮只把其中 4 条提升进 curated frontier；其余新增内容已保留在 `public.news_items` 供后续继续筛选。
