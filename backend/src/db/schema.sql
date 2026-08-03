-- ============================================================
-- REAL ESTATE PLATFORM - POSTGRESQL SCHEMA
-- ============================================================
-- Run: psql -U your_user -d your_db -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(120) NOT NULL,
    email             VARCHAR(160) UNIQUE NOT NULL,
    phone             VARCHAR(15) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    role              VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' | 'agent' | 'admin'
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_image     TEXT,
    city              VARCHAR(100),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- OTP VERIFICATIONS (email OTP for register / login / reset)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(160) NOT NULL,
    otp_code    VARCHAR(6) NOT NULL,
    purpose     VARCHAR(30) NOT NULL DEFAULT 'register', -- 'register' | 'login' | 'reset_password'
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);

-- ------------------------------------------------------------
-- LOCATIONS (city / locality hierarchy for search & filters)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city        VARCHAR(100) NOT NULL,
    locality    VARCHAR(120) NOT NULL,
    state       VARCHAR(100),
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    UNIQUE (city, locality)
);

-- ------------------------------------------------------------
-- PROPERTY TYPES (Bungalow, Apartment, 1BHK, 2BHK, Villa, Plot...)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_types (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(60) UNIQUE NOT NULL, -- '1BHK','2BHK','3BHK','Apartment','Bungalow','Villa','Plot','Penthouse'
    category VARCHAR(30) NOT NULL DEFAULT 'residential' -- 'residential' | 'commercial'
);

INSERT INTO property_types (name, category) VALUES
 ('1 RK','residential'),('1 BHK','residential'),('2 BHK','residential'),
 ('3 BHK','residential'),('4 BHK','residential'),('5+ BHK','residential'),
 ('Apartment','residential'),('Independent House','residential'),
 ('Villa','residential'),('Bungalow','residential'),('Penthouse','residential'),
 ('Plot / Land','residential'),('Office Space','commercial'),
 ('Shop / Showroom','commercial'),('Warehouse','commercial')
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------
-- PROPERTIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    listing_type      VARCHAR(10) NOT NULL, -- 'buy' | 'rent'
    property_type_id  INTEGER NOT NULL REFERENCES property_types(id),
    location_id       UUID REFERENCES locations(id),
    address           VARCHAR(255),
    latitude          DOUBLE PRECISION,
    longitude         DOUBLE PRECISION,

    price             NUMERIC(14,2) NOT NULL,
    price_per_sqft    NUMERIC(10,2),
    monthly_rent      NUMERIC(12,2),
    security_deposit  NUMERIC(12,2),

    area_sqft         NUMERIC(10,2),
    bedrooms          SMALLINT,
    bathrooms         SMALLINT,
    balconies         SMALLINT,
    floor_number      SMALLINT,
    total_floors      SMALLINT,
    furnishing        VARCHAR(20), -- 'unfurnished' | 'semi-furnished' | 'furnished'
    facing            VARCHAR(20), -- 'east','west','north','south', etc.
    age_of_property    VARCHAR(30), -- 'new','0-1 yrs','1-5 yrs','5-10 yrs','10+ yrs'
    parking           SMALLINT DEFAULT 0,

    amenities         TEXT[],   -- e.g. {'Lift','Gym','Swimming Pool','Power Backup'}

    is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending'|'approved'|'rejected'|'sold'|'rented'
    views_count        INTEGER NOT NULL DEFAULT 0,

    contact_name      VARCHAR(120),
    contact_phone     VARCHAR(15),
    contact_email     VARCHAR(160),

    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);

-- ------------------------------------------------------------
-- PROPERTY IMAGES (multiple images per property)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_images (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url     TEXT NOT NULL,
    is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
    display_order SMALLINT DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);

-- ------------------------------------------------------------
-- FEATURED PROJECTS (builder projects shown on homepage)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS featured_projects (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(200) NOT NULL,
    builder_name  VARCHAR(150),
    location_id   UUID REFERENCES locations(id),
    price_range   VARCHAR(80),   -- '80L - 1.2Cr'
    banner_image  TEXT,
    possession_date VARCHAR(50),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- SHORTLISTS (saved properties)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shortlists (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, property_id)
);

-- ------------------------------------------------------------
-- RECENTLY VIEWED
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recently_viewed (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, property_id)
);

-- ------------------------------------------------------------
-- RECENT SEARCHES (for footer / quick links)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recent_searches (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    search_query VARCHAR(255) NOT NULL,
    filters      JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- PROPERTY CONTACT / LEADS (buyer enquiries sent to owner)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_leads (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id),
    name         VARCHAR(120),
    phone        VARCHAR(15),
    email        VARCHAR(160),
    message      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- TRIGGER: auto-update updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_properties_updated ON properties;
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Seed an admin user (password: Admin@123 -> replace hash via API ideally)
-- ------------------------------------------------------------
-- INSERT INTO users (name, email, password_hash, role, is_email_verified)
-- VALUES ('Super Admin', 'admin@example.com', '$2b$10$replace_with_real_bcrypt_hash', 'admin', TRUE);
