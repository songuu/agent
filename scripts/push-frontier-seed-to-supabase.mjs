// Fallback uploader for environments where tsx/esbuild cannot spawn.
// It reads the generated SQL seed and sends the same rows through PostgREST.

import { readFileSync } from "node:fs";

const seedPath = "supabase/seed/frontier_ecosystem_articles.sql";
const columns = [
  "article_id",
  "slug",
  "chapter_id",
  "chapter_slug",
  "title",
  "source",
  "source_url",
  "kind",
  "ecosystem_layer",
  "ecosystem_layer_label",
  "summary",
  "collected_date",
  "collected_at",
  "read_count",
  "sort_order",
  "tags",
  "detail_paragraphs",
  "metadata",
];

function loadEnv(path = ".env") {
  const env = readFileSync(path, "utf8");
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function unquotePostgresString(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("'") || !trimmed.endsWith("'")) return trimmed;
  return trimmed.slice(1, -1).replace(/''/g, "'");
}

function splitTopLevel(value) {
  const parts = [];
  let current = "";
  let inString = false;
  let squareDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (char === "'" && next === "'") {
      current += "''";
      index += 1;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString) {
      if (char === "[") squareDepth += 1;
      if (char === "]") squareDepth -= 1;
      if (char === "," && squareDepth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseArray(value) {
  const match = value.match(/^array\[(.*)\]::text\[\]$/s);
  if (!match) return null;
  if (!match[1].trim()) return [];
  return splitTopLevel(match[1]).map(unquotePostgresString);
}

function parseSeedValue(value) {
  const arrayValue = parseArray(value);
  if (arrayValue) return arrayValue;

  if (value.endsWith("::jsonb")) {
    return JSON.parse(unquotePostgresString(value.slice(0, -"::jsonb".length)));
  }

  if (/^-?\d+$/.test(value)) return Number(value);
  return unquotePostgresString(value);
}

function extractRowStrings(sql) {
  const valuesStart = sql.indexOf("\nvalues\n");
  const conflictStart = sql.indexOf("\non conflict");
  if (valuesStart === -1 || conflictStart === -1) {
    throw new Error("Could not locate seed VALUES block");
  }

  const valuesBlock = sql.slice(valuesStart + "\nvalues\n".length, conflictStart);
  const rows = [];
  let start = -1;
  let depth = 0;
  let inString = false;

  for (let index = 0; index < valuesBlock.length; index += 1) {
    const char = valuesBlock[index];
    const next = valuesBlock[index + 1];

    if (char === "'" && next === "'") {
      index += 1;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "(") {
      if (depth === 0) start = index + 1;
      depth += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        rows.push(valuesBlock.slice(start, index));
        start = -1;
      }
    }
  }

  return rows;
}

function parseSeedRows(sql) {
  return extractRowStrings(sql).map((row) => {
    const values = splitTopLevel(row);
    if (values.length !== columns.length) {
      throw new Error(`Unexpected seed column count: expected ${columns.length}, got ${values.length}`);
    }

    return Object.fromEntries(columns.map((column, index) => [column, parseSeedValue(values[index])]));
  });
}

async function main() {
  loadEnv();

  const base = requireEnv("SUPABASE_URL").replace(/\/+$/, "");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const schema = process.env.SUPABASE_SCHEMA || "public";
  const rows = parseSeedRows(readFileSync(seedPath, "utf8"));

  const response = await fetch(`${base}/rest/v1/frontier_ecosystem_articles?on_conflict=slug`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Content-Profile": schema,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Upsert failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
  }

  const countResponse = await fetch(`${base}/rest/v1/frontier_ecosystem_articles?select=slug`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Accept-Profile": schema,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  console.log(
    `Upsert OK (HTTP ${response.status}). pushed=${rows.length}, table count (content-range)=${
      countResponse.headers.get("content-range") ?? "?"
    }`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
