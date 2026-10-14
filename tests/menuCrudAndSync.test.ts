import test from "node:test";
import assert from "node:assert/strict";
import {
  getDemoSnapshot,
  saveDemoSnapshot,
  resetDemoSnapshot,
  getDefaultDemoSnapshot,
} from "../src/services/demoSyncService.ts";
import { getFallbackContent } from "../src/services/publicContentService.ts";
import type { MenuCategoryContract, MenuItemContract } from "../src/types/business.ts";

test("Category Lifecycle: Can Create, Edit, and Delete Categories", () => {
  const initial = getDefaultDemoSnapshot();
  assert.ok(initial.menuCategories.length > 0);
  const initialCount = initial.menuCategories.length;

  // 1. Create a Category
  const newCat: MenuCategoryContract = {
    id: "gourmet-burgers",
    label: "Gourmet Burgers",
    description: "Handcrafted brioche burgers",
    groups: [
      {
        title: "Gourmet Burgers",
        items: [
          { name: "Smoky BBQ Burger", price: "189", veg: false, available: true },
        ],
      },
    ],
  };

  const updatedCategories = [...initial.menuCategories, newCat];
  saveDemoSnapshot({
    ...initial,
    menuCategories: updatedCategories,
  });

  const snapshotAfterCreate = getDemoSnapshot();
  assert.equal(snapshotAfterCreate.menuCategories.length, initialCount + 1);
  assert.ok(snapshotAfterCreate.menuCategories.some((c) => c.id === "gourmet-burgers"));

  // 2. Edit Category label & description
  const editedCategories = snapshotAfterCreate.menuCategories.map((c) => {
    if (c.id === "gourmet-burgers") {
      return {
        ...c,
        label: "Artisan Brioche Burgers",
        description: "Freshly baked artisan buns",
      };
    }
    return c;
  });

  saveDemoSnapshot({
    ...snapshotAfterCreate,
    menuCategories: editedCategories,
  });

  const snapshotAfterEdit = getDemoSnapshot();
  const edited = snapshotAfterEdit.menuCategories.find((c) => c.id === "gourmet-burgers");
  assert.ok(edited);
  assert.equal(edited.label, "Artisan Brioche Burgers");
  assert.equal(edited.description, "Freshly baked artisan buns");

  // 3. Delete Category
  const deletedCategories = snapshotAfterEdit.menuCategories.filter((c) => c.id !== "gourmet-burgers");
  saveDemoSnapshot({
    ...snapshotAfterEdit,
    menuCategories: deletedCategories,
  });

  const snapshotAfterDelete = getDemoSnapshot();
  assert.equal(snapshotAfterDelete.menuCategories.length, initialCount);
  assert.ok(!snapshotAfterDelete.menuCategories.some((c) => c.id === "gourmet-burgers"));
});

test("Menu Item Lifecycle: Add, Edit, Delete, and Reassign Category", () => {
  const initial = getDefaultDemoSnapshot();
  const bevCategory = initial.menuCategories.find((c) => c.id === "beverages");
  assert.ok(bevCategory);

  // 1. Add an item
  const newItem: MenuItemContract = {
    name: "Hazelnut Cappuccino",
    price: "119",
    veg: true,
    available: true,
    description: "Steamed whole milk with roasted hazelnut syrup",
  };

  const categoriesWithNewItem = initial.menuCategories.map((c) => {
    if (c.id === "beverages") {
      return {
        ...c,
        groups: c.groups.map((g, idx) => (idx === 0 ? { ...g, items: [...g.items, newItem] } : g)),
      };
    }
    return c;
  });

  saveDemoSnapshot({
    ...initial,
    menuCategories: categoriesWithNewItem,
  });

  let snapshot = getDemoSnapshot();
  let found = snapshot.menuCategories
    .find((c) => c.id === "beverages")
    ?.groups[0].items.find((i) => i.name === "Hazelnut Cappuccino");
  assert.ok(found);
  assert.equal(found.price, "119");

  // 2. Edit price & 86'd status
  const categoriesWithEditedItem = snapshot.menuCategories.map((c) => {
    if (c.id === "beverages") {
      return {
        ...c,
        groups: c.groups.map((g) => ({
          ...g,
          items: g.items.map((i) =>
            i.name === "Hazelnut Cappuccino" ? { ...i, price: "129", available: false } : i
          ),
        })),
      };
    }
    return c;
  });

  saveDemoSnapshot({
    ...snapshot,
    menuCategories: categoriesWithEditedItem,
  });

  snapshot = getDemoSnapshot();
  found = snapshot.menuCategories
    .find((c) => c.id === "beverages")
    ?.groups[0].items.find((i) => i.name === "Hazelnut Cappuccino");
  assert.ok(found);
  assert.equal(found.price, "129");
  assert.equal(found.available, false);

  // 3. Move item to another category (e.g. momos)
  const categoriesWithMovedItem = snapshot.menuCategories.map((c) => {
    if (c.id === "beverages") {
      return {
        ...c,
        groups: c.groups.map((g) => ({
          ...g,
          items: g.items.filter((i) => i.name !== "Hazelnut Cappuccino"),
        })),
      };
    }
    if (c.id === "momos") {
      return {
        ...c,
        groups: c.groups.map((g, idx) => (idx === 0 ? { ...g, items: [...g.items, found!] } : g)),
      };
    }
    return c;
  });

  saveDemoSnapshot({
    ...snapshot,
    menuCategories: categoriesWithMovedItem,
  });

  snapshot = getDemoSnapshot();
  const inBev = snapshot.menuCategories
    .find((c) => c.id === "beverages")
    ?.groups.some((g) => g.items.some((i) => i.name === "Hazelnut Cappuccino"));
  assert.equal(inBev, false, "Item should no longer be in beverages");

  const inMomos = snapshot.menuCategories
    .find((c) => c.id === "momos")
    ?.groups.some((g) => g.items.some((i) => i.name === "Hazelnut Cappuccino"));
  assert.equal(inMomos, true, "Item should now be in momos");

  // 4. Delete item
  const categoriesWithDeletedItem = snapshot.menuCategories.map((c) => {
    if (c.id === "momos") {
      return {
        ...c,
        groups: c.groups.map((g) => ({
          ...g,
          items: g.items.filter((i) => i.name !== "Hazelnut Cappuccino"),
        })),
      };
    }
    return c;
  });

  saveDemoSnapshot({
    ...snapshot,
    menuCategories: categoriesWithDeletedItem,
  });

  snapshot = getDemoSnapshot();
  const existsAnywhere = snapshot.menuCategories.some((c) =>
    c.groups.some((g) => g.items.some((i) => i.name === "Hazelnut Cappuccino"))
  );
  assert.equal(existsAnywhere, false, "Item must be deleted completely");
});

