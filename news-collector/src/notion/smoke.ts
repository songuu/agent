// 离线 smoke：`pnpm notion:smoke`。无 token、不触网，用 fixtures 跑通 map+sync 纯管线，
// 打印确定性报告。证明编排在无凭据时也能闭环（免 key 先行）。

import { FIXTURE_SOURCE, makeNotionPage } from "./fixtures.ts";
import { formatSyncReport } from "./report.ts";
import { syncNotion } from "./sync.ts";

async function main(): Promise<void> {
  const pages = [
    makeNotionPage({ id: "be633bf1-dfa0-436d-b259-571129a590e5", title: "Agent 前沿一", slug: "agent-frontier-1" }),
    makeNotionPage({ id: "aa11bb22-cc33-dd44-ee55-ff6677889900", title: "Agent 前沿二" }),
  ];

  const report = await syncNotion({
    sources: [FIXTURE_SOURCE],
    now: new Date("2026-06-17T08:30:00.000Z"),
    dryRun: true,
    maxPages: 0,
    fullResync: true,
    cursorFor: async () => null,
    iteratePages: async function* () {
      for (const page of pages) yield page;
    },
    renderPage: async (page) => ({
      markdown: `# 正文\n\n这是 ${page.id} 的正文段落。`,
      assets: {},
    }),
    upsert: async () => ({ attempted: 0, invalid: 0, pushed: 0, tableCount: "0" }),
  });

  process.stdout.write(`${formatSyncReport(report)}\n`);
  process.stdout.write(
    `articles: ${report.articles.map((a) => `${a.title}(${a.slug})`).join(", ")}\n`,
  );

  if (report.totalPages !== 2) {
    throw new Error(`smoke expected 2 pages, got ${report.totalPages}`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
