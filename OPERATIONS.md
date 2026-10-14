# Operations Runbook: Aromica Café & Owner Management System

**Reference Implementation**: Aromica Café (`aromica-cafe`)  
**Creator & Architect**: Susmit Dey (+91 9007801474 / susmitdey047@gmail.com)  
**System Classification**: Concept Demonstration & Owner Management Showcase  
**Document Status**: Operational Guide (Cloud-dependent steps marked *[Requires Live Cloud Provisioning]*)

---

## 1. System Architecture Overview

The system consists of two independently runnable applications sharing a centralized, tenant-isolated data contract:

1. **Public Business Website (`src/`)**: High-performance, SEO-optimized, responsive public website with editorial typography (`DM Serif Display`, `Libre Baskerville`), tactile interactions, and Stale-While-Revalidate (SWR) cache revalidation (60s TTL).
2. **Owner Management Dashboard (`apps/owner-dashboard/`)**: Mobile-first private management interface for business owners with dual modes (in-memory portfolio simulation and authenticated Supabase session with tenant RLS).

---

## 2. Environment Variables & Credential Security

Create a `.env` file in the repository root (`d:\agency\cafe-aromica\aromica-final`) based on [`.env.example`](file:///d:/agency/cafe-aromica/aromica-final/.env.example).

```env
# Supabase Project URL (Project Settings -> API)
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co

# Supabase Public Anon Key (Protected by Postgres Row Level Security)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Primary Public Tenant Slug
VITE_DEFAULT_TENANT_SLUG=aromica-cafe
```

### Critical Security Boundaries
- **NEVER expose the `service_role` key**: Neither the public website nor the owner dashboard requires or should ever include `SUPABASE_SERVICE_ROLE_KEY`.
- **Client Safety**: All public and owner dashboard queries operate through the public `anon` key, authenticated tokens (`auth.users`), and PostgreSQL Row Level Security (RLS).
- **Offline / Graceful Degradation**: If `.env` is absent or contains placeholder keys, `isSupabaseConfigured` detects this automatically and transparently falls back to approved Phase 1 verified contracts without error toasts or broken UI.

---

## 3. Migration & Seed Execution Order

When provisioning a fresh Supabase project, execute the SQL scripts in the **SQL Editor** in this exact sequence:

1. [`supabase/migrations/20261014000001_initial_schema.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/migrations/20261014000001_initial_schema.sql)
   - Enables `pgcrypto`.
   - Creates `tenants`, `tenant_users`, `business_profiles`, `operating_schedules`, `menu_categories`, `menu_groups`, `menu_items`, and `audit_logs`.
   - Sets up automated `updated_at` triggers and foreign key cascades.
2. [`supabase/migrations/20261014000002_rls_policies.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/migrations/20261014000002_rls_policies.sql)
   - Enables Row Level Security on all 8 tables.
   - Creates security definer functions: `is_tenant_member(UUID)` and `is_tenant_owner_or_manager(UUID)`.
   - Attaches public read policies (`is_published = true`) and owner mutation policies (`is_tenant_owner_or_manager`).
   - Attaches `trg_audit_menu_items` for automatic audit logging.
3. [`supabase/migrations/20261014000003_media_storage_schema.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/migrations/20261014000003_media_storage_schema.sql)
   - Creates `media_assets` registry table with size (`byte_size <= 5242880`) and MIME type constraints.
   - Attaches RLS policies for published tenant reads and authenticated owner management.
   - Enforces storage bucket path isolation (`storage.objects`).
4. [`supabase/seed.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/seed.sql)
   - Populates Aromica Café (`a0000000-0000-0000-0000-000000000001`, published).
   - Populates Bistro Verona (`b0000000-0000-0000-0000-000000000002`, unpublished isolation fixture).
   - Seeds menu categories, operating schedule, and items.

---

## 4. Tenant Provisioning & Owner Binding Workflow

*[Requires Live Cloud Provisioning]*

To onboard a new owner or associate an owner with the Aromica Café demo:

### Step 1: Create the User in Supabase Auth
In **Authentication > Users**, click **Add User > Create User**:
- **Email**: `owner@aromica.in`
- **Password**: `<secure password>`
- **Auto-confirm**: Checked (bypasses email confirmation)
- Copy the generated `User UID`.

### Step 2: Bind User to Tenant in `tenant_users`
Run this query in the SQL Editor:
```sql
INSERT INTO tenant_users (tenant_id, user_id, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    '<PASTE_USER_UID_HERE>'::uuid,
    'owner'
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;
```

---

## 5. Storage Bucket Configuration (`business-media`)

*[Requires Live Cloud Provisioning]*

1. In Supabase Dashboard, go to **Storage > Create a new bucket**.
2. **Bucket name**: `business-media`
3. **Public bucket**: Enabled.
4. **Allowed MIME types**: `image/webp, image/jpeg, image/png, image/avif`
5. **File size limit**: `5 MB`
6. Verify bucket policies: [`20261014000003_media_storage_schema.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/migrations/20261014000003_media_storage_schema.sql) handles object-level RLS so only authenticated owners can write/delete in their tenant directory (`tenants/{tenant_id}/*`).

---

## 6. Orphaned Media Detection & Storage Reconciliation

In web applications, storage uploads and database metadata inserts occur in separate network calls.

### Risk
If a network disconnect occurs after file upload to S3/Storage but before database metadata registration, an unreferenced "orphaned" storage object is created.

### Manual Reconciliation Query (SQL Editor)
*[Requires Live Cloud Provisioning]*
```sql
-- Find storage objects that have no corresponding record in media_assets
SELECT s.name AS orphaned_storage_path, s.created_at, s.metadata->>'size' AS size_bytes
FROM storage.objects s
LEFT JOIN media_assets m ON m.storage_path = s.name
WHERE s.bucket_id = 'business-media'
  AND m.id IS NULL
  AND s.created_at < now() - interval '24 hours';
```

---

## 7. Backup, Disaster Recovery & Limitations

### Managed Database Backups
- **Free Tier**: Supabase provides point-in-time recovery on Pro plans and automated daily logical dumps.
- **Manual Database Export**:
  ```bash
  # Via Supabase CLI (if installed)
  supabase db dump -f backup_$(date +%Y%m%d).sql
  ```

### Storage Backups
- Storage bucket files (`storage.objects`) are **not** included in logical SQL dumps.
- They reside in object storage (AWS S3) and require separate bucket replication if multi-region redundancy is mandated.

### Disaster Recovery
In the event of total project failure:
1. Recreate project.
2. Execute migrations 1 through 3.
3. Reapply `seed.sql` or restore data dump.
4. If storage is wiped, the public website automatically falls back to Phase 1 verified static contracts without breaking visitor experience.

---

## 8. Handoff & Tenant Publication Controls

To unpublish or pause a client's public website without destroying data:
```sql
-- Instantly hides tenant from public website and blocks public bucket media reads
UPDATE tenants SET is_published = false WHERE slug = 'aromica-cafe';
```
When unpublished:
- Public queries return empty/error.
- Public site immediately degrades to safe offline fallback or concept landing screen.
- Storage RLS blocks direct object downloads from `business-media`.
- Owners can still log into the management system to make updates.

---

## 9. Role Architecture & Authorization Boundaries

### Tenant Level (`tenant_users`)
- `owner`: Restricted to their single assigned `tenant_id`. Can edit menu, hours, media, and profile.
- `manager`: Restricted to their single assigned `tenant_id`.
- `staff`: Read-only access within their assigned `tenant_id`.
- Evaluated via `is_tenant_member()` and `is_tenant_owner_or_manager()`.

*Security Boundary:* Tenant owners and managers can never mutate data outside their tenant boundary. All client queries operate via the public `anon` key.

---

## 10. Operational Verification Status

| Procedure | Verification Status | Target Environment |
| :--- | :--- | :--- |
| Core Schema Migrations (01–03) | Verified Code / Simulated | Local Node & Test Harness |
| RLS Tenant Isolation (9 Tables) | Verified Code / Simulated | Local Test Suite (`rlsPoliciesAndIsolation.test.ts`) |
| Production Environment Validation | Verified Code / Simulated | Local Test Suite (`productionReadiness.test.ts`) |
| In-Memory Owner Simulation | Verified Locally | Browser Runtime / Owner Dashboard |
| Production Static Builds (Both Apps) | Verified Locally | Vite Build Runner (2 applications) |
| Live Supabase Auth Handshake | *Pending Provisioning* | Cloud Supabase Project |
| Live Storage Uploads & Bucket RLS | *Pending Provisioning* | Cloud Supabase S3 Storage |
| Live `audit_logs` Triggering | *Pending Provisioning* | Cloud PostgreSQL Instance |

---

## 11. Production Deployment Runbooks (Two Applications)

The platform supports independent deployment of each application layer to static hosting providers (e.g. Vercel, Netlify, Cloudflare Pages, or AWS S3/CloudFront).

### Application 1: Public Business Website
* **Repository Root**: `/`
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Environment Variables**:
  * `VITE_SUPABASE_URL`: (Optional) Production Supabase URL
  * `VITE_SUPABASE_ANON_KEY`: (Optional) Production public anon key
  * `VITE_DEFAULT_TENANT_SLUG`: `aromica-cafe` (or target tenant slug)
* **Single-Page App Routing**: Rewrite all routes `/*` to `/index.html`.

### Application 2: Owner Management Dashboard
* **Repository Root**: `/`
* **Build Command**: `npm run build:dashboard`
* **Output Directory**: `apps/owner-dashboard/dist`
* **Environment Variables**: Same as Public Website (uses public anon key only).
* **Single-Page App Routing**: Rewrite all routes `/*` to `/index.html`.

---

## 12. Capability Matrix: Interactive Simulation vs Live Connected

| System Capability | Interactive Simulation Mode (Today) | Live Connected Database Mode (When Provisioned) |
| :--- | :--- | :--- |
| **Public Website Viewing** | Serves verified offline snapshot with responsive menu, gallery, hours badge | Fetches live PostgreSQL data with 60s Stale-While-Revalidate (SWR) cache |
| **Owner Authentication** | Instant single-click demo session (no credentials needed) | Supabase Auth email/password with JWT session persistence |
| **Menu Editing & 86'ing** | Full in-memory edit; instant UI reflection; resets on session clear | Direct PostgreSQL UPDATE protected by `is_tenant_owner_or_manager` RLS |
| **Media Management** | Browser `blob:` preview URLs; full metadata validation & simulation | Uploads to `business-media` bucket; metadata stored in `media_assets` |
| **Owner Activity Trail** | Real-time in-memory timeline badged as `SIMULATED` | Queries real `audit_logs` populated by PostgreSQL triggers |
| **Order/Payments/DNS** | *Explicitly Out of Scope*: Planned roadmap badges only | *Explicitly Out of Scope*: Planned roadmap badges only |


