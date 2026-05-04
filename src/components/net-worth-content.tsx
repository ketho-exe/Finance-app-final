"use client";

import { useFinance } from "@/lib/finance-store";
import { currency, preciseCurrency } from "@/lib/utils";

export function NetWorthContent() {
  const { cards, pots } = useFinance();
  const accountAssets = cards.filter((card) => card.balance > 0).reduce((sum, card) => sum + card.balance, 0);
  const potAssets = pots.reduce((sum, pot) => sum + pot.current, 0);
  const liabilities = cards.filter((card) => card.balance < 0).reduce((sum, card) => sum + Math.abs(card.balance), 0);
  const netWorth = accountAssets + potAssets - liabilities;
  const rows = [
    ...cards.map((card) => ({ id: card.id, name: `${card.provider} ${card.name}`, kind: card.type === "credit" || card.balance < 0 ? "liability" : "asset", balance: card.balance })),
    ...pots.map((pot) => ({ id: pot.id, name: pot.name, kind: "asset", balance: pot.current })),
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-4">
        <Summary label="Assets" value={currency.format(accountAssets + potAssets)} />
        <Summary label="Liabilities" value={currency.format(liabilities)} />
        <Summary label="Net worth" value={currency.format(netWorth)} />
        <Summary label="Tracked records" value={String(rows.length)} />
      </section>
      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-black">Balance register</h2>
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_140px_140px] sm:items-center">
              <p className="font-black">{row.name}</p>
              <p className="capitalize text-muted">{row.kind}</p>
              <p className="font-black sm:text-right">{preciseCurrency.format(row.balance)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
