"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlideOverlay } from "@/components/glide-overlay";
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

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveTransaction({ ...form, id: form.id || createId("txn"), cardId: form.cardId || firstCard });
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
        <Input label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Input label="Merchant" value={form.merchant} onChange={(value) => setForm({ ...form, merchant: value })} />
        <label className="block">
          <span className="text-sm font-bold text-muted">Category</span>
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Category })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold">
            {categoryOptions.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-muted">Card</span>
          <select value={form.cardId} onChange={(event) => setForm({ ...form, cardId: event.target.value })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold">
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </label>
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
        <select value={filters.cardId ?? "all"} onChange={(event) => setFilters({ ...filters, cardId: event.target.value })} className="focus-ring rounded-md border border-border bg-background px-3 py-2 text-sm font-bold">
          <option value="all">All cards</option>
          {cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}
        </select>
        <select value={filters.category ?? "all"} onChange={(event) => setFilters({ ...filters, category: event.target.value as Category | "all" })} className="focus-ring rounded-md border border-border bg-background px-3 py-2 text-sm font-bold">
          <option value="all">All categories</option>
          {categoryOptions.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select value={filters.direction ?? "all"} onChange={(event) => setFilters({ ...filters, direction: event.target.value as TransactionFilters["direction"] })} className="focus-ring rounded-md border border-border bg-background px-3 py-2 text-sm font-bold">
          <option value="all">All movement</option>
          <option value="income">Income</option>
          <option value="outgoing">Outgoing</option>
        </select>
        <button type="button" onClick={() => setFilters({ direction: "all", category: "all", cardId: "all" })} className="rounded-md border border-border px-3 py-2 text-sm font-black">Reset</button>
      </div>
      <div className="surface overflow-x-auto p-5">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="border-b border-border py-3">Date</th>
              <th className="border-b border-border py-3">Merchant</th>
              <th className="border-b border-border py-3">Category</th>
              <th className="border-b border-border py-3">Card</th>
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
                <td className="border-b border-border py-3">{cards.find((card) => card.id === transaction.cardId)?.name ?? "No card"}</td>
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
        </table>
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
