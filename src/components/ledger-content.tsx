"use client";

import { useMemo, useState } from "react";
import { SelectField } from "@/components/select-field";
import { useFinance } from "@/lib/finance-store";
import { calculateLedgerMatrix, transactionToLedgerRow } from "@/lib/ledger";
import { currency, preciseCurrency } from "@/lib/utils";

const activeYear = { label: "2026-27", startDate: "2026-04-06", endDate: "2027-04-05" };

export function LedgerContent() {
  const { cards, transactions, categoryOptions } = useFinance();
  const [accountId, setAccountId] = useState(cards[0]?.id ?? "all");
  const accountOptions = [{ value: "all", label: "All accounts" }, ...cards.map((card) => ({ value: card.id, label: `${card.provider} ${card.name}` }))];
  const ledgerRows = useMemo(() => transactions.filter((transaction) => accountId === "all" || transaction.cardId === accountId).map((transaction) => transactionToLedgerRow(transaction, activeYear)), [accountId, transactions]);
  const matrix = calculateLedgerMatrix(ledgerRows);
  const categories = categoryOptions.filter((category) => ledgerRows.some((row) => row.category === category));
  const periods = Array.from(new Set(ledgerRows.map((row) => row.periodIndex))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <section className="surface grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-end">
        <SelectField label="Account" value={accountId} options={accountOptions} onChange={setAccountId} />
        <div>
          <p className="text-sm font-bold text-muted">Ledger total</p>
          <p className="text-2xl font-black">{currency.format(matrix.total)}</p>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-black">Financial-year category matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-soft text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-black">Period</th>
                {categories.map((category) => <th key={category} className="px-4 py-3 font-black">{category}</th>)}
                <th className="px-4 py-3 font-black">Total</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period} className="border-t border-border">
                  <td className="px-4 py-3 font-black">Period {period}</td>
                  {categories.map((category) => <td key={category} className="px-4 py-3">{preciseCurrency.format(matrix.cells[`${period}:${category}`] ?? 0)}</td>)}
                  <td className="px-4 py-3 font-black">{preciseCurrency.format(matrix.periodTotals[period] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-soft font-black">
              <tr>
                <td className="px-4 py-3">Year total</td>
                {categories.map((category) => <td key={category} className="px-4 py-3">{preciseCurrency.format(matrix.categoryTotals[category] ?? 0)}</td>)}
                <td className="px-4 py-3">{preciseCurrency.format(matrix.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-black">Ledger rows</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-soft text-left text-muted">
              <tr>{["Supplier", "Description", "Period", "Date", "Gross", "VAT", "Net", "Category", "Source"].map((heading) => <th key={heading} className="px-4 py-3 font-black">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {ledgerRows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 font-black">{row.supplier}</td>
                  <td className="px-4 py-3">{row.description}</td>
                  <td className="px-4 py-3">{row.periodIndex}</td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{preciseCurrency.format(row.grossAmount)}</td>
                  <td className="px-4 py-3">{preciseCurrency.format(row.vatAmount)}</td>
                  <td className="px-4 py-3">{preciseCurrency.format(row.grossAmount - row.vatAmount)}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3 capitalize">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
