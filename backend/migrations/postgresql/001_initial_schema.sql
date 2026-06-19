-- ============================================================
-- Aqarati — PostgreSQL Schema
-- Supports: PostgreSQL 15+ with PostGIS, pgcrypto, citext
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────

CREATE TYPE property_visibility AS ENUM ('private', 'organization', 'public');
CREATE TYPE property_status AS ENUM ('draft', 'active', 'reserved', 'sold', 'rented', 'archived');
CREATE TYPE property_purpose AS ENUM ('sale', 'rent', 'investment');
CREATE TYPE property_type_enum AS ENUM (
  'apartment', 'villa', 'land', 'commercial', 'office',
  'warehouse', 'farm', 'floor', 'building', 'rest_house', 'shop', 'other'
);
CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
CREATE TYPE org_role AS ENUM ('owner', 'manager', 'agent', 'viewer');
CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'office');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'trial');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE share_channel AS ENUM ('whatsapp', 'copy', 'link');
CREATE TYPE reminder_type AS ENUM ('follow_up', 'expiry', 'incomplete', 'custom');
CREATE TYPE contact_role AS ENUM ('owner', 'agent', 'client', 'source');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');

-- ─── Users & Identity ────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE,
  phone VARCHAR(32),
  password_hash TEXT,
  google_id VARCHAR(128) UNIQUE,
  apple_id VARCHAR(128) UNIQUE,
  status user_status NOT NULL DEFAULT 'active',
  language VARCHAR(2) NOT NULL DEFAULT 'ar',
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(160) NOT NULL,
  avatar_url TEXT,
  country_code CHAR(2) NOT NULL DEFAULT 'SA',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT,
  platform VARCHAR(16) NOT NULL CHECK (platform IN ('ios', 'android', 'huawei', 'web')),
  device_info JSONB NOT NULL DEFAULT '{}',
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_id UUID REFERENCES devices(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Organizations ───────────────────────────────────────

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'SA',
  owner_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'agent',
  status VARCHAR(16) NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- ─── Properties ──────────────────────────────────────────

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  visibility property_visibility NOT NULL DEFAULT 'private',
  purpose property_purpose NOT NULL,
  property_type property_type_enum NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status property_status NOT NULL DEFAULT 'draft',
  completeness_score INT NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT private_no_org CHECK (
    (visibility = 'private' AND organization_id IS NULL) OR visibility <> 'private'
  )
);

CREATE TABLE property_locations (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  country_code CHAR(2) NOT NULL DEFAULT 'SA',
  region VARCHAR(120),
  city VARCHAR(120) NOT NULL,
  district VARCHAR(120),
  address_text TEXT,
  lat NUMERIC(9,6) CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90)),
  lng NUMERIC(9,6) CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180)),
  geom GEOGRAPHY(Point, 4326)
);

CREATE TABLE property_details (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  area_sqm NUMERIC(12,2) CHECK (area_sqm IS NULL OR area_sqm > 0),
  bedrooms INT CHECK (bedrooms IS NULL OR bedrooms >= 0),
  bathrooms INT CHECK (bathrooms IS NULL OR bathrooms >= 0),
  street_width NUMERIC(8,2),
  age_years INT,
  floor_number INT,
  furnished BOOLEAN,
  features JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE property_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  price_amount NUMERIC(14,2) NOT NULL CHECK (price_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  negotiable BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ
);

CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type media_type NOT NULL DEFAULT 'image',
  storage_key TEXT NOT NULL,
  thumbnail_key TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Contacts ────────────────────────────────────────────

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(160),
  type VARCHAR(32) NOT NULL DEFAULT 'source',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE property_contacts (
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role contact_role NOT NULL,
  PRIMARY KEY (property_id, contact_id, role)
);

-- ─── Tags ────────────────────────────────────────────────

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) NOT NULL,
  color VARCHAR(7),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  UNIQUE (name, owner_user_id, organization_id)
);

