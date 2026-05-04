"use client";

import { calculateUkSalary } from "@/lib/finance";
import { useFinance } from "@/lib/finance-store";
import { buildMonthlyPlan, calculateSalaryBreakdown, type MonthlyPlanItem } from "@/lib/planning";
import { currency, preciseCurrency } from "@/lib/utils";

export function PlanningContent() {
  const { salary, budgets, subscriptions, pots } = useFinance();
  const takeHome = calculateUkSalary(salary.gross, salary.pension, salary.studentLoan, salary.pensionTiming);
  const savingsMonthly = pots.reduce((sum, pot) => sum + pot.monthlyContribution, 0);
  const breakdown = calculateSalaryBreakdown({ grossAnnual: salary.gross, takeHomeAnnual: takeHome.takeHomeAnnual, pensionPercent: salary.pension, savingsPercent: takeHome.takeHomeMonthly > 0 ? (savingsMonthly / takeHome.takeHomeMonthly) * 100 : 20 });
  const items: MonthlyPlanItem[] = [
    ...budgets.map((budget) => ({
      id: budget.id,
      name: budget.category,
      amount: budget.monthlyLimit,
      category: budget.category,
      kind: budget.commitment === "reserve" ? "buffer" as const : budget.commitment === "bill" ? "bill" as const : "necessity" as const,
      frequency: "monthly" as const,
      active: true,
    })),
    ...subscriptions.map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      amount: subscription.amount,
      category: subscription.category,
      kind: "subscription" as const,
      frequency: subscription.repeatPattern === "weekly" ? "weekly" as const : subscription.repeatPattern === "four-weekly" ? "four-weekly" as const : "monthly" as const,
      active: true,
    })),
    ...(savingsMonthly > 0 ? [{ id: "pots", name: "Savings pots", amount: savingsMonthly, category: "Savings", kind: "saving" as const, frequency: "monthly" as const, active: true }] : []),
  ];
  const plan = buildMonthlyPlan({ takeHomeMonthly: takeHome.takeHomeMonthly, items });
  const rows = [
    ["Gross salary", breakdown.gross],
    ["Pension", breakdown.pension],
    ["Take-home", breakdown.takeHome],
    ["Savings target", breakdown.savings],
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-4">
        <Summary label="Take-home monthly" value={currency.format(takeHome.takeHomeMonthly)} />
        <Summary label="Planned costs" value={currency.format(plan.monthlyTotal)} />
        <Summary label="Remaining monthly" value={currency.format(plan.remainingMonthly)} />
        <Summary label="Remaining daily" value={preciseCurrency.format(plan.remainingDaily)} />
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-black">Workbook salary table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-soft text-left text-muted">
              <tr>
                {["Metric", "Annual", "Monthly", "Weekly", "Daily"].map((heading) => <th key={heading} className="px-4 py-3 font-black">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, values]) => (
                <tr key={label as string} className="border-t border-border">
                  <td className="px-4 py-3 font-black">{label as string}</td>
                  <td className="px-4 py-3">{currency.format((values as typeof breakdown.gross).annual)}</td>
                  <td className="px-4 py-3">{preciseCurrency.format((values as typeof breakdown.gross).monthly)}</td>
                  <td className="px-4 py-3">{preciseCurrency.format((values as typeof breakdown.gross).weekly)}</td>
                  <td className="px-4 py-3">{preciseCurrency.format((values as typeof breakdown.gross).daily)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-black">Necessities and recurring plan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-soft text-left text-muted">
              <tr>
                {["Item", "Kind", "Category", "Monthly", "Weekly", "Daily", "% take-home"].map((heading) => <th key={heading} className="px-4 py-3 font-black">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {plan.items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3 font-black">{item.name}</td>
                  <td className="px-4 py-3 capitalize">{item.kind}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{preciseCurrency.format(item.monthlyAmount)}</td>
                  <td className="px-4 py-3">{preciseCurrency.format(item.weeklyAmount)}</td>
                  <td className="px-4 py-3">{preciseCurrency.format(item.dailyAmount)}</td>
                  <td className="px-4 py-3">{item.percentageOfTakeHome.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
