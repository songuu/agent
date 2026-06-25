---
title: "科技 RSS 源扩展与 Supabase 验证"
type: sprint
status: completed
created: "2026-06-25"
updated: "2026-06-25"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, news-collector, rss, supabase]
goal: "结合给定文章和更多 RSS 源扩展科技相关新闻订阅，完成抓取并写入 Supabase，最后通过 Supabase 正常读取数据验证闭环。"
goal_max_iter: 3
goal_until: ""
goal_iteration: 0
goal_status: completed
invariants:
  - "news_items 是资讯流真实 Supabase sink，不能用本地文件成功替代远端写入成功"
  - "单源失败只 skip+log，不影响其它源抓取与写库"
  - "service_role 只走 .env，不写入 tracked 文件"
invariant_tests:
  - "node node_modules/tsx/dist/cli.mjs --test news-collector/__tests__/sources.test.mts news-collector/__tests__/rss.test.mts news-collector/__tests__/collect.test.mts"
---

# Phase 1: Think

## Scope

- 从给定 RSS 清单中筛选科技/AI/开发者相关源，优先直接 RSS/Atom，谨慎加入 RSSHub 依赖。
- 扩展 `news-collector/src/sources.ts`，让新源默认参与 `enabledSources()`。
- 用真实 `pnpm news:collect` 写入 Supabase。
- 用 PostgREST 从 `news_items` 读回新增来源数据。

## Non-scope

- 不改 Supabase schema。
- 不重写采集、分类、去重、入库管道。
- 不处理无公开 RSS 的站点适配器。

## Success

- 新增科技相关 RSS 源进入启用列表。
- 离线源注册测试通过。
- 真实抓取有数据。
- Supabase `news_items` 写入成功。
- Supabase 可按新增 source_key 读回数据。

## Risks

- 个别 feed 可能因 TLS、反爬、RSSHub 不稳定失败；依赖单源故障隔离。
- 当前工作树已有无关改动；本 sprint 只触碰 news collector 相关文件。

# Phase 2: Plan

## 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| news-collector | `news_items` 是真实远端 sink | 最终用 Supabase write + readback 判断完成 |
| RSS 抓取 | 单源失败隔离 | 不改变 `rss.ts`，只扩展 source registry |
| 密钥 | service_role 不进 tracked 文件 | 所有真实写库只通过 `.env` 加载 |

## 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 新 RSS 源 | `pnpm news:collect` | `sources -> rss -> normalize -> dedupe -> store` | `news_items` upsert | 页面/读库按 `source_key` 可见 |

## 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-17 news collector | 来源覆盖持续扩展 | 本 sprint 增加科技直订源并验证写读闭环 | 2026-06-25 |

## Tasks

- [x] Task 1: 扩展科技/AI RSS 源注册表。
- [x] Task 2: 补充源注册测试与 README 来源表。
- [x] Task 3: 跑离线测试。
- [x] Task 4: 真实抓取、Supabase 写入、Supabase 读回验证。

# Phase 3: Work

## 变更

- `news-collector/src/sources.ts` 新增并启用 7 个科技/AI/开发者直订 RSS/Atom 源：
  - `ithome`
  - `sspai`
  - `arxiv-cs-lg`
  - `hn-frontpage`
  - `linuxdo-latest`
  - `github-engineering`
  - `github-changelog`
- `news-collector/__tests__/sources.test.mts` 锁定新增源必须 enabled。
- `news-collector/README.md` 同步来源清单。

## 验证

- `node node_modules\tsx\dist\cli.mjs --test news-collector\__tests__\sources.test.mts news-collector\__tests__\rss.test.mts news-collector\__tests__\collect.test.mts` -> pass, 13/13。
- `pnpm news:test` -> sandbox 中 `spawn EPERM`；非 sandbox 重跑 pass, 56/56。
- `pnpm news:collect` -> pass, `sources=35/35 ok`, `fetched=580`, `dedupe=579`, `stored=579`, `table=0-0/1262`。
- Supabase PostgREST 新增源读回 -> status 200, `content-range=0-145/146`。
- Supabase PostgREST 全表 count -> status 206, `content-range=0-0/1262`。

## 关键证据

新增源读回计数：

| source_key | readable rows |
|------------|---------------|
| ithome | 30 |
| sspai | 10 |
| arxiv-cs-lg | 30 |
| hn-frontpage | 20 |
| linuxdo-latest | 36 |
| github-engineering | 10 |
| github-changelog | 10 |

# Phase 4: Review

## 结果

- P0: 无。
- P1: 无。
- 集成连续性：新增源走现有 `sources -> rss -> normalize -> dedupe -> store` 路径；无新 dead code；Supabase 写入与读回均已验证。
- 风险备注：`v2ex-hot` 候选源在真实抓取中返回不可解析 XML，未保留为启用源；改用已探测可解析的 GitHub 官方 RSS。

# Phase 5: Compound

## 复利记录

- 经验：新增 RSS 源前先用现有 `fetchFeed` 探测，失败源不进入 enabled，避免 cron 每日噪音。
- 经验：Supabase 成功边界必须分层报告：抓取成功、stored 数、PostgREST 读回、全表 count 分别列证据。

Goal loop: iter 0/3, until=n/a, goal-met=yes, decision=stop:met
## 2026-06-25 严格源可用性修正

用户补充要求：订阅源必须能被当前 `fetchFeed` 正确解析并获取数据，剔除不能使用的源头。

调整：

- 剔除 `v2ex-hot`：真实抓取返回 `Unable to parse XML`。
- 剔除 `anthropic`：无已验证公开 RSS，原先只是 disabled 占位。
- 剔除 `aibase-news`：当前真实抓取 `fetch failed`，且不是 RSS/Atom，而是 HTML adapter。
- 保留 34 个启用源；测试新增约束：`enabledSources().map(key) === SOURCES.map(key)`，注册表不再保留 disabled 占位订阅源。

验证：

- `node node_modules\tsx\dist\cli.mjs --test news-collector\__tests__\sources.test.mts news-collector\__tests__\rss.test.mts news-collector\__tests__\collect.test.mts` -> pass, 13/13。
- `pnpm news:test` -> pass, 56/56。
- `pnpm news:collect` -> pass, `sources=34/34 ok`, `fetched=560`, `dedupe=559`, `stored=559`, `table=0-0/1282`。
- Supabase 当前批次读回 -> status 200, `content-range=0-558/559`, `sourceCount=34`。