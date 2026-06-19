-- Aqarati RBAC Foundation Migration
-- Creates roles, permissions, role_permissions, user_roles tables
-- Adds must_change_password to users

-- ─── RBAC Tables ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL UNIQUE,
    description  TEXT,
    scope        TEXT NOT NULL DEFAULT 'platform', -- platform, organization
    is_system    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    category    TEXT NOT NULL DEFAULT 'general',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_by   UUID REFERENCES users(id),
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'))
);

-- ─── must_change_password ───────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Seed Roles ──────────────────────────────────────────

INSERT INTO roles (id, name, description, scope, is_system) VALUES
    ('00000000-0000-0000-0000-000000000010', 'super_admin',        'Super Admin — full platform access', 'platform', TRUE),
    ('00000000-0000-0000-0000-000000000011', 'admin_manager',      'Admin Manager — manage users, roles', 'platform', TRUE),
    ('00000000-0000-0000-0000-000000000012', 'support_agent',      'Support Agent — view users, handle reports', 'platform', TRUE),
    ('00000000-0000-0000-0000-000000000013', 'billing_manager',    'Billing Manager — manage plans, payments', 'platform', TRUE),
    ('00000000-0000-0000-0000-000000000014', 'content_moderator',  'Content Moderator — review properties, reports', 'platform', TRUE),
    ('00000000-0000-0000-0000-000000000015', 'readonly_auditor',   'Read Only Auditor — view-only access', 'platform', TRUE),
    ('00000000-0000-0000-0000-000000000016', 'org_owner',          'Organization Owner', 'organization', FALSE),
    ('00000000-0000-0000-0000-000000000017', 'org_admin',          'Organization Admin', 'organization', FALSE),
    ('00000000-0000-0000-0000-000000000018', 'agent',              'Agent/Broker', 'organization', FALSE),
    ('00000000-0000-0000-0000-000000000019', 'viewer',             'Viewer — read-only org access', 'organization', FALSE),
    ('00000000-0000-0000-0000-000000000020', 'customer',           'Customer/Public User', 'platform', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ─── Seed Permissions ─────────────────────────────────────

INSERT INTO permissions (id, name, description, category) VALUES
    ('00000000-0000-0000-0000-100000000000', 'admin.users.read',         'View users list', 'admin'),
    ('00000000-0000-0000-0000-100000000001', 'admin.users.update',       'Update user accounts', 'admin'),
    ('00000000-0000-0000-0000-100000000002', 'admin.users.suspend',      'Suspend/activate users', 'admin'),
    ('00000000-0000-0000-0000-100000000003', 'admin.roles.manage',       'Manage roles and permissions', 'admin'),
    ('00000000-0000-0000-0000-100000000004', 'admin.billing.read',       'View billing/subscriptions', 'admin'),
    ('00000000-0000-0000-0000-100000000005', 'admin.billing.update',     'Update billing/subscriptions', 'admin'),
    ('00000000-0000-0000-0000-100000000006', 'admin.plans.manage',       'Create/update/delete plans', 'admin'),
    ('00000000-0000-0000-0000-100000000007', 'admin.audit.read',         'View audit logs', 'admin'),
    ('00000000-0000-0000-0000-100000000008', 'admin.payment_providers.manage', 'Manage payment providers', 'admin'),
    ('00000000-0000-0000-0000-100000000009', 'admin.reports.manage',     'Manage reports', 'admin'),
    ('00000000-0000-0000-0000-100000000010', 'admin.dashboard.read',     'View admin dashboard stats', 'admin'),
    ('00000000-0000-0000-0000-200000000000', 'properties.create',        'Create properties', 'properties'),
    ('00000000-0000-0000-0000-200000000001', 'properties.read.own',      'Read own properties', 'properties'),
    ('00000000-0000-0000-0000-200000000002', 'properties.update.own',    'Update own properties', 'properties'),
    ('00000000-0000-0000-0000-200000000003', 'properties.delete.own',    'Delete own properties', 'properties'),
    ('00000000-0000-0000-0000-200000000004', 'properties.media.upload',  'Upload property media', 'properties'),
    ('00000000-0000-0000-0000-200000000005', 'properties.read.org',      'Read org properties', 'properties'),
    ('00000000-0000-0000-0000-300000000000', 'org.members.invite',       'Invite members to org', 'organization'),
    ('00000000-0000-0000-0000-300000000001', 'org.members.manage',       'Manage org members', 'organization'),
    ('00000000-0000-0000-0000-300000000002', 'org.settings.manage',      'Manage org settings', 'organization'),
    ('00000000-0000-0000-0000-400000000000', 'profile.read.own',         'Read own profile', 'profile'),
    ('00000000-0000-0000-0000-400000000001', 'profile.update.own',       'Update own profile', 'profile'),
    ('00000000-0000-0000-0000-500000000000', 'billing.subscription.manage', 'Manage subscription', 'billing'),
    ('00000000-0000-0000-0000-500000000001', 'billing.invoices.read',    'Read invoices', 'billing')
ON CONFLICT (name) DO NOTHING;

-- ─── Assign permissions to super_admin ────────────────────

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000010', id FROM permissions
ON CONFLICT DO NOTHING;

-- ─── Assign basic permissions to customer ─────────────────

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000020', id FROM permissions
WHERE name IN (
    'properties.create', 'properties.read.own', 'properties.update.own',
    'properties.delete.own', 'properties.media.upload',
    'profile.read.own', 'profile.update.own',
    'billing.subscription.manage', 'billing.invoices.read'
)
ON CONFLICT DO NOTHING;
