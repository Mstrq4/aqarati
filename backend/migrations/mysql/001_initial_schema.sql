-- ============================================================
-- Aqarati — MySQL Schema (v8.0+)
-- Alternative to PostgreSQL for deployment flexibility
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ─── Users ───────────────────────────────────────────────

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(32),
  password_hash VARCHAR(255),
  google_id VARCHAR(128) UNIQUE,
  apple_id VARCHAR(128) UNIQUE,
  status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  language VARCHAR(2) NOT NULL DEFAULT 'ar',
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone),
  INDEX idx_users_google (google_id),
  INDEX idx_users_apple (apple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_profiles (
  user_id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  avatar_url TEXT,
  country_code CHAR(2) NOT NULL DEFAULT 'SA',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
  verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE devices (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  push_token TEXT,
  platform VARCHAR(16) NOT NULL,
  device_info JSON NOT NULL,
  last_active TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_id CHAR(36),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Organizations ───────────────────────────────────────

CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'SA',
  owner_user_id CHAR(36) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  logo_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization_members (
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner', 'manager', 'agent', 'viewer') NOT NULL DEFAULT 'agent',
  status VARCHAR(16) NOT NULL DEFAULT 'invited',
  invited_by CHAR(36),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Properties ──────────────────────────────────────────

CREATE TABLE properties (
  id CHAR(36) PRIMARY KEY,
  owner_user_id CHAR(36) NOT NULL,
  organization_id CHAR(36),
  visibility ENUM('private', 'organization', 'public') NOT NULL DEFAULT 'private',
  purpose ENUM('sale', 'rent', 'investment') NOT NULL,
  property_type ENUM('apartment', 'villa', 'land', 'commercial', 'office', 'warehouse', 'farm', 'floor', 'building', 'rest_house', 'shop', 'other') NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status ENUM('draft', 'active', 'reserved', 'sold', 'rented', 'archived') NOT NULL DEFAULT 'draft',
  completeness_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  INDEX idx_properties_owner (owner_user_id, deleted_at),
  INDEX idx_properties_org (organization_id),
  INDEX idx_properties_status (status, visibility),
  INDEX idx_properties_purpose (purpose),
  INDEX idx_properties_type (property_type),
  FULLTEXT idx_properties_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE property_locations (
  property_id CHAR(36) PRIMARY KEY,
  country_code CHAR(2) NOT NULL DEFAULT 'SA',
  region VARCHAR(120),
  city VARCHAR(120) NOT NULL,
  district VARCHAR(120),
  address_text TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_locations_city (city),
  INDEX idx_locations_district (city, district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE property_details (
  property_id CHAR(36) PRIMARY KEY,
  area_sqm DECIMAL(12,2),
  bedrooms INT,
  bathrooms INT,
  street_width DECIMAL(8,2),
  age_years INT,
  floor_number INT,
  furnished TINYINT(1),
  features JSON NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE property_prices (
  id CHAR(36) PRIMARY KEY,
  property_id CHAR(36) NOT NULL,
  price_amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  negotiable TINYINT(1) NOT NULL DEFAULT 0,
  valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_prices_property (property_id, valid_from DESC),
  INDEX idx_prices_amount (price_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE property_media (
  id CHAR(36) PRIMARY KEY,
  property_id CHAR(36) NOT NULL,
  type ENUM('image', 'video', 'document') NOT NULL DEFAULT 'image',
  storage_key VARCHAR(500) NOT NULL,
  thumbnail_key VARCHAR(500),
  sort_order INT NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  metadata JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_media_property (property_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Contacts ────────────────────────────────────────────

CREATE TABLE contacts (
  id CHAR(36) PRIMARY KEY,
  owner_user_id CHAR(36) NOT NULL,
  organization_id CHAR(36),
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(160),
  type VARCHAR(32) NOT NULL DEFAULT 'source',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  INDEX idx_contacts_owner (owner_user_id),
  INDEX idx_contacts_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE property_contacts (
  property_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NOT NULL,
  role ENUM('owner', 'agent', 'client', 'source') NOT NULL,
  PRIMARY KEY (property_id, contact_id, role),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tags ────────────────────────────────────────────────

CREATE TABLE tags (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  color VARCHAR(7),
  owner_user_id CHAR(36) NOT NULL,
  organization_id CHAR(36),
  UNIQUE KEY uq_tag (name, owner_user_id, organization_id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE property_tags (
  property_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,
  PRIMARY KEY (property_id, tag_id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Favorites & Notes ───────────────────────────────────

CREATE TABLE favorites (
  user_id CHAR(36) NOT NULL,
  property_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notes (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  property_id CHAR(36),
  contact_id CHAR(36),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Reminders ───────────────────────────────────────────

CREATE TABLE reminders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  property_id CHAR(36),
  type ENUM('follow_up', 'expiry', 'incomplete', 'custom') NOT NULL DEFAULT 'custom',
  title VARCHAR(200) NOT NULL,
  due_at TIMESTAMP NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Saved Searches ─────────────────────────────────────

CREATE TABLE saved_searches (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  filters JSON NOT NULL,
  notify TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Sharing ─────────────────────────────────────────────

CREATE TABLE share_templates (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  organization_id CHAR(36),
  name VARCHAR(120) NOT NULL,
  body_template TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE share_events (
  id CHAR(36) PRIMARY KEY,
  property_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  channel ENUM('whatsapp', 'copy', 'link') NOT NULL,
  template_id CHAR(36),
  recipient_contact_id CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_share_property (property_id),
  INDEX idx_share_user (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Ratings ─────────────────────────────────────────────

CREATE TABLE ratings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  property_id CHAR(36) NOT NULL,
  score INT NOT NULL,
  review TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rating (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Reports ─────────────────────────────────────────────

CREATE TABLE reports (
  id CHAR(36) PRIMARY KEY,
  reporter_id CHAR(36) NOT NULL,
  property_id CHAR(36),
  reported_user_id CHAR(36),
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  resolution TEXT,
  resolved_by CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Billing ─────────────────────────────────────────────

CREATE TABLE plans (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  tier ENUM('free', 'pro', 'office') NOT NULL,
  description TEXT,
  price_monthly_sar DECIMAL(10,2) DEFAULT 0,
  price_yearly_sar DECIMAL(10,2) DEFAULT 0,
  max_properties INT NOT NULL DEFAULT 10,
  max_images_per_property INT NOT NULL DEFAULT 5,
  max_organization_members INT NOT NULL DEFAULT 0,
  max_saved_searches INT NOT NULL DEFAULT 3,
  ai_enabled TINYINT(1) NOT NULL DEFAULT 0,
  export_enabled TINYINT(1) NOT NULL DEFAULT 0,
  features JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  organization_id CHAR(36),
  plan_id CHAR(36) NOT NULL,
  status ENUM('active', 'canceled', 'expired', 'trial') NOT NULL DEFAULT 'trial',
  current_period_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP NOT NULL,
  canceled_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  INDEX idx_sub_user (user_id),
  INDEX idx_sub_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY,
  subscription_id CHAR(36) NOT NULL,
  amount_sar DECIMAL(10,2) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  provider_reference TEXT,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  raw_payload JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_providers (
  id CHAR(36) PRIMARY KEY,
  provider_key VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  config JSON NOT NULL,
  supported_methods JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── AI (Phase 2) ────────────────────────────────────────

CREATE TABLE ai_jobs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  property_id CHAR(36),
  job_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  input_data JSON,
  output_data JSON,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Admin & Audit ───────────────────────────────────────

CREATE TABLE admin_audit_logs (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id CHAR(36),
  details JSON NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_audit_admin (admin_id, created_at DESC),
  INDEX idx_audit_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE security_events (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  event_type VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  details JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_security_user (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consents (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  consent_type VARCHAR(64) NOT NULL,
  accepted TINYINT(1) NOT NULL DEFAULT 1,
  accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_consent (user_id, consent_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_tickets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  priority VARCHAR(16) NOT NULL DEFAULT 'normal',
  assigned_to CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE content_pages (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(200) NOT NULL UNIQUE,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  body_ar TEXT,
  body_en TEXT,
  meta_description_ar TEXT,
  meta_description_en TEXT,
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
