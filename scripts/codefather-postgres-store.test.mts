import assert from "node:assert/strict";
import test from "node:test";

import type { PostgresExecutor } from "../news-collector/src/data/postgres-content-repository.ts";
import {
  synchronizeCodefatherRowsWithPostgres,
} from "./codefather-postgres-store.ts";
import type { InterviewQuestionRow } from "./sync-codefather-interview-to-supabase.ts";

const row: InterviewQuestionRow = {
  question_id: "codefather-1",
  slug: "codefather-interview-1",
  category: "engineering",
  category_label: "工程类",
  question: "如何设计 Agent？",
  related_chapters: ["external-codefather"],
  answer_source: "https://ai.codefather.cn/post/1",
  collected_date: "2026-07-24",
  collected_at: "2026-07-24T00:00:00.000Z",
  sort_order: 100001,
  tags: ["面试题"],
  metadata: { source: "codefather" },
};

test("Codefather PostgreSQL store upserts, deduplicates, and verifies through reader role", async () => {
  const writerCalls: Array<{ statement: string; values: readonly unknown[] }> = [];
  const readerCalls: Array<{ statement: string; values: readonly unknown[] }> = [];
  let readNumber = 0;
  const writer: PostgresExecutor = {
    async query(statement, values) {
      writerCalls.push({ statement, values });
      if (statement.startsWith("SELECT COUNT(*)") && !statement.includes("WHERE")) {
        return { rowCount: 1, rows: [{ table_count: "625" }] };
      }
      if (statement.startsWith("SELECT COUNT(*)")) {
        return { rowCount: 1, rows: [{ total_count: "1" }] };
      }
      if (statement.startsWith("SELECT")) {
        readNumber += 1;
        return { rowCount: 1, rows: [row] };
      }
      if (statement.startsWith("DELETE")) return { rowCount: 1, rows: [] };
      return { rowCount: 1, rows: [] };
    },
  };
  const reader: PostgresExecutor = {
    async query(statement, values) {
      readerCalls.push({ statement, values });
      return { rowCount: 1, rows: [{ total_count: "1" }] };
    },
  };

  const result = await synchronizeCodefatherRowsWithPostgres({
    rows: [row],
    writer,
    reader,
    findDuplicateSlugs: () => ["codefather-interview-duplicate"],
  });

  assert.equal(result.duplicatesDeleted, 1);
  assert.equal(result.writerCount, 1);
  assert.equal(result.readerCount, 1);
  assert.equal(readNumber, 2);
  assert.match(writerCalls[0]!.statement, /^INSERT INTO "interview_questions"/);
  assert.match(writerCalls[0]!.statement, /ON CONFLICT \("slug"\) DO UPDATE SET/);
  assert.ok(writerCalls.some((call) => call.statement.includes("ANY($1::text[])")));
  assert.deepEqual(readerCalls[0]!.values, ["codefather-interview-%"]);
});
