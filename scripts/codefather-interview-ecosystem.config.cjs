// PM2 config for daily Codefather interview sync.
// Start from repo root:
//   mkdir -p /var/log/agent-build
//   pm2 start scripts/codefather-interview-ecosystem.config.cjs
//   pm2 save

const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const logDir = process.env.CODEFATHER_INTERVIEW_LOG_DIR || "/var/log/agent-build";

module.exports = {
  apps: [
    {
      name: "codefather-interview-sync",
      script: "node",
      args: "--env-file=.env scripts/codefather-interview-cron.ts",
      cwd: repoRoot,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      time: true,
      out_file: path.join(logDir, "codefather-interview-sync.out.log"),
      error_file: path.join(logDir, "codefather-interview-sync.error.log"),
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        CODEFATHER_INTERVIEW_CRON: "15 8 * * *",
        CODEFATHER_INTERVIEW_TZ: "Asia/Shanghai",
        CODEFATHER_INTERVIEW_LIMIT: "500",
        CODEFATHER_INTERVIEW_PAGE_SIZE: "20",
        CODEFATHER_INTERVIEW_RUN_AT_BOOT: "0",
      },
    },
  ],
};