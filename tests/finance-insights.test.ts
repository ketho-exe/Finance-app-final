import assert from "node:assert/strict";
import test from "node:test";
import { cards, transactions } from "../src/lib/finance";
import {
  calculateDebtPayoff,
  calculateSafeToSpendToday,
  findUpcomingRenewals,
  suggestCategory,
} from "../src/lib/finance-insights";

test("findUpcomingRenewals returns bills due within the warning window", () => {
  const renewals = findUpcomingRenewals(
    [
      { id: "s1", name: "Netflix", amount: 17.99, category: "Entertainment", cardId: "amex", renewalDay: 27, warningDays: 7 },
      { id: "s2", name: "Rent", amount: 1150, category: "Rent", cardId: "chase", renewalDay: 12, warningDays: 7 },
    ],
    new Date("2026-04-24T12:00:00Z"),
  );

  assert.equal(renewals.length, 1);
  assert.equal(renewals[0].name, "Netflix");
  assert.equal(renewals[0].daysUntilRenewal, 3);
});

test("calculateSafeToSpendToday reserves bills, budget buffer, and savings", () => {
  const result = calculateSafeToSpendToday({
    balance: 1000,
    upcomingBills: 250,
    savingsTarget: 150,
    daysLeftInMonth: 10,
    buffer: 100,
  });

  assert.equal(result.safeToday, 50);
  assert.equal(result.discretionaryRemaining, 500);
});

test("suggestCategory recognises merchant keywords", () => {
  const suggestion = suggestCategory("Tesco Express weekly shop", -32, transactions);

  assert.equal(suggestion.category, "Groceries");
  assert.ok(suggestion.confidence >= 0.8);
});

test("calculateDebtPayoff estimates months and interest", () => {
  const result = calculateDebtPayoff(cards, 400);

  assert.equal(result.length, 1);
  assert.equal(result[0].cardName, "Rewards Credit");
  assert.ok(result[0].monthsToPayoff > 0);
});