test("Public Website Synchronization: getFallbackContent Reads Updated Demo Snapshot", () => {
  // Reset demo snapshot first
  resetDemoSnapshot();

  // Initial read by public website
  const initialPublic = getFallbackContent();
  assert.ok(initialPublic.menuCategories.length > 0);

  // Dashboard performs mutation (e.g. changing tagline and adding a custom item)
  const currentSnapshot = getDemoSnapshot();
  const updatedSnapshot = {
    ...currentSnapshot,
    profile: {
      ...currentSnapshot.profile,
      tagline: "Synchronized Live Tagline Test",
    },
    menuCategories: [
      ...currentSnapshot.menuCategories,
      {
        id: "live-sync-cat",
        label: "Live Synchronized Category",
        groups: [
          {
            title: "Live Synchronized Category",
            items: [{ name: "Live Sync Espresso", price: "99", veg: true, available: true }],
          },
        ],
      },
    ],
  };

  saveDemoSnapshot(updatedSnapshot);

  // Public content service reads fallback
  const syncedPublic = getFallbackContent();

  assert.equal(
    syncedPublic.profile.tagline,
    "Synchronized Live Tagline Test",
    "Public website must immediately receive updated tagline"
  );

  const syncCat = syncedPublic.menuCategories.find((c) => c.id === "live-sync-cat");
  assert.ok(syncCat, "Public website must immediately receive newly created category");
  assert.equal(syncCat.groups[0].items[0].name, "Live Sync Espresso");

  // Reset restores pristine state
  resetDemoSnapshot();
  const resetPublic = getFallbackContent();
  assert.ok(!resetPublic.menuCategories.some((c) => c.id === "live-sync-cat"));
});

test("Cross-Origin HTTP Demo Sync Service: Reads & Writes to http://127.0.0.1:5176", async () => {
  const syncServerUrl = "http://127.0.0.1:5176";

  // 1. Healthcheck
  const healthRes = await fetch(`${syncServerUrl}/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, "ok");

  // 2. Fetch snapshot
  const snapshotRes = await fetch(`${syncServerUrl}/api/snapshot`);
  assert.equal(snapshotRes.status, 200);
  const snapshot = await snapshotRes.json();
  assert.ok(Array.isArray(snapshot.menuCategories));

  // 3. Mutate price via HTTP
  const modified = {
    ...snapshot,
    menuCategories: snapshot.menuCategories.map((c: MenuCategoryContract) => {
      if (c.id === "beverages") {
        return {
          ...c,
          groups: c.groups.map((g) => ({
            ...g,
            items: g.items.map((i) => (i.name === "Black Coffee" ? { ...i, price: "237" } : i)),
          })),
        };
      }
      return c;
    }),
  };

  const saveRes = await fetch(`${syncServerUrl}/api/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(modified),
  });
  assert.equal(saveRes.status, 200);

  // 4. Read back and verify persistence
  const verifyRes = await fetch(`${syncServerUrl}/api/snapshot`);
  const verifyData = await verifyRes.json();
  const coffee = verifyData.menuCategories
    .find((c: MenuCategoryContract) => c.id === "beverages")
    ?.groups[0].items.find((i: MenuItemContract) => i.name === "Black Coffee");
  assert.equal(coffee?.price, "237", "Price ₹237 must be saved and returned across origins");

  // 5. Reset via HTTP
  const resetRes = await fetch(`${syncServerUrl}/api/reset`, { method: "POST" });
  assert.equal(resetRes.status, 200);
  const resetData = await resetRes.json();
  assert.equal(resetData.success, true);
});
