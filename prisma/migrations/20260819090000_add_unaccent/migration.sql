-- Enable the unaccent extension for accent-insensitive (diacritic) search.
-- Used by src/lib/services/articles.ts via raw SQL (unaccent ILIKE unaccent).
CREATE EXTENSION IF NOT EXISTS unaccent;