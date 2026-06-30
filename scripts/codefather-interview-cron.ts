// Daily Codefather interview sync daemon.
// PM2 owns the process in production; node-cron owns the daily schedule.

import cron from "node-cron";
import {
  formatCodefatherSyncFailure,
  formatCodefatherSyncReport,
  runCodefatherInterviewSync,
} from "./sync-codefather-interview-to-supabase.ts";

const DEFAULT_CRON = "15 8 * * *";
const DEFAULT_TIMEZONE = "Asia/Shanghai";
const DEFAULT_LIMIT = 500;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_TAG = "面试题";

let running = false;

function log(message: string): void {
  process.stdout.write(`${new Date().toISOString()} ${message}\n`);
}

function logError(message: string): void {
  process.stderr.write(`${new Date().toISOString()} ${message}\n`);
}

function positiveIntEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

async function reportFailure(message: string): Promise<void> {
  const webhookUrl = process.env.CODEFATHER_INTERVIEW_FAILURE_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Codefather interview sync failed",
        source: "agent-build",
        severity: "error",
        text: message.slice(0, 6000),
        occurredAt: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      logError(`[codefather-interview-cron] failure webhook failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
    }
  } catch (error: unknown) {
    logError(
      `[codefather-interview-cron] failure webhook threw: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function runScheduled(reason: string): Promise<void> {
  if (running) {
    log(`[codefather-interview-cron] skip reason=${reason}; previous run still active`);
    return;
  }

  running = true;
  try {
    log(`[codefather-interview-cron] run start reason=${reason}`);
    const report = await runCodefatherInterviewSync({
      limit: positiveIntEnv("CODEFATHER_INTERVIEW_LIMIT", DEFAULT_LIMIT),
      pageSize: positiveIntEnv("CODEFATHER_INTERVIEW_PAGE_SIZE", DEFAULT_PAGE_SIZE),
      tag: process.env.CODEFATHER_INTERVIEW_TAG || DEFAULT_TAG,
      dryRun: booleanEnv("CODEFATHER_INTERVIEW_DRY_RUN", false),
    });
    log(formatCodefatherSyncReport(report));
  } catch (error: unknown) {
    const message = formatCodefatherSyncFailure(error);
    logError(message);
    await reportFailure(message);
  } finally {
    running = false;
  }
}

function main(): void {
  const schedule = process.env.CODEFATHER_INTERVIEW_CRON || DEFAULT_CRON;
  const timezone = process.env.CODEFATHER_INTERVIEW_TZ || DEFAULT_TIMEZONE;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid CODEFATHER_INTERVIEW_CRON expression: "${schedule}"`);
  }

  log(
    `[codefather-interview-cron] daemon up cron="${schedule}" tz=${timezone} ` +
      `limit=${positiveIntEnv("CODEFATHER_INTERVIEW_LIMIT", DEFAULT_LIMIT)} dryRun=${booleanEnv("CODEFATHER_INTERVIEW_DRY_RUN", false)}`,
  );

  const task = cron.schedule(
    schedule,
    () => {
      void runScheduled("schedule");
    },
    { timezone, name: "codefather-interview-sync", noOverlap: true },
  );

  if (booleanEnv("CODEFATHER_INTERVIEW_RUN_AT_BOOT", false)) {
    void runScheduled("boot");
  }

  const shutdown = (signal: string): void => {
    log(`[codefather-interview-cron] received ${signal}, stopping`);
    task.stop();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();