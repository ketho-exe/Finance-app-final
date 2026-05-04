"use client";

import { useMemo, useState } from "react";
import { SelectField } from "@/components/select-field";
import { useFinance } from "@/lib/finance-store";
import { preciseCurrency } from "@/lib/utils";

export function StatementsContent() {
  const { cards, transactions } = useFinance();
  const creditCards = cards.filter((card) => card.type === "credit");
  const [accountId, setAccountId] = useState(creditCards[0]?.id ?? "");
  const monthly = useMemo(() => {
    const totals = transactions
      .filter((transaction) => transaction.cardId === accountId && transaction.amount < 0)
      .reduce<Record<string, number>>((sum, transaction) => {
        const month = transaction.date.slice(0, 7);
        sum[month] = (sum[month] ?? 0) + Math.abs(transaction.amount);
        return sum;
      }, {});
    return Object.entries(totals).sort(([a], [b]) => b.localeCompare(a)).slice(0, 12);
  }, [accountId, transactions]);
  const average = monthly.length ? monthly.reduce((sum, [, amount]) => sum + amount, 0) / monthly.length : 0;

  return (
    <div className="space-y-6">
      <section className="surface grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-end">
        <SelectField label="Credit account" value={accountId} options={creditCards.map((card) => ({ value: card.id, label: `${card.provider} ${card.name}` }))} onChange={setAccountId} />
        <div>
          <p className="text-sm font-bold text-muted">Average statement</p>
          <p className="text-2xl font-black">{preciseCurrency.format(average)}</p>
        </div>
      </section>
      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-black">Statement history from transactions</h2>
        </div>
        <div className="divide-y divide-border">
          {monthly.map(([month, amount]) => (
            <div key={month} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <p className="font-black">{month}</p>
              <p className="font-black">{preciseCurrency.format(amount)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
