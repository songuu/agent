-- /news/calendar groups by collection date and layer, then counts distinct
-- sources. These compact covering indexes keep the public read path from
-- scanning the wide news_items heap (which includes extracted article text).
--
-- The normal schema runner may wrap migrations in a transaction, so this
-- durable migration deliberately uses regular CREATE INDEX. Production can
-- apply the same definitions with CREATE INDEX CONCURRENTLY before this file
-- is replayed; IF NOT EXISTS makes that later replay safe.

create index if not exists news_items_calendar_bucket_idx
  on public.news_items (collected_date desc, ecosystem_layer);

create index if not exists news_items_calendar_layer_source_idx
  on public.news_items (ecosystem_layer, source_name);

create index if not exists news_items_calendar_source_idx
  on public.news_items (source_name);
