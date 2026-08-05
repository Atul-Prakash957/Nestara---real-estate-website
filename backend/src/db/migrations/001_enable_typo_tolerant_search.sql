-- Run this once on an existing database before deploying the fuzzy search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_locations_city_trgm ON locations USING GIN (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_locations_locality_trgm ON locations USING GIN (locality gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON properties USING GIN (title gin_trgm_ops);
