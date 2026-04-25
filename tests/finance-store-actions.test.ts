import assert from "node:assert/strict";
import test from "node:test";
import type { MoneyCard, Pot, WishlistItem } from "../src/lib/finance";
import { removeById, upsertById } from "../src/lib/finance-store-actions";

test("upsertById adds a new item when the id is not present", () => {
  const cards: MoneyCard[] = [];

  const result = upsertById(cards, {
    id: "card-1",
    name: "Main",
    provider: "Bank",
    type: "current",
    balance: 100,
    colour: "bg-[#0f766e]",
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Main");
});

test("upsertById edits an existing item without changing item order", () => {
  const pots: Pot[] = [
    { id: "pot-1", name: "Emergency", current: 50, target: 100, monthlyContribution: 10, kind: "saving" },
    { id: "pot-2", name: "Holiday", current: 20, target: 200, monthlyContribution: 15, kind: "goal" },
  ];

  const result = upsertById(pots, {
    id: "pot-1",
    name: "Emergency fund",
    current: 75,
    target: 100,
    monthlyContribution: 25,
    kind: "saving",
  });

  assert.deepEqual(
    result.map((item) => item.id),
    ["pot-1", "pot-2"],
  );
  assert.equal(result[0].name, "Emergency fund");
  assert.equal(result[0].current, 75);
});

test("removeById removes only the matching item", () => {
  const wishlist: WishlistItem[] = [
    { id: "wish-1", name: "Desk", price: 300, priority: "High", saved: 20 },
    { id: "wish-2", name: "Chair", price: 500, priority: "Medium", saved: 100 },
  ];

  const result = removeById(wishlist, "wish-1");

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "wish-2");
});
