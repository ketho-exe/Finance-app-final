"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlideOverlay } from "@/components/glide-overlay";
import { SelectField } from "@/components/select-field";
import { type Category, type Transaction } from "@/lib/finance";
import { filterTransactions, type TransactionFilters } from "@/lib/finance-insights";
import { createId, useFinance } from "@/lib/finance-store";
import { preciseCurrency } from "@/lib/utils";

const blank: Transaction = {
  id: "",
  date: new Date().toISOString().slice(0, 10),
  merchant: "",
  category: "Groceries",
  amount: 0,
  cardId: "",
};

export function TransactionsManager() {
  const { cards, transactions, categoryOptions, saveTransaction, deleteTransaction } = useFinance();
  const firstCard = cards[0]?.id ?? "";
  const [form, setForm] = useState<Transaction>({ ...blank, cardId: firstCard });
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({ direction: "all", category: "all", cardId: "all" });
  const visibleTransactions = filterTransactions(transactions, filters);
  const movementType = form.category === "Transfer" ? "transfer" : form.amount >= 0 ? "income" : "expense";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const signedAmount = form.category === "Transfer" ? -Math.abs(form.amount) : form.amount;
    saveTransaction({ ...form, amount: signedAmount, id: form.id || createId("txn"), cardId: form.cardId || firstCard });
    setForm({ ...blank, cardId: firstCard });
    setOverlayOpen(false);
  }

  function openAdd() {
    setForm({ ...blank, cardId: firstCard });
    setOverlayOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setForm(transaction);
    setOverlayOpen(true);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
          <Plus className="size-4" />
          Add transaction
        </button>
      </div>
      <GlideOverlay open={overlayOpen} title={form.id ? "Edit transaction" : "Add transaction"} onClose={() => setOverlayOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-black">{form.id ? "Edit transaction" : "Add transaction"}</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
            { value: "transfer", label: "Transfer" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                if (item.value === "income") setForm({ ...form, amount: Math.abs(form.amount || 0), category: "Income" });
                if (item.value === "expense") setForm({ ...form, amount: -Math.abs(form.amount || 0), category: form.category === "Income" || form.category === "Transfer" ? "Groceries" : form.category });
                if (item.value === "transfer") setForm({ ...form, amount: -Math.abs(form.amount || 0), category: "Transfer" });
              }}
              className={`rounded-md border px-3 py-2 text-sm font-black ${movementType === item.value ? "border-foreground bg-foreground text-background" : "border-border bg-soft text-muted"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Input label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Input label="Merchant" value={form.merchant} onChange={(value) => setForm({ ...form, merchant: value })} />
        <SelectField label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} options={categoryOptions.map((category) => ({ value: category, label: category }))} />
        <SelectField label="Account" value={form.cardId} onChange={(cardId) => setForm({ ...form, cardId })} options={cards.map((card) => ({ value: card.id, label: card.name }))} />
        <Input label="Amount" type="number" value={String(form.amount)} onChange={(value) => setForm({ ...form, amount: Number(value) })} />
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 font-black text-background" type="submit">
          <Plus className="size-4" />
          Save
        </button>
        </form>
      </GlideOverlay>
      <div className="surface mb-5 grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-8">
        <input placeholder="Search merchant or notes" value={filters.query ?? ""} onChange={(event) => setFilters({ ...filters, query: event.target.value })} className="focus-ring rounded-md border border-border bg-background px-3 py-2 text-sm font-bold md:col-span-2" />
        <input type="date" value={filters.startDate ?? ""} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} className="focus-ring rounded-md border border-border bg-background px-3 py-2 text-sm font-bold" />
        <input type="date" value={filters.endDate ?? ""} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} className="focus-ring rounded-md border border-border bg-background px-3 py-2 text-sm font-bold" />
        <SelectField value={filters.cardId ?? "all"} onChange={(cardId) => setFilters({ ...filters, cardId })} buttonClassName="mt-0 px-3 py-2 text-sm" options={[{ value: "all", label: "All accounts" }, ...cards.map((card) => ({ value: card.id, label: card.name }))]} />
        <SelectField value={filters.category ?? "all"} onChange={(category) => setFilters({ ...filters, category: category as Category | "all" })} buttonClassName="mt-0 px-3 py-2 text-sm" options={[{ value: "all", label: "All categories" }, ...categoryOptions.map((category) => ({ value: category, label: category }))]} />
        <SelectField
          value={filters.direction ?? "all"}
          onChange={(direction) => setFilters({ ...filters, direction })}
          buttonClassName="mt-0 px-3 py-2 text-sm"
          options={[
            { value: "all", label: "All movement" },
            { value: "income", label: "Income" },
            { value: "outgoing", label: "Outgoing" },
          ]}
        />
        <button type="button" onClick={() => setFilters({ direction: "all", category: "all", cardId: "all" })} className="rounded-md border border-border px-3 py-2 text-sm font-black">Reset</button>
      </div>
      <div className="surface overflow-x-auto p-5">
        {visibleTransactions.length ? <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="border-b border-border py-3">Date</th>
              <th className="border-b border-border py-3">Merchant</th>
              <th className="border-b border-border py-3">Category</th>
              <th className="border-b border-border py-3">Account</th>
              <th className="border-b border-border py-3 text-right">Amount</th>
              <th className="border-b border-border py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="border-b border-border py-3">{transaction.date}</td>
                <td className="border-b border-border py-3 font-bold">{transaction.merchant}</td>
                <td className="border-b border-border py-3">{transaction.category}</td>
                <td className="border-b border-border py-3">{cards.find((card) => card.id === transaction.cardId)?.name ?? "No account"}</td>
                <td className={`border-b border-border py-3 text-right font-black ${transaction.amount < 0 ? "text-danger" : "text-accent"}`}>
                  {preciseCurrency.format(transaction.amount)}
                </td>
                <td className="border-b border-border py-3">
                  <div className="flex justify-end gap-2">
                    <button title="Edit transaction" type="button" onClick={() => openEdit(transaction)} className="grid size-9 place-items-center rounded-md border border-border">
                      <Pencil className="size-4" />
                    </button>
                    <button title="Delete transaction" type="button" onClick={() => deleteTransaction(transaction.id)} className="grid size-9 place-items-center rounded-md border border-border text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table> : (
          <div className="grid min-h-64 place-items-center text-center">
            <div>
              <p className="text-xl font-black">No transactions yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">Add your first spend, income, or transfer. You can also import a CSV when you have a bank export ready.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={openAdd} className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
                  <Plus className="size-4" />
                  Add transaction
                </button>
                <a href="/upload" className="inline-flex h-11 items-center rounded-md border border-border px-4 font-black">Import CSV</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted">{label}</span>
      <input required type={type} step={type === "number" ? "0.01" : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
    </label>
  );
}
