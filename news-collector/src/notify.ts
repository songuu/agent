import { createHmac } from "node:crypto";
import type { CollectReport } from "./collect.ts";
import type { NewsNotificationConfig } from "./config.ts";

const MAX_FEISHU_TEXT_LENGTH = 6_000;

interface FailureSummary {
  readonly severity: "warning" | "error";
  readonly title: string;
  readonly text: string;
}

interface NotifyOptions {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
}

interface FeishuPayload {
  readonly timestamp?: string;
  readonly sign?: string;
  readonly msg_type: "text";
  readonly content: {
    readonly text: string;
  };
}

export async function notifyCollectReport(
  report: CollectReport,
  config: NewsNotificationConfig,
  options: NotifyOptions = {},
): Promise<"sent" | "skipped"> {
  const summary = summarizeCollectFailures(report, config);
  if (!summary || !config.feishuWebhookUrl) return "skipped";
  await sendFeishuText(config.feishuWebhookUrl, summary.text, {
    secret: config.feishuWebhookSecret,
    fetchImpl: options.fetchImpl,
    now: options.now,
  });
  return "sent";
}

export async function notifyRunFailure(
  error: unknown,
  config: NewsNotificationConfig,
  options: NotifyOptions = {},
): Promise<"sent" | "skipped"> {
  if (!config.feishuWebhookUrl) return "skipped";
  const detail = error instanceof Error ? error.message : String(error);
  const text = [
    "RSS 采集告警",
    "级别: error",
    `时间: ${new Date(options.now?.() ?? Date.now()).toISOString()}`,
    "类型: run_failed",
    `错误: ${detail}`,
  ].join("\n");
  await sendFeishuText(config.feishuWebhookUrl, text, {
    secret: config.feishuWebhookSecret,
    fetchImpl: options.fetchImpl,
    now: options.now,
  });
  return "sent";
}

export function summarizeCollectFailures(
  report: CollectReport,
  config: NewsNotificationConfig,
): FailureSummary | null {
  const failedSources = config.notifyOnSourceFailure
    ? report.sources.filter((source) => !source.ok)
    : [];
  const shouldNotifyContent = config.notifyOnContentFailure && report.contentFailed > 0;
  const shouldNotifyTranslation = config.notifyOnTranslationFailure && report.translationFailed > 0;
  if (failedSources.length === 0 && !shouldNotifyContent && !shouldNotifyTranslation) return null;

  const severity = failedSources.some((source) => source.critical) ? "error" : "warning";
  const okCount = report.sources.length - failedSources.length;
  const lines = [
    "RSS 采集告警",
    `级别: ${severity}`,
    `时间: ${report.finishedAt}`,
    `RSS源: ${okCount}/${report.sources.length} ok`,
    `写库: stored=${report.stored} table=${report.tableCount}`,
    `条目: fetched=${report.totalFetched} dedupe=${report.afterDedupe}`,
  ];

  if (failedSources.length > 0) {
    lines.push("", "失败源:");
    for (const source of failedSources.slice(0, 12)) {
      lines.push(
        `- ${source.critical ? "[critical] " : ""}${source.name} (${source.key}) attempts=${source.attempts}`,
      );
      if (source.error) lines.push(`  error=${truncate(source.error, 500)}`);
      if (source.diagnostics) lines.push(`  diagnostics=${truncate(source.diagnostics, 500)}`);
    }
    if (failedSources.length > 12) lines.push(`- ... ${failedSources.length - 12} more failed sources`);
  }

  if (shouldNotifyContent) lines.push("", `正文抽取失败: ${report.contentFailed}`);
  if (shouldNotifyTranslation) lines.push("", `翻译失败: ${report.translationFailed}`);

  return {
    severity,
    title: "RSS 采集告警",
    text: truncate(lines.join("\n"), MAX_FEISHU_TEXT_LENGTH),
  };
}

export function buildFeishuTextPayload(
  text: string,
  options: { readonly secret?: string; readonly now?: () => number } = {},
): FeishuPayload {
  const payload: FeishuPayload = {
    msg_type: "text",
    content: { text: truncate(text, MAX_FEISHU_TEXT_LENGTH) },
  };
  if (!options.secret) return payload;

  const timestamp = Math.floor((options.now?.() ?? Date.now()) / 1000).toString();
  return {
    ...payload,
    timestamp,
    sign: signFeishuWebhook(timestamp, options.secret),
  };
}

export function signFeishuWebhook(timestamp: string, secret: string): string {
  return createHmac("sha256", `${timestamp}\n${secret}`).update("").digest("base64");
}

async function sendFeishuText(
  webhookUrl: string,
  text: string,
  options: NotifyOptions & { readonly secret?: string },
): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(buildFeishuTextPayload(text, options)),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Feishu webhook failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
  }

  const body = await response.text();
  if (!body.trim()) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return;
  }
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const code = record.code ?? record.StatusCode;
    if (code !== undefined && code !== 0) {
      throw new Error(`Feishu webhook rejected request: ${body.slice(0, 500)}`);
    }
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
