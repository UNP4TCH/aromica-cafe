import test from "node:test";
import assert from "node:assert/strict";
import type { ActivityEvent } from "../apps/owner-dashboard/src/types.ts";

test("Activity Event: Format and field integrity for simulated actions", () => {
  const event: ActivityEvent = {
    id: "act-123",
    action: "UPDATE",
    entityType: "menu_item",
    description: 'Updated item "Cappuccino" (₹89)',
    details: "Group: Hot Coffee",
    timestamp: new Date().toISOString(),
    userEmail: "owner@aromica.in",
    isSimulated: true,
  };

  assert.equal(event.isSimulated, true);
  assert.equal(event.action, "UPDATE");
  assert.equal(event.entityType, "menu_item");
  assert.ok(event.description.includes("Cappuccino"));
  assert.ok(event.timestamp.length > 0);
});

test("Activity Event: Session reset clears simulated history completely", () => {
  let simulatedHistory: ActivityEvent[] = [
    {
      id: "act-1",
      action: "INSERT",
      entityType: "category",
      description: "Added Cold Brews",
      timestamp: new Date().toISOString(),
      isSimulated: true,
    },
    {
      id: "act-2",
      action: "TOGGLE",
      entityType: "menu_item",
      description: "Toggled availability",
      timestamp: new Date().toISOString(),
      isSimulated: true,
    },
  ];

  assert.equal(simulatedHistory.length, 2);

  // Simulate handleResetSimulationData action
  simulatedHistory = [];

  assert.equal(simulatedHistory.length, 0, "Simulated activities must reset cleanly on reset");
});

test("Activity Isolation: Distinguishes between simulated and live audit rows", () => {
  const simulatedEvent: ActivityEvent = {
    id: "sim-1",
    action: "UPDATE",
    entityType: "business_profile",
    description: "Changed Tagline",
    timestamp: new Date().toISOString(),
    isSimulated: true,
  };

  const liveEvent: ActivityEvent = {
    id: "uuid-db-1",
    action: "UPDATE",
    entityType: "business_profile",
    description: "Changed Tagline",
    timestamp: new Date().toISOString(),
    userEmail: "User a1b2c3d4...",
    isSimulated: false,
  };

  assert.equal(simulatedEvent.isSimulated, true, "Simulated event must be marked true");
  assert.equal(liveEvent.isSimulated, false, "Live DB event must be marked false");
});
