---
title: "共享工作目录下并行会话把未提交密钥推进公开仓库的止血"
date: 2026-06-16
tags: [solution, security, git, secret-leak, parallel-session, supabase]
related_instincts: [secret-never-in-tracked-file, supabase-selfhosted-sync]
aliases: ["密码进了公开仓库怎么办", "git 历史移除密钥 force-push", "并行会话 auto-commit 泄漏", "rotate before rewrite"]
---

# 共享工作目录下并行会话把未提交密钥推进公开仓库的止血

## Problem
一个真实生产 DB 密码被写进了 sprint 计划文档（`docs/plans/*.md` 的债务清单行）。该文档是 tracked 文件。一个**与本会话共用同一工作目录**的并行 Agent 会话执行了 `git add` + `commit` + `push`，把我尚未脱敏的工作区内容（含密码）一起卷进 commit 并推到**公开 GitHub 仓库**——发生在我 grep 自查、准备脱敏之前。

## Root Cause
两层叠加：
1. **把活密钥写进了可提交文件**：密钥只该进 `.env`，绝不进源码/文档/计划。哪怕是规划文档里随手写一句"轮换弱密码 `<值>`"，也是泄漏。
2. **共享工作目录 + 并行会话 auto-commit-AND-push**：当第二个 agent 与你共用 workdir，你工作区里任何**未提交**内容随时可能被它 `git add -A` 提交并推送。"push 是人工 gate"这个前提在多 agent 共享目录下**不成立**——push gate 只约束你自己这条会话。

## Solution
**补救顺序：先轮换，再重写历史。** 公开暴露不可逆，force-push 删不掉 GitHub 缓存/fork/clone 副本，所以让泄漏值失效（rotation）才是真正止血，历史重写是次要清理。

1. **立即轮换被暴露的凭据**（最高优先）。自托管 Supabase 用仍可用的直连通道改：
   - 脚本内 `crypto.randomBytes(24).toString("base64url")` 生成新强密码（URL-safe、无引号/@/: → 连接串和单引号 SQL 都安全）。
   - `alter user postgres with password '<new>'`，新值**只写进 `.env` 的 `SUPABASE_DB_URL`**，stdout/stderr **绝不回显**。
   - 实测旧密码已被拒（`password authentication failed`）= 失效确认。
2. **脱敏工作区**（把文档里的密钥换成抽象描述，如"弱 DB 密码（值仅存 .env）"）。
3. **重写历史**（本环境 interactive rebase 不可用，用确定性的 soft-reset-recommit）：
   ```bash
   git reset --soft <last-clean-commit>          # 退到泄漏前的干净提交，改动全部留在 index/工作区
   git commit -- <paths...>                       # 用脱敏后的工作区重新提交（可拆多个）
   git push --force-with-lease origin master       # lease 校验远端仍是旧 tip，防误覆盖并行会话
   ```
4. **核验**：`git ls-remote origin -h refs/heads/master` 看真实远端 tip 干净；`git ls-remote origin | grep -c <old-sha>` = 0（旧提交无 ref 指向 = 不可达）；`git log -S '<secret>' --oneline` 为空。

## Prevention
- **密钥永不进 tracked 文件**——源码、文档、计划文档一律不行；只进 `.env`（先 `git check-ignore .env` 确认被忽略）+ `--env-file` 注入。记录凭据相关任务时只写**抽象指代**，绝不写值（写值=再次泄漏到可提交文件，正是本次的错）。
- **共享工作目录 + 并行 agent 会话**：假设任何未提交文件随时会被另一会话 commit+push。补救期间**必须先暂停并行会话**——本次它在我重写后又把旧密码提交 merge 回我的干净 tip（出现 `.git/MERGE_HEAD` + 冲突标记 + 密码复现），只能 `git merge --abort` 回到干净 tip 再推。不暂停它，止血会被反复撤销。
- **rotation > 历史重写**：公开暴露一律视泄漏值为永久 compromised，先轮换。
- 副作用提醒：裸 `alter user postgres` 会让自托管 Supabase Studio 失配（"too many authentication failures"），数据面 PostgREST（独立 `authenticator` 角色）不受影响——见 [[supabase-selfhosted-sync]]。

## Related
- [[supabase-selfhosted-sync]] — 自托管 Supabase 同步 + 密码轮换副作用
- [[kg-data-driven-doc-generation]] — 本次承载泄漏的 sprint 来自数据驱动文章扩充
- 会话 2026-06-16（前沿文章扩充 → 同步 supabase → 安全事件止血）
