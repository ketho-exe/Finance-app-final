import assert from "node:assert/strict";
import test from "node:test";
import {
  cardFromRow,
  cardToRow,
  potFromRow,
  potToRow,
  salaryFromRow,
  salaryToRow,
  transactionFromRow,
  transactionToRow,
  wishlistFromRow,
  wishlistToRow,
  budgetFromRow,
  budgetToRow,
  subscriptionFromRow,
  subscriptionToRow,
} from "../src/lib/supabase-finance";

test("maps card rows to UI cards and back", () => {
  const card = cardFromRow({
    id: "00000000-0000-4000-8000-000000000001",
    name: "Main",
    provider: "Bank",
    type: "credit",
    balance: "-123.45",
    credit_limit: "2000",
    overdraft_limit: null,
    colour: "bg-[#0f766e]",
  });

  assert.equal(card.balance, -123.45);
  assert.deepEqual(cardToRow(card, "user-1"), {
    id: "00000000-0000-4000-8000-000000000001",
    user_id: "user-1",
    name: "Main",
    provider: "Bank",
    type: "credit",
    balance: -123.45,
    credit_limit: 2000,
    overdraft_limit: null,
    colour: "bg-[#0f766e]",
  });
});

test("maps transaction rows to UI transactions and back", () => {
  const transaction = transactionFromRow({
    id: "00000000-0000-4000-8000-000000000002",
    transaction_date: "2026-04-25",
    merchant: "Tesco",
    category: "Groceries",
    amount: "-21.50",
    card_id: "00000000-0000-4000-8000-000000000001",
    notes: "Weekly shop",
    source: "csv",
  });

  assert.equal(transaction.category, "Groceries");
  assert.equal(transaction.source, "csv");
  assert.deepEqual(transactionToRow(transaction, "user-1"), {
    id: "00000000-0000-4000-8000-000000000002",
    user_id: "user-1",
    transaction_date: "2026-04-25",
    merchant: "Tesco",
    category: "Groceries",
    amount: -21.5,
    card_id: "00000000-0000-4000-8000-000000000001",
    notes: "Weekly shop",
    source: "csv",
  });
});

test("maps pot, wishlist, and salary rows", () => {
  assert.equal(potFromRow({ id: "p1", name: "Trip", kind: "goal", current_amount: "10", target_amount: "100", monthly_contribution: "5" }).target, 100);
  assert.equal(wishlistFromRow({ id: "w1", name: "Chair", price: "300", saved_amount: "20", priority: "High" }).saved, 20);
  const salary = salaryFromRow({ gross_annual: "60000", pension_percent: "6", pension_tax_timing: "after-tax", student_loan_plan: "plan2", payday_day: 25, income_card_id: "00000000-0000-4000-8000-000000000001" });
  assert.equal(salary.pension, 6);
  assert.equal(salary.pensionTiming, "after-tax");
  assert.equal(salary.paydayDay, 25);
  assert.equal(potToRow({ id: "p1", name: "Trip", kind: "goal", current: 10, target: 100, monthlyContribution: 5 }, "user-1").target_amount, 100);
  assert.equal(wishlistToRow({ id: "w1", name: "Chair", price: 300, saved: 20, priority: "High" }, "user-1").saved_amount, 20);
  const salaryRow = salaryToRow({ gross: 60000, pension: 6, pensionTiming: "after-tax", studentLoan: "plan2", paydayDay: 25, incomeCardId: "00000000-0000-4000-8000-000000000001" }, "user-1");
  assert.deepEqual(salaryRow, {
    user_id: "user-1",
    gross_annual: 60000,
    pension_percent: 6,
    pension_tax_timing: "after-tax",
    student_loan_plan: "plan2",
    payday_day: 25,
    income_card_id: "00000000-0000-4000-8000-000000000001",
    updated_at: salaryRow.updated_at,
  });
});

test("maps budget and subscription rows", () => {
  const budget = budgetFromRow({ id: "b1", category: "Groceries", monthly_limit: "450", commitment_type: "reserve", due_day: 20, card_id: "00000000-0000-4000-8000-000000000001" });
  assert.equal(budget.monthlyLimit, 450);
  assert.equal(budget.commitment, "reserve");
  assert.deepEqual(budgetToRow(budget, "user-1"), {
    id: undefined,
    user_id: "user-1",
    category: "Groceries",
    monthly_limit: 450,
    commitment_type: "reserve",
    due_day: 20,
    card_id: "00000000-0000-4000-8000-000000000001",
  });

  const subscription = subscriptionFromRow({
    id: "s1",
    name: "Netflix",
    amount: "17.99",
    category: "Entertainment",
    card_id: "00000000-0000-4000-8000-000000000001",
    renewal_day: 27,
    warning_days: 7,
  });
  assert.equal(subscription.amount, 17.99);
  assert.equal(subscriptionToRow(subscription, "user-1").renewal_day, 27);
});
