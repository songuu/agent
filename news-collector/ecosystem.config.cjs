// pm2 进程配置——把收集器作为常驻服务跑在阿里云主机上。
//
// 用法（在仓库根执行）：
//   pm2 start news-collector/ecosystem.config.cjs
//   pm2 logs news-collector
//   pm2 save && pm2 startup     # 开机自启
//
// 前置：仓库根已有 .env（含 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY），且 .env 已被 .gitignore。

const path = require("node:path");

// 仓库根 = 本文件所在目录的上一级。
const repoRoot = path.join(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "news-collector",
      // 用 tsx 直接跑 TS，无需预编译。
      script: "node_modules/tsx/dist/cli.mjs",
      args: "--env-file=.env news-collector/src/cron.ts",
      cwd: repoRoot,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
