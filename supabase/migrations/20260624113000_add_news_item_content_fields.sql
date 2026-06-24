-- Add bounded article body fields for /news/article station-side reading.
-- content_text is extracted by news-collector from the original article URL and capped in Node.

alter table public.news_items
  add column if not exists content_text text not null default '',
  add column if not exists content_excerpt text not null default '',
  add column if not exists content_status text not null default 'not_fetched' check (
    content_status in ('not_fetched', 'fetched', 'empty', 'failed')
  ),
  add column if not exists content_fetched_at timestamptz;

update public.news_items
set content_excerpt = coalesce(nullif(content_excerpt, ''), nullif(summary, ''), title),
    content_text = coalesce(nullif(content_text, ''), nullif(summary, ''), '')
where content_excerpt = '' or content_text = '';

drop index if exists news_items_search_idx;
alter table public.news_items drop column if exists search_text;
alter table public.news_items
  add column search_text tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(source_name, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(content_excerpt, '') || ' ' ||
      coalesce(content_text, '')
    )
  ) stored;

create index if not exists news_items_search_idx
  on public.news_items using gin (search_text);

comment on column public.news_items.content_text is
  'Bounded original-article text extracted by news-collector for station-side article detail rendering.';
comment on column public.news_items.content_excerpt is
  'Short list-card excerpt derived from content_text when available; falls back to cleaned feed summary.';
comment on column public.news_items.content_status is
  'Article body extraction status: not_fetched, fetched, empty, or failed.';
comment on column public.news_items.content_fetched_at is
  'Timestamp when news-collector last attempted to fetch original article content.';

notify pgrst, 'reload schema';
