-- Full-text search index for the public search feature (Spanish config)
CREATE INDEX IF NOT EXISTS "Article_search_idx"
ON "Article" USING GIN (
  to_tsvector(
    'spanish',
    coalesce("title", '') || ' ' ||
    coalesce("subtitle", '') || ' ' ||
    coalesce("excerpt", '') || ' ' ||
    coalesce(("content")::text, '')
  )
);
