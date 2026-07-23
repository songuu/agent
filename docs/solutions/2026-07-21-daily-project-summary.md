---
title: "Daily project summary (2026-07-21)"
date: 2026-07-21
tags: [summary, daily, status, agent-build]
related_instincts: []
aliases: ["2026-07-21 日总结", "agent-build 每日总结"]
---

# Daily Project Summary (2026-07-21)

## Summary Scope

- Primary capture time: `2026-07-21T08:33:24.3293805+08:00`
- Observation window: `2026-07-20T08:33:24.3293805+08:00` to `2026-07-21T08:33:24.3293805+08:00`
- Previous automation run: `2026-07-20T00:34:22.740Z`
- Repository: `C:\project\my\agent-build`
- Report path: `docs/solutions/2026-07-21-daily-project-summary.md`

## 已验证事实

### 1. Git 基线与过去 24 小时提交

- 当前分支：`master`
- 当前 `HEAD`：`2ee2dc8638366e521c117e5edebea50dd6474eef`
- 当前 `HEAD` 时间：`2026-07-14 11:15:20 +0800`
- 当前 `HEAD` 作者：`songyu_qiming`
- 当前 `HEAD` 标题：`feat: implement codefather interview runner and cron job`
- `git log --since="24 hours ago"` 没有命中任何本地提交。
- 结论：过去 24 小时没有新的本地 Git 提交，今天的活动全部体现在未提交工作区上。

### 2. 当前工作区状态

- `git status --short --branch` 显示：`## master...origin/master`
- 当前共有 `29` 条状态：
  - 已跟踪修改：`23`
  - 未跟踪路径：`6`
- 已跟踪修改文件：
  - `.vitepress/theme/interview-article-detail.test.mts`
  - `.vitepress/theme/interview-article-detail.ts`
  - `.vitepress/theme/interview-clinic-data.test.mts`
  - `.vitepress/theme/interview-clinic-data.ts`
  - `docs/career-guide.md`
  - `docs/knowledge-graph.md`
  - `knowledge-graph/data/frontier-articles.ts`
  - `knowledge-graph/data/graph.ts`
  - `knowledge-graph/data/interview-questions.ts`
  - `knowledge-graph/output/index.html`
  - `lessons/19-agent-ecosystem-and-frontier/README.md`
  - `news-collector/README.md`
  - `news-collector/__tests__/collect.test.mts`
  - `news-collector/__tests__/config.test.mts`
  - `news-collector/__tests__/rss.test.mts`
  - `news-collector/__tests__/sources.test.mts`
  - `news-collector/src/collect.ts`
  - `news-collector/src/config.ts`
  - `news-collector/src/rss.ts`
  - `news-collector/src/sources.ts`
  - `news-collector/src/types.ts`
  - `supabase/seed/frontier_ecosystem_articles.sql`
  - `supabase/seed/interview_questions.sql`
- 未跟踪路径：
  - `docs/solutions/2026-07-16-daily-project-summary.md`
  - `docs/solutions/2026-07-17-agent-content-daily-sync.md`
  - `docs/solutions/2026-07-17-daily-project-summary.md`
  - `docs/solutions/2026-07-20-agent-content-daily-sync.md`
  - `docs/solutions/2026-07-20-daily-project-summary.md`
  - `news-collector/deploy/ecosystem.runtime.config.cjs`
- `git diff --stat` 汇总：`23 files changed, 1387 insertions(+), 255 deletions(-)`。

### 3. 过去 24 小时真实落盘的主要工作流

#### 3.1 面试题前端日期展示修正

- `.vitepress/theme/interview-article-detail.ts`
  - 新增 `sourceCreatedAt`、`sourceUpdatedAt` 元数据读取。
  - 新增 `resolveInterviewDisplayDate()`，显示顺序调整为：`sourceUpdatedAt` -> `sourceCreatedAt` -> `collected_date`。
- `.vitepress/theme/interview-clinic-data.ts`
  - `normalizeInterviewQuestionRow()` 改为优先使用上游时间字段，最后才回退到本地默认值。
- 对应测试补充：
  - `.vitepress/theme/interview-article-detail.test.mts`
  - `.vitepress/theme/interview-clinic-data.test.mts`
- 最后写入时间（UTC）：
  - `2026-07-20 08:18:59` 到 `2026-07-20 08:18:59`

#### 3.2 news-collector 抓取稳态增强

- `news-collector/src/collect.ts`
  - 新增 `feedConcurrency` 配置和有界并发 `fetchFeedsBounded()`，避免同域请求突发。
- `news-collector/src/config.ts`
  - 新增环境变量 `NEWS_FEED_CONCURRENCY`，默认值 `4`。
- `news-collector/src/rss.ts`
  - 新增 `hacker-news-algolia` JSON 解析。
  - 新增 Hacker News 主入口失败时回退到 `hnrss` 的逻辑。
  - 扩大可重试错误匹配范围，覆盖 `fetch failed`、`operation was aborted`、`Unexpected close tag`。
