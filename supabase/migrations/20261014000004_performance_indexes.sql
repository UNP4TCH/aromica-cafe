-- ============================================================================
-- Migration: 20261014000004_performance_indexes.sql
-- Description: Composite and query-covering performance indexes for public
--              and owner workload optimization.
-- Compatible with PostgreSQL 15+ & Supabase
-- ============================================================================

-- 1. Tenants composite index:
-- Accelerates public tenant resolution by slug and publication state
CREATE INDEX IF NOT EXISTS idx_tenants_slug_published
    ON tenants(slug, is_published);

-- 2. Menu categories composite index:
-- Accelerates public published menu category lookups ordered by display_order
CREATE INDEX IF NOT EXISTS idx_menu_categories_tenant_published_order
    ON menu_categories(tenant_id, is_published, display_order);

-- 3. Menu items name index:
-- Eliminates table scans during item update/delete mutations by name within tenant
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_name
    ON menu_items(tenant_id, name);

-- 4. Media assets composite index:
-- Accelerates public gallery fetch filtered by tenant, publication, and reverse-chronological order
CREATE INDEX IF NOT EXISTS idx_media_assets_tenant_published_created
    ON media_assets(tenant_id, is_published, created_at DESC);

-- 5. Menu groups category index with tenant isolation:
-- Optimizes group lookups by category with tenant filtering
CREATE INDEX IF NOT EXISTS idx_menu_groups_tenant_category_order
    ON menu_groups(tenant_id, category_id, display_order);
