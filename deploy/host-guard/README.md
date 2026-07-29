# 生产主机自动恢复守卫

pm2-root 在启动时只会恢复保存的 PM2 dump；它不会验证 dump 指向的运行目录是否仍存在。这个守卫在开机 45 秒后、以及每 5 分钟执行一次：

- 确认 nginx 与 pm2-root 已启动；
- 确认预期 PM2 进程在线；
- 通过 runner、Content API、AICrew、Deploy Management 的本机端点确认进程没有“online 但不可用”；
- 探测失败时重启对应 PM2 进程，并在仍不可用时让 systemd service 失败，以便从 journalctl -u agent-build-stack-guard 追踪。

DM Tekton bridge 当前是有意停止的，不纳入守卫。

## 安装或更新

在仓库根执行：

    pwsh scripts/deploy-host-stack-guard.ps1

部署脚本只上传 deploy/host-guard/ 的四个资产到临时目录，再由远端 install.sh 安装到 /opt/agent-build/host-guard 和 /etc/systemd/system。它不依赖 /opt/agent-build/current，因为该目录可能只是静态站输出。

## 验证

    systemctl status agent-build-stack-guard.timer
    systemctl start agent-build-stack-guard.service
    journalctl -u agent-build-stack-guard -n 100 --no-pager

每次迁移 PM2 runtime 后仍须执行 pm2 save；守卫能发现并报告已删除的运行目录，不能凭空重建未交付的运行包。
