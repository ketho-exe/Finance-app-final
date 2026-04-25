"use client";

import { calculateBudgetUsage, budgets } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { currency, percent } from "@/lib/utils";

export function BudgetsContent() {
  const { transactions } = useFinance();
  const usage = calculateBudgetUsage(budgets, transactions);

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {usage.map((budget) => (
        <article key={budget.id} className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-muted">Monthly budget</p>
              <h2 className="text-2xl font-black">{budget.category}</h2>
            </div>
            <p className={budget.overLimit ? "font-black text-danger" : "font-black text-accent"}>{percent(budget.progress)}</p>
          </div>
          <div className="mt-5 h-3 rounded-full bg-soft">
            <div className={budget.overLimit ? "h-full rounded-full bg-danger" : "h-full rounded-full bg-accent"} style={{ width: `${budget.progress}%` }} />
          </div>
          <div className="mt-4 flex justify-between text-sm font-bold">
            <span>{currency.format(budget.spent)} spent</span>
            <span>{currency.format(budget.monthlyLimit)} limit</span>
          </div>
          <p className="mt-2 text-sm text-muted">{budget.overLimit ? "Over budget. Future safe-spend is reduced." : `${currency.format(budget.remaining)} remaining this month.`}</p>
        </article>
      ))}
    </div>
  );
}
