import assert from "node:assert/strict";
import test from "node:test";
import { calculateUkSalary, cards, categorySpend, transactions } from "../src/lib/finance";
import {
  buildCashFlowSeries,
  buildBudgetAlerts,
  calculateAffordability,
  calculateBudgetUsage,
  calculateDebtPayoff,
  calculateEmergencyBuffer,
  calculatePaydayPlan,
  calculateSafeToSpendToday,
  calculateMonthlySubscriptionTotal,
  buildMonthEndForecast,
  buildRecurringOccurrences,
  calculatePaydayCycle,
  calculateSpendingSummary,
  filterTransactions,
  findUpcomingRenewals,
  planWishlistAffordability,
  predictFutureBalance,
  suggestCategory,
} from "../src/lib/finance-insights";

test("calculatePaydayCycle supports fixed, last working day, weekly, and four-weekly paydays", () => {
  assert.deepEqual(calculatePaydayCycle({ type: "fixed-day", day: 28 }, new Date("2026-05-04T09:00:00")).nextPayday, "2026-05-28");
  assert.deepEqual(calculatePaydayCycle({ type: "last-working-day" }, new Date("2026-05-04T09:00:00")).nextPayday, "2026-05-29");
  assert.deepEqual(calculatePaydayCycle({ type: "weekly", weekday: 5 }, new Date("2026-05-04T09:00:00")).nextPayday, "2026-05-08");
  assert.deepEqual(calculatePaydayCycle({ type: "four-weekly", anchorDate: "2026-04-10" }, new Date("2026-05-04T09:00:00")).nextPayday, "2026-05-08");
});

test("buildRecurringOccurrences creates deterministic occurrences without duplicate keys", () => {
  const occurrences = buildRecurringOccurrences(
    [
      { id: "salary", name: "Salary", amount: 2000, category: "Income", cardId: "main", type: "income", frequency: "monthly", startDate: "2026-04-28", autoCreate: true },
      { id: "rent", name: "Rent", amount: -900, category: "Rent", cardId: "main", type: "expense", frequency: "monthly", startDate: "2026-04-01", autoCreate: false },
    ],
    { startDate: "2026-05-01", endDate: "2026-06-30" },
  );

  assert.deepEqual(occurrences.map((item) => item.dedupeKey), ["rent:2026-05-01", "salary:2026-05-28", "rent:2026-06-01", "salary:2026-06-28"]);
});

test("calculateSpendingSummary excludes transfers from spending", () => {
  const summary = calculateSpendingSummary([
    { id: "income", date: "2026-05-01", merchant: "Payroll", category: "Income", amount: 2000, cardId: "main" },
    { id: "groceries", date: "2026-05-02", merchant: "Tesco", category: "Groceries", amount: -50, cardId: "main" },
    { id: "transfer", date: "2026-05-03", merchant: "ISA transfer", category: "Transfer", amount: -250, cardId: "main" },
  ]);

  assert.equal(summary.income, 2000);
  assert.equal(summary.spending, 50);
  assert.equal(summary.transfers, 250);
  assert.deepEqual(categorySpend([
    { id: "groceries", date: "2026-05-02", merchant: "Tesco", category: "Groceries", amount: -50, cardId: "main" },
    { id: "transfer", date: "2026-05-03", merchant: "ISA transfer", category: "Transfer", amount: -250, cardId: "main" },
  ]), { Groceries: 50 });
});

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

test("findUpcomingRenewals includes renewals due later today", () => {
  const renewals = findUpcomingRenewals(
    [{ id: "s1", name: "Broadband", amount: 32, category: "Bills", cardId: "monzo", renewalDay: 28, warningDays: 7 }],
    new Date("2026-04-28T15:30:00"),
  );

  assert.equal(renewals.length, 1);
  assert.equal(renewals[0].renewalDate, "2026-04-28");
  assert.equal(renewals[0].daysUntilRenewal, 0);
});

test("findUpcomingRenewals uses the real month end for day 31 renewals", () => {
  const renewals = findUpcomingRenewals(
    [{ id: "s1", name: "Mortgage", amount: 1250, category: "Bills", cardId: "chase", renewalDay: 31, warningDays: 40 }],
    new Date("2026-05-01T09:00:00"),
  );

  assert.equal(renewals[0].renewalDate, "2026-05-31");
  assert.equal(renewals[0].daysUntilRenewal, 30);
});

test("month-end forecast includes take-home salary, recurring bills, and committed budgets", () => {
  const forecast = buildMonthEndForecast({
    currentBalance: 1000,
    monthlyTakeHome: 2500,
    paydayDay: 25,
    today: new Date("2026-04-20T00:00:00Z"),
    subscriptions: [{ id: "s1", name: "Phone", amount: 30, category: "Bills", cardId: "c1", renewalDay: 27, warningDays: 7 }],
    budgets: [
      { id: "b1", category: "Rent", monthlyLimit: 900, commitment: "bill", dueDay: 28 },
      { id: "b2", category: "Transport", monthlyLimit: 160, commitment: "reserve" },
    ],
  });

  assert.deepEqual(forecast.events.map((event) => event.name), ["Salary", "Phone", "Rent reserve", "Transport hold"]);
  assert.equal(forecast.projectedEndBalance, 2570);
  assert.equal(forecast.reservedAtMonthEnd, 160);
  assert.equal(forecast.availableAtMonthEnd, 2410);
});

