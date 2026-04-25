"use client";

import { calculateSafeToSpendToday } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency } from "@/lib/utils";

export function SafeSpendContent() {
  const { cards, pots } = useFinance();
  const availableBalance = cards.filter((card) => card.type === "current").reduce((sum, card) => sum + card.balance, 0);
  const savingsTarget = pots.reduce((sum, pot) => sum + pot.monthlyContribution, 0);
  const upcomingBills = 1150 + 126 + 80;
  const today = new Date();
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const result = calculateSafeToSpendToday({ balance: availableBalance, upcomingBills, savingsTarget, daysLeftInMonth: daysLeft, buffer: 250 });

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="surface p-6">
        <p className="text-sm font-black uppercase text-accent">Safe to spend today</p>
        <p className="mt-3 text-5xl font-black">{currency.format(result.safeToday)}</p>
        <p className="mt-3 text-muted">This reserves known bills, monthly pot contributions, and a £250 buffer before dividing the rest across the days left this month.</p>
      </section>
      <section className="surface p-6">
        <h2 className="text-xl font-black">Calculation</h2>
        <div className="mt-4 space-y-3 text-sm font-bold">
          <Row label="Current account balance" value={currency.format(availableBalance)} />
          <Row label="Upcoming bills reserve" value={`-${currency.format(upcomingBills)}`} />
          <Row label="Savings reserve" value={`-${currency.format(savingsTarget)}`} />
          <Row label="Buffer" value="-£250" />
          <Row label="Discretionary remaining" value={currency.format(result.discretionaryRemaining)} />
          <Row label="Days left in month" value={String(daysLeft)} />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-md bg-soft px-3 py-3">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
