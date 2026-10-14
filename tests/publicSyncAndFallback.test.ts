import test from "node:test";
import assert from "node:assert/strict";
import {
  mapDatabaseToMenuCategories,
  mapDatabaseToSchedule,
  mapDatabaseToProfile,
  readCachedContent,
  writeCachedContent,
  getFallbackContent,
  fetchLiveBusinessContent,
} from "../src/services/publicContentService.ts";
import { cafe } from "../src/data/cafe.ts";

test("Public Data Mapping: Raw DB Menu Payload transforms to Strict Menu Contracts", () => {
  const rawDbCategories = [
    {
      id: "cat-1",
      slug_id: "beverages",
      label: "Coffee & Beverages",
      display_order: 1,
      is_published: true,
      menu_groups: [
        {
          id: "grp-1",
          title: "Cold Coffee & Shakes",
          display_order: 1,
          menu_items: [
            {
              id: "item-1",
              name: "Classic Cold Coffee",
              price: "109",
              veg: true,
              available: true,
              description: "Chilled brewed espresso blended with rich cream",
              display_order: 1,
            },
            {
              id: "item-2",
              name: "Seasonal Mango Frappe",
              price: "139",
              veg: true,
              available: false, // 86'd / Sold out
              description: "Alphonso mango cream reduction",
              display_order: 2,
            },
          ],
        },
      ],
    },
    {
      id: "cat-2",
      slug_id: "secret-menu",
      label: "Unpublished Experimental Drinks",
      display_order: 2,
      is_published: false, // Should be excluded from public view
      menu_groups: [],
    },
  ];

  const mapped = mapDatabaseToMenuCategories(rawDbCategories);

  // 1. Unpublished category isolation
  assert.equal(mapped.length, 1, "Unpublished categories must be filtered out");
  assert.equal(mapped[0].id, "beverages");
  assert.equal(mapped[0].label, "Coffee & Beverages");

  // 2. Groups and items mapping
  assert.equal(mapped[0].groups.length, 1);
  const group = mapped[0].groups[0];
  assert.equal(group.title, "Cold Coffee & Shakes");
  assert.equal(group.items.length, 2);

  // 3. Item properties & availability preservation
  const item1 = group.items[0];
  assert.equal(item1.name, "Classic Cold Coffee");
  assert.equal(item1.price, "109");
  assert.equal(item1.veg, true);
  assert.equal(item1.available, true);

  const item2 = group.items[1];
  assert.equal(item2.name, "Seasonal Mango Frappe");
  assert.equal(item2.available, false, "Sold out / unavailable status must be preserved");
});

test("Public Data Mapping: Database Schedule Transforms to DayHoursContract", () => {
  const rawSchedule = [
    {
      day_of_week: 1,
      is_closed: true,
      open_time: null,
      close_time: null,
    },
    {
      day_of_week: 2,
      is_closed: false,
      open_time: "17:00:00",
      close_time: "22:30:00",
    },
  ];

  const mapped = mapDatabaseToSchedule(rawSchedule);

  assert.equal(mapped.length, 7, "Schedule maintains 7-day structure, updating matched days");
  assert.equal(mapped[0].day, "Monday");
  assert.equal(mapped[0].isClosed, true);
  assert.equal(mapped[0].hours, "Closed");

  assert.equal(mapped[1].day, "Tuesday");
  assert.equal(mapped[1].isClosed, false);
  assert.equal(mapped[1].openMinutes, 17 * 60);
  assert.equal(mapped[1].closeMinutes, 22 * 60 + 30);
  assert.equal(mapped[1].hours, "5:00 PM – 10:30 PM");
});

