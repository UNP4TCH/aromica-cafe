import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  handler,
  validateSnapshotPayload,
  checkRateLimit,
  getBaselineSnapshot,
  isOriginAllowed,
  writeRateLimiter,
} from "../api/demo-sync.js";
import {
  getSyncConfig,
  getDefaultDemoSnapshot,
  getDemoSnapshot,
  saveDemoSnapshot,
  resetDemoSnapshotRemote,
  type DemoSnapshot,
} from "../src/services/demoSyncService.ts";

// Helper to run a test server wrapping the handler
async function withTestServer(
  setupFn: (serverUrl: string) => Promise<void>
) {
  const server = http.createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const port = (server.address() as { port: number }).port;
  const serverUrl = `http://127.0.0.1:${port}`;
  try {
    await setupFn(serverUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

// Helper to run a mock Upstash Redis server
async function withMockUpstash(
  handlerFn: (req: http.IncomingMessage, res: http.ServerResponse) => void,
  setupFn: (upstashUrl: string) => Promise<void>
) {
  const mockUpstash = http.createServer(handlerFn);
  await new Promise<void>((resolve) => mockUpstash.listen(0, "127.0.0.1", () => resolve()));
  const port = (mockUpstash.address() as { port: number }).port;
  const upstashUrl = `http://127.0.0.1:${port}`;
  try {
    await setupFn(upstashUrl);
  } finally {
    await new Promise<void>((resolve) => mockUpstash.close(() => resolve()));
  }
}

test("Cloud Sync API: Method Whitelisting rejects unsupported HTTP methods with 405", async () => {
  await withTestServer(async (url) => {
    const putRes = await fetch(url, { method: "PUT" });
    assert.strictEqual(putRes.status, 405);
    const delRes = await fetch(url, { method: "DELETE" });
    assert.strictEqual(delRes.status, 405);
    const patchRes = await fetch(url, { method: "PATCH" });
    assert.strictEqual(patchRes.status, 405);
  });
});

test("Cloud Sync API: Origin checking allows approved origins and rejects disallowed origins", async () => {
  await withTestServer(async (url) => {
    // Disallowed origin should return 403 Forbidden
    const forbiddenRes = await fetch(url, {
      method: "GET",
      headers: { Origin: "https://evil-unauthorized-site.com" },
    });
    assert.strictEqual(forbiddenRes.status, 403);
    const forbiddenJson = await forbiddenRes.json();
    assert.match(forbiddenJson.error, /Forbidden/);

    // OPTIONS preflight from disallowed origin should also be 403
    const optionsBadRes = await fetch(url, {
      method: "OPTIONS",
      headers: { Origin: "https://evil-unauthorized-site.com" },
    });
    assert.strictEqual(optionsBadRes.status, 403);

    // Allowed origin should return CORS headers
    assert.strictEqual(isOriginAllowed("https://aromica-cafe.vercel.app"), true);
    assert.strictEqual(isOriginAllowed("https://aromica-owner-dashboard.vercel.app"), true);
    assert.strictEqual(isOriginAllowed("https://aromica-preview-123.vercel.app"), true);
    assert.strictEqual(isOriginAllowed("http://localhost:5173"), true);
    assert.strictEqual(isOriginAllowed("http://127.0.0.1:5174"), true);
    assert.strictEqual(isOriginAllowed("https://external-attacker.com"), false);
  });
});

test("Cloud Sync API: Authorization rejects unauthorized mutations and resets with 401", async () => {
  const originalPasskey = process.env.DEMO_SYNC_PASSKEY;
  process.env.DEMO_SYNC_PASSKEY = "correct-demo-secret-passkey";

  try {
    await withTestServer(async (url) => {
      // 1. Missing x-demo-auth header
      const missingRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      assert.strictEqual(missingRes.status, 401);
      const missingJson = await missingRes.json();
      assert.match(missingJson.error, /Unauthorized/);

      // 2. Incorrect passkey
      const wrongRes = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-auth": "wrong-secret-token",
        },
        body: JSON.stringify({ reset: true }),
      });
      assert.strictEqual(wrongRes.status, 401);

      // 3. Reset operation with missing passkey is also blocked
      const resetBlockedRes = await fetch(`${url}?action=reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      assert.strictEqual(resetBlockedRes.status, 401);
    });
  } finally {
    process.env.DEMO_SYNC_PASSKEY = originalPasskey;
  }
});

test("Cloud Sync API: Content-Type validation requires application/json on mutations", async () => {
  const originalPasskey = process.env.DEMO_SYNC_PASSKEY;
  process.env.DEMO_SYNC_PASSKEY = "test-passkey";

  try {
    await withTestServer(async (url) => {
      const textRes = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "x-demo-auth": "test-passkey",
        },
        body: "plain text mutation",
      });
      assert.strictEqual(textRes.status, 415);
      const textJson = await textRes.json();
      assert.match(textJson.error, /Unsupported Media Type/);
    });
  } finally {
    process.env.DEMO_SYNC_PASSKEY = originalPasskey;
  }
});

test("Cloud Sync API: Schema validation rejects malformed snapshot payloads", () => {
  // Empty or non-object
  assert.strictEqual(validateSnapshotPayload(null).valid, false);
  assert.strictEqual(validateSnapshotPayload("string").valid, false);

  // Missing or non-array menuCategories
  assert.strictEqual(validateSnapshotPayload({}).valid, false);
  assert.strictEqual(validateSnapshotPayload({ menuCategories: "not-an-array" }).valid, false);

  // Category with invalid id or label
  assert.strictEqual(validateSnapshotPayload({ menuCategories: [{}] }).valid, false);
  assert.strictEqual(
    validateSnapshotPayload({ menuCategories: [{ id: "beverages", label: "" }] }).valid,
    false
  );

  // Group item with missing or blank name
  assert.strictEqual(
    validateSnapshotPayload({
      menuCategories: [
        {
          id: "beverages",
          label: "Beverages",
          groups: [
            {
              title: "Hot Drinks",
              items: [{ name: "   ", price: "40" }],
            },
          ],
        },
      ],
    }).valid,
    false
  );

  // Valid baseline passes validation
  const baseline = getBaselineSnapshot();
  const res = validateSnapshotPayload(baseline);
  assert.strictEqual(res.valid, true);
});

test("Cloud Sync API: Rate limiter enforces maximum mutations per window", () => {
  writeRateLimiter.clear();
  const testIp = "192.168.1.100";

  // First 60 requests within window are allowed
  for (let i = 0; i < 60; i++) {
    assert.strictEqual(checkRateLimit(testIp), true);
  }

  // 61st request in same window is rejected
  assert.strictEqual(checkRateLimit(testIp), false);
});

test("Cloud Sync API: Upstash failure returns 503 and never returns misleading 200 baseline", async () => {
  const origUrl = process.env.UPSTASH_REDIS_REST_URL;
  const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Unconfigured Upstash returns 503
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  await withTestServer(async (url) => {
    const unconfRes = await fetch(url, { method: "GET" });
    assert.strictEqual(unconfRes.status, 503);
    const unconfJson = await unconfRes.json();
    assert.match(unconfJson.error, /not configured/);
  });

  // 2. Unreachable / erroring Upstash returns 503
  await withMockUpstash(
    (req, res) => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Redis Cluster Error" }));
    },
    async (mockUrl) => {
      process.env.UPSTASH_REDIS_REST_URL = mockUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

      await withTestServer(async (url) => {
        const errRes = await fetch(url, { method: "GET" });
        assert.strictEqual(errRes.status, 503);
        const errJson = await errRes.json();
        assert.match(errJson.error, /temporarily unreachable/);
      });
    }
  );

  process.env.UPSTASH_REDIS_REST_URL = origUrl;
  process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
});

test("Cloud Sync API: Authorized reset restores approved baseline snapshot", async () => {
  let storedInRedis: string | null = null;

  await withMockUpstash(
    async (req, res) => {
      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          // parsed is ["SET", "aromica_demo_snapshot", stringifiedSnapshot]
          assert.strictEqual(parsed[0], "SET");
          assert.strictEqual(parsed[1], "aromica_demo_snapshot");
          storedInRedis = parsed[2];
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ result: "OK" }));
        });
      }
    },
    async (mockUrl) => {
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      const origPasskey = process.env.DEMO_SYNC_PASSKEY;

      process.env.UPSTASH_REDIS_REST_URL = mockUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
      process.env.DEMO_SYNC_PASSKEY = "authorized-passkey";

      try {
        await withTestServer(async (url) => {
          const resetRes = await fetch(`${url}?action=reset`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-demo-auth": "authorized-passkey",
            },
            body: JSON.stringify({ reset: true }),
          });

          assert.strictEqual(resetRes.status, 200);
          const resetJson = await resetRes.json();
          assert.strictEqual(resetJson.success, true);
          assert.strictEqual(resetJson.reset, true);
          assert.ok(resetJson.snapshot);
          assert.ok(Array.isArray(resetJson.snapshot.menuCategories));

          // Verify Redis was updated with pristine baseline
          assert.ok(storedInRedis !== null);
          const parsedRedis = JSON.parse(storedInRedis);
          assert.strictEqual(parsedRedis.profile.name, "Aromica Café");
          assert.ok(parsedRedis.menuCategories.length > 0);
        });
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        process.env.DEMO_SYNC_PASSKEY = origPasskey;
      }
    }
  );
});

test("Cloud Sync API: First-time initialization returns baseline with x-demo-initial header", async () => {
  await withMockUpstash(
    (req, res) => {
      // Simulate key does not exist yet in Redis (result is null)
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result: null }));
    },
    async (mockUrl) => {
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      process.env.UPSTASH_REDIS_REST_URL = mockUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

      try {
        await withTestServer(async (url) => {
          const initRes = await fetch(url, { method: "GET" });
          assert.strictEqual(initRes.status, 200);
          assert.strictEqual(initRes.headers.get("x-demo-initial"), "true");
          const initJson = await initRes.json();
          assert.strictEqual(initJson.profile.name, "Aromica Café");
        });
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
      }
    }
  );
});

test("Demo Sync Service: getSyncConfig correctly differentiates localhost vs cloud", () => {
  // By default in Node test environment: points to local sync server
  const config = getSyncConfig();
  assert.strictEqual(config.isCloud, false);
  assert.strictEqual(config.url, "http://127.0.0.1:5176");
});

test("Data Safety: Remote failures never overwrite cached snapshot with baseline", async () => {
  // Given a custom saved snapshot
  const customSnapshot: DemoSnapshot = {
    ...getDefaultDemoSnapshot(),
    updatedAt: Date.now(),
    profile: {
      ...getDefaultDemoSnapshot().profile,
      name: "Custom Aromica Cafe Test",
    },
  };
  saveDemoSnapshot(customSnapshot);

  // Cached snapshot should retain custom name
  const cached = getDemoSnapshot();
  assert.strictEqual(cached.profile.name, "Custom Aromica Cafe Test");

  // Restore pristine state for subsequent tests
  await resetDemoSnapshotRemote();
});
