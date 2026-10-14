import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMenuItemUpdate,
  isValidPriceString,
  sanitizeString,
} from "../src/services/menuValidation.ts";

test("Menu Validation: isValidPriceString", () => {
  // Valid prices
  assert.equal(isValidPriceString("35"), true);
  assert.equal(isValidPriceString("35 / 55"), true);
  assert.equal(isValidPriceString("109"), true);
  assert.equal(isValidPriceString("₹120"), true);
  assert.equal(isValidPriceString("79.50"), true);

  // Invalid prices
  assert.equal(isValidPriceString(""), false);
  assert.equal(isValidPriceString("   "), false);
  assert.equal(isValidPriceString("free"), false);
  assert.equal(isValidPriceString("DROP TABLE menu_items;"), false);
});

test("Menu Validation: sanitizeString removes HTML tags and scripts", () => {
  const dirty = "<script>alert('xss')</script>Hot Espresso";
  const clean = sanitizeString(dirty);
  assert.equal(clean, "Hot Espresso");
});

test("Menu Validation: validates successful update payload", () => {
  const validPayload = {
    name: "Classic Cold Coffee",
    price: "119",
    veg: true,
    available: false,
    description: "Chilled blended coffee garnished with dark cocoa powder",
    note: "Add ice cream for ₹29",
  };

  const result = validateMenuItemUpdate(validPayload);
  assert.equal(result.success, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.data?.price, "119");
  assert.equal(result.data?.available, false);
});

test("Security: Rejects tenant_id tampering in update payload", () => {
  const maliciousPayload = {
    name: "Malicious Injection",
    price: "99",
    tenant_id: "b0000000-0000-0000-0000-000000000002", // Attempting cross-tenant overwrite
  };

  const result = validateMenuItemUpdate(maliciousPayload);
  assert.equal(result.success, false);
  assert.ok(
    result.errors.some((err) => err.includes("Forbidden: Changing 'tenant_id'")),
    "Must reject tenant_id tampering"
  );
});

test("Security: Rejects direct id mutation in update payload", () => {
  const payloadWithId = {
    id: "m0000000-0000-0000-0000-999999999999",
    name: "ID Tamper Attempt",
  };

  const result = validateMenuItemUpdate(payloadWithId);
  assert.equal(result.success, false);
  assert.ok(
    result.errors.some((err) => err.includes("Forbidden: Direct 'id' mutation")),
    "Must reject id tampering"
  );
});

test("Input Constraints: Rejects empty name and excessively long inputs", () => {
  const emptyNameResult = validateMenuItemUpdate({ name: "   " });
  assert.equal(emptyNameResult.success, false);
  assert.ok(emptyNameResult.errors.some((e) => e.includes("cannot be empty")));

  const longDesc = "A".repeat(501);
  const longDescResult = validateMenuItemUpdate({ description: longDesc });
  assert.equal(longDescResult.success, false);
  assert.ok(longDescResult.errors.some((e) => e.includes("exceed 500 characters")));
});
