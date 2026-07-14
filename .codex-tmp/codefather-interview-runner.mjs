import {
  formatCodefatherSyncFailure,
  formatCodefatherSyncReport,
  runCodefatherInterviewSync,
} from "./sync-codefather-interview-to-supabase.ts";

async function main() {
  const report = await runCodefatherInterviewSync({
    limit: 500,
    pageSize: 20,
    tag: "面试题",
    batchSize: 25,
    timeoutMs: 300000,
  });
  console.log(formatCodefatherSyncReport(report));
}

main().catch((error) => {
  console.error(formatCodefatherSyncFailure(error));
  process.exitCode = 1;
});
