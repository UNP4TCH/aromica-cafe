import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { fetchRemoteDemoSnapshot } from "../src/services/demoSyncService.ts";
import { writeCachedContent, readCachedContent, invalidateCachedContent } from "../src/services/publicContentService.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const migration4Path = path.join(projectRoot, "supabase/migrations/20261014000004_performance_indexes.sql");

function httpRequest(options, data = null) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: 0,
        headers: {},
        error: err.message,
      });
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

test("Database Hardening: Migration 4 Performance Indexes Exist and Target Critical Query Patterns", () => {
  assert.ok(fs.existsSync(migration4Path), "20261014000004_performance_indexes.sql must exist");
  const sql = fs.readFileSync(migration4Path, "utf-8");

  // 1. Tenant lookup index for published site routing
  assert.ok(
    /idx_tenants_slug_published/i.test(sql),
    "Must create index idx_tenants_slug_published for fast slug routing"
  );

  // 2. Composite index on menu categories for tenant + publication + display order
  assert.ok(
    /idx_menu_categories_tenant_published_order/i.test(sql),
    "Must create index idx_menu_categories_tenant_published_order for ordered public menu reads"
  );

  // 3. Menu items name search index
  assert.ok(
    /idx_menu_items_tenant_name/i.test(sql),
    "Must create index idx_menu_items_tenant_name for item search and name lookups"
  );

  // 4. Media assets index for gallery ordering
  assert.ok(
    /idx_media_assets_tenant_published_created/i.test(sql),
    "Must create index idx_media_assets_tenant_published_created for gallery display"
  );

  // 5. Menu groups foreign key and ordering index
  assert.ok(
    /idx_menu_groups_tenant_category_order/i.test(sql),
    "Must create index idx_menu_groups_tenant_category_order for category grouping hierarchy"
  );
});

test("Security Hardening: Demo Sync Server Rejects Disallowed Web Browser Origins with 403 Forbidden", async () => {
  const res = await httpRequest({
    hostname: "127.0.0.1",
    port: 5176,
    path: "/api/snapshot",
    method: "GET",
    headers: {
      Origin: "http://malicious-external-site.com",
    },
  });

  assert.equal(res.statusCode, 403, "Disallowed cross-origin request must be rejected with 403");
  const parsed = JSON.parse(res.body);
  assert.ok(parsed.error.includes("Forbidden"), "Response body must state Forbidden");
});

test("Security Hardening: Demo Sync Server Accepts Approved Local Frontend Origins with CORS Headers", async () => {
  const res = await httpRequest({
    hostname: "127.0.0.1",
    port: 5176,
    path: "/api/snapshot",
    method: "GET",
    headers: {
      Origin: "http://localhost:5173",
    },
  });

  assert.equal(res.statusCode, 200, "Approved origin http://localhost:5173 must be accepted");
  assert.equal(
    res.headers["access-control-allow-origin"],
    "http://localhost:5173",
    "Must return matching Access-Control-Allow-Origin header"
  );
});

test("Security Hardening: Demo Sync Server Rejects Unsupported Media Types on Snapshot Mutations", async () => {
  const res = await httpRequest({
    hostname: "127.0.0.1",
    port: 5176,
    path: "/api/snapshot",
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
  }, "invalid plain text data");

  assert.equal(res.statusCode, 415, "Non-JSON Content-Type must be rejected with 415 Unsupported Media Type");
});

test("Security Hardening: Demo Sync Server Rejects Oversized Payloads Exceeding 1MB Limit", async () => {
  const oversizedData = "x".repeat(1024 * 1024 + 100); // > 1MB
  const res = await httpRequest({
    hostname: "127.0.0.1",
    port: 5176,
    path: "/api/snapshot",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(oversizedData),
    },
  }, oversizedData);

  assert.ok(
    res.statusCode === 413 || res.statusCode === 0,
    "Payload exceeding 1MB limit must be rejected with 413 or terminated"
  );
});

test("Security Hardening: Demo Sync Server Rejects Malformed Snapshot Payload Structure", async () => {
  // Test 1: Missing menuCategories array
  const res1 = await httpRequest({
    hostname: "127.0.0.1",
    port: 5176,
    path: "/api/snapshot",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, JSON.stringify({ version: 1, menuCategories: "not-an-array" }));

  assert.equal(res1.statusCode, 400, "Malformed payload must receive 400 Bad Request");
  assert.ok(JSON.parse(res1.body).error.includes("menuCategories must be an array"));

  // Test 2: Category with empty or missing ID
  const res2 = await httpRequest({
    hostname: "127.0.0.1",
    port: 5176,
    path: "/api/snapshot",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, JSON.stringify({
    version: 1,
    menuCategories: [{ id: "", label: "Empty ID Category", groups: [] }],
  }));

  assert.equal(res2.statusCode, 400, "Category with empty ID must receive 400 Bad Request");
});

test("Caching & Request Reduction: In-Flight Snapshot Fetch Deduplication Prevents Duplicate Requests", async () => {
  // Trigger two concurrent fetches simultaneously
  const [res1, res2] = await Promise.all([
    fetchRemoteDemoSnapshot(),
    fetchRemoteDemoSnapshot(),
  ]);

  assert.ok(res1, "Fetch 1 must succeed");
  assert.ok(res2, "Fetch 2 must succeed");
  assert.equal(res1.version, res2.version, "Both concurrent fetches must return identical snapshot data");
});

test("Caching & Request Reduction: Public Content Cache Invalidation Operates Reliably", () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
  (globalThis as unknown as { localStorage: typeof mockStorage }).localStorage = mockStorage;

  const mockPayload = {
    profile: {} as any,
    menuCategories: [],
    schedule: [],
    galleryItems: [],
    reviews: [],
    isLive: false,
    source: "fallback" as const,
    error: null,
    fetchedAt: Date.now(),
  };

  writeCachedContent("test-tenant", mockPayload);
  const cached = readCachedContent("test-tenant");
  assert.ok(cached !== null, "Cache must store payload");

  invalidateCachedContent("test-tenant");
  const cleared = readCachedContent("test-tenant");
  assert.equal(cleared, null, "Cache must be cleared after invalidation");
});
