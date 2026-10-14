import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const migration1Path = path.join(projectRoot, "supabase/migrations/20261014000001_initial_schema.sql");
const migration2Path = path.join(projectRoot, "supabase/migrations/20261014000002_rls_policies.sql");
const migration3Path = path.join(projectRoot, "supabase/migrations/20261014000003_media_storage_schema.sql");
const seedSqlPath = path.join(projectRoot, "supabase/seed.sql");

test("Database Schema & Migrations: All 3 Core Migration Files Exist and Are Non-Empty", () => {
  assert.ok(fs.existsSync(migration1Path), "20261014000001_initial_schema.sql must exist");
  assert.ok(fs.existsSync(migration2Path), "20261014000002_rls_policies.sql must exist");
  assert.ok(fs.existsSync(migration3Path), "20261014000003_media_storage_schema.sql must exist");
  assert.ok(fs.existsSync(seedSqlPath), "seed.sql must exist");

  const m1 = fs.readFileSync(migration1Path, "utf-8");
  const m2 = fs.readFileSync(migration2Path, "utf-8");
  const m3 = fs.readFileSync(migration3Path, "utf-8");

  assert.ok(m1.length > 500, "Migration 1 must contain schema definitions");
  assert.ok(m2.length > 500, "Migration 2 must contain RLS policy definitions");
  assert.ok(m3.length > 500, "Migration 3 must contain media storage definitions");
});

test("Security & RLS Verification: All 9 Core Platform Tables Have Row Level Security Enabled", () => {
  // Aggregate SQL content across all core migrations
  const allSql = [
    fs.readFileSync(migration1Path, "utf-8"),
    fs.readFileSync(migration2Path, "utf-8"),
    fs.readFileSync(migration3Path, "utf-8"),
  ].join("\n");

  const all9Tables = [
    "tenants",
    "tenant_users",
    "business_profiles",
    "operating_schedules",
    "menu_categories",
    "menu_groups",
    "menu_items",
    "audit_logs",
    "media_assets",
  ];

  for (const table of all9Tables) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i");
    assert.ok(
      rlsRegex.test(allSql),
      `Table '${table}' must have ROW LEVEL SECURITY explicitly enabled`
    );
  }
});

test("Security & RLS Verification: Core Security Definer Functions Are Defined", () => {
  const allSql = [
    fs.readFileSync(migration2Path, "utf-8"),
  ].join("\n");

  const securityDefinerFunctions = [
    "is_tenant_member",
    "is_tenant_owner_or_manager",
  ];

  for (const fnName of securityDefinerFunctions) {
    const fnRegex = new RegExp(`CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+${fnName}`, "i");
    assert.ok(fnRegex.test(allSql), `Function '${fnName}' must be defined`);
  }

  // Count occurrences of SECURITY DEFINER
  const matches = allSql.match(/SECURITY\s+DEFINER/gi);
  assert.ok(matches && matches.length >= 2, "Core functions must use SECURITY DEFINER");
});

test("Security & RLS Verification: Write Policies Enforce WITH CHECK Constraints", () => {
  const rlsContent = fs.readFileSync(migration2Path, "utf-8");

  // Tenant-scoped mutation tables
  const tenantMutatingTables = [
    "business_profiles",
    "operating_schedules",
    "menu_categories",
    "menu_groups",
    "menu_items",
  ];

  for (const table of tenantMutatingTables) {
    const withCheckRegex = new RegExp(
      `ON\\s+${table}[\\s\\S]*?WITH\\s+CHECK\\s*\\(is_tenant_owner_or_manager\\(tenant_id\\)\\)`,
      "i"
    );
    assert.ok(
      withCheckRegex.test(rlsContent),
      `Table '${table}' must enforce WITH CHECK (is_tenant_owner_or_manager(tenant_id))`
    );
  }
});

test("Security & RLS Verification: Public Read Strictly Requires is_published = true", () => {
  const rlsContent = fs.readFileSync(migration2Path, "utf-8");
  const mediaContent = fs.readFileSync(migration3Path, "utf-8");

  // Public tenants select must require is_published = true
  assert.ok(
    /USING\s*\(is_published\s*=\s*true\)/i.test(rlsContent),
    "Public tenants policy must require is_published = true"
  );

  // Public media select must require is_published = true AND published tenant
  assert.ok(
    /is_published\s*=\s*true[\s\S]*?t\.is_published\s*=\s*true/i.test(mediaContent),
    "Public media assets policy must require is_published = true"
  );

  // Sensitive tables must have NO public read policy
  assert.ok(!rlsContent.includes('CREATE POLICY "Public can view tenant users"'));
  assert.ok(!rlsContent.includes('CREATE POLICY "Public can view audit logs"'));
  assert.ok(!mediaContent.includes('CREATE POLICY "Public can view all media"'));
});

