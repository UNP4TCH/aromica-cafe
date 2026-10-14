-- ============================================================================
-- Migration: 20261014000002_rls_policies.sql
-- Description: Row Level Security (RLS) policies for tenant isolation & safe public access
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. Security Definer Helper Functions
-- Evaluates membership without causing recursive policy evaluation
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_id = p_tenant_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_tenant_owner_or_manager(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_id = p_tenant_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- 2. Tenants Table Policies
-- Public can view published tenants; members can view their own tenant record
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can view published tenants" ON tenants;
CREATE POLICY "Public can view published tenants" ON tenants
    FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Members can view their own tenant" ON tenants;
CREATE POLICY "Members can view their own tenant" ON tenants
    FOR SELECT
    TO authenticated
    USING (is_tenant_member(id));

-- ----------------------------------------------------------------------------
-- 3. Tenant Users (Memberships) Table Policies
-- Users can only view their own memberships; owners can manage memberships in their tenant
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own tenant memberships" ON tenant_users;
CREATE POLICY "Users can view their own tenant memberships" ON tenant_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_tenant_owner_or_manager(tenant_id));

DROP POLICY IF EXISTS "Owners can manage memberships in their tenant" ON tenant_users;
CREATE POLICY "Owners can manage memberships in their tenant" ON tenant_users
    FOR ALL
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id))
    WITH CHECK (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 4. Business Profiles Policies
-- Public read for published tenants; Owners/managers can view and update
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read published business profile" ON business_profiles;
CREATE POLICY "Public can read published business profile" ON business_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenants t
            WHERE t.id = business_profiles.tenant_id
              AND t.is_published = true
        )
    );

DROP POLICY IF EXISTS "Owners/Managers can update business profile" ON business_profiles;
CREATE POLICY "Owners/Managers can update business profile" ON business_profiles
    FOR UPDATE
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id))
    WITH CHECK (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 5. Operating Schedules Policies
-- Public read for published tenants; Owners/managers can manage schedules
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read published schedules" ON operating_schedules;
CREATE POLICY "Public can read published schedules" ON operating_schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenants t
            WHERE t.id = operating_schedules.tenant_id
              AND t.is_published = true
        )
    );

DROP POLICY IF EXISTS "Owners/Managers can manage schedules" ON operating_schedules;
CREATE POLICY "Owners/Managers can manage schedules" ON operating_schedules
    FOR ALL
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id))
    WITH CHECK (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 6. Menu Categories Policies
-- Public read for published categories of published tenants; Owners can mutate
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read published categories" ON menu_categories;
CREATE POLICY "Public can read published categories" ON menu_categories
    FOR SELECT
    USING (
        is_published = true AND EXISTS (
            SELECT 1 FROM tenants t
            WHERE t.id = menu_categories.tenant_id
              AND t.is_published = true
        )
    );

DROP POLICY IF EXISTS "Members can view all tenant categories" ON menu_categories;
CREATE POLICY "Members can view all tenant categories" ON menu_categories
    FOR SELECT
    TO authenticated
    USING (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Owners/Managers can manage categories" ON menu_categories;
CREATE POLICY "Owners/Managers can manage categories" ON menu_categories
    FOR ALL
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id))
    WITH CHECK (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 7. Menu Groups Policies
-- Public read for groups belonging to published categories; Owners can mutate
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read published groups" ON menu_groups;
CREATE POLICY "Public can read published groups" ON menu_groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM menu_categories mc
            JOIN tenants t ON t.id = mc.tenant_id
            WHERE mc.id = menu_groups.category_id
              AND mc.is_published = true
              AND t.is_published = true
        )
    );

DROP POLICY IF EXISTS "Members can view all tenant groups" ON menu_groups;
CREATE POLICY "Members can view all tenant groups" ON menu_groups
    FOR SELECT
    TO authenticated
    USING (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Owners/Managers can manage groups" ON menu_groups;
CREATE POLICY "Owners/Managers can manage groups" ON menu_groups
    FOR ALL
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id))
    WITH CHECK (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 8. Menu Items Policies
-- Public read for items of published groups; Owners/managers can mutate
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read published menu items" ON menu_items;
CREATE POLICY "Public can read published menu items" ON menu_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM menu_groups mg
            JOIN menu_categories mc ON mc.id = mg.category_id
            JOIN tenants t ON t.id = mc.tenant_id
            WHERE mg.id = menu_items.group_id
              AND mc.is_published = true
              AND t.is_published = true
        )
    );

DROP POLICY IF EXISTS "Members can view all tenant menu items" ON menu_items;
CREATE POLICY "Members can view all tenant menu items" ON menu_items
    FOR SELECT
    TO authenticated
    USING (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Owners/Managers can manage menu items" ON menu_items;
CREATE POLICY "Owners/Managers can manage menu items" ON menu_items
    FOR ALL
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id))
    WITH CHECK (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 9. Audit Logs Policies
-- Only owners and managers can read audit logs for their tenant; no public access
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Owners can view audit logs" ON audit_logs;
CREATE POLICY "Owners can view audit logs" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 10. Audit Logging Trigger Function
-- Automatically creates audit logs on menu item and category changes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION log_menu_item_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        auth.uid(),
        TG_OP,
        'menu_item',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_menu_items ON menu_items;
CREATE TRIGGER trg_audit_menu_items
    AFTER INSERT OR UPDATE OR DELETE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION log_menu_item_change();