CREATE TABLE property_tags (
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, tag_id)
);

-- ─── Favorites & Notes ───────────────────────────────────

CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Reminders ───────────────────────────────────────────

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  type reminder_type NOT NULL DEFAULT 'custom',
  title VARCHAR(200) NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Saved Searches ─────────────────────────────────────

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  notify BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sharing ─────────────────────────────────────────────

CREATE TABLE share_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(120) NOT NULL,
  body_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  user_id UUID NOT NULL REFERENCES users(id),
  channel share_channel NOT NULL,
  template_id UUID REFERENCES share_templates(id),
  recipient_contact_id UUID REFERENCES contacts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Ratings ─────────────────────────────────────────────

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

-- ─── Reports ─────────────────────────────────────────────

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id),
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (property_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

-- ─── Billing ─────────────────────────────────────────────

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  tier plan_tier NOT NULL,
  description TEXT,
  price_monthly_sar NUMERIC(10,2) DEFAULT 0,
  price_yearly_sar NUMERIC(10,2) DEFAULT 0,
  max_properties INT NOT NULL DEFAULT 10,
  max_images_per_property INT NOT NULL DEFAULT 5,
  max_organization_members INT NOT NULL DEFAULT 0,
  max_saved_searches INT NOT NULL DEFAULT 3,
  ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  export_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount_sar NUMERIC(10,2) NOT NULL CHECK (amount_sar > 0),
  provider VARCHAR(64) NOT NULL,
  provider_reference TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}',
  supported_methods JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI (Phase 2) ────────────────────────────────────────

CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  job_type VARCHAR(32) NOT NULL CHECK (job_type IN ('extract', 'generate_ad', 'detect_duplicate', 'natural_search')),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─── Admin & Audit ───────────────────────────────────────

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(64) NOT NULL,
  ip_address INET,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(64) NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, consent_type)
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Content Pages (for Next.js site) ────────────────────

CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) NOT NULL UNIQUE,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  body_ar TEXT,
  body_en TEXT,
  meta_description_ar TEXT,
  meta_description_en TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────

-- Users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_google ON users(google_id);
CREATE INDEX idx_users_apple ON users(apple_id);

-- Properties
CREATE INDEX idx_properties_owner ON properties(owner_user_id, deleted_at);
CREATE INDEX idx_properties_org ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status, visibility);
CREATE INDEX idx_properties_purpose ON properties(purpose);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_created ON properties(created_at DESC);
CREATE INDEX idx_properties_search ON properties USING GIN (
  to_tsvector('arabic', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Property locations
CREATE INDEX idx_locations_city ON property_locations(city);
CREATE INDEX idx_locations_district ON property_locations(city, district);
CREATE INDEX idx_locations_geom ON property_locations USING GIST (geom);

-- Prices
CREATE INDEX idx_prices_amount ON property_prices(price_amount);
CREATE INDEX idx_prices_property ON property_prices(property_id, valid_from DESC);

-- Media
CREATE INDEX idx_media_property ON property_media(property_id, sort_order);

-- Contacts
CREATE INDEX idx_contacts_owner ON contacts(owner_user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);

-- Organization members
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id, status);

-- Sharing
CREATE INDEX idx_share_events_property ON share_events(property_id);
CREATE INDEX idx_share_events_user ON share_events(user_id, created_at DESC);

-- Billing
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Audit
CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX idx_audit_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);

-- ─── Row Level Security ──────────────────────────────────

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Property owner can read/write their own
CREATE POLICY property_owner_all ON properties
  FOR ALL USING (owner_user_id = current_setting('app.user_id', TRUE)::UUID);

-- Org members can read org properties
CREATE POLICY property_org_read ON properties
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = current_setting('app.user_id', TRUE)::UUID AND status = 'active'
    )
  );

-- ─── Triggers ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_saved_searches_updated_at BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payment_providers_updated_at BEFORE UPDATE ON payment_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_content_pages_updated_at BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
