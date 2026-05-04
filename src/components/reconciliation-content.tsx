"use client";

import { useMemo, useState } from "react";
import { SelectField } from "@/components/select-field";
import { useFinance } from "@/lib/finance-store";
import { calculateReconciliation } from "@/lib/reconciliation";
import { currency, preciseCurrency } from "@/lib/utils";

export function ReconciliationContent() {
  const { cards, transactions } = useFinance();
  const [accountId, setAccountId] = useState(cards[0]?.id ?? "");
  const [bankBalance, setBankBalance] = useState(0);
  const [moneyIn, setMoneyIn] = useState(0);
  const [moneyOut, setMoneyOut] = useState(0);
  const [buffer, setBuffer] = useState(500);
  const account = cards.find((card) => card.id === accountId);
  const recent = useMemo(() => transactions.filter((transaction) => transaction.cardId === accountId).slice(0, 8), [accountId, transactions]);
  const result = calculateReconciliation({ appBalance: account?.balance ?? 0, bankBalance, moneyInAfterDate: moneyIn, moneyOutAfterDate: moneyOut, bufferAmount: buffer });

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="surface space-y-4 p-4">
        <SelectField label="Account" value={accountId} options={cards.map((card) => ({ value: card.id, label: `${card.provider} ${card.name}` }))} onChange={setAccountId} />
        <MoneyInput label="Imported bank balance" value={bankBalance} onChange={setBankBalance} />
        <MoneyInput label="Money in after date" value={moneyIn} onChange={setMoneyIn} />
        <MoneyInput label="Money out after date" value={moneyOut} onChange={setMoneyOut} />
        <MoneyInput label="Buffer" value={buffer} onChange={setBuffer} />
      </section>

      <section className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          <Summary label="App balance" value={currency.format(account?.balance ?? 0)} />
          <Summary label="Expected balance" value={currency.format(result.expectedBalance)} />
          <Summary label="Difference" value={preciseCurrency.format(result.difference)} />
          <Summary label="Status" value={result.status.replace("_", " ")} />
        </div>
        <div className="surface overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-black">Recent app transactions</h2>
          </div>
          <div className="divide-y divide-border">
            {recent.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-black">{transaction.merchant}</p>
                  <p className="text-muted">{transaction.date} - {transaction.category}</p>
                </div>
                <p className="font-black">{preciseCurrency.format(transaction.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm font-bold text-muted">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold text-foreground" />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-2 text-xl font-black capitalize">{value}</p>
    </div>
  );
}
