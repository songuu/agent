---
title: "Agent 内容每日采集同步（2026-06-18）"
date: "2026-06-18"
tags: [agent, frontier, news, supabase, interview, sync]
---

# Agent 内容每日采集同步（2026-06-18）

## 目标

收集最新 AI Agent 相关内容，按仓库既有模块落地，并把对应数据同步到 Supabase。  
本轮硬性成功标准：`news_items`、`frontier_ecosystem_articles`、`interview_questions` 三条链路都必须完成远端写入与回读验证。

## 模块映射与依据

### 已验证事实

- **最新文章 / 技术实践 / 开源动态**
  - 落地模块：
    - `news-collector` → Supabase `news_items`
    - 第 20 章 `/news` / `lessons/20-agent-frontier-news`
  - 依据：
    - 这是仓库现有“多源 RSS/Atom → 去重 → 分类 → Upsert”的日采集链路，专门承接最新资料流。
- **精选前沿参考档案**
  - 落地模块：
    - `knowledge-graph/data/graph.ts`
    - 派生 `knowledge-graph/data/frontier-articles.ts`
    - Supabase `frontier_ecosystem_articles`
  - 依据：
    - 这是仓库现有第 19/20 章 curated frontier 事实源，适合沉淀高信号 release / benchmark / 方法论文。
- **面试题与高频考点**
  - 落地模块：
    - `knowledge-graph/data/interview-questions.ts`
    - `docs/career-guide.md`
    - Supabase `interview_questions`
  - 依据：
    - 这是仓库现有结构化题库事实源 + 人读清单。

## 本轮执行

### 1. Supabase 前置检查

已验证：

