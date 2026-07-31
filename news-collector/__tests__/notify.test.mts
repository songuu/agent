import assert from "node:assert/strict";
import { test } from "node:test";
import type { CollectReport } from "../src/collect.ts";
import type { NewsNotificationConfig } from "../src/config.ts";
import {
  buildFeishuTextPayload,
  notifyCollectReport,
  notifyRunFailure,
  signFeishuWebhook,
  summarizeCollectFailures,
} from "../src/notify.ts";

const BASE_CONFIG: NewsNotificationConfig = {
  feishuWebhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/test",
  notifyOnSourceFailure: true,
  notifyOnContentFailure: false,
  notifyOnTranslationFailure: false,
};

function report(overrides: Partial<CollectReport> = {}): CollectReport {
  return {
    startedAt: "2026-07-31T00:00:00.000Z",
    finishedAt: "2026-07-31T00:01:00.000Z",
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

test("summarizeCollectFailures returns null when enabled failure classes are clean", () => {
  assert.equal(summarizeCollectFailures(report(), BASE_CONFIG), null);
  assert.equal(
    summarizeCollectFailures(
      report({ contentFailed: 3, translationFailed: 1 }),
      BASE_CONFIG,
    ),
    null,
  );
});

test("summarizeCollectFailures reports failed RSS sources with critical severity", () => {
  const summary = summarizeCollectFailures(
    report({
      sources: [
        {
          key: "microsoft-ai-source",
          name: "Microsoft Source · AI",
          ok: false,
          fetched: 0,
          attempts: 5,
          critical: true,
          error: "Request timed out after 15000ms",
          diagnostics: "critical; attempts=5/5; retry-exhausted",
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
    BASE_CONFIG,
  );

  assert.equal(summary?.severity, "error");
  assert.match(summary?.text ?? "", /RSS源: 1\/2 ok/);
  assert.match(summary?.text ?? "", /microsoft-ai-source/);
  assert.match(summary?.text ?? "", /retry-exhausted/);
});

test("buildFeishuTextPayload adds a deterministic signature when secret is configured", () => {
  const payload = buildFeishuTextPayload("RSS 采集告警", {
    secret: "test-secret",
    now: () => 1_596_360_473_000,
  });

  assert.equal(payload.msg_type, "text");
  assert.equal(payload.content.text, "RSS 采集告警");
  assert.equal(payload.timestamp, "1596360473");
  assert.equal(payload.sign, signFeishuWebhook("1596360473", "test-secret"));
});

test("notifyCollectReport sends one Feishu text message for a source failure", async () => {
  let requestUrl = "";
  let payload: Record<string, unknown> | undefined;
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    requestUrl = String(input);
    payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({ code: 0, msg: "success" }), { status: 200 });
  };

  const result = await notifyCollectReport(
    report({
      sources: [
        {
          key: "owasp-genai",
          name: "OWASP GenAI Security Project",
          ok: false,
          fetched: 0,
          attempts: 1,
          error: "Status code 403",
        },
      ],
    }),
    { ...BASE_CONFIG, feishuWebhookSecret: "test-secret" },
    { fetchImpl: fetchImpl as typeof fetch, now: () => 1_596_360_473_000 },
  );

  assert.equal(result, "sent");
  assert.equal(requestUrl, BASE_CONFIG.feishuWebhookUrl);
  assert.equal(payload?.msg_type, "text");
  assert.equal(payload?.timestamp, "1596360473");
  assert.match(JSON.stringify(payload), /owasp-genai/);
});

test("notifyRunFailure sends a Feishu alert for thrown collector errors", async () => {
  let text = "";
  const fetchImpl = async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const payload = JSON.parse(String(init?.body)) as { content: { text: string } };
    text = payload.content.text;
    return new Response(JSON.stringify({ code: 0 }), { status: 200 });
  };

  const result = await notifyRunFailure(
    new Error("database connection refused"),
    BASE_CONFIG,
    { fetchImpl: fetchImpl as typeof fetch, now: () => 1_596_360_473_000 },
  );

  assert.equal(result, "sent");
  assert.match(text, /run_failed/);
  assert.match(text, /database connection refused/);
});
