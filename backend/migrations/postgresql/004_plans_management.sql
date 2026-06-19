-- Aqarati Plans Management Migration
-- Adds: plan_features table, enum types, plan columns for admin management

-- ─── New Enums ──────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE plan_billing_interval AS ENUM ('monthly', 'yearly', 'one_time');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_status AS ENUM ('draft', 'active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_visibility AS ENUM ('public', 'internal', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Plan Columns ────────────────────────────────────────

ALTER TABLE plans ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS billing_interval plan_billing_interval DEFAULT 'monthly';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS badge_label_ar TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS badge_label_en TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS visibility plan_visibility DEFAULT 'public';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_total_images INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_team_members INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_ai_requests_per_month INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS featured_listings_limit INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS support_level TEXT DEFAULT 'basic';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Convert existing status column from is_active to plan_status
ALTER TABLE plans ADD COLUMN IF NOT EXISTS status plan_status DEFAULT 'active';
UPDATE plans SET status = CASE WHEN is_active THEN 'active'::plan_status ELSE 'inactive'::plan_status END;

-- Backfill existing plans with AR names
UPDATE plans SET
    name_ar = CASE
        WHEN name = 'مجاني' THEN 'مجاني'
        WHEN name = 'احترافي' THEN 'احترافي'
        WHEN name = 'مكتب' THEN 'مكتب'
        ELSE name
    END,
    slug = CASE
        WHEN name = 'مجاني' THEN 'free'
        WHEN name = 'احترافي' THEN 'pro'
        WHEN name = 'مكتب' THEN 'office'
        ELSE lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g'))
    END,
    description_ar = CASE
        WHEN name = 'مجاني' THEN 'الباقة المجانية للوسيط الفردي'
        WHEN name = 'احترافي' THEN 'للمحترفين الباحثين عن أدوات أقوى'
        WHEN name = 'مكتب' THEN 'للمكاتب العقارية والفرق'
        ELSE description
    END,
    billing_interval = 'monthly',
    currency = 'SAR',
    trial_days = CASE WHEN name = 'مجاني' THEN 0 WHEN name = 'احترافي' THEN 14 ELSE 0 END,
    is_featured = CASE WHEN name = 'احترافي' THEN TRUE ELSE FALSE END,
    is_popular = CASE WHEN name = 'احترافي' THEN TRUE ELSE FALSE END,
    display_order = CASE WHEN name = 'مجاني' THEN 1 WHEN name = 'احترافي' THEN 2 WHEN name = 'مكتب' THEN 3 ELSE 99 END,
    badge_label_ar = CASE WHEN name = 'احترافي' THEN 'الأكثر شيوعاً' ELSE NULL END,
    max_total_images = max_properties * max_images_per_property,
    max_storage_mb = CASE WHEN name = 'مجاني' THEN 100 WHEN name = 'احترافي' THEN 1024 WHEN name = 'مكتب' THEN 5120 ELSE NULL END,
    max_team_members = max_organization_members,
    max_ai_requests_per_month = CASE WHEN ai_enabled THEN 100 ELSE 0 END,
    featured_listings_limit = CASE WHEN name = 'مجاني' THEN 0 WHEN name = 'احترافي' THEN 5 WHEN name = 'مكتب' THEN 20 ELSE 0 END,
    support_level = CASE WHEN name = 'مجاني' THEN 'basic' WHEN name = 'احترافي' THEN 'priority' WHEN name = 'مكتب' THEN 'dedicated' ELSE 'basic' END;

-- ─── Plan Features Table ─────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_features (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id       UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_key   TEXT NOT NULL,
    label_ar      TEXT NOT NULL,
    label_en      TEXT,
    is_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    value_limit   TEXT,
    display_order INTEGER DEFAULT 0,
    tooltip_ar    TEXT,
    tooltip_en    TEXT,
    is_included   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(plan_id, feature_key)
);

-- ─── Seed plan features from existing JSONB features ─────

INSERT INTO plan_features (plan_id, feature_key, label_ar, is_enabled, display_order, is_included)
SELECT
    p.id,
    'feature_' || (row_number() OVER (PARTITION BY p.id ORDER BY f.value)),
    f.value::TEXT,
    TRUE,
    row_number() OVER (PARTITION BY p.id ORDER BY f.value),
    TRUE
FROM plans p,
     jsonb_array_elements_text(p.features) AS f(value)
WHERE p.features IS NOT NULL AND jsonb_array_length(p.features) > 0
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ─── RBAC Permissions for Plan Management ────────────────

INSERT INTO permissions (id, name, description, category) VALUES
    ('00000000-0000-0000-0000-100000000011', 'admin.plans.create',         'Create new plans', 'admin'),
    ('00000000-0000-0000-0000-100000000012', 'admin.plans.archive',        'Archive plans', 'admin'),
    ('00000000-0000-0000-0000-100000000013', 'admin.plans.delete',         'Hard delete plans', 'admin'),
    ('00000000-0000-0000-0000-100000000014', 'admin.plans.feature',        'Manage plan featured/popular flags', 'admin'),
    ('00000000-0000-0000-0000-100000000015', 'admin.plans.pricing.update', 'Change plan pricing', 'admin'),
    ('00000000-0000-0000-0000-100000000016', 'admin.subscriptions.read',   'View subscriptions', 'admin'),
    ('00000000-0000-0000-0000-100000000017', 'admin.subscriptions.update', 'Modify subscriptions', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Assign new permissions to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000010', id FROM permissions
WHERE name IN (
    'admin.plans.create', 'admin.plans.archive', 'admin.plans.delete',
    'admin.plans.feature', 'admin.plans.pricing.update',
    'admin.subscriptions.read', 'admin.subscriptions.update'
)
ON CONFLICT DO NOTHING;
