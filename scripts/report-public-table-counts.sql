DO $$
DECLARE
  table_row record;
  row_count bigint;
BEGIN
  FOR table_row IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = current_schema()
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', table_row.tablename) INTO row_count;
    RAISE NOTICE '%|%', table_row.tablename, row_count;
  END LOOP;
END
$$;
