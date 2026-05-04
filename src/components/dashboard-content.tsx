"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Plus, ShieldCheck, Target, TrendingUp, Wallet } from "lucide-react";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { StatCard } from "@/components/stat-card";
import { calculateUkSalary, categorySpend } from "@/lib/finance";
import { buildBudgetAlerts, buildMonthEndForecast, calculateAffordability, calculateEmergencyBuffer, calculateMonthlySubscriptionTotal, calculatePaydayPlan, calculateSafeToSpendToday, calculateSpendingSummary } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency } from "@/lib/utils";

export function DashboardContent() {
  const { cards, pots, transactions, salary, budgets, subscriptions } = useFinance();
  const [affordCheck, setAffordCheck] = useState(250);
  const today = new Date();
  const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = today.toLocaleString("en-GB", { month: "long" });
  const monthTransactions = transactions.filter((item) => item.date.startsWith(monthPrefix));
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const spendingSummary = calculateSpendingSummary(monthTransactions);
  const monthlyIncome = spendingSummary.income;
  const monthlySpend = spendingSummary.spending;
  const topCategory = Object.entries(categorySpend(monthTransactions)).sort((a, b) => b[1] - a[1])[0];
  const potProgress = pots.length ? pots.reduce((sum, pot) => sum + (pot.target > 0 ? pot.current / pot.target : 0), 0) / pots.length : 0;
  const currentBalance = cards.filter((card) => card.type === "current").reduce((sum, card) => sum + card.balance, 0);
  const savingsTarget = pots.reduce((sum, pot) => sum + pot.monthlyContribution, 0);
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const committedBudgetTotal = budgets
    .filter((budget) => budget.commitment === "bill" || budget.commitment === "reserve")
    .reduce((sum, budget) => sum + budget.monthlyLimit, 0);
  const safeSpend = calculateSafeToSpendToday({
    balance: currentBalance,
    upcomingBills: calculateMonthlySubscriptionTotal(subscriptions) + committedBudgetTotal,
    savingsTarget,
    daysLeftInMonth: daysLeft,
    buffer: 250,
  });
  const monthlySalary = calculateUkSalary(salary.gross, salary.pension, salary.studentLoan, salary.pensionTiming).takeHomeMonthly;
  const payday = calculatePaydayPlan({
    currentBalance,
    monthlySalary,
    transactions,
    recurring: subscriptions,
    today,
    paydayDay: salary.paydayDay,
    buffer: 250,
  });
  const monthEndForecast = buildMonthEndForecast({
    currentBalance,
    monthlyTakeHome: monthlySalary,
    paydayDay: salary.paydayDay,
    today,
    subscriptions,
    budgets,
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
  const hasStarterData = cards.length > 0 && transactions.length > 0 && (budgets.length > 0 || subscriptions.length > 0);
  const setupItems = [
    { label: "Add your main account", href: "/cards", done: cards.length > 0 },
    { label: "Set salary and payday", href: "/salary", done: salary.gross > 0 },
    { label: "Add bills or budgets", href: "/budgets", done: budgets.length > 0 || subscriptions.length > 0 },
    { label: "Add or import transactions", href: "/transactions", done: transactions.length > 0 },
  ];

  return (
    <>
      <section className="surface overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:p-7">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-md bg-accent text-background">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Safe to spend</p>
                <h2 className="text-2xl font-black sm:text-3xl">Your daily number until payday</h2>
              </div>
            </div>
            <p className="mt-6 text-6xl font-black tracking-normal sm:text-7xl">{currency.format(safeSpend.safeToday)}</p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              You have {currency.format(safeSpend.discretionaryRemaining)} flexible money after known bills, savings targets, and a £250 buffer. Payday is in {payday.daysUntilPayday} days.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Until payday" value={`${payday.daysUntilPayday} days`} />
              <MiniMetric label="Bills before payday" value={currency.format(payday.upcomingBills)} />
              <MiniMetric label="Projected payday balance" value={currency.format(payday.balanceByPayday)} />
            </div>
          </div>
          <div className="surface-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black">Setup health</h3>
              <span className="rounded-md bg-panel px-2 py-1 text-xs font-black text-muted">{setupItems.filter((item) => item.done).length}/{setupItems.length}</span>
            </div>
            <div className="mt-4 space-y-2">
              {setupItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center justify-between gap-3 rounded-md bg-panel px-3 py-3 text-sm font-bold hover:text-accent">
                  <span className="flex items-center gap-2">
                    {item.done ? <CheckCircle2 className="size-4 text-accent" /> : <Plus className="size-4 text-muted" />}
                    {item.label}
                  </span>
                  <ArrowRight className="size-4 text-muted" />
                </Link>
              ))}
            </div>
            {!hasStarterData ? <p className="mt-4 text-sm leading-6 text-muted">Start with an account balance, your payday, and one bill. Ledgerly can then calculate a useful safe-to-spend figure immediately.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total balance" value={currency.format(totalBalance)} detail="Across current, credit, and savings accounts" tone="good" />
        <StatCard label={`${monthLabel} income`} value={currency.format(monthlyIncome)} detail="Income transactions this month" />
        <StatCard label={`${monthLabel} spending`} value={currency.format(monthlySpend)} detail={`Transfers excluded. Top: ${topCategory?.[0] ?? "None"}`} tone="warn" />
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
            <p className="mt-1 text-sm text-muted">Payday income forecast uses {currency.format(monthlySalary)} take-home.</p>
            {payday.bufferWarningDate ? <p className="mt-2 text-sm font-bold text-danger">Buffer risk on {payday.bufferWarningDate}</p> : null}
          </div>
          <div className="surface p-5">
            <div className="flex items-center gap-3">
              <Wallet className="size-5 text-accent" />
              <h2 className="text-xl font-black">Next actions</h2>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Review account utilisation", "/cards"],
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
          <InsightCard title="Subscription impact" value={currency.format(calculateMonthlySubscriptionTotal(subscriptions))} detail="Estimated monthly total from active recurring subscriptions." />
        </div>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-4">
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
            <Wallet className="size-5 text-accent" />
            <h2 className="text-xl font-black">Month-end forecast</h2>
          </div>
          <p className="mt-4 text-3xl font-black">{currency.format(monthEndForecast.availableAtMonthEnd)}</p>
          <p className="mt-1 text-sm text-muted">Available after salary, subscriptions, bill-like budgets, and held-back money.</p>
          <div className="mt-4 space-y-2">
            {monthEndForecast.events.slice(0, 4).map((event) => (
              <div key={`${event.kind}-${event.id}`} className="flex justify-between gap-3 rounded-md bg-soft px-3 py-2 text-sm font-bold">
                <span>{event.name}</span>
                <span className={event.amount < 0 ? "text-danger" : "text-accent"}>{currency.format(event.amount)}</span>
              </div>
            ))}
          </div>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-soft/70 px-3 py-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function InsightCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-5 text-accent-2" />
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <p className="mt-4 text-4xl font-black">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}
