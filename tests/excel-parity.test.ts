import assert from "node:assert/strict";
import test from "node:test";
import { calculateLedgerMatrix, inferPeriodIndex, ledgerNetAmount } from "../src/lib/ledger";
import { buildMonthlyPlan, calculateSalaryBreakdown } from "../src/lib/planning";
import { calculateReconciliation } from "../src/lib/reconciliation";

test("calculates workbook-style salary and planning breakdowns", () => {
  const salary = calculateSalaryBreakdown({ grossAnnual: 29500, takeHomeAnnual: 22873.2, pensionPercent: 5, savingsPercent: 20 });
  assert.equal(salary.gross.monthly, 2458.33);
  assert.equal(salary.takeHome.monthly, 1906.1);
  assert.equal(salary.pension.annual, 1475);
  assert.equal(salary.savings.monthly, 381.22);

  const plan = buildMonthlyPlan({
    takeHomeMonthly: salary.takeHome.monthly,
    items: [
      { id: "rent", name: "Rent", amount: 950, category: "Rent", kind: "necessity", frequency: "monthly", active: true },
      { id: "saving", name: "Savings", amount: salary.savings.monthly, category: "Savings", kind: "saving", frequency: "monthly", active: true },
    ],
  });

  assert.equal(plan.monthlyTotal, 1331.22);
  assert.equal(plan.remainingMonthly, 574.88);
  assert.equal(plan.items[0].percentageOfTakeHome, 49.84);
});

test("allocates ledger rows into period and category totals", () => {
  assert.equal(ledgerNetAmount({ grossAmount: -120, vatAmount: -20 }), -100);
  assert.equal(inferPeriodIndex("2026-04-06", { startDate: "2026-04-06", endDate: "2027-04-05" }), 1);
  assert.equal(inferPeriodIndex("2027-03-30", { startDate: "2026-04-06", endDate: "2027-04-05" }), 12);

  const matrix = calculateLedgerMatrix([
    { id: "1", accountId: "amex", supplier: "Tesco", description: "Shop", periodIndex: 1, date: "2026-04-10", grossAmount: -60, vatAmount: 0, category: "Groceries", source: "manual" },
    { id: "2", accountId: "amex", supplier: "TfL", description: "Tube", periodIndex: 1, date: "2026-04-12", grossAmount: -12, vatAmount: 0, category: "Travel", source: "manual" },
    { id: "3", accountId: "amex", supplier: "Tesco", description: "Shop", periodIndex: 2, date: "2026-05-10", grossAmount: -40, vatAmount: 0, category: "Groceries", source: "manual" },
  ]);

  assert.equal(matrix.categoryTotals.Groceries, -100);
  assert.equal(matrix.periodTotals[1], -72);
  assert.equal(matrix.cells["1:Groceries"], -60);
});

test("calculates bank reconciliation status", () => {
  assert.deepEqual(calculateReconciliation({ appBalance: 1030, bankBalance: 1000, moneyInAfterDate: 50, moneyOutAfterDate: 80, bufferAmount: 500 }), {
    expectedBalance: 1030,
    difference: 0,
    status: "matched",
    bufferAmount: 500,
  });

  assert.equal(calculateReconciliation({ appBalance: 900, bankBalance: 1000, moneyInAfterDate: 50, moneyOutAfterDate: 80, bufferAmount: 500 }).status, "needs_review");
});
