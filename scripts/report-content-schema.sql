SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name IN ('frontier_ecosystem_articles', 'news_items')
ORDER BY table_name, ordinal_position;
