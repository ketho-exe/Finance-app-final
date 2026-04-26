"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { StatCard } from "@/components/stat-card";
import { categorySpend } from "@/lib/finance";
import { calculateSafeToSpendToday } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency } from "@/lib/utils";

export function DashboardContent() {
  const { cards, pots, transactions, salary } = useFinance();
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const monthlyIncome = transactions.filter((item) => item.category === "Income").slice(0, 1)[0]?.amount ?? 0;
  const monthlySpend = transactions
    .filter((item) => item.amount < 0 && item.date.startsWith("2026-04"))
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const topCategory = Object.entries(categorySpend(transactions)).sort((a, b) => b[1] - a[1])[0];
  const potProgress = pots.length ? pots.reduce((sum, pot) => sum + pot.current / pot.target, 0) / pots.length : 0;
  const currentBalance = cards.filter((card) => card.type === "current").reduce((sum, card) => sum + card.balance, 0);
  const savingsTarget = pots.reduce((sum, pot) => sum + pot.monthlyContribution, 0);
  const today = new Date();
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const safeSpend = calculateSafeToSpendToday({
    balance: currentBalance,
    upcomingBills: 1356,
    savingsTarget,
    daysLeftInMonth: daysLeft,
    buffer: 250,
  });

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total balance" value={currency.format(totalBalance)} detail="Across current, credit, and savings cards" tone="good" />
        <StatCard label="April income" value={currency.format(monthlyIncome)} detail="Latest payroll transaction" />
        <StatCard label="April spending" value={currency.format(monthlySpend)} detail={`Highest category: ${topCategory?.[0] ?? "None"}`} tone="warn" />
        <StatCard label="Pot progress" value={`${Math.round(potProgress * 100)}%`} detail="Average progress toward active goals" />
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Cash flow</h2>
              <p className="text-sm text-muted">Actuals plus near-term prediction.</p>
            </div>
            <TrendingUp className="size-5 text-accent" />
          </div>
          <CashFlowChart transactions={transactions} monthlySalary={salary.gross / 12} />
        </div>
        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center gap-3">
              <Wallet className="size-5 text-accent" />
              <h2 className="text-xl font-black">Next actions</h2>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Review card utilisation", "/cards"],
                ["Import latest bank CSV", "/upload"],
                ["Re-check salary deductions", "/salary"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="flex items-center justify-between rounded-md bg-soft px-3 py-3 text-sm font-bold hover:text-accent">
                  {label}
                  <ArrowRight className="size-4" />
                </Link>
              ))}
            </div>
          </div>
          <div className="surface p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-accent-2" />
              <h2 className="text-xl font-black">Safe to spend today</h2>
            </div>
            <p className="mt-4 text-4xl font-black">{currency.format(safeSpend.safeToday)}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              After upcoming bills, savings contributions, and a buffer, {currency.format(safeSpend.discretionaryRemaining)} remains for the month.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
