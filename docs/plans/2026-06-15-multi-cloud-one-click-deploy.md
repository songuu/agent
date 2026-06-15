---
title: "多云一键部署脚本"
type: sprint
status: completed
created: "2026-06-15"
updated: "2026-06-15"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, deployment, multi-cloud, powershell]
aliases: ["一键部署", "多云部署"]
invariants:
  - "生产静态站 base 必须保持 /agent-build/，避免线上 assets 404。"
  - "部署脚本必须先走本地门禁，再构建、上传、远端原子换入、线上验证。"
  - "生产服务器地址和路径只放 gitignored 私有脚本/runbook，不进入公开站点。"
invariant_tests:
  - "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\deploy.ps1 -DryRun -Provider aliyun"
  - "pnpm typecheck"
  - "pnpm run site:build"
deferred: []
deadcode_until: []
---

# Phase 1: Think

## 需求分析

用户要在当前项目继续优化部署能力：现在生产部署在阿里云，后续可能迁移或复制到火山云、腾讯云，需要提供一个完整的一键部署脚本。

## Scope

- 保留当前阿里云生产默认路径和行为。
- 新增云厂商 profile：`aliyun`、`volcengine`、`tencent`、`custom`。
- 支持命令行参数覆盖：SSH 主机、远端 web root、域名、base path、验证协议、验证路径。
- 支持 `DryRun`，避免迁移前误上传/误换入。
- 保持原有发布安全策略：门禁、构建、base 自检、tar/scp、远端备份、原子换入、线上验证。
- 同步私有 runbook。

## Non-scope

- 不自动创建云服务器、EIP、安全组、DNS、SSL 证书。
- 不引入云厂商 AK/SK 或 SDK。
- 不部署 demo runner 后端，只保留后端迁移说明。

## Success

- `pwsh scripts/deploy.ps1` 仍可部署当前阿里云生产。
- `-Provider volcengine` / `-Provider tencent` 可通过 `-DeployHost` 或环境变量切换目标。
- dry-run 覆盖四类 provider。
- 项目门禁和生产 base 构建通过。

# Phase 2: Plan

## 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| VitePress 生产站 | base 必须是 `/agent-build/` | 脚本统一 `Normalize-BasePath` 并构建后检查 `/agent-build/assets` |
| 私有部署资料 | `docs/DEPLOYMENT.md`、`scripts/deploy.ps1` 不提交公开仓库 | 继续使用已 gitignore 的私有文件 |
| 发布安全 | 门禁、构建、自检、上传、备份、验证 | 新脚本沿用同一顺序，并新增 provider profile |

## 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 阿里云发布 | `pwsh scripts/deploy.ps1` | 本地构建 → scp → ssh swap | 远端 web root | 线上 URL 200 |
| 火山云发布 | `pwsh scripts/deploy.ps1 -Provider volcengine -DeployHost root@ip` | 同一部署链路 | 对应云主机 web root | 绑定域名/base 可见 |
| 腾讯云发布 | `pwsh scripts/deploy.ps1 -Provider tencent -DeployHost root@ip` | 同一部署链路 | 对应云主机 web root | 绑定域名/base 可见 |

## 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 生产部署 runbook | 部署脚本只支持阿里云硬编码 | 本 sprint 收口为 provider profile | 2026-06-15 |

## 任务拆解

- [x] Task 1：审计现有 `scripts/deploy.ps1` 和 `docs/DEPLOYMENT.md`。
- [x] Task 2：把部署脚本抽象成 provider profile + 参数覆盖。
- [x] Task 3：补 `DryRun`、多云环境变量、base/path/domain 规范化。
- [x] Task 4：更新私有部署 runbook。
- [x] Task 5：执行 dry-run、门禁、生产构建验证。

# Phase 3: Work

## 变更日志

- 重写 `scripts/deploy.ps1`：
  - provider：`aliyun`、`volcengine`、`tencent`、`custom`
  - 参数：`-DeployHost`、`-WebRoot`、`-Domain`、`-BasePath`、`-VerifyScheme`、`-VerifyPaths`
  - 安全开关：`-DryRun`、`-SkipTests`、`-SkipBuild`、`-SkipVerify`、`-KeepArchive`
  - 构建：自动设置 `VITEPRESS_BASE`、`DEMO_RUNNER_CLIENT_ENABLED`、`DEMO_RUNNER_BASE_URL`
  - 远端：stage 解包、旧 dist 备份、原子换入、输出 `ROLLBACK_BACKUP`
- 更新 `docs/DEPLOYMENT.md`：
  - 当前阿里云默认部署
  - 火山云/腾讯云环境变量和命令示例
  - 新云主机 Nginx 前置条件
  - 回滚和排错说明

# Phase 4: Review

## 审查结果

P0：无。

P1：无。

P2：

- `scripts/deploy.ps1` 是 gitignored 私有脚本，适合存生产 host；若未来要公开模板，可另建不含 host 的 `scripts/deploy.example.ps1`。
- 脚本只发布到已有 Linux/Nginx 主机，不负责云资源创建；这是有意边界，避免 AK/SK 进入仓库。

## 第 6 视角 - 集成连续性

- 未破坏 `/agent-build/` base 不变量。
- 未引入公开页面泄漏；`docs/DEPLOYMENT.md` 仍在 `.vitepress/config.mts srcExclude` 和 `.gitignore` 内。
- 多云 provider 共享同一部署链路，避免三套脚本漂移。

# Phase 5: Compound

## 复利记录

- 部署脚本应以「云厂商 profile + SSH 目标」抽象 VM 发布，不要过早接云 SDK。
- 私有 runbook 可承载真实生产 host；公开仓库只保留无敏感的说明或模板。
- Windows/PowerShell 脚本最好保持 ASCII 运行时文本，避免 Windows PowerShell 5 读取 UTF-8 无 BOM 时乱码解析。

## 验证

```text
powershell -NoProfile -ExecutionPolicy Bypass -Command '<parse deploy.ps1>' -> pass
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\deploy.ps1 -DryRun -Provider aliyun -> pass
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\deploy.ps1 -DryRun -Provider volcengine -DeployHost root@1.2.3.4 -Domain example.com -> pass
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\deploy.ps1 -DryRun -Provider tencent -DeployHost root@5.6.7.8 -Domain example.com -> pass
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\deploy.ps1 -DryRun -Provider custom -DeployHost root@example.com -WebRoot /var/www/agent-build -Domain example.com -BasePath agent-build -> pass
pnpm typecheck -> pass
npx tsx knowledge-graph/data/visuals.test.mts -> pass
npx tsx knowledge-graph/generate.test.mts -> pass
npx tsx .vitepress/theme/diagram-zoom.test.mts -> pass
npx tsx .vitepress/theme/reduced-motion.test.mts -> pass
pnpm run site:build -> pass outside sandbox; sandbox failed with esbuild spawn EPERM
dist index base check /agent-build/assets -> pass
```

🧠 会话收尾：
  ✅ 已 compound：3 条经验 + 0 个本能 + 0 个 skill 信号
⚠️ 建议 /compact — 完整功能任务已完成，且本轮包含多次工具验证与文档更新。