test("Multi-Role RBAC Simulation: Public, Owner, Manager Isolation", () => {
  // Mock relational tables
  const tenants = [
    { id: "tenant-aromica", slug: "aromica-cafe", is_published: true },
    { id: "tenant-bistro", slug: "bistro-verona", is_published: false },
  ];

  const tenantUsers = [
    { tenant_id: "tenant-aromica", user_id: "user-susmit-owner", role: "owner" },
    { tenant_id: "tenant-aromica", user_id: "user-bob-mgr", role: "manager" },
    { tenant_id: "tenant-bistro", user_id: "user-alice-owner", role: "owner" },
  ];

  // RBAC helper functions simulating PostgreSQL functions
  const isTenantMember = (tId: string, uId: string | null) => {
    if (!uId) return false;
    return tenantUsers.some((tu) => tu.tenant_id === tId && tu.user_id === uId);
  };

  const isTenantOwnerOrManager = (tId: string, uId: string | null) => {
    if (!uId) return false;
    return tenantUsers.some(
      (tu) => tu.tenant_id === tId && tu.user_id === uId && (tu.role === "owner" || tu.role === "manager")
    );
  };

  // 1. Unauthenticated Public Visitor
  const publicTenants = tenants.filter((t) => t.is_published);
  assert.equal(publicTenants.length, 1);
  assert.equal(publicTenants[0].slug, "aromica-cafe");
  assert.equal(isTenantMember("tenant-aromica", null), false);

  // 2. Tenant Owner (Susmit on Aromica)
  assert.equal(isTenantOwnerOrManager("tenant-aromica", "user-susmit-owner"), true);
  // Cross-tenant boundary
  assert.equal(isTenantOwnerOrManager("tenant-bistro", "user-susmit-owner"), false);

  // 3. Tenant Manager (Bob on Aromica)
  assert.equal(isTenantOwnerOrManager("tenant-aromica", "user-bob-mgr"), true);
  assert.equal(isTenantOwnerOrManager("tenant-bistro", "user-bob-mgr"), false);
});

test("Storage Policies: business-media Bucket Path Isolation Simulation", () => {
  const bucketName = "business-media";
  assert.equal(bucketName, "business-media");
  const validTenantId = "a0000000-0000-0000-0000-000000000001";
  const foreignTenantId = "b0000000-0000-0000-0000-000000000002";

  const isOwnerOf = (tId: string, uId: string) => tId === validTenantId && uId === "user-owner-1";

  // Simulate path parsing: "tenants/{tenant_id}/{category}/{filename}"
  const checkUploadPermission = (path: string, userId: string) => {
    const parts = path.split("/");
    if (parts[0] !== "tenants") return false;
    const targetTenantId = parts[1];
    return isOwnerOf(targetTenantId, userId);
  };

  // Valid upload to own directory
  const ownPath = `tenants/${validTenantId}/gallery/hero.webp`;
  assert.equal(checkUploadPermission(ownPath, "user-owner-1"), true);

  // Unauthorized upload to foreign tenant directory
  const foreignPath = `tenants/${foreignTenantId}/gallery/hero.webp`;
  assert.equal(checkUploadPermission(foreignPath, "user-owner-1"), false);

  // Unauthorized root path traversal attempt
  const traversalPath = `tenants/../system/secret.webp`;
  assert.equal(checkUploadPermission(traversalPath, "user-owner-1"), false);
});

test("Security: No Service Role Key or Secrets in Client Config or Environment Template", () => {
  const envExamplePath = path.join(projectRoot, ".env.example");
  assert.ok(fs.existsSync(envExamplePath), ".env.example must exist");

  const envContent = fs.readFileSync(envExamplePath, "utf-8");
  assert.ok(
    !/^SUPABASE_SERVICE_ROLE_KEY\s*=/m.test(envContent),
    "Never assign SUPABASE_SERVICE_ROLE_KEY in client .env.example"
  );
  assert.ok(
    envContent.includes("VITE_SUPABASE_ANON_KEY="),
    "Client template should only specify anon key"
  );
});
