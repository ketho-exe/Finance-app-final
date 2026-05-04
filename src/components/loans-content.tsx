"use client";

import { calculateDebtPayoff } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency, preciseCurrency } from "@/lib/utils";

export function LoansContent() {
  const { cards } = useFinance();
  const debts = cards.filter((card) => card.type === "credit" || card.balance < 0);
  const plans = calculateDebtPayoff(debts, 250);
  const totalDebt = debts.reduce((sum, card) => sum + Math.abs(Math.min(0, card.balance)), 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <Summary label="Tracked debt" value={currency.format(totalDebt)} />
        <Summary label="Debt accounts" value={String(debts.length)} />
        <Summary label="Assumed payment" value={currency.format(250)} />
      </section>
      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-black">Payoff estimates</h2>
        </div>
        <div className="divide-y divide-border">
          {plans.map((plan) => (
            <div key={plan.cardId} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_120px_120px_140px] sm:items-center">
              <p className="font-black">{plan.cardName}</p>
              <p>{plan.monthsToPayoff} months</p>
              <p>{(plan.apr * 100).toFixed(1)}% APR</p>
              <p className="font-black sm:text-right">{preciseCurrency.format(plan.totalInterest)}</p>
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
