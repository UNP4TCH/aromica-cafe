# Supabase Backend & Database Foundation

This directory contains the reproducible database schema, PostgreSQL Row Level Security (RLS) policies, storage bucket configurations, and seed data for **Aromica Café** and the **Owner Management System**.

---

## 1. Architecture & Security Overview

* **Database Engine**: PostgreSQL 15+ (Hosted on managed Supabase).
* **Multi-Tenant Model**: Database partitioned strictly by `tenant_id UUID REFERENCES tenants(id)` for future multi-tenant expansion.
* **Isolation Enforcement**: Enforced at the PostgreSQL engine level via **Row Level Security (RLS)** using `SECURITY DEFINER` helper functions (`is_tenant_member`, `is_tenant_owner_or_manager`).
* **Client Security Boundary**:
  * Public browsers and anonymous visitors ONLY receive `VITE_SUPABASE_ANON_KEY`.
  * `SUPABASE_SERVICE_ROLE_KEY` is strictly forbidden from client bundles and never committed to source control.
  * Public read queries are restricted to tenants, profiles, schedules, menus, and media where `is_published = true`.
  * Cross-tenant write operations fail immediately via PostgreSQL `WITH CHECK` constraint violation.

---

## 2. Migration Files & Schema Structure

| Migration File | Description | Tables Covered |
| :--- | :--- | :--- |
| [`migrations/20261014000001_initial_schema.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/migrations/20261014000001_initial_schema.sql) | Relational tables, foreign keys, triggers & constraints | `tenants`, `tenant_users`, `business_profiles`, `operating_schedules`, `menu_categories`, `menu_groups`, `menu_items`, `audit_logs` |
| [`migrations/20261014000002_rls_policies.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/migrations/20261014000002_rls_policies.sql) | RLS activation, helper functions, public read & owner write policies | Row Level Security enabled across core tables with `WITH CHECK` tenant validation and `trg_audit_menu_items` |
| [`migrations/20261014000003_media_storage_schema.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/migrations/20261014000003_media_storage_schema.sql) | Media assets registry & Storage bucket isolation policies | `media_assets` table and `business-media` bucket policies for path format `tenants/{tenant_id}/{category}/{filename}` |
| [`seed.sql`](file:///d:/agency/cafe-aromica/aromica-final/supabase/seed.sql) | Seed script for primary demo tenant and secondary test tenant | Seeds `aromica-cafe` demo tenant (with full menu, hours, profile) and private `bistro-verona` test tenant |

---

## 3. Data Model & Relational Boundaries

```
tenants (id, slug, name, is_demo, is_published)
   ├── tenant_users (tenant_id, user_id, role: 'owner' | 'manager' | 'staff')
   ├── business_profiles (tenant_id, brand, address, phone, whatsapp, coordinates, ...)
   ├── operating_schedules (tenant_id, day, day_index, open_minutes, close_minutes, ...)
   ├── media_assets (tenant_id, filename, storage_path, public_url, byte_size, category, ...)
   └── menu_categories (tenant_id, slug_id, label, display_order, is_published)
          └── menu_groups (tenant_id, category_id, title, note, ...)
                 └── menu_items (tenant_id, group_id, name, price, veg, available, ...)
```

---

## 4. Execution Sequence (When Cloud Supabase is Provisioned)

When executing in the Supabase **SQL Editor**:
1. Run `migrations/20261014000001_initial_schema.sql`
2. Run `migrations/20261014000002_rls_policies.sql`
3. Run `migrations/20261014000003_media_storage_schema.sql`
4. Run `seed.sql`

---

## 5. Automated Verification & Testing

Run the automated test suite across all 7 test files:
```bash
npm run test
```

This verifies:
* All 9 core platform tables have Row Level Security explicitly enabled.
* Security definer functions (`is_tenant_member`, `is_tenant_owner_or_manager`) are defined.
* Public read policies strictly require `is_published = true`.
* Mutating policies enforce `WITH CHECK` tenant constraints.
* RBAC simulation tests Public visitor, Tenant Owner, and Tenant Manager roles.
* Media validation enforces file size limits, supported MIME signatures, and filename path sanitation.
* No service role secrets are exposed in client environment templates or bundles.
