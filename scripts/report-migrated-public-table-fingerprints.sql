SET TIME ZONE 'UTC';

DO $$
DECLARE
  table_row record;
  row_count bigint;
  content_fingerprint text;
BEGIN
  FOR table_row IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = current_schema()
      AND tablename NOT IN (
        'frontier_ecosystem_articles',
        'glossary_terms',
        'interview_questions',
        'news_items',
        'notion_articles'
      )
    ORDER BY tablename
  LOOP
    EXECUTE format(
      $query$
        SELECT
          count(*),
          md5(
            coalesce(
              string_agg(
                md5(row_to_json(source_row)::text),
                '' ORDER BY md5(row_to_json(source_row)::text)
              ),
              ''
            )
          )
        FROM public.%I AS source_row
      $query$,
      table_row.tablename
    ) INTO row_count, content_fingerprint;

    RAISE NOTICE '%|%|%', table_row.tablename, row_count, content_fingerprint;
  END LOOP;
END
$$;
