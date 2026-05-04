import { roundMoney } from "@/lib/money";

export type FinanceYear = {
  label?: string;
  startDate: string;
  endDate: string;
};

export type LedgerRow = {
  id: string;
  accountId: string;
  supplier: string;
  externalRef?: string;
  description: string;
  periodIndex: number;
  date: string;
  grossAmount: number;
  vatAmount: number;
  category: string;
  notes?: string;
  source: "manual" | "csv" | "import";
};

export function ledgerNetAmount(row: Pick<LedgerRow, "grossAmount" | "vatAmount">) {
  return roundMoney(row.grossAmount - row.vatAmount);
}

export function inferPeriodIndex(date: string, financeYear: FinanceYear) {
  const transactionDate = parseIsoDate(date);
  const startDate = parseIsoDate(financeYear.startDate);
  const endDate = parseIsoDate(financeYear.endDate);
  if (!transactionDate || !startDate || !endDate || transactionDate < startDate || transactionDate > endDate) return undefined;
  return ((transactionDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12) + transactionDate.getUTCMonth() - startDate.getUTCMonth() + 1;
}

export function calculateLedgerMatrix(rows: LedgerRow[]) {
  const categoryTotals: Record<string, number> = {};
  const periodTotals: Record<number, number> = {};
  const cells: Record<string, number> = {};

  for (const row of rows) {
    const net = ledgerNetAmount(row);
    categoryTotals[row.category] = roundMoney((categoryTotals[row.category] ?? 0) + net);
    periodTotals[row.periodIndex] = roundMoney((periodTotals[row.periodIndex] ?? 0) + net);
    cells[`${row.periodIndex}:${row.category}`] = roundMoney((cells[`${row.periodIndex}:${row.category}`] ?? 0) + net);
  }

  return {
    categoryTotals,
    periodTotals,
    cells,
    total: roundMoney(rows.reduce((sum, row) => sum + ledgerNetAmount(row), 0)),
  };
}

export function transactionToLedgerRow(transaction: { id: string; cardId: string; merchant: string; notes?: string; category: string; date: string; amount: number }, financeYear: FinanceYear): LedgerRow {
  return {
    id: transaction.id,
    accountId: transaction.cardId,
    supplier: transaction.merchant,
    description: transaction.notes ?? transaction.merchant,
    periodIndex: inferPeriodIndex(transaction.date, financeYear) ?? 1,
    date: transaction.date,
    grossAmount: transaction.amount,
    vatAmount: 0,
    category: transaction.category,
    source: "manual",
  };
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}
