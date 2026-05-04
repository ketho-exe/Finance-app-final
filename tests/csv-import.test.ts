import assert from "node:assert/strict";
import test from "node:test";
import {
  autoDetectCsvMapping,
  buildCsvCandidates,
  csvCandidateToTransaction,
  parseCsvAmount,
  parseCsvDate,
  type CsvMapping,
} from "../src/lib/csv-import";

const cards = [{ id: "main", name: "Main" }];
const categories = ["Groceries", "Transport", "Shopping", "Income"];

test("autoDetectCsvMapping recognises common UK bank columns", () => {
  assert.deepEqual(autoDetectCsvMapping(["Transaction Date", "Counter Party", "Amount (GBP)", "Spending Category", "Reference"]), {
    date: "Transaction Date",
    merchant: "Counter Party",
    amount: "Amount (GBP)",
    notes: "Reference",
    category: "Spending Category",
    account: undefined,
  });
});

test("parseCsvDate and parseCsvAmount handle common bank formats", () => {
  assert.equal(parseCsvDate("04/05/2026"), "2026-05-04");
  assert.equal(parseCsvDate("2026-05-04"), "2026-05-04");
  assert.equal(parseCsvAmount("£1,234.56"), 1234.56);
  assert.equal(parseCsvAmount("(42.10)"), -42.1);
});

test("buildCsvCandidates validates all rows and marks duplicates", () => {
  const mapping: CsvMapping = { date: "Date", merchant: "Name", amount: "Amount", category: "Category", notes: "Notes" };
  const candidates = buildCsvCandidates(
    [
      { Date: "2026-05-01", Name: "Tesco", Amount: "-12.34", Category: "Groceries", Notes: "Food" },
      { Date: "2026-05-01", Name: "Tesco", Amount: "-12.34", Category: "Groceries", Notes: "Duplicate" },
      { Date: "", Name: "", Amount: "not money", Category: "" },
    ],
    { mapping, cards, categories, defaultCardId: "main", defaultCategory: "Shopping", existingFingerprints: new Set(["2026-04-01|Old|1|main"]) },
  );

  assert.equal(candidates.length, 3);
  assert.equal(candidates[0].valid, true);
  assert.equal(candidates[0].duplicate, false);
  assert.equal(candidates[1].duplicate, true);
  assert.equal(candidates[1].valid, false);
  assert.deepEqual(candidates[2].errors, ["Date is missing or invalid", "Merchant is missing", "Amount is missing or invalid"]);
});

test("csvCandidateToTransaction uses csv source", () => {
  const [candidate] = buildCsvCandidates(
    [{ Date: "2026-05-01", Name: "Tesco", Amount: "-12.34", Category: "Groceries" }],
    { mapping: { date: "Date", merchant: "Name", amount: "Amount", category: "Category" }, cards, categories, defaultCardId: "main", defaultCategory: "Shopping", existingFingerprints: new Set() },
  );

  const transaction = csvCandidateToTransaction(candidate, "csv-1");
  assert.equal(transaction.source, "csv");
  assert.equal(transaction.amount, -12.34);
  assert.equal(transaction.cardId, "main");
});
