ALTER TABLE properties ADD COLUMN IF NOT EXISTS sharing_type VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gender_preference VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS meals_included BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_bed NUMERIC(10,2);

INSERT INTO property_types (name, category) VALUES ('PG / Hostel', 'residential')
ON CONFLICT (name) DO NOTHING;




