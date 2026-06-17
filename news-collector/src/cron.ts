// 常驻守护进程入口：`pnpm news:cron`。
//
// 用 node-cron 按 NEWS_CRON / NEWS_TZ 周期触发收集；NEWS_RUN_AT_BOOT 控制启动时是否先跑一次。
// 部署见 news-collector/README.md（pm2 / systemd）。

import cron from "node-cron";
import { collectFromConfig } from "./collect.ts";
import { loadConfig, type RunConfig } from "./config.ts";
import { formatReport } from "./report.ts";

function log(message: string): void {
  process.stdout.write(`${new Date().toISOString()} ${message}\n`);
}

function logError(message: string): void {
  process.stderr.write(`${new Date().toISOString()} ${message}\n`);
}

async function runOnce(config: RunConfig): Promise<void> {
  try {
    const report = await collectFromConfig(config);
    log(formatReport(report));
  } catch (error: unknown) {
    logError(
      `[news-collector] run failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function main(): void {
  const config = loadConfig();

  if (!cron.validate(config.cron)) {
    throw new Error(`Invalid NEWS_CRON expression: "${config.cron}"`);
  }

  log(
    `[news-collector] daemon up. cron="${config.cron}" tz=${config.timezone} ` +
      `dryRun=${config.dryRun} enrichMax=${config.enrichMax}`,
  );

  const task = cron.schedule(
    config.cron,
    () => {
      void runOnce(config);
    },
    // noOverlap: 上一次收集未结束时跳过本次触发，防止慢 feed 导致任务堆叠。
    { timezone: config.timezone, name: "news-collector", noOverlap: true },
  );

  if (config.runAtBoot) {
    void runOnce(config);
  }

  const shutdown = (signal: string): void => {
    log(`[news-collector] received ${signal}, stopping.`);
    task.stop();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
