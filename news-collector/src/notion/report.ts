// 同步报告格式化（mirror ../report.ts）：CLI 与 cron 共用的可读日志。

import type { SyncReport } from "./sync.ts";

export function formatSyncReport(report: SyncReport): string {
  const lines: string[] = [];
  lines.push(
    `[notion-sync] ${report.dryRun ? "DRY-RUN " : ""}` +
      `pages=${report.totalPages} upserted=${report.upserted} table=${report.tableCount} ` +
      `(${report.durationMs}ms)`,
  );
  for (const source of report.sources) {
    if (source.ok) {
      const errs = source.pageErrors > 0 ? ` (${source.pageErrors} page errors)` : "";
      lines.push(`  ✓ ${source.name}: ${source.pages} pages${errs}`);
    } else {
      lines.push(`  ✗ ${source.name}: ${source.error ?? "failed"}`);
    }
  }
  if (report.sources.length === 0) {
    lines.push("  (no enabled Notion sources — 在 notion-sources.ts 配置并 enable)");
  }
  return lines.join("\n");
}
