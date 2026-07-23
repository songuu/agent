// Linux 独立运行目录的 PM2 配置。
//
// 适用场景：站点静态 release 不携带 worker 源码时，collector 使用独立 runtime 目录运行。
// Node 24 原生 type stripping 避免把 tsx 作为常驻 worker 的运行时依赖。

const path = require("node:path");

const runtimeRoot = path.join(__dirname, "..", "..");

module.exports = {
  apps: [
    {
      name: "news-collector",
      script: "news-collector/src/cron.ts",
      cwd: runtimeRoot,
      interpreter: "/usr/bin/node",
      interpreter_args: "--experimental-transform-types --env-file=.env",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      time: true,
      env: {
        NODE_ENV: "production",
        // 正文站点不属于来源采集 SLA，避免其反爬/慢响应阻塞每日入库。
        NEWS_ARTICLE_CONTENT_ENABLED: "false",
        NEWS_FEED_CONCURRENCY: "4",
      },
    },
  ],
};
