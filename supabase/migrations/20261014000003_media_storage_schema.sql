-- ============================================================================
-- Migration: 20261014000003_media_storage_schema.sql
-- Description: Media assets registry and storage bucket isolation policies
-- Compatible with PostgreSQL 15+ & Supabase Storage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Media Assets Table
-- Tracks metadata for uploaded files linked to tenants, menu items, and gallery
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    content_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL,
    width INT,
    height INT,
    category TEXT NOT NULL DEFAULT 'gallery' CHECK (category IN ('gallery', 'menu', 'branding')),
    alt_text TEXT,
    caption TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_byte_size CHECK (byte_size > 0 AND byte_size <= 5242880), -- 5MB maximum limit
    CONSTRAINT valid_content_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif'))
);

CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON media_assets(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_media_assets_published ON media_assets(is_published);

-- Enable Row Level Security on media_assets
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Media Assets RLS Policies
-- Public can read published media belonging to published tenants;
-- Owners/Managers can manage all media belonging to their tenant.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read published media assets" ON media_assets;
CREATE POLICY "Public can read published media assets" ON media_assets
    FOR SELECT
    USING (
        is_published = true AND EXISTS (
            SELECT 1 FROM tenants t
            WHERE t.id = media_assets.tenant_id
              AND t.is_published = true
        )
    );

DROP POLICY IF EXISTS "Members can view tenant media assets" ON media_assets;
CREATE POLICY "Members can view tenant media assets" ON media_assets
    FOR SELECT
    TO authenticated
    USING (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Owners/Managers can manage tenant media assets" ON media_assets;
CREATE POLICY "Owners/Managers can manage tenant media assets" ON media_assets
    FOR ALL
    TO authenticated
    USING (is_tenant_owner_or_manager(tenant_id))
    WITH CHECK (is_tenant_owner_or_manager(tenant_id));

-- ----------------------------------------------------------------------------
-- 3. Storage Bucket Policy Reference (Supabase Storage: storage.objects)
-- Documents the exact bucket access rules when Supabase Storage is provisioned
-- 
-- Bucket Name: "business-media" (public bucket with path-level RLS)
-- Path Format: "tenants/{tenant_id}/{category}/{filename}"
-- ----------------------------------------------------------------------------

-- Note: The following policy definitions apply to Supabase Storage's storage.objects table.
-- They execute safely when the storage extension is active.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
        -- Allow public read of objects in published tenant paths
        EXECUTE '
            CREATE POLICY "Public read business media"
            ON storage.objects FOR SELECT
            USING (
                bucket_id = ''business-media''
                AND (storage.foldername(name))[1] = ''tenants''
                AND EXISTS (
                    SELECT 1 FROM tenants t
                    WHERE t.id = (storage.foldername(name))[2]::uuid
                      AND t.is_published = true
                )
            );
        ';

        -- Allow authenticated tenant owners to upload into their tenant directory
        EXECUTE '
            CREATE POLICY "Owners can upload to their tenant media folder"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (
                bucket_id = ''business-media''
                AND (storage.foldername(name))[1] = ''tenants''
                AND is_tenant_owner_or_manager((storage.foldername(name))[2]::uuid)
            );
        ';

        -- Allow owners to delete objects in their tenant directory
        EXECUTE '
            CREATE POLICY "Owners can delete their tenant media files"
            ON storage.objects FOR DELETE
            TO authenticated
            USING (
                bucket_id = ''business-media''
                AND (storage.foldername(name))[1] = ''tenants''
                AND is_tenant_owner_or_manager((storage.foldername(name))[2]::uuid)
            );
        ';
    END IF;
END $$;
