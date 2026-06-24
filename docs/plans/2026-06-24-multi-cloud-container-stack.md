---
title: 多云容器化部署栈
date: 2026-06-24
status: completed
tasks_total: 6
tasks_completed: 6
risk_level: L3
---

# 多云容器化部署栈

## 需求分析

用户要求在现有多云部署脚本基础上，按容器化方向继续新增，并考虑当前云上四个项目的整体迁移。核心目标：多云随意迁移时，不再依赖每台云主机手工 Node/PM2/Nginx 运行环境；用 Docker/Compose 固定运行边界，宿主机只保留 TLS、鉴权、路由转发。

## 技术方案

### 方案概述

采用“容器层新增，不替换原 SSH 发布”的渐进方案。`agent-build` 是第一条落地链路：静态站镜像和 Node runtime 镜像分离；Compose 编排 site、runner、news/notion jobs；一键脚本支持镜像仓库或无仓库 SSH 镜像传输。

四项目不在一个仓库内，不能在本仓库伪造其它项目 Dockerfile。因此本轮把四项目做成 inventory + Nginx 切换示例 + 迁移顺序，`agent-build` 完成可执行容器部署，其余项目标记为 external-repo-required。

### 任务拆解

- [x] **Task 1**: 只读盘点当前云上 Nginx/PM2/Docker/目录 — 风险: L1
- [x] **Task 2**: 新增 `agent-build` 多阶段 `Dockerfile` 和 `.dockerignore` — 风险: L2
- [x] **Task 3**: 新增 Compose、容器内 Nginx、宿主机 Nginx 示例 — 风险: L2
- [x] **Task 4**: 新增 `scripts/deploy-container.ps1` 一键容器部署 — 风险: L3
- [x] **Task 5**: 新增四项目 inventory 和内部运维文档 — 风险: L2
- [x] **Task 6**: 更新架构规则、VitePress 排除内部 ops 文档、执行验证 — 风险: L2

### 测试策略

- 解析测试：PowerShell scriptblock parse。
- Dry-run：`scripts/deploy-container.ps1 -DryRun -SkipTests -SkipBuild`。
- Compose 静态校验：`docker compose config`，若本机 Docker/Compose 可用。
- 项目门禁：`pnpm typecheck`、视觉/图谱测试、`news:test`、`notion:test`。
- 构建验证：`pnpm run site:build`，确认 `/agent-build/` base。

### 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 容器内 Nginx base 与 VitePress base 不一致 | 中 | assets 404 | build arg + Compose env 统一 `/agent-build/` |
| 运行时 secrets 泄漏 | 中 | 安全事故 | `.dockerignore` 排除 `.env`，脚本只在部署时可选上传 |
| 四项目一次性切换失败 | 高 | 全站中断 | 路由级分批切，保留 PM2/static 回滚 |
| 无镜像仓库阻塞迁移 | 中 | 跨云发布不顺 | 脚本支持 `docker save + scp + docker load` |
| deploy-management bridge 当前 stopped | 中 | 误判服务状态 | inventory 标记 stopped，不纳入首批启动 |

### 涉及文件

- `.dockerignore`
- `Dockerfile`
- `deploy/compose/agent-build.compose.yml`
- `deploy/compose/agent-build.env.example`
- `deploy/cloud-projects.json`
- `deploy/nginx/agent-build.conf.template`
- `deploy/nginx/songuu-host.container.conf.example`
- `scripts/deploy-container.ps1`
- `deploy/MULTI_CLOUD_CONTAINER_DEPLOYMENT.md`
- `docs/plans/2026-06-24-multi-cloud-container-stack.md`
- `.codex/rules/architecture.md`
- `.vitepress/config.mts`

## Work Log

- 线上只读盘点确认：Nginx 暴露 `/`、`/agent-build/`、`/aicrew/`、`/pipeline/` 等入口；PM2 有 `agent-build-runner`、`news-collector`、`aicrew-studio`、`dm-web`、`dm-api`、`dm-tekton-bridge`（stopped）；Docker 仅有既存 `searxng`。
- 新增 `agent-build` 容器路径：`site` 镜像托管静态站，`app-runtime` 镜像运行 runner/news/notion。
- 新增一键脚本，支持阿里云/火山云/腾讯云/custom provider，支持 registry 和 SSH image transfer 两种模式。
- 新增内部运维文档，明确四项目迁移顺序和回滚边界。

## Review

第 6 视角补充：

- 安全：真实 IP、cookie hash、JWT、service role key 不进入新增公开文件。
- 运维：脚本不自动改 Nginx，避免直接切断现网。
- 架构：容器是迁移层，宿主机 Nginx 继续负责 TLS/鉴权/路由。
- 测试：脚本内门禁覆盖 site + worker；本轮本地执行结果记录在最终答复。
- 可回滚：保留旧 `scripts/deploy.ps1` 和 PM2/static 路径。
- 范围：其它三个项目需要在对应仓库补 Dockerfile，本仓库只记录 inventory 和切换契约。

## Compound

- 经验 1：多云迁移的切割单位应是“公网路由 + 运行进程 + 端口 + 数据/密钥边界”，不是单纯按仓库名。
- 经验 2：静态站可继续 SSH 发布，但只要同一域名下挂多个 Node 服务，容器化应作为主迁移层。
- 经验 3：容器化切换不要让脚本直接改 Nginx；先启动 loopback 端口，验证后人工/独立脚本切路由，保留 PM2 回滚。

🧠 会话收尾：
  ✅ 已 compound：3 条经验 + 0 个本能 + 0 个 skill 信号
⚠️ 建议 /compact — 完整功能任务完成，且包含远程盘点、部署脚本、容器配置与文档更新。

## Verification Results

- `powershell -NoProfile -ExecutionPolicy Bypass -Command [scriptblock]::Create(...)` → pass (`scripts/deploy-container.ps1` parse ok).
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\deploy-container.ps1 -DryRun -SkipTests -SkipBuild -Provider aliyun` → pass.
- `docker compose -f deploy\compose\agent-build.compose.yml --env-file deploy\compose\agent-build.env.example config` → pass.
- `docker compose -f deploy\compose\agent-build.compose.yml --env-file deploy\compose\agent-build.env.example --profile jobs --profile notion config` → pass.
- `deploy\cloud-projects.json | ConvertFrom-Json` → pass.
- `pnpm typecheck` → pass.
- `npx tsx knowledge-graph/data/visuals.test.mts` → pass.
- `npx tsx knowledge-graph/generate.test.mts` → pass.
- `npx tsx .vitepress/theme/diagram-zoom.test.mts` → pass.
- `npx tsx .vitepress/theme/reduced-motion.test.mts` → pass.
- `pnpm news:test` → sandbox `spawn EPERM`; rerun outside sandbox → pass, 43 tests.
- `pnpm notion:test` → sandbox `spawn EPERM`; rerun outside sandbox → pass, 57 tests.
- `pnpm run site:build` with `VITEPRESS_BASE=/agent-build/` and demo runner client env → pass; `.vitepress/dist/index.html` contains `/agent-build/assets`.
- `docker build --check --target site .` → not completed because Docker Desktop Linux engine is not running (`dockerDesktopLinuxEngine` pipe missing). Compose config still validates YAML shape without daemon.
