// 一次性收集入口：`pnpm news:collect`（配 --env-file=.env 时写库，否则 dryRun）。
//
// 显式 process.exit：rss-parser 的超时请求可能残留 keep-alive socket/timer，
// 让事件循环不自然退出；一次性 CLI 需要跑完即退，故收尾显式退出。

import { collectFromConfig } from "./collect.ts";
import { loadConfig } from "./config.ts";
import { formatReport } from "./report.ts";

async function main(): Promise<number> {
  const config = loadConfig();
  const report = await collectFromConfig(config);
  process.stdout.write(`${formatReport(report)}\n`);

  // 退出码遵循故障隔离：只要有任一源成功就算成功；全部源失败才非零。
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