test("Public Data Mapping: Database Profile Merges Cleanly into Verified Profile Contract", () => {
  const rawProfile = {
    business_name: "Aromica Café & Roastery",
    tagline: "Slow Coffee & Evening Conversations",
    visit_description: "New verified address details",
    phone_number: "+91 90078 01474",
    whatsapp_number: "+91 90078 01474",
    email: "hello@aromica.in",
    instagram_handle: "@aromicacafe",
    order_online_url: "https://order.aromica.in",
    order_online_enabled: true,
  };

  const mapped = mapDatabaseToProfile(rawProfile);

  assert.equal(mapped.name, "Aromica Café & Roastery");
  assert.equal(mapped.tagline, "Slow Coffee & Evening Conversations");
  assert.equal(mapped.phone.number, "+91 90078 01474");
  assert.equal(mapped.instagram.handle, "@aromicacafe");
  assert.equal(mapped.orderOnline.enabled, true);
  // Preserves non-database presentation fields (branding words, coordinates, etc.)
  assert.equal(mapped.brandWord1, "Aromica");
  assert.equal(mapped.brandWord2, "Café");
  assert.ok(mapped.menu?.eyebrow, "Menu metadata must always be defined");
  assert.ok(mapped.hours?.daysOpenSummary, "Hours summary must always be defined");
});

test("Public Data Mapping: Normalizes Demo Snapshot and Partial Profiles without Crashing", () => {
  // Scenario 1: Snapshot with menuMeta instead of menu, partial hours
  const snapshotProfile = {
    name: "Aromica Café",
    menuMeta: {
      eyebrow: "Artisanal Brews",
      title: "Our Seasonal Offerings",
    },
    hours: {
      regular: "5:00 PM – 10:30 PM",
    },
  };

  const normalized = mapDatabaseToProfile(snapshotProfile);
  assert.equal(normalized.menu.eyebrow, "Artisanal Brews");
  assert.equal(normalized.menu.title, "Our Seasonal Offerings");
  assert.ok(normalized.menu.subtitle, "Default subtitle retained");
  assert.ok(normalized.hours.daysOpenSummary, "Default daysOpenSummary retained");

  // Scenario 2: Empty profile or null/undefined
  const emptyNormalized = mapDatabaseToProfile({});
  assert.ok(emptyNormalized.menu.eyebrow, "Menu eyebrow safe fallback");
  assert.ok(emptyNormalized.atmosphere.eyebrow, "Atmosphere eyebrow safe fallback");
  assert.ok(emptyNormalized.hours.summary, "Hours summary safe fallback");
});

test("Fallback Resilience: Returns Approved Static Content when Supabase is Missing or Fails", async () => {
  const fallback = getFallbackContent("Supabase client is not configured");

  assert.equal(fallback.source, "fallback");
  assert.equal(fallback.isLive, false);
  assert.equal(fallback.error, "Supabase client is not configured");
  assert.ok(fallback.profile.name.length > 0);
  assert.ok(fallback.menuCategories.length > 0);
  assert.ok(fallback.schedule.length === 7);
  assert.ok(fallback.galleryItems.length > 0);
  assert.ok(Array.isArray(fallback.reviews), "Reviews array must exist in contract");
  assert.equal(fallback.profile.name, cafe.name);
});

test("Caching & SWR Strategy: Read / Write / TTL Expiry", () => {
  // Mock localStorage in Node environment
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

  const testPayload = getFallbackContent(null);
  testPayload.source = "cached";
  testPayload.fetchedAt = Date.now();

  writeCachedContent("aromica-cafe", testPayload);

  // 1. Immediate read hit
  const freshHit = readCachedContent("aromica-cafe");
  assert.ok(freshHit, "Cache should hit immediately");
  assert.equal(freshHit?.source, "cached");
  assert.equal(freshHit?.profile.name, cafe.name);

  // 2. Expired read hit (simulate > 60s TTL)
  testPayload.fetchedAt = Date.now() - 65 * 1000;
  writeCachedContent("aromica-cafe", testPayload);

  const expiredHit = readCachedContent("aromica-cafe");
  assert.equal(expiredHit, null, "Expired cache entries (>60s) must return null for revalidation");
});

test("Live Synchronization: Safe Degradation on Unconfigured Project", async () => {
  // In an unconfigured environment (no VITE_SUPABASE_URL), fetchLiveBusinessContent degrades safely to fallback
  const result = await fetchLiveBusinessContent("aromica-cafe");

  assert.equal(result.isLive, false);
  assert.ok(result.source === "fallback" || result.source === "cached");
  assert.ok(result.menuCategories.length > 0, "Public website must retain full menu categories on fallback");
});
