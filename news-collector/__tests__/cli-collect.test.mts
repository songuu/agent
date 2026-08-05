import assert from "node:assert/strict";
import { test } from "node:test";
import type { CollectReport } from "../src/collect.ts";
import { runCollectCli } from "../src/cli-collect.ts";
import type { RunConfig } from "../src/config.ts";

type CliOptions = NonNullable<Parameters<typeof runCollectCli>[0]>;

const BASE_CONFIG: RunConfig = {
  env: {} as RunConfig["env"],
  dryRun: true,
  supabase: null,
  contentRepository: { driver: "supabase" },
  feedTimeoutMs: 15_000,
  feedConcurrency: 1,
  maxPerSource: 10,
  enrichMax: 0,
  enrichProvider: "openai",
  translationMaxItems: 0,
  translationConcurrency: 1,
  translationTimeoutMs: 120_000,
  translationMaxAttempts: 1,
  articleContentEnabled: false,
  articleContentTimeoutMs: 12_000,
  articleContentMaxItems: 0,
  notification: {
    feishuWebhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/test",
    notifyOnSourceFailure: true,
    notifyOnContentFailure: false,
    notifyOnTranslationFailure: false,
  },
  cron: "0 8 * * *",
  timezone: "Asia/Shanghai",
  runAtBoot: false,
};

function report(overrides: Partial<CollectReport> = {}): CollectReport {
  return {
    startedAt: "2026-08-05T00:00:00.000Z",
    finishedAt: "2026-08-05T00:01:00.000Z",
    durationMs: 60_000,
    sources: [
      {
        key: "openai",
        name: "OpenAI News",
        ok: true,
        fetched: 10,
        attempts: 1,
        critical: true,
      },
    ],
    totalFetched: 10,
    afterDedupe: 10,
    contentFetched: 0,
    contentEmpty: 0,
    contentFailed: 0,
    translated: 0,
    translationFailed: 0,
    translationSkipped: 0,
    enriched: 0,
    stored: 10,
    tableCount: "100",
    dryRun: false,
    items: [],
    ...overrides,
  };
}

function captureWriter(): { writer: { write(chunk: string): void }; output: () => string } {
  const chunks: string[] = [];
  return {
    writer: {
      write(chunk: string) {
        chunks.push(chunk);
      },
    },
    output: () => chunks.join(""),
  };
}

test("runCollectCli sends a notification after an isolated source failure", async () => {
  let notifiedReport: CollectReport | undefined;
  let notifiedWebhook: string | undefined;
  const stdout = captureWriter();
  const stderr = captureWriter();

  const notifyCollect: NonNullable<CliOptions["notifyCollect"]> = async (
    collectReport,
    config,
  ) => {
    notifiedReport = collectReport;
    notifiedWebhook = config.feishuWebhookUrl;
    return "sent";
  };

  const exitCode = await runCollectCli({
    config: BASE_CONFIG,
    collect: async () =>
      report({
        sources: [
          {
            key: "together-ai-blog",
            name: "Together AI Blog",
            ok: false,
            fetched: 0,
            attempts: 3,
            error: "getaddrinfo ENOTFOUND www.together.ai",
          },
          {
            key: "openai",
            name: "OpenAI News",
            ok: true,
            fetched: 10,
            attempts: 1,
            critical: true,
          },
        ],
      }),
    notifyCollect,
    stdout: stdout.writer,
    stderr: stderr.writer,
  });

  assert.equal(exitCode, 0);
  assert.equal(notifiedWebhook, BASE_CONFIG.notification.feishuWebhookUrl);
  assert.equal(notifiedReport?.sources[0]?.ok, false);
  assert.match(stdout.output(), /notify=feishu sent/);
  assert.equal(stderr.output(), "");
});

test("runCollectCli sends a run-failure notification when collection throws", async () => {
  let notifiedError: unknown;
  const stdout = captureWriter();
  const stderr = captureWriter();
  const expectedError = new Error("news_items insert failed: missing title_zh");

  const notifyRunFailure: NonNullable<CliOptions["notifyRunFailure"]> = async (
    error,
  ) => {
    notifiedError = error;
    return "sent";
  };

  const exitCode = await runCollectCli({
    config: BASE_CONFIG,
    collect: async () => {
      throw expectedError;
    },
    notifyRunFailure,
    stdout: stdout.writer,
    stderr: stderr.writer,
  });

  assert.equal(exitCode, 1);
  assert.equal(notifiedError, expectedError);
  assert.equal(stdout.output(), "");
  assert.match(stderr.output(), /missing title_zh/);
  assert.match(stderr.output(), /notify=feishu sent/);
});
