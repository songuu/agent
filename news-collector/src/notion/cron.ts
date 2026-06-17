// 常驻守护进程入口：`pnpm notion:cron`（独立于 news collector 的第二个 cron）。
//
// 用 node-cron 按 NOTION_CRON / NOTION_TZ 周期触发同步；NOTION_RUN_AT_BOOT 控制启动时是否先跑一次。
// 与 news-collector 分属独立 daemon：部署单元解耦，pm2/systemd 可单独重启而互不影响。

import cron from "node-cron";
import { loadNotionConfig, type NotionRunConfig } from "./config.ts";
import { formatSyncReport } from "./report.ts";
import { syncFromConfig } from "./sync.ts";

function log(message: string): void {
  process.stdout.write(`${new Date().toISOString()} ${message}\n`);
}

function logError(message: string): void {
  process.stderr.write(`${new Date().toISOString()} ${message}\n`);
}

async function runOnce(config: NotionRunConfig): Promise<void> {
  try {
    const report = await syncFromConfig(config);
    log(formatSyncReport(report));
  } catch (error: unknown) {
    logError(
      `[notion-sync] run failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function main(): void {
  const config = loadNotionConfig();

  if (!cron.validate(config.cron)) {
    throw new Error(`Invalid NOTION_CRON expression: "${config.cron}"`);
  }

  log(
    `[notion-sync] daemon up. cron="${config.cron}" tz=${config.timezone} ` +
      `dryRun=${config.dryRun} sources=${config.sources.length} bucket=${config.storageBucket}`,
  );

  const task = cron.schedule(
    config.cron,
    () => {
      void runOnce(config);
    },
    // noOverlap：分页+限流的同步可能超过一个 tick，上次未结束则跳过本次，防任务堆叠。
    { timezone: config.timezone, name: "notion-sync", noOverlap: true },
  );

  if (config.runAtBoot) {
    void runOnce(config);
  }

  const shutdown = (signal: string): void => {
    log(`[notion-sync] received ${signal}, stopping.`);
    task.stop();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
