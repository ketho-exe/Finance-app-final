import assert from "node:assert/strict";
import test from "node:test";
import {
  fallbackTransactionId,
  guessCategory,
  normaliseMerchant,
  toOpenBankingTransactionRow,
} from "../src/lib/open-banking/sync";

test("normaliseMerchant prefers named parties and trims long labels", () => {
  assert.equal(normaliseMerchant({ creditorName: "Tesco Stores", transactionAmount: { amount: "-12.40", currency: "GBP" } }), "Tesco Stores");
  assert.equal(
    normaliseMerchant({
      remittanceInformationUnstructuredArray: ["Standing", "Order"],
      transactionAmount: { amount: "-10", currency: "GBP" },
    }),
    "Standing Order",
  );
  assert.equal(normaliseMerchant({ transactionAmount: { amount: "-1", currency: "GBP" } }), "Open Banking transaction");
});

test("fallbackTransactionId is stable for duplicate provider transactions", () => {
  const tx = {
    bookingDate: "2026-05-01",
    remittanceInformationUnstructured: "Coffee",
    transactionAmount: { amount: "-3.50", currency: "GBP" },
  };

  assert.equal(fallbackTransactionId("acc-1", tx), fallbackTransactionId("acc-1", tx));
  assert.notEqual(fallbackTransactionId("acc-1", tx), fallbackTransactionId("acc-2", tx));
});

test("guessCategory recognises common UK merchant patterns", () => {
  assert.equal(guessCategory({ creditorName: "Payroll Ltd", transactionAmount: { amount: "2500", currency: "GBP" } }), "Income");
  assert.equal(guessCategory({ creditorName: "Aldi", transactionAmount: { amount: "-45", currency: "GBP" } }), "Groceries");
  assert.equal(guessCategory({ creditorName: "TfL Travel", transactionAmount: { amount: "-6", currency: "GBP" } }), "Transport");
  assert.equal(guessCategory({ creditorName: "Unknown shop", transactionAmount: { amount: "-6", currency: "GBP" } }), "Shopping");
});

test("toOpenBankingTransactionRow maps provider transactions to idempotent Supabase rows", () => {
  const row = toOpenBankingTransactionRow({
    userId: "user-1",
    cardId: "card-1",
    externalAccountId: "account-1",
    importedAt: "2026-05-05T12:00:00.000Z",
    tx: {
      transactionId: "provider-tx-1",
      bookingDate: "2026-05-04",
      creditorName: "Netflix",
      transactionAmount: { amount: "-17.99", currency: "GBP" },
    },
  });

  assert.deepEqual(row, {
    user_id: "user-1",
    card_id: "card-1",
    external_account_id: "account-1",
    external_transaction_id: "provider-tx-1",
    transaction_date: "2026-05-04",
    merchant: "Netflix",
    category: "Entertainment",
    amount: -17.99,
    notes: null,
    source: "open_banking",
    imported_at: "2026-05-05T12:00:00.000Z",
    pending: false,
  });
});
