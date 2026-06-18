// 把 CollectReport 格式化成一段可读日志（cli 与 cron 共用）。

import type { CollectReport } from "./collect.ts";

export function formatReport(report: CollectReport): string {
  const okCount = report.sources.filter((source) => source.ok).length;
  const lines: string[] = [];

  lines.push(
    `[news-collector] ${report.startedAt} → ${report.finishedAt} (${report.durationMs}ms)${
      report.dryRun ? "  [DRY-RUN]" : ""
    }`,
  );
  lines.push(`  sources: ${okCount}/${report.sources.length} ok`);
  for (const source of report.sources) {
    lines.push(
      source.ok
        ? `    ✓ ${source.name} (${source.key}) — ${source.fetched} items [attempts=${source.attempts}${
            source.critical ? ", critical" : ""
          }]`
        : `    ✗ ${source.name} (${source.key}) — ${source.error ?? "failed"} [attempts=${source.attempts}${
            source.critical ? ", critical" : ""
          }]${source.diagnostics ? ` :: ${source.diagnostics}` : ""}`,
    );
  }
  lines.push(
    `  fetched=${report.totalFetched} dedupe=${report.afterDedupe} ` +
      `enriched=${report.enriched} stored=${report.stored} table=${report.tableCount}`,
  );

  return lines.join("\n");
}
