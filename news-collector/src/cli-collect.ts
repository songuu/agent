// 一次性收集入口：`pnpm news:collect`（配 --env-file=.env 时写库，否则 dryRun）。
//
// 显式 process.exit：rss-parser 的超时请求可能残留 keep-alive socket/timer，
// 让事件循环不自然退出；一次性 CLI 需要跑完即退，故收尾显式退出。

import { pathToFileURL } from "node:url";
import { collectFromConfig, type CollectReport } from "./collect.ts";
import { loadConfig, type RunConfig } from "./config.ts";
import { notifyCollectReport, notifyRunFailure } from "./notify.ts";
import { formatReport } from "./report.ts";

interface OutputWriter {
  write(chunk: string): unknown;
}

interface CollectCliOptions {
  readonly config?: RunConfig;
  readonly collect?: (config: RunConfig) => Promise<CollectReport>;
  readonly notifyCollect?: typeof notifyCollectReport;
  readonly notifyRunFailure?: typeof notifyRunFailure;
  readonly stdout?: OutputWriter;
  readonly stderr?: OutputWriter;
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function logNotificationFailure(stderr: OutputWriter, error: unknown): void {
  stderr.write(
    `[news-collector] Feishu notification failed: ${errorMessage(error)}\n`,
  );
}

function logNotificationSent(writer: OutputWriter, result: "sent" | "skipped"): void {
  if (result === "sent") writer.write("[news-collector] notify=feishu sent\n");
}

export async function runCollectCli(options: CollectCliOptions = {}): Promise<number> {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const config = options.config ?? loadConfig();
  const collect = options.collect ?? collectFromConfig;
  const notifyCollect = options.notifyCollect ?? notifyCollectReport;
  const notifyRunFailureImpl = options.notifyRunFailure ?? notifyRunFailure;

  try {
    const report = await collect(config);
    stdout.write(`${formatReport(report)}\n`);

    try {
      logNotificationSent(stdout, await notifyCollect(report, config.notification));
    } catch (error: unknown) {
      logNotificationFailure(stderr, error);
    }

    // 退出码遵循故障隔离：只要有任一源成功就算成功；全部源失败才非零。
    const allFailed =
      report.sources.length > 0 && report.sources.every((source) => !source.ok);
    return allFailed ? 1 : 0;
  } catch (error: unknown) {
    stderr.write(`${errorDetail(error)}\n`);
    try {
      logNotificationSent(stderr, await notifyRunFailureImpl(error, config.notification));
    } catch (notifyError: unknown) {
      logNotificationFailure(stderr, notifyError);
    }
    return 1;
  }
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && import.meta.url === pathToFileURL(entry).href);
}

if (isDirectRun()) {
  runCollectCli()
    .then((code) => {
      process.exit(code);
    })
    .catch((error: unknown) => {
      process.stderr.write(`${errorDetail(error)}\n`);
      process.exit(1);
    });
}