- `.env` 中存在 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_SCHEMA`
- 远端三张表可读：
  - `news_items`：HTTP 206，初始 `content-range=0-0/377`
  - `frontier_ecosystem_articles`：HTTP 206，初始 `content-range=0-0/77`
  - `interview_questions`：HTTP 206，初始 `content-range=0-0/30`

### 2. 最新内容采集

执行命令：

```powershell
node node_modules/tsx/dist/cli.mjs --env-file=.env news-collector/src/cli-collect.ts
```

已验证事实：

- 运行时间：`2026-06-18T00:36:07.559Z → 2026-06-18T00:36:23.233Z`
- 15 个源中 10 个成功，5 个失败
- 本次抓取进入管道 `150` 条，批内去重后 `150` 条
- `stored=150`
- 当前远端表中 `collected_date=2026-06-18` 的 `news_items` 已可回读

成功源：

- 量子位
- The Decoder
- arXiv cs.AI
- Microsoft Source · AI
- AWS Machine Learning Blog
- NVIDIA Deep Learning
- InfoQ AI/ML/Data Engineering
- VentureBeat AI
- MIT Technology Review
- Ahead of AI

失败源：

- Hacker News · AI：`Status code 502`
- Google AI Blog：`Client network socket disconnected before secure TLS connection was established`
- Google DeepMind Blog：`Client network socket disconnected before secure TLS connection was established`
- Hugging Face Blog：`Request timed out after 15000ms`
- OpenAI News：`Request timed out after 15000ms`

### 3. Curated frontier 落地

本轮把以下高信号资料保留到 `knowledge-graph/data/graph.ts`，再派生到 `frontier_ecosystem_articles`：

- `LangGraph CLI 0.4.30 release notes`
- `RetailBench: A Long-Horizon Benchmark for AI Agents in Retail Management`
- `Can AI Agents Synthesize Scientific Conclusions? Understanding Strategic Generalization on SciConBench`
- `SubtleMemory: Benchmarking Long-Term Relational Memory in LLM Agents`
- `SentinelBench: Benchmarking Monitoring Agents in Dynamic Environments`

这些内容的共同特点：

- 一手 release / arXiv 原文可追溯
- 明确对应仓库现有教学模块
- 能补当前 agent runtime、评测、记忆一致性与 long-horizon 口径

### 4. 面试题题库补充

本轮把题库扩展为 `34` 题，新增 4 条工程类高频追问，并同步补到 `docs/career-guide.md`：

- clean-room synthesis / strategic generalization
- long-horizon benchmark vs 单回合成功率
- monitoring agent 的时效 / 误报 / 行动链
- relational memory consistency vs keyword recall

## Supabase 同步

### 已上传成功

#### `news_items`

- 同步方式：
  - `news-collector` 真实抓取后直接 PostgREST upsert
- 结果：
  - 本次运行 `stored=150`
- 样例来源：
  - `Amazon SageMaker AI Async Inference now supports inline request payloads`
  - `Get back hours every day with autonomous agents in Amazon Quick`
  - `Context intelligence for your data and AI agents at scale`
  - `New in Amazon Bedrock AgentCore: Build agents with broader knowledge and continuous learning`

#### `frontier_ecosystem_articles`

执行命令：

```powershell
node node_modules/tsx/dist/cli.mjs scripts/generate-frontier-ecosystem-supabase-seed.ts
node node_modules/tsx/dist/cli.mjs --env-file=.env scripts/push-frontier-ecosystem-to-supabase.ts
```

首次同步失败：

- 错误：`spawn EPERM`
- 失败位置：`tsx/esbuild`
- 判断：Windows 环境子进程启动受限，不是表权限错误

按仓库约定切换 fallback：

```powershell
node scripts/push-frontier-seed-to-supabase.mjs
```

已验证事实：

- seed 生成成功：`82` rows
- fallback upsert 成功：`HTTP 200`
- 回读计数：`content-range=0-0/82`

#### `interview_questions`

执行命令：

```powershell
node node_modules/tsx/dist/cli.mjs scripts/generate-interview-questions-supabase-seed.ts
node node_modules/tsx/dist/cli.mjs --env-file=.env scripts/push-interview-questions-to-supabase.ts
```

首次同步失败：

- 错误：`spawn EPERM`
- 失败位置：`tsx/esbuild`
- 判断：同样是 Windows 环境子进程启动限制，不是表权限错误

fallback：

```powershell
node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts
```

已验证事实：

- seed 生成成功：`34` rows
- fallback upsert 成功：`HTTP 200`
- 回读计数：`content-range=0-0/34`

## 关键样例

### 最新资讯流样例（已写 `news_items`）

- `2026-06-17` · AWS Machine Learning Blog  
  `Get back hours every day with autonomous agents in Amazon Quick`  
  <https://aws.amazon.com/blogs/machine-learning/get-back-hours-every-day-with-autonomous-agents-in-amazon-quick/>

- `2026-06-17` · AWS Machine Learning Blog  
  `Context intelligence for your data and AI agents at scale`  
  <https://aws.amazon.com/blogs/machine-learning/context-intelligence-for-your-data-and-ai-agents-at-scale/>

- `2026-06-17` · AWS Machine Learning Blog  
  `New in Amazon Bedrock AgentCore: Build agents with broader knowledge and continuous learning`  
  <https://aws.amazon.com/blogs/machine-learning/new-in-amazon-bedrock-agentcore-build-agents-with-broader-knowledge-and-continuous-learning/>

- `2026-06-17` · InfoQ  
  `From Hype to Strong Foundations: What the Rise, Fall and Resurgence of Agents Can Teach Us About Outlasting the Cycle`  
  <https://www.infoq.com/presentations/llm-compound-ai-systems/>

### Curated frontier 样例（已写 `frontier_ecosystem_articles`）

- `2026-06-16` · LangChain  
  `LangGraph CLI 0.4.30 release notes`  
  <https://github.com/langchain-ai/langgraph/releases/tag/langgraph-cli%3D%3D0.4.30>

- `2026-06-14` · arXiv  
  `RetailBench: A Long-Horizon Benchmark for AI Agents in Retail Management`  
  <https://arxiv.org/abs/2606.14545>

- `2026-06-09` · arXiv  
  `Can AI Agents Synthesize Scientific Conclusions? Understanding Strategic Generalization on SciConBench`  
  <https://arxiv.org/abs/2606.11337>

- `2026-06-04` · arXiv  
  `SubtleMemory: Benchmarking Long-Term Relational Memory in LLM Agents`  
  <https://arxiv.org/abs/2606.05761>

### 面试题样例（已写 `interview_questions`）

- `scientific-synthesis-clean-room-generalization`
- `long-horizon-agent-benchmark-vs-single-step-score`
- `monitoring-agent-timeliness-false-alert-action-chain`
- `memory-agent-relational-consistency-vs-keyword-recall`

## 本地落地位置

- [`knowledge-graph/data/graph.ts`](/C:/project/my/agent-build/knowledge-graph/data/graph.ts)
- [`knowledge-graph/data/frontier-articles.ts`](/C:/project/my/agent-build/knowledge-graph/data/frontier-articles.ts)
- [`knowledge-graph/data/interview-questions.ts`](/C:/project/my/agent-build/knowledge-graph/data/interview-questions.ts)
- [`docs/career-guide.md`](/C:/project/my/agent-build/docs/career-guide.md)
- [`supabase/seed/frontier_ecosystem_articles.sql`](/C:/project/my/agent-build/supabase/seed/frontier_ecosystem_articles.sql)
- [`supabase/seed/interview_questions.sql`](/C:/project/my/agent-build/supabase/seed/interview_questions.sql)

## 失败 / 未知项

### 已知失败

- 本轮 `news-collector` 有 5 个源抓取失败，但整批采集和 `news_items` 写库已成功。
- `tsx/esbuild` 在本机 Windows 环境下对 `frontier` / `interview` push 均触发 `spawn EPERM`；已按仓库约定用 fallback 方案完成写库。

### 未知项

- `frontier_ecosystem_articles` 表当前没有独立 `published_at` 列；发布时间存放于 `metadata.publishedAt`。这不是本轮阻塞，但后续若要直接按发布时间筛选远端 SQL，需要补 schema 或统一查询层口径。
- 失败的 5 个 RSS 源是否在下一轮恢复，需要下一次采集再验证。

## 结论

本轮任务状态：**成功**。

已验证成功：

- `news_items` 已上传 Supabase
- `frontier_ecosystem_articles` 已上传 Supabase
- `interview_questions` 已上传 Supabase
- 仓库内对应事实源与人读模块已同步更新

未作为成功掩盖项的事实：

- `tsx/esbuild -> spawn EPERM` 确实发生过，但已用仓库指定 fallback 完成远端同步
- 5 个资讯源本轮抓取失败，已保留具体错误，不影响本轮三张表的 Supabase 同步成功判定
