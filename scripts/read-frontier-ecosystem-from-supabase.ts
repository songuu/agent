function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const schema = process.env.SUPABASE_SCHEMA || "public";

  if (!base) throw new Error("Missing required env var: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");

  const endpoint = `${base}/rest/v1/frontier_ecosystem_articles?select=slug,title,source,ecosystem_layer&chapter_id=eq.19&order=sort_order.asc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Accept-Profile": schema,
      Prefer: "count=exact",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Read failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
  }

  const rows = (await response.json()) as Array<{ ecosystem_layer?: string; title?: string; source?: string }>;
  const layerCounts = new Map<string, number>();
  for (const row of rows) {
    const layer = row.ecosystem_layer || "unknown";
    layerCounts.set(layer, (layerCounts.get(layer) || 0) + 1);
  }

  console.log(`Read OK. rows=${rows.length}, content-range=${response.headers.get("content-range") ?? "n/a"}`);
  for (const [layer, count] of [...layerCounts.entries()].sort()) {
    console.log(`${layer}: ${count}`);
  }
  const first = rows[0];
  if (first) {
    console.log(`first=${first.source ?? "unknown"} · ${first.title ?? "untitled"}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
