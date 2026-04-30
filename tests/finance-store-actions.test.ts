import assert from "node:assert/strict";
import test from "node:test";
import type { MoneyCard, Pot, Transaction, WishlistItem } from "../src/lib/finance";
import { deriveCardBalances, hydrateLocalSnapshot, removeById, toLocalSnapshot, upsertById } from "../src/lib/finance-store-actions";

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

test("deriveCardBalances recalculates balances from current transactions", () => {
  const cards: MoneyCard[] = [
    { id: "card-1", name: "Current", provider: "Bank", type: "current", balance: 999, colour: "bg-[#0f766e]" },
    { id: "card-2", name: "Credit", provider: "Bank", type: "credit", balance: -999, limit: 1000, colour: "bg-[#2f80ed]" },
  ];
  const transactions: Transaction[] = [
    { id: "t1", date: "2026-04-01", merchant: "Payroll", category: "Income", amount: 2000, cardId: "card-1" },
    { id: "t2", date: "2026-04-02", merchant: "Cafe", category: "Eating out", amount: -12.34, cardId: "card-1" },
    { id: "t3", date: "2026-04-03", merchant: "Groceries", category: "Groceries", amount: -50, cardId: "card-2" },
    { id: "t4", date: "2026-04-04", merchant: "Unknown", category: "Shopping", amount: -20, cardId: "missing-card" },
  ];

  const result = deriveCardBalances(cards, transactions);

  assert.equal(result[0].balance, 1987.66);
  assert.equal(result[1].balance, -50);
});

test("local snapshots preserve deletions and user-created finance data", () => {
  const snapshot = toLocalSnapshot({
    cards: [{ id: "card-1", name: "Main", provider: "Bank", type: "current", balance: 10, colour: "bg-[#0f766e]" }],
    transactions: [],
    pots: [],
    wishlist: [],
    salary: { gross: 61000, pension: 8, studentLoan: "plan2", paydayDay: 28, incomeCardId: "card-1" },
    budgets: [{ id: "budget-1", category: "Groceries", monthlyLimit: 450, commitment: "flexible" }],
    subscriptions: [],
    customCategories: [],
    csvTemplates: [],
    reportExports: [],
  });

  const hydrated = hydrateLocalSnapshot(JSON.stringify(snapshot));

  assert.equal(hydrated?.transactions.length, 0);
  assert.equal(hydrated?.budgets[0].id, "budget-1");
  assert.equal(hydrated?.salary.pension, 8);
});
