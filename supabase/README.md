# Supabase assets

This folder stores Supabase-ready SQL for the Agent course site.

## Frontier ecosystem articles

- Table migration: `migrations/20260616090000_create_frontier_ecosystem_articles.sql`
- Generated seed/upsert: `seed/frontier_ecosystem_articles.sql`
- Source of truth: `knowledge-graph/data/graph.ts` -> `FRONTIER_ARTICLES`

Apply order:

```bash
supabase db push
node node_modules/tsx/dist/cli.mjs scripts/generate-frontier-ecosystem-supabase-seed.ts
```

Then run the generated `supabase/seed/frontier_ecosystem_articles.sql` in the Supabase SQL editor or through your database connection.

This repository currently does not contain Supabase connection settings, so the script generates auditable SQL instead of writing to a remote project implicitly.
