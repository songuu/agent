---
title: GitHub Workflow 自动打包部署
date: 2026-07-02
status: completed
tasks_total: 4
tasks_completed: 4
risk_level: L2
tags: [sprint, deployment, github-actions]
invariants:
  - "保留旧 SSH/static 发布路径，不用 GitHub Actions 替换回滚链路"
  - "不把主机、私钥、service role key 或 .env 写入仓库"
  - "VitePress 生产 base 必须保持 /agent-build/"
invariant_tests:
  - "pnpm typecheck"
  - "pnpm site:build"
---

# GitHub Workflow 自动打包部署

## Phase 1: Think

### Scope

- 新增 GitHub Actions 工作流，实现 push `master` 后自动打包静态站并通过 SSH 发布；最终形状直接参考 AICrew 的 `.github/workflows/deploy-aicrew.yml`。
- 手动触发使用同一条 build-and-deploy 链路，保持和 AICrew 相同的直接发布模型。
- 发布过程采用 release-root + `current` symlink 原子切换，并保留 loopback + public HTTPS 验证。
- 文档化 required secrets / variables / 安全边界。

### Non-scope

- 不执行真实远端发布。
- 不改宿主机 Nginx、PM2、Docker Compose。
- 不提交本地 `scripts/deploy.ps1` 或 `docs/DEPLOYMENT.md`，它们仍是私有运行手册。

### Success

- `.github/workflows/agent-build-deploy.yml` 可完成 defaults、install、gates、写入 production env、`pnpm kg`、VitePress build、tar、scp、remote release 解包、`current` symlink 原子切换、loopback + public HTTPS verify。
- `deploy/MULTI_CLOUD_CONTAINER_DEPLOYMENT.md` 说明 GitHub Secrets/Variables。
- 本地验证通过：workflow 文件存在且 build 仍能产出 `/agent-build/assets`。

### Risks

| 风险 | 影响 | 缓解 |
|------|------|------|
| SSH secret 配错 | CI 发布失败 | workflow preflight 明确报缺失 SSH 私钥 |
| host key 首次记录依赖 ssh-keyscan | SSH 首次接入信任边界较弱 | 与 AICrew 保持一致；如需更强校验后续单独加固定 known_hosts |
| VitePress base 漂移 | 生产 assets 404 | build self-check grep `/agent-build/assets` |
| 自动发布破坏回滚 | 线上恢复困难 | release-root 保留最近 5 个版本；回滚可切回旧 `current` symlink；首跑会备份旧 `current` 目录 |

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| 部署 | 容器/CI 是新增层，旧 SSH/static 路径保留 | 只新增 GitHub Actions，不删除 `scripts/deploy.ps1`；CI 改用 release-root + `current` symlink |
| 密钥 | `.env` 和真实主机密钥不入库 | workflow 使用 GitHub Secrets，文档只列变量名 |
| 站点 | VitePress base 固定 `/agent-build/` | workflow env 默认 `/agent-build/`，并 grep build output |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| CI package | push `master` / manual dispatch | GitHub runner build + tar archive | runner temp archive | 是，进入部署链路 |
| CI deploy | single `build-and-deploy` job | scp + ssh release-root + symlink swap | 远端 release 目录 + `current` symlink | 是，loopback + public HTTPS 验证 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-10-course-website | 直接打包部署（含 GitHub Pages/CI 发布） | 本 sprint 收口为 GitHub Actions SSH 发布 | 2026-07-02 |
| 2026-06-24-multi-cloud-container-stack | 保留旧 static 回滚路径 | 继续保持，不自动切 Nginx/Compose | 2026-07-02 |

### Tasks

- [x] **Task 1**: 读取现有 deploy/package/build 路径，确认私有 deploy 脚本不入公开 CI — 风险 L1
- [x] **Task 2**: 新增 GitHub Actions package/deploy workflow — 风险 L2
- [x] **Task 3**: 更新部署文档，列出 secrets/variables/边界 — 风险 L1
- [x] **Task 4**: 执行本地验证并完成 review/compound — 风险 L2

## Phase 3: Work

- 新增 `.github/workflows/agent-build-deploy.yml`，初版为双 job/artifact；按用户纠正“直接参考 AICrew”后，改为 AICrew 同款单 job 直接部署链路；再按用户要求把 host 默认到 `47.253.230.197`、移除额外 known-hosts secret、静态发布改为 release-root + `current` symlink，并处理旧 `current` 目录首跑迁移。
- 更新 `deploy/MULTI_CLOUD_CONTAINER_DEPLOYMENT.md`，加入 GitHub Actions 自动打包部署章节。
- 新增本 sprint 文档。

## Phase 4: Review

### 5 + 1 视角

| 视角 | 结果 |
|------|------|
| 架构 | pass：CI 是新增发布入口，保留旧 static/容器路径；远端采用 release-root + symlink 模型 |
| 安全 | pass：workflow 仅引用 Secrets/Variables，不写真实密钥 |
| 性能 | pass：workflow 只上传 `.vitepress/dist` tarball，不上传 workspace；无额外 artifact job |
| 代码质量 | pass：远端 swap 用参数传递，避免拼接 web root 到 shell 源码 |
| 测试覆盖 | pass：保留 typecheck、图谱/视觉测试、site build、自检 grep |
| 集成连续性 | pass：承接 2026-06-10 deferred CI 发布议题，不改线上 Nginx/PM2/Compose；Nginx 仍读 `/opt/agent-build/current/.vitepress/dist` |

## Phase 5: Compound

- 经验 1：跨项目新增 GitHub Actions 发布能力时，先直接读可工作的同类项目 workflow；本轮以 AICrew 的单 job deploy workflow 为模板，再按 `agent-build` 静态站边界改造。
- 经验 2：GitHub Actions 静态部署也要保留“tar archive -> release-root -> current symlink swap -> loopback/public verify”四段证据，不只看 build green。
- 经验 3：若明确要求和 AICrew 保持一致，SSH host key 处理就使用同款 `ssh-keyscan`；更强的固定 known-hosts 校验应作为单独安全升级，不混入本轮对齐。

## Verification Results

- `pnpm typecheck` -> pass.
- `npx tsx knowledge-graph/data/visuals.test.mts` -> pass (`visuals.test.mts: ok`; npm emitted non-fatal `.npmrc` warning).
- `npx tsx knowledge-graph/generate.test.mts` -> pass (`generate.test.mts: ok`; npm emitted non-fatal `.npmrc` warning).
- `npx tsx .vitepress/theme/diagram-zoom.test.mts` -> pass (`diagram-zoom.test.mts: ok`; npm emitted non-fatal `.npmrc` warning).
- `npx tsx .vitepress/theme/reduced-motion.test.mts` -> pass (`reduced-motion.test.mts: ok`; npm emitted non-fatal `.npmrc` warning).
- `pnpm kg` -> pass；生成器同步到 `171` 篇关联文章，并刷新 `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`。
- `pnpm site:build` -> sandbox first run failed with `spawn EPERM`; rerun outside sandbox -> pass，build complete in 39.74s，只有 Rollup chunk size warning。
- `.vitepress/dist/index.html` grep `/agent-build/assets` -> pass。
- `git diff --check` -> pass；仅 Git CRLF warning，无 whitespace error。
- Workflow YAML parser status：local `actionlint` / `yq` / PyYAML 不可用；已做 targeted static checks for AICrew-style single-job shape, default host, removed extra known-hosts secret, release-root symlink swap, production env gate, base path check, and trailing whitespace.