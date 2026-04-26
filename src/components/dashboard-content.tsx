"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, ShieldCheck, Target, TrendingUp, Wallet } from "lucide-react";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { StatCard } from "@/components/stat-card";
import { categorySpend } from "@/lib/finance";
import { buildBudgetAlerts, calculateAffordability, calculateEmergencyBuffer, calculatePaydayPlan, calculateSafeToSpendToday } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency } from "@/lib/utils";

export function DashboardContent() {
  const { cards, pots, transactions, salary, budgets, subscriptions } = useFinance();
  const [affordCheck, setAffordCheck] = useState(250);
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
    upcomingBills: subscriptions.reduce((sum, item) => sum + item.amount, 0),
    savingsTarget,
    daysLeftInMonth: daysLeft,
    buffer: 250,
  });
  const monthlySalary = salary.gross / 12;
  const payday = calculatePaydayPlan({
    currentBalance,
    monthlySalary,
    transactions,
    recurring: subscriptions,
    today,
    paydayDay: 25,
    buffer: 250,
  });
  const affordability = calculateAffordability({
    itemCost: affordCheck,
    safeToday: safeSpend.safeToday,
    discretionaryRemaining: safeSpend.discretionaryRemaining,
    savingsTarget,
  });
  const emergency = calculateEmergencyBuffer({
    targetMonths: 1,
    transactions,
    savedAmount: pots.find((pot) => pot.name.toLowerCase().includes("emergency"))?.current ?? pots.filter((pot) => pot.kind === "saving").reduce((sum, pot) => sum + pot.current, 0),
  });
  const alerts = buildBudgetAlerts(budgets, transactions, subscriptions).slice(0, 4);

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
          <CashFlowChart transactions={transactions} monthlySalary={monthlySalary} />
        </div>
        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-5 text-accent" />
              <h2 className="text-xl font-black">Payday planner</h2>
            </div>
            <p className="mt-4 text-3xl font-black">{payday.daysUntilPayday} days</p>
            <p className="mt-1 text-sm text-muted">Projected payday balance: {currency.format(payday.balanceByPayday)}</p>
            <p className="mt-3 text-sm font-bold">{currency.format(payday.safeDailySpend)} safe daily spend until payday.</p>
            {payday.bufferWarningDate ? <p className="mt-2 text-sm font-bold text-danger">Buffer risk on {payday.bufferWarningDate}</p> : null}
          </div>
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
      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <Target className="size-5 text-accent-2" />
            <h2 className="text-xl font-black">Can I afford it?</h2>
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-bold text-muted">Purchase amount</span>
            <input type="number" step="1" value={affordCheck} onChange={(event) => setAffordCheck(Number(event.target.value))} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
          </label>
          <p className={`mt-4 text-sm font-black ${affordability.affordable ? "text-accent" : "text-danger"}`}>
            {affordability.affordable ? "Fits current discretionary money" : "Would push past discretionary money"}
          </p>
          <p className="mt-1 text-sm text-muted">Daily spend after purchase: {currency.format(affordability.dailySpendAfterPurchase)}</p>
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-accent" />
            <h2 className="text-xl font-black">Emergency buffer</h2>
          </div>
          <p className="mt-4 text-3xl font-black">{Math.round(emergency.progress)}%</p>
          <div className="mt-3 h-2 rounded-full bg-soft">
            <div className="h-full rounded-full bg-accent" style={{ width: `${emergency.progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted">{currency.format(emergency.shortfall)} left to cover one month of tracked outgoings.</p>
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-danger" />
            <h2 className="text-xl font-black">Alerts</h2>
          </div>
          <div className="mt-4 space-y-2">
            {alerts.length ? alerts.map((alert) => (
              <div key={alert.id} className="rounded-md bg-soft px-3 py-2 text-sm">
                <p className="font-black">{alert.title}</p>
                <p className="text-muted">{alert.detail}</p>
              </div>
            )) : <p className="text-sm text-muted">No budget or renewal warnings right now.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
