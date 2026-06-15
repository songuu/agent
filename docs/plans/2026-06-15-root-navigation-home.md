---
title: "根路径导航首页"
type: sprint
status: completed
created: "2026-06-15"
updated: "2026-06-15"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, nginx, deployment, navigation]
aliases: ["songuu.top 根路径导航"]
invariants:
  - "/agent-build/ must keep serving the agent-build VitePress site"
  - "/pipeline/ must keep serving the pipeline app"
  - "/ must not proxy to pipeline by default"
invariant_tests:
  - "curl.exe -I https://songuu.top/"
  - "curl.exe -I https://songuu.top/agent-build/"
  - "curl.exe -I https://songuu.top/pipeline/"
deferred: []
deadcode_until: []
---

# 根路径导航首页

## Phase 1: Think

Scope:
- 把 `https://songuu.top/` 从空响应改成一个定制导航页。
- 页面只放两个明确入口：`/pipeline/` 和 `/agent-build/`。
- 保持 `/pipeline/` 与 `/agent-build/` 现有服务逻辑不变。

Non-scope:
- 不改 pipeline 应用代码。
- 不改 agent-build 静态站构建产物。
- 不新增公网 API。

Success:
- `/` 返回 `200 text/html`，视觉上是现代、华丽、导航性质明显的入口页。
- `/pipeline/` 仍按原鉴权逻辑进入 pipeline。
- `/agent-build/` 仍返回 agent-build 站点。

Risks:
- nginx 根路径配置若写错，会影响主域访问。
- 首页若依赖外部资源，会引入额外失败点；因此采用单文件内联 CSS。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| nginx root routing | `/` 不再默认进入 pipeline | 改为静态导航页 |
| agent-build | `/agent-build/` 继续 alias 静态站 | 不改该 location |
| pipeline | `/pipeline/` 继续 proxy 到 3000 | 不改代理目标，仅验证 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 根路径首页 | 访问 `/` | nginx exact location | server file | 是 |
| pipeline 入口 | 点击导航 | `/pipeline/` proxy | pipeline app | 由 pipeline 决定 |
| agent-build 入口 | 点击导航 | `/agent-build/` alias | static dist | 是 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-15 nginx routing | `/` 空响应不够友好 | 本 sprint 解决 | 2026-06-15 |

Tasks:
- [x] T1 制作单文件首页 HTML。
- [x] T2 配置 nginx `location = /` 指向首页。
- [x] T3 `nginx -t` + reload。
- [x] T4 验证 `/`、`/pipeline/`、`/agent-build/`。

## Phase 3: Work

- 新增服务器文件：`/opt/songuu-home/index.html`。
- 修改 nginx：`location = /` 从 `return 204` 改为读取 `/opt/songuu-home/index.html`。
- 保持 `/agent-build/`、`/pipeline/`、`/pipeline` 规则不变。
- 远端备份：`/etc/nginx/conf.d/default.conf.bak.20260615165926`。

## Phase 4: Review

Findings:
- P0: 无。
- P1: 无。

Checks:
- `nginx -t`：pass。
- `nginx -s reload`：pass。
- `curl.exe -I https://songuu.top/`：`200 OK`，`Content-Type: text/html`。
- `curl.exe -I https://songuu.top/agent-build/`：`200 OK`。
- `curl.exe -I https://songuu.top/pipeline`：`301` 到 `/pipeline/`。
- `curl.exe -I https://songuu.top/pipeline/`：`302` 到 `/login`，符合原 pipeline 鉴权逻辑。
- 服务器回源 HTML grep：确认 `Pipeline`、`Agent Build`、`/pipeline/`、`/agent-build/` 存在。

## Phase 5: Compound

经验:
- 主域根路径适合做独立静态 gateway，不应继续复用业务应用默认路由。
- 单文件 HTML + exact location 可降低资产路径和发布耦合风险。

状态:
- sprint completed。
