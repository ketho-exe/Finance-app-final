"use client";

import { CategoryChart } from "@/components/charts/category-chart";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { calculateUkSalary, categorySpend } from "@/lib/finance";
import { buildCashFlowSeries } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency } from "@/lib/utils";

export function StatisticsContent() {
  const { transactions, salary } = useFinance();
  const ranked = Object.entries(categorySpend(transactions)).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const monthlyTakeHome = calculateUkSalary(salary.gross, salary.pension, salary.studentLoan, salary.pensionTiming).takeHomeMonthly;
  const predictedNet = buildCashFlowSeries({ transactions, monthlySalary: monthlyTakeHome }).slice(-2).reduce((sum, item) => sum + item.net, 0);
  const outgoings = transactions.filter((item) => item.amount < 0);
  const avgTransaction = outgoings.reduce((sum, item) => sum + Math.abs(item.amount), 0) / Math.max(1, outgoings.length);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">Top category</p>
          <p className="mt-2 text-2xl font-black">{top?.[0] ?? "No spending yet"}</p>
          <p className="text-sm text-muted">{currency.format(top?.[1] ?? 0)} total spend</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">Average purchase</p>
          <p className="mt-2 text-2xl font-black">{currency.format(avgTransaction)}</p>
          <p className="text-sm text-muted">Across outgoing transactions</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">Forecast net</p>
          <p className="mt-2 text-2xl font-black text-accent">{currency.format(predictedNet)}</p>
          <p className="text-sm text-muted">Next two predicted months</p>
        </div>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-xl font-black">Category breakdown</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Largest spend areas are ranked in the legend.</p>
          <CategoryChart transactions={transactions} />
        </div>
        <div className="surface p-5">
          <h2 className="text-xl font-black">Cash flow graph</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Income, outgoings, and net movement with forecast months included.</p>
          <CashFlowChart transactions={transactions} monthlySalary={monthlyTakeHome} />
        </div>
      </section>
    </>
  );
}
