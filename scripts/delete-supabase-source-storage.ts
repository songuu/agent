#!/usr/bin/env node

const CONFIRMATION = "DELETE_SUPABASE_SOURCE_STORAGE";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push([...items.slice(index, index + size)]);
  }
  return result;
}

async function responseText(response: Response): Promise<string> {
  const value = await response.text().catch(() => "");
  return value || response.statusText;
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  if (!args.has("--execute") || !args.has("--confirm") || !args.has(CONFIRMATION)) {
    throw new Error(`Refusing to run. Use --execute --confirm ${CONFIRMATION}.`);
  }

  const baseUrl = requiredEnv("SUPABASE_URL").replace(/\/+$/, "");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const pg = await import("pg");
  const source = new pg.Pool({
    connectionString: requiredEnv("SOURCE_POSTGRES_URL"),
    ssl: process.env.SOURCE_POSTGRES_SSL === "false" ? false : { rejectUnauthorized: true },
    max: 1,
    application_name: "agent-build-supabase-storage-delete",
  });

  try {
    const buckets = await source.query<{ id: string }>("SELECT id FROM storage.buckets ORDER BY id");
    let deletedObjects = 0;
    for (const { id: bucket } of buckets.rows) {
      const objectRows = await source.query<{ name: string }>(
        "SELECT name FROM storage.objects WHERE bucket_id = $1 ORDER BY name",
        [bucket],
      );
      for (const names of chunks(objectRows.rows.map((row) => row.name), 100)) {
        const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
          method: "DELETE",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prefixes: names }),
        });
        if (!response.ok) {
          throw new Error(`Storage object deletion for bucket ${bucket} failed: ${response.status} ${await responseText(response)}`);
        }
        deletedObjects += names.length;
      }
      const bucketResponse = await fetch(`${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
        method: "DELETE",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });
      if (!bucketResponse.ok) {
        throw new Error(`Storage bucket deletion for ${bucket} failed: ${bucketResponse.status} ${await responseText(bucketResponse)}`);
      }
    }

    const [remainingObjects, remainingBuckets] = await Promise.all([
      source.query<{ count: string }>("SELECT count(*)::text AS count FROM storage.objects"),
      source.query<{ count: string }>("SELECT count(*)::text AS count FROM storage.buckets"),
    ]);
    console.log(`DELETED_OBJECTS=${deletedObjects}`);
    console.log(`DELETED_BUCKETS=${buckets.rowCount ?? buckets.rows.length}`);
    console.log(`REMAINING_OBJECTS=${remainingObjects.rows[0]?.count ?? "0"}`);
    console.log(`REMAINING_BUCKETS=${remainingBuckets.rows[0]?.count ?? "0"}`);
  } finally {
    await source.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
