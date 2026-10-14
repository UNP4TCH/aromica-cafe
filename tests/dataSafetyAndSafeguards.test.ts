import test from "node:test";
import assert from "node:assert/strict";
import {
  getDemoSnapshot,
  saveDemoSnapshot,
  resetDemoSnapshot,
  resetDemoSnapshotRemote,
  checkSyncServerHealth,
} from "../src/services/demoSyncService.ts";
import { mapDatabaseToProfile } from "../src/services/publicContentService.ts";
import { cafe } from "../src/data/cafe.ts";

test("Data Safety: Undo-Delete Item restores the item to its original category and group", () => {
  resetDemoSnapshot();
  const initial = getDemoSnapshot();
  const bevCat = initial.menuCategories.find((c) => c.id === "beverages");
  assert.ok(bevCat, "Beverages category must exist");
  const hotGroup = bevCat.groups.find((g) => g.title === "Hot Coffee");
  assert.ok(hotGroup, "Hot Coffee group must exist");

  const originalItem = hotGroup.items.find((i) => i.name === "Black Coffee");
  assert.ok(originalItem, "Black Coffee must be found");

  // Simulate Deleting the item
  const updatedCategoriesAfterDelete = initial.menuCategories.map((c) => {
    if (c.id !== "beverages") return c;
    return {
      ...c,
      groups: c.groups.map((g) => {
        if (g.title !== "Hot Coffee") return g;
        return {
          ...g,
          items: g.items.filter((i) => i.name !== "Black Coffee"),
        };
      }),
    };
  });

  saveDemoSnapshot({
    ...initial,
    menuCategories: updatedCategoriesAfterDelete,
  });

  // Verify it is gone
  let snapshot = getDemoSnapshot();
  let deletedCat = snapshot.menuCategories.find((c) => c.id === "beverages");
  let deletedGroup = deletedCat?.groups.find((g) => g.title === "Hot Coffee");
  assert.ok(!deletedGroup?.items.some((i) => i.name === "Black Coffee"));

  // Simulate Undo-Delete
  const restoredCategories = snapshot.menuCategories.map((c) => {
    if (c.id !== "beverages") return c;
    return {
      ...c,
      groups: c.groups.map((g) => {
        if (g.title !== "Hot Coffee") return g;
        return {
          ...g,
          items: [...g.items, originalItem],
        };
      }),
    };
  });

  saveDemoSnapshot({
    ...snapshot,
    menuCategories: restoredCategories,
  });

  // Verify item is restored with exact price and properties
  snapshot = getDemoSnapshot();
  const restoredCat = snapshot.menuCategories.find((c) => c.id === "beverages");
  const restoredGrp = restoredCat?.groups.find((g) => g.title === "Hot Coffee");
  const restoredItem = restoredGrp?.items.find((i) => i.name === "Black Coffee");
  assert.ok(restoredItem, "Item must be restored");
  assert.equal(restoredItem.price, originalItem.price);
  assert.equal(restoredItem.veg, originalItem.veg);
});

test("Data Safety: Undo-Delete Category restores category with all child groups and items", () => {
  resetDemoSnapshot();
  const initial = getDemoSnapshot();
  const momoCat = initial.menuCategories.find((c) => c.id === "momos");
  assert.ok(momoCat, "Momos category must exist");
  const originalMomoCount = momoCat.groups.reduce((acc, g) => acc + g.items.length, 0);
  assert.ok(originalMomoCount > 0, "Momos must contain items");

  // Simulate Deleting Category
  const withoutMomos = initial.menuCategories.filter((c) => c.id !== "momos");
  saveDemoSnapshot({
    ...initial,
    menuCategories: withoutMomos,
  });

  let snapshot = getDemoSnapshot();
  assert.ok(!snapshot.menuCategories.some((c) => c.id === "momos"));

  // Simulate Undo-Delete Category
  const withMomosRestored = [...snapshot.menuCategories, momoCat];
  saveDemoSnapshot({
    ...snapshot,
    menuCategories: withMomosRestored,
  });

  snapshot = getDemoSnapshot();
  const restoredMomoCat = snapshot.menuCategories.find((c) => c.id === "momos");
  assert.ok(restoredMomoCat, "Momos category must be restored");
  const restoredMomoCount = restoredMomoCat.groups.reduce((acc, g) => acc + g.items.length, 0);
  assert.equal(restoredMomoCount, originalMomoCount, "All items in category must be restored");
});

test("Data Safety: resetDemoSnapshotRemote restores pristine baseline across sync", async () => {
  // Mutate demo snapshot first
  const current = getDemoSnapshot();
  saveDemoSnapshot({
    ...current,
    profile: {
      ...current.profile,
      name: "Temporary Modified Café Name",
    },
  });

  assert.equal(getDemoSnapshot().profile.name, "Temporary Modified Café Name");

  // Call resetDemoSnapshotRemote
  const pristine = await resetDemoSnapshotRemote();
  assert.equal(pristine.profile.name, "Aromica Café");
  assert.equal(getDemoSnapshot().profile.name, "Aromica Café");
});

test("Data Safety: checkSyncServerHealth detects live running sync service", async () => {
  const isHealthy = await checkSyncServerHealth();
  assert.equal(isHealthy, true, "Local sync server on port 5176 must report healthy");
});

test("Fault Tolerance: mapDatabaseToProfile handles null or partial input without throwing", () => {
  const partial = {
    name: "Partial Café",
    // Missing address, phone, hours, landmarks, etc.
  };

  const mapped = mapDatabaseToProfile(partial, cafe);
  assert.equal(mapped.name, "Partial Café");
  assert.ok(mapped.address.street);
  assert.ok(Array.isArray(mapped.landmarks));
  assert.ok(mapped.phone.href);
});