- `news-collector/src/sources.ts`
  - `hn-ai` 主入口改为 Algolia API，并配置 RSS fallback。
  - 明确关闭 `techweb-it`、`36kr-feed` 等存在证书或验证码问题的来源。
  - 为若干高价值源补上 fallback / retry / critical 标记。
- `news-collector/src/types.ts`
  - 新增 `SourceFallback` 与 `fallbacks` 定义。
- `news-collector/README.md`
  - 补充 `NEWS_FEED_CONCURRENCY` 说明和独立部署入口说明。
- 新增未跟踪部署文件：
  - `news-collector/deploy/ecosystem.runtime.config.cjs`
- 对应测试补充：
  - `news-collector/__tests__/collect.test.mts`
  - `news-collector/__tests__/config.test.mts`
  - `news-collector/__tests__/rss.test.mts`
  - `news-collector/__tests__/sources.test.mts`
- 最后写入时间（UTC）：
  - `2026-07-20 09:09:51` 到 `2026-07-20 10:10:12`

#### 3.3 frontier / interview / knowledge graph 内容刷新

- `knowledge-graph/data/frontier-articles.ts`
  - 最近一次本地写入：`2026-07-20 23:08:49 UTC`
- `knowledge-graph/data/graph.ts`
  - 大量新增第 `19` 章 frontier 条目和知识图谱节点。
  - 最近一次本地写入：`2026-07-20 23:10:18 UTC`
- `docs/knowledge-graph.md`
  - 文章总数从旧值上升到 `222`。
  - 最近一次本地写入：`2026-07-20 23:10:29 UTC`
- `knowledge-graph/data/interview-questions.ts`
  - 新增围绕 Agents SDK、MCP v2、OpenHands、Langfuse、Phoenix、Mem0、verifier、安全评测等面试题。
  - 最近一次本地写入：`2026-07-20 23:10:42 UTC`
- `docs/career-guide.md`
  - 新增题号 `70` 到 `81` 的高阶题目。
  - 最近一次本地写入：`2026-07-20 23:09:54 UTC`
- `lessons/19-agent-ecosystem-and-frontier/README.md`
  - 同步追加对应来源与“为什么重要”说明。
- `knowledge-graph/output/index.html`
  - 生成产物更新。
- `supabase/seed/frontier_ecosystem_articles.sql`
  - frontier seed 重生成。
- `supabase/seed/interview_questions.sql`
  - interview seed 重生成。

### 4. 过去 24 小时仓库内新增但未纳管的文档

- `docs/solutions/2026-07-20-daily-project-summary.md`
  - 最后写入：`2026-07-20 00:37:43 UTC`
- `docs/solutions/2026-07-20-agent-content-daily-sync.md`
  - 最后写入：`2026-07-20 23:35:31 UTC`
- 更早遗留且仍未跟踪：
  - `docs/solutions/2026-07-16-daily-project-summary.md`
  - `docs/solutions/2026-07-17-agent-content-daily-sync.md`
  - `docs/solutions/2026-07-17-daily-project-summary.md`

### 5. 测试与构建状态

#### 5.1 已通过

- `pnpm typecheck`
  - 退出码：`0`
- `node node_modules\tsx\dist\cli.mjs --test news-collector\__tests__\rss.test.mts news-collector\__tests__\collect.test.mts news-collector\__tests__\config.test.mts news-collector\__tests__\sources.test.mts`
  - 退出码：`0`
  - 汇总结果：`26` tests, `26` pass, `0` fail
  - 本轮覆盖点：
    - RSS/Atom/Algolia 解析
    - fallback / retry
    - 抓取并发上限
    - 来源启停与 fallback 注册
    - 配置默认值

#### 5.2 已失败

- `node node_modules\vitepress\bin\vitepress.js build`
  - 退出码：`1`
  - 错误：`failed to load config from C:\project\my\agent-build\.vitepress\config.mts`
  - 栈顶原因：`spawn EPERM`
  - 触发阶段：`esbuild` 子进程启动
- 该失败证明“当前环境无法完成整站构建”，但还不能单独证明源码层存在新的功能回归。

### 6. 仓库约定

- `docs/scheduled.md` 明确把“每日项目总结”的落点定义为 `docs/solutions/*-daily-project-summary.md`。
- 本轮报告沿用该约定。

## 推断

- 今天的主要开发动作分成三条工作流：面试题时间展示修正、news-collector 稳态增强、frontier/interview/graph 内容刷新。
  - 依据：过去 24 小时的文件落盘时间形成三段明显聚类，且 diff 内容主题清晰分离。
- 当前仓库脏状态已经不只是“内容同步残留”，而是叠加了前端逻辑改动和采集器行为改动。
  - 依据：`.vitepress/theme/*` 和 `news-collector/*` 同时出现源码与测试改动。
