\set ON_ERROR_STOP on

BEGIN;

CREATE TABLE IF NOT EXISTS public.content_assets (
  bucket text NOT NULL CHECK (bucket = 'notion-assets'),
  object_key text NOT NULL CHECK (
    object_key <> ''
    AND object_key !~ '(^|/)(\.|\.\.)(/|$)'
    AND object_key !~ E'[\\\\\x01-\x1F\x7F]'
  ),
  content_type text NOT NULL CHECK (
    content_type IN ('image/png', 'image/svg+xml', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif')
  ),
  data bytea NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0 AND byte_size = octet_length(data)),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, object_key)
);

ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_assets_reader_select ON public.content_assets;
CREATE POLICY content_assets_reader_select
  ON public.content_assets
  FOR SELECT
  TO agent_build_reader
  USING (true);

REVOKE ALL ON TABLE public.content_assets FROM PUBLIC;
GRANT SELECT ON TABLE public.content_assets TO agent_build_reader;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.content_assets TO agent_build_writer;

COMMIT;