test("month-end forecast includes payday when it is today", () => {
  const forecast = buildMonthEndForecast({
    currentBalance: 1000,
    monthlyTakeHome: 2500,
    paydayDay: 25,
    today: new Date("2026-04-25T12:00:00"),
    subscriptions: [],
    budgets: [],
  });

  assert.deepEqual(forecast.events.map((event) => event.name), ["Salary"]);
  assert.equal(forecast.projectedEndBalance, 3500);
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

test("calculateBudgetUsage handles empty, deleted, zero-limit, and multi-month data", () => {
  const usage = calculateBudgetUsage(
    [
      { id: "b1", category: "Groceries", monthlyLimit: 100 },
      { id: "b2", category: "Shopping", monthlyLimit: 0 },
    ],
    [
      { id: "t1", date: "2026-04-10", merchant: "Tesco", category: "Groceries", amount: -30, cardId: "card-1" },
      { id: "t2", date: "2026-03-10", merchant: "Tesco", category: "Groceries", amount: -70, cardId: "card-1" },
      { id: "t3", date: "2026-04-12", merchant: "Refund", category: "Groceries", amount: 10, cardId: "card-1" },
    ],
    "2026-04",
  );

  assert.equal(usage[0].spent, 30);
  assert.equal(usage[0].remaining, 70);
  assert.equal(usage[0].progress, 30);
  assert.equal(usage[1].progress, 0);
});

test("calculateMonthlySubscriptionTotal normalises repeat patterns", () => {
  const total = calculateMonthlySubscriptionTotal([
    { id: "s1", name: "Weekly", amount: 10, category: "Bills", cardId: "c1", renewalDay: 1, warningDays: 7, repeatPattern: "weekly" },
    { id: "s2", name: "Four weekly", amount: 40, category: "Bills", cardId: "c1", renewalDay: 1, warningDays: 7, repeatPattern: "four-weekly" },
    { id: "s3", name: "Monthly", amount: 25, category: "Bills", cardId: "c1", renewalDay: 1, warningDays: 7, repeatPattern: "monthly" },
  ]);

  assert.equal(total, 111.67);
});

test("calculateUkSalary supports pension contributions before or after tax", () => {
  const beforeTax = calculateUkSalary(52000, 5, "plan2", "before-tax");
  const afterTax = calculateUkSalary(52000, 5, "plan2", "after-tax");

  assert.equal(beforeTax.pension, 2600);
  assert.equal(afterTax.pension, 2600);
  assert.ok(beforeTax.takeHomeAnnual > afterTax.takeHomeAnnual);
  assert.ok(afterTax.incomeTax > beforeTax.incomeTax);
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

test("buildCashFlowSeries uses saved salary when income transactions are missing", () => {
  const series = buildCashFlowSeries({
    transactions: [
      { id: "t1", date: "2026-04-10", merchant: "Rent", category: "Rent", amount: -1000, cardId: "card-1" },
      { id: "t2", date: "2026-05-10", merchant: "Groceries", category: "Groceries", amount: -200, cardId: "card-1" },
    ],
    monthlySalary: 2500,
    startDate: new Date("2026-04-01T00:00:00Z"),
    months: 2,
  });

  assert.deepEqual(series.map((item) => item.month), ["Apr", "May"]);
  assert.equal(series[0].income, 2500);
  assert.equal(series[0].outgoings, 1000);
  assert.equal(series[0].net, 1500);
  assert.equal(series[1].income, 2500);
});

test("filterTransactions searches merchant, notes, card, category, amount and direction", () => {
  const filtered = filterTransactions(
    [
      { id: "1", date: "2026-04-01", merchant: "Tesco", category: "Groceries", amount: -25, cardId: "card-a", notes: "weekly" },
      { id: "2", date: "2026-04-02", merchant: "Payroll", category: "Income", amount: 2000, cardId: "card-b" },
    ],
    { query: "tes", category: "Groceries", cardId: "card-a", direction: "outgoing", minAmount: 20, maxAmount: 30 },
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].merchant, "Tesco");
});

test("predictFutureBalance and payday plan combine salary and recurring outgoings", () => {
  const prediction = predictFutureBalance({
    currentBalance: 1000,
    monthlySalary: 2500,
    recurring: [{ id: "r1", name: "Rent", amount: -700, category: "Rent", cardId: "c1", renewalDay: 10, warningDays: 7 }],
    today: new Date("2026-04-01T00:00:00Z"),
    paydayDay: 25,
    buffer: 200,
  });

  assert.ok(prediction.balanceByPayday > 0);
  assert.equal(prediction.bufferWarningDate, null);

  const payday = calculatePaydayPlan({
    currentBalance: 1000,
    monthlySalary: 2500,
    transactions: [],
    recurring: prediction.upcomingRecurring,
    today: new Date("2026-04-01T00:00:00Z"),
    paydayDay: 25,
    buffer: 200,
  });
  assert.equal(payday.daysUntilPayday, 24);
});

test("affordability, emergency buffer, alerts, and wishlist plans return actionable values", () => {
  const affordability = calculateAffordability({ itemCost: 250, safeToday: 50, discretionaryRemaining: 500, savingsTarget: 300 });
  assert.equal(affordability.affordable, true);
  assert.equal(affordability.dailySpendAfterPurchase, 25);

  const buffer = calculateEmergencyBuffer({ targetMonths: 1, transactions: [{ id: "1", date: "2026-04-01", merchant: "Rent", category: "Rent", amount: -1000, cardId: "c1" }], savedAmount: 250 });
  assert.equal(buffer.target, 1000);
  assert.equal(buffer.progress, 25);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const alerts = buildBudgetAlerts([{ id: "b1", category: "Eating out", monthlyLimit: 100 }], [{ id: "1", date: `${currentMonth}-01`, merchant: "Cafe", category: "Eating out", amount: -85, cardId: "c1" }], []);
  assert.equal(alerts[0].type, "budget");

  const wishlist = planWishlistAffordability([{ id: "w1", name: "Ticket", price: 250, saved: 50, priority: "High" }], 100);
  assert.equal(wishlist[0].monthsUntilAffordable, 2);
});