- `site build` 的阻断更像环境级进程启动问题，而不是本轮改动直接击穿 TypeScript 或测试基线。
  - 依据：`typecheck` 与 `26/26` 相关测试通过，而失败点停在 `esbuild` 子进程 `spawn EPERM`。

## 未知项

- `master...origin/master` 没显示 ahead / behind 数字；本轮没有 `git fetch`，无法确认远端是否有新提交。
- 本轮没有执行任何 Supabase 写入或读回，无法证明 `frontier_ecosystem_articles`、`interview_questions`、`news_items` 的远端状态与本地 seed 同步。
- 本轮没有运行完整 `pnpm news:test`、`pnpm notion:test` 或课程页面级手工检查，无法证明未覆盖区域完全无回归。
- `docs/career-guide.md` 新增题目虽然已落盘，但本轮没有做 Markdown 渲染级检查。
- `news-collector/deploy/ecosystem.runtime.config.cjs` 仍未纳入版本控制，本轮无法判断它是准备提交的正式部署入口还是临时本地文件。

## 风险

1. `23` 个 tracked diff 混合了前端逻辑、采集器逻辑、内容数据与生成产物。
   - 影响：如果直接提交，review 和回滚边界会很差。
2. 日报/同步文档继续未跟踪累积。
   - 影响：后续自动化状态审计会持续掺入旧噪声。
3. 构建证据仍缺最终闭环。
   - 影响：`typecheck + 26/26 tests` 不能替代 VitePress 整站可构建性。
4. 远端数据状态未读回。
   - 影响：本地 seed 和页面文档已经更新，不代表线上数据已同步。

## 下一步

1. 先按工作流拆提交边界。
   - 建议至少拆成：
   - `.vitepress/theme` 面试题日期展示修正
   - `news-collector` 稳态增强
   - `knowledge-graph + docs + supabase seeds` 内容刷新
2. 决定 `docs/solutions/*.md` 和 `news-collector/deploy/ecosystem.runtime.config.cjs` 的 Git 策略。
   - 要么纳管，要么忽略；继续悬空会持续制造噪声。
3. 在允许子进程启动的环境复跑整站构建。
   - 目标命令：`pnpm site:build` 或 `node node_modules\vitepress\bin\vitepress.js build`
4. 如果要把内容刷新视为完成，还需要补远端验证。
   - 至少要做 seed/推送后的 Supabase 读回，不要只看本地文件。

## Trace Appendix

```powershell
Get-Date -Format o
git -C C:\project\my\agent-build rev-parse --abbrev-ref HEAD
git -C C:\project\my\agent-build rev-parse HEAD
git -C C:\project\my\agent-build log -1 --date=iso --format="%H%n%ad%n%an%n%s"
git -C C:\project\my\agent-build log --since="24 hours ago" --date=iso --stat --decorate=short --pretty=format:"__COMMIT__%n%H%n%ad%n%an%n%s"
git -C C:\project\my\agent-build status --short --branch
git -C C:\project\my\agent-build diff --stat
git -C C:\project\my\agent-build diff --name-only
Get-ChildItem -Path C:\project\my\agent-build -Recurse -File | Where-Object { $_.LastWriteTime -ge (Get-Date).AddHours(-24) } | Sort-Object LastWriteTime -Descending | Select-Object -First 40 FullName, LastWriteTime
git -C C:\project\my\agent-build diff --unified=0 -- .vitepress/theme/interview-article-detail.ts .vitepress/theme/interview-clinic-data.ts .vitepress/theme/interview-article-detail.test.mts .vitepress/theme/interview-clinic-data.test.mts
git -C C:\project\my\agent-build diff --unified=0 -- news-collector/src/rss.ts news-collector/src/collect.ts news-collector/src/config.ts news-collector/src/sources.ts news-collector/src/types.ts news-collector/__tests__/rss.test.mts news-collector/__tests__/collect.test.mts news-collector/__tests__/config.test.mts news-collector/__tests__/sources.test.mts news-collector/README.md news-collector/deploy/ecosystem.runtime.config.cjs
git -C C:\project\my\agent-build diff --unified=0 -- docs/career-guide.md docs/knowledge-graph.md lessons/19-agent-ecosystem-and-frontier/README.md knowledge-graph/data/frontier-articles.ts knowledge-graph/data/graph.ts knowledge-graph/data/interview-questions.ts supabase/seed/frontier_ecosystem_articles.sql supabase/seed/interview_questions.sql knowledge-graph/output/index.html
Get-Content -Raw docs/scheduled.md
pnpm typecheck
node node_modules\tsx\dist\cli.mjs --test news-collector\__tests__\rss.test.mts news-collector\__tests__\collect.test.mts news-collector\__tests__\config.test.mts news-collector\__tests__\sources.test.mts
node node_modules\vitepress\bin\vitepress.js build
```
