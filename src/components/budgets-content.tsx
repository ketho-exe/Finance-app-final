"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlideOverlay } from "@/components/glide-overlay";
import { categories, type Category } from "@/lib/finance";
import { calculateBudgetUsage, type Budget } from "@/lib/finance-insights";
import { createId, useFinance } from "@/lib/finance-store";
import { currency, percent } from "@/lib/utils";

const blankBudget: Budget = {
  id: "",
  category: "Groceries",
  monthlyLimit: 300,
};

export function BudgetsContent() {
  const { budgets, transactions, saveBudget, deleteBudget } = useFinance();
  const [form, setForm] = useState<Budget>(blankBudget);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const usage = calculateBudgetUsage(budgets, transactions);

  function openAdd() {
    setForm(blankBudget);
    setOverlayOpen(true);
  }

  function openEdit(budget: Budget) {
    setForm(budget);
    setOverlayOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveBudget({ ...form, id: form.id || createId("budget") });
    setOverlayOpen(false);
    setForm(blankBudget);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
          <Plus className="size-4" />
          Add budget
        </button>
      </div>
      <GlideOverlay open={overlayOpen} title={form.id ? "Edit budget" : "Add budget"} onClose={() => setOverlayOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-muted">Category</span>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Category })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold">
              {categories.filter((category) => category !== "Income").map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-muted">Monthly limit</span>
            <input type="number" step="0.01" value={form.monthlyLimit} onChange={(event) => setForm({ ...form, monthlyLimit: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
          </label>
          <button className="h-11 w-full rounded-md bg-foreground px-4 font-black text-background">Save budget</button>
        </form>
      </GlideOverlay>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {usage.map((budget) => (
          <article key={budget.id} className="surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-muted">Monthly budget</p>
                <h2 className="text-2xl font-black">{budget.category}</h2>
              </div>
              <div className="flex gap-2">
                <button title="Edit budget" type="button" onClick={() => openEdit(budget)} className="grid size-9 place-items-center rounded-md border border-border">
                  <Pencil className="size-4" />
                </button>
                <button title="Delete budget" type="button" onClick={() => deleteBudget(budget.id)} className="grid size-9 place-items-center rounded-md border border-border text-danger">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className={budget.overLimit ? "mt-4 font-black text-danger" : "mt-4 font-black text-accent"}>{percent(budget.progress)}</p>
            <div className="mt-3 h-3 rounded-full bg-soft">
              <div className={budget.overLimit ? "h-full rounded-full bg-danger" : "h-full rounded-full bg-accent"} style={{ width: `${budget.progress}%` }} />
            </div>
            <div className="mt-4 flex justify-between text-sm font-bold">
              <span>{currency.format(budget.spent)} spent</span>
              <span>{currency.format(budget.monthlyLimit)} limit</span>
            </div>
            <p className="mt-2 text-sm text-muted">{budget.overLimit ? "Over budget. Future safe-spend is reduced." : `${currency.format(budget.remaining)} remaining this month.`}</p>
          </article>
        ))}
        {usage.length === 0 ? (
          <div className="surface p-5">
            <h2 className="text-xl font-black">No budgets yet</h2>
            <p className="mt-2 text-sm text-muted">Add your first category limit to start tracking monthly spend.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
