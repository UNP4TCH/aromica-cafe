-- ============================================================================
-- Migration: 20261014000001_initial_schema.sql
-- Description: Core relational schema for multi-tenant business website management
-- Compatible with PostgreSQL 15+ & Supabase
-- ============================================================================

-- Ensure pgcrypto or uuid extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Tenants Table
-- Identifies each client business entity in the multi-tenant system
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 3 AND length(slug) <= 64),
    CONSTRAINT name_length CHECK (length(trim(name)) > 0 AND length(name) <= 120)
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_published ON tenants(is_published);

-- ----------------------------------------------------------------------------
-- 2. Tenant Users Table (Memberships & Role Mapping)
-- Binds Supabase auth.users to specific tenants with explicit roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);

-- ----------------------------------------------------------------------------
-- 3. Business Profiles Table
-- Stores brand identity, location, contact, and storytelling information
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    brand_word1 TEXT NOT NULL DEFAULT '',
    brand_word2 TEXT NOT NULL DEFAULT '',
    tagline TEXT NOT NULL DEFAULT '',
    slogan TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    neighborhood TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    landmarks JSONB NOT NULL DEFAULT '[]'::jsonb,
    landmark_guidance TEXT NOT NULL DEFAULT '',
    visit_description TEXT NOT NULL DEFAULT '',
    phone JSONB NOT NULL DEFAULT '{}'::jsonb,
    whatsapp JSONB NOT NULL DEFAULT '{}'::jsonb,
    instagram JSONB NOT NULL DEFAULT '{}'::jsonb,
    reviews JSONB NOT NULL DEFAULT '{}'::jsonb,
    order_online JSONB NOT NULL DEFAULT '{}'::jsonb,
    menu_flipbook JSONB NOT NULL DEFAULT '{}'::jsonb,
    directions JSONB NOT NULL DEFAULT '{}'::jsonb,
    coordinates JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
    hero_image JSONB NOT NULL DEFAULT '{}'::jsonb,
    atmosphere JSONB NOT NULL DEFAULT '{}'::jsonb,
    menu_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_tenant ON business_profiles(tenant_id);

-- ----------------------------------------------------------------------------
-- 4. Operating Schedules Table
-- Stores weekly opening and closing schedules with timezone evaluation data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operating_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    day_index INT NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
    hours TEXT NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    open_minutes INT CHECK (open_minutes IS NULL OR (open_minutes >= 0 AND open_minutes <= 1440)),
    close_minutes INT CHECK (close_minutes IS NULL OR (close_minutes >= 0 AND close_minutes <= 1440)),
    open_display TEXT,
    close_display TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, day_index)
);

CREATE INDEX IF NOT EXISTS idx_schedules_tenant ON operating_schedules(tenant_id);

-- ----------------------------------------------------------------------------
-- 5. Menu Categories Table
-- Represents top-level menu groupings (e.g., Beverages, Momos, Burgers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug_id TEXT NOT NULL,
    label TEXT NOT NULL CHECK (length(trim(label)) > 0 AND length(label) <= 100),
    description TEXT CHECK (description IS NULL OR length(description) <= 300),
    display_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, slug_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_tenant ON menu_categories(tenant_id, display_order);

-- ----------------------------------------------------------------------------
-- 6. Menu Groups Table
-- Represents subheadings within a category (e.g., "Hot Coffee", "Momos (6 pcs)")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 100),
    note TEXT CHECK (note IS NULL OR length(note) <= 200),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_groups_category ON menu_groups(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_groups_tenant ON menu_groups(tenant_id);

-- ----------------------------------------------------------------------------
-- 7. Menu Items Table
-- Individual offerings with pricing, veg classification, and availability
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES menu_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 120),
    price TEXT NOT NULL CHECK (length(trim(price)) > 0 AND length(price) <= 50),
    veg BOOLEAN NOT NULL DEFAULT true,
    description TEXT CHECK (description IS NULL OR length(description) <= 500),
    note TEXT CHECK (note IS NULL OR length(note) <= 200),
    available BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_group ON menu_items(group_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);

-- ----------------------------------------------------------------------------
-- 8. Audit Logs Table
-- Immutable audit trail recording administrative and owner modifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- Automatic Updated-At Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_business_profiles_updated_at ON business_profiles;
CREATE TRIGGER trg_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_operating_schedules_updated_at ON operating_schedules;
CREATE TRIGGER trg_operating_schedules_updated_at BEFORE UPDATE ON operating_schedules FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_menu_categories_updated_at ON menu_categories;
CREATE TRIGGER trg_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_menu_groups_updated_at ON menu_groups;
CREATE TRIGGER trg_menu_groups_updated_at BEFORE UPDATE ON menu_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON menu_items;
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
