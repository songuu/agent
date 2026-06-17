// 一次性同步入口：`pnpm notion:sync`（配 --env-file=.env 时写库，否则 dryRun）。
//
// 显式 process.exit：Notion SDK / fetch 的 keep-alive socket 可能残留，让事件循环不自然退出；
// 一次性 CLI 需跑完即退，故收尾显式退出（mirror cli-collect.ts）。

import { loadNotionConfig } from "./config.ts";
import { formatSyncReport } from "./report.ts";
import { syncFromConfig } from "./sync.ts";

async function main(): Promise<number> {
  const config = loadNotionConfig();
  const report = await syncFromConfig(config);
  process.stdout.write(`${formatSyncReport(report)}\n`);

  // 退出码遵循故障隔离：有任一源成功（或无源）即 0；全部已配置源失败才非零。
  const allFailed =
    report.sources.length > 0 && report.sources.every((source) => !source.ok);
  return allFailed ? 1 : 0;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
    process.exit(1);
  });
