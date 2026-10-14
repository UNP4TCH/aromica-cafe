import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateEnvironmentConfig } from "../src/lib/envConfig.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

test("Production Config: Validates unconfigured environment safely defaults to Simulation Mode", () => {
  const result = validateEnvironmentConfig({
    VITE_SUPABASE_URL: "https://your-project-id.supabase.co",
    VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here",
    VITE_DEFAULT_TENANT_SLUG: "aromica-cafe",
  });

  assert.equal(result.isConfigured, false, "Placeholder environment must not be marked configured");
  assert.equal(result.isSimulated, true, "Must safely default to Interactive Simulation Mode");
  assert.equal(result.hasServiceRoleLeak, false);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.length > 0);
  assert.ok(result.warnings[0].includes("Interactive Portfolio Simulation Mode"));
});

test("Production Config: Detects and rejects accidental Service Role key leakage", () => {
  const result = validateEnvironmentConfig({
    VITE_SUPABASE_URL: "https://valid-project.supabase.co",
    VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon",
    SUPABASE_SERVICE_ROLE_KEY: "secret-service-role-key-do-not-leak",
  });

  assert.equal(result.hasServiceRoleLeak, true, "Must flag leaked service role key");
  assert.ok(result.errors.some((e) => e.includes("CRITICAL: Service role key detected")));
});

test("Production Config: Rejects invalid or malicious default tenant slug", () => {
  const invalidSlugs = ["AromicaCafe", "aromica_cafe", "ar", "../traversal", "a".repeat(65)];

  for (const slug of invalidSlugs) {
    const result = validateEnvironmentConfig({
      VITE_DEFAULT_TENANT_SLUG: slug,
    });
    assert.ok(
      result.errors.some((e) => e.includes("Invalid default tenant slug")),
      `Slug "${slug}" should trigger a configuration validation error`
    );
  }
});

test("Production Config: Validates fully provisioned HTTPS production environment", () => {
  const result = validateEnvironmentConfig({
    VITE_SUPABASE_URL: "https://aromica-prod.supabase.co",
    VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-anon-signature.sig",
    VITE_DEFAULT_TENANT_SLUG: "aromica-cafe",
  });

  assert.equal(result.isConfigured, true, "Real HTTPS URL and signature should pass");
  assert.equal(result.isSimulated, false);
  assert.equal(result.hasServiceRoleLeak, false);
  assert.equal(result.errors.length, 0);
});

test("Accessibility & HTML Standards: Both App HTML Entrypoints Have Proper Lang & Viewport", () => {
  const htmlFiles = [
    { name: "Public Website", path: path.join(projectRoot, "index.html") },
    { name: "Owner Dashboard", path: path.join(projectRoot, "apps/owner-dashboard/index.html") },
  ];

  for (const file of htmlFiles) {
    assert.ok(fs.existsSync(file.path), `${file.name} HTML file must exist`);
    const content = fs.readFileSync(file.path, "utf-8");

    assert.ok(/<html[^>]*lang="en"/i.test(content), `${file.name} must specify lang="en" for accessibility`);
    assert.ok(content.includes('name="viewport"'), `${file.name} must include viewport meta tag`);
    assert.ok(content.includes("<title>"), `${file.name} must define a descriptive title`);
    assert.ok(content.includes('name="description"'), `${file.name} must define meta description for SEO`);
  }
});

test("Creator Attribution Consistency: Attribution is Preserved Across All Applications", () => {
  const publicConfig = fs.readFileSync(path.join(projectRoot, "src/data/demoConfig.ts"), "utf-8");
  const dashboardBanner = fs.readFileSync(path.join(projectRoot, "apps/owner-dashboard/src/components/DemoAttributionBanner.tsx"), "utf-8");

  // Susmit Dey attribution must be visible or imported from MANAGEMENT_DEMO_ATTRIBUTION / demoConfig
  assert.ok(publicConfig.includes("Susmit Dey"), "Public config must attribute Susmit Dey");
  assert.ok(dashboardBanner.includes("MANAGEMENT_DEMO_ATTRIBUTION"), "Dashboard must import and render MANAGEMENT_DEMO_ATTRIBUTION");

  // Contact coordinates must match
  assert.ok(publicConfig.includes("9007801474") || publicConfig.includes("+91 9007801474"));
  assert.ok(dashboardBanner.includes("creator.phone"), "Dashboard banner must link creator.phone");
});
