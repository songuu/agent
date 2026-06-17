// 离线 smoke：用打包 fixtures 跑通完整管道（抓取→分类→归一→去重），无网络/无 key/不写库。
// 对标 rag:smoke / lg:smoke，证明子系统端到端可用。
//
//   pnpm news:smoke

import { collectOnce } from "./src/collect.ts";
import { FIXTURE_SOURCES, fixtureFetchFeed } from "./src/fixtures.ts";
import { formatReport } from "./src/report.ts";

async function main(): Promise<void> {
  const now = new Date("2026-06-17T00:00:00.000Z");
  const report = await collectOnce({
    sources: FIXTURE_SOURCES,
    fetchFeedImpl: fixtureFetchFeed,
    now,
    dryRun: true,
  });

  process.stdout.write(`${formatReport(report)}\n`);

  const MIN_ITEMS = 5;
  if (report.afterDedupe < MIN_ITEMS) {
    process.stderr.write(
      `smoke FAILED: expected >= ${MIN_ITEMS} items, got ${report.afterDedupe}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const layers = new Set(report.items.map((item) => item.ecosystemLayer));
  process.stdout.write(
    `smoke OK: ${report.afterDedupe} items across ${layers.size} layers ` +
      `(${[...layers].sort().join(", ")})\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
