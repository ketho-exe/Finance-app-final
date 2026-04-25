"use client";

import { useState } from "react";
import { calculateDebtPayoff } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency } from "@/lib/utils";

export function DebtPlannerContent() {
  const { cards } = useFinance();
  const [payment, setPayment] = useState(400);
  const payoff = calculateDebtPayoff(cards, payment);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="surface h-fit p-5">
        <h2 className="text-xl font-black">Monthly debt payment</h2>
        <input type="range" min="50" max="1500" step="25" value={payment} onChange={(event) => setPayment(Number(event.target.value))} className="mt-5 w-full accent-[var(--accent)]" />
        <p className="mt-3 text-4xl font-black">{currency.format(payment)}</p>
        <p className="mt-2 text-sm text-muted">Applied to each active debt account for planning.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {payoff.length ? (
          payoff.map((item) => (
            <article key={item.cardId} className="surface p-5">
              <h2 className="text-2xl font-black">{item.cardName}</h2>
              <p className="mt-2 text-sm text-muted">APR estimate: {Math.round(item.apr * 1000) / 10}%</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Mini label="Debt" value={currency.format(item.startingDebt)} />
                <Mini label="Months" value={String(item.monthsToPayoff)} />
                <Mini label="Interest" value={currency.format(item.totalInterest)} />
              </div>
            </article>
          ))
        ) : (
          <article className="surface p-5">
            <h2 className="text-xl font-black">No active debt</h2>
            <p className="mt-2 text-muted">Credit and overdraft accounts with negative balances will appear here.</p>
          </article>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-soft p-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
