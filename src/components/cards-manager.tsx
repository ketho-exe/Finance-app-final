"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { calculateDebtPayoff } from "@/lib/finance-insights";
import { GlideOverlay } from "@/components/glide-overlay";
import { cardTransactions, type MoneyCard } from "@/lib/finance";
import { createId, useFinance } from "@/lib/finance-store";
import { currency, percent, preciseCurrency } from "@/lib/utils";

const blankCard: MoneyCard = {
  id: "",
  name: "",
  provider: "",
  type: "current",
  balance: 0,
  limit: undefined,
  overdraft: undefined,
  apr: undefined,
  colour: "bg-[#0f766e]",
};

export function CardsManager() {
  const { cards, transactions, saveCard, deleteCard } = useFinance();
  const [form, setForm] = useState<MoneyCard>(blankCard);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [focusedCard, setFocusedCard] = useState<MoneyCard | null>(null);
  const [debtPayment, setDebtPayment] = useState(400);
  const [payoffMethod, setPayoffMethod] = useState<"snowball" | "avalanche">("avalanche");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveCard({ ...form, id: form.id || createId("card") });
    setForm(blankCard);
    setOverlayOpen(false);
  }

  function openAdd() {
    setForm(blankCard);
    setOverlayOpen(true);
  }

  function openEdit(card: MoneyCard) {
    setForm(card);
    setOverlayOpen(true);
  }

  return (
    <>
      <GlideOverlay open={Boolean(focusedCard)} title={focusedCard?.name ?? "Card details"} onClose={() => setFocusedCard(null)}>
        {focusedCard ? (
          <div className="space-y-5">
            <div className="rounded-md bg-soft p-4">
              <p className="text-sm font-bold text-muted">{focusedCard.provider}</p>
              <p className="mt-2 text-3xl font-black">{currency.format(focusedCard.balance)}</p>
              <p className="mt-1 text-sm text-muted">{focusedCard.type === "credit" ? "Credit account" : "Account balance"}</p>
            </div>
            {focusedCard.type === "credit" || focusedCard.overdraft ? (
              <div>
                <h3 className="text-xl font-black">Debt payoff planner</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-muted">Payoff method</span>
                    <select value={payoffMethod} onChange={(event) => setPayoffMethod(event.target.value as "snowball" | "avalanche")} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold">
                      <option value="avalanche">Avalanche</option>
                      <option value="snowball">Snowball</option>
                    </select>
                  </label>
                  <MiniStat label="APR" value={`${focusedCard.apr ?? (focusedCard.type === "credit" ? 24.9 : 39.9)}%`} />
                </div>
                <input type="range" min="50" max="1500" step="25" value={debtPayment} onChange={(event) => setDebtPayment(Number(event.target.value))} className="mt-4 w-full accent-[var(--accent)]" />
                <p className="mt-2 text-sm font-bold text-muted">
                  Monthly payment: {currency.format(debtPayment)}. {payoffMethod === "avalanche" ? "Prioritise highest APR first." : "Prioritise the smallest balance first."}
                </p>
                {calculateDebtPayoff([focusedCard], debtPayment).map((plan) => (
                  <div key={plan.cardId} className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Debt" value={currency.format(plan.startingDebt)} />
                    <MiniStat label="Months" value={String(plan.monthsToPayoff)} />
                    <MiniStat label="Interest" value={currency.format(plan.totalInterest)} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Debt planning appears for credit cards or accounts with overdraft exposure.</p>
            )}
            <div>
              <h3 className="text-xl font-black">Recent transactions</h3>
              <div className="mt-2 divide-y divide-border">
                {cardTransactions(focusedCard.id, transactions).slice(0, 8).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="font-bold">{transaction.merchant}</span>
                    <span className={transaction.amount < 0 ? "font-black text-danger" : "font-black text-accent"}>{preciseCurrency.format(transaction.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </GlideOverlay>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
          <Plus className="size-4" />
          Add card
        </button>
      </div>
      <GlideOverlay open={overlayOpen} title={form.id ? "Edit card" : "Add card"} onClose={() => setOverlayOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-black">{form.id ? "Edit card" : "Add card"}</h2>
        <Field label="Card name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Field label="Provider" value={form.provider} onChange={(value) => setForm({ ...form, provider: value })} />
        <label className="block">
          <span className="text-sm font-bold text-muted">Type</span>
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as MoneyCard["type"] })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold">
            <option value="current">Current</option>
            <option value="credit">Credit</option>
            <option value="savings">Savings</option>
          </select>
        </label>
        <NumberField label="Balance" value={form.balance} onChange={(value) => setForm({ ...form, balance: value })} />
        <NumberField label="Credit limit" value={form.limit ?? 0} onChange={(value) => setForm({ ...form, limit: value || undefined })} />
        <NumberField label="Overdraft" value={form.overdraft ?? 0} onChange={(value) => setForm({ ...form, overdraft: value || undefined })} />
        <NumberField label="APR %" value={form.apr ?? 0} onChange={(value) => setForm({ ...form, apr: value || undefined })} />
        <div className="flex gap-2">
          <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-4 font-black text-background" type="submit">
            <Plus className="size-4" />
            Save
          </button>
          {form.id ? (
            <button type="button" onClick={() => setOverlayOpen(false)} className="h-11 rounded-md border border-border px-4 font-bold">
              Cancel
            </button>
          ) : null}
        </div>
        </form>
      </GlideOverlay>
      <div className="grid gap-5 xl:grid-cols-2">
        {cards.map((card) => {
          const txs = cardTransactions(card.id, transactions);
          const utilisation = card.limit ? Math.min(100, (Math.abs(card.balance) / card.limit) * 100) : 0;
          return (
            <article key={card.id} className="surface overflow-hidden">
              <div className={`${card.colour} h-2`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-muted">{card.provider}</p>
                    <button type="button" onClick={() => setFocusedCard(card)} className="text-left text-2xl font-black hover:text-accent">
                      {card.name}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button title="Edit card" type="button" onClick={() => openEdit(card)} className="grid size-9 place-items-center rounded-md border border-border">
                      <Pencil className="size-4" />
                    </button>
                    <button title="Delete card" type="button" onClick={() => deleteCard(card.id)} className="grid size-9 place-items-center rounded-md border border-border text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Balance" value={currency.format(card.balance)} />
                  <MiniStat label="Limit" value={card.limit ? currency.format(card.limit) : "N/A"} />
                  <MiniStat label="Overdraft" value={card.overdraft ? currency.format(card.overdraft) : "N/A"} />
                </div>
                {card.limit ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Credit utilisation</span>
                      <span>{percent(utilisation)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-soft">
                      <div className="h-full rounded-full bg-accent-2" style={{ width: `${utilisation}%` }} />
                    </div>
                  </div>
                ) : null}
                <div className="mt-5 divide-y divide-border">
                  {txs.slice(0, 4).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{transaction.merchant}</p>
                        <p className="text-muted">{transaction.category}</p>
                      </div>
                      <p className={transaction.amount < 0 ? "font-black text-danger" : "font-black text-accent"}>{preciseCurrency.format(transaction.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted">{label}</span>
      <input required value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted">{label}</span>
      <input type="number" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-soft p-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
