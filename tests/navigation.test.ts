import assert from "node:assert/strict";
import test from "node:test";
import { commandNavItems, primaryNavItems, secondaryNavItems } from "../src/lib/navigation";

test("keeps primary sidebar navigation focused", () => {
  assert.ok(primaryNavItems.length <= 8);
  assert.equal(primaryNavItems.some((item) => item.href === "/planning"), true);
  assert.equal(primaryNavItems.some((item) => item.href === "/reconciliation"), false);
  assert.equal(primaryNavItems.some((item) => item.href === "/statements"), false);
});

test("keeps advanced pages available outside the sidebar", () => {
  for (const href of ["/reconciliation", "/statements", "/loans", "/net-worth", "/ledger"]) {
    assert.equal(secondaryNavItems.some((item) => item.href === href), true);
    assert.equal(commandNavItems.some((item) => item.href === href), true);
  }
});
