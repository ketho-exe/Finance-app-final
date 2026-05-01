"use client";

import { BellRing, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlideOverlay } from "@/components/glide-overlay";
import { SelectField } from "@/components/select-field";
import { calculateMonthlySubscriptionTotal, findUpcomingRenewals, type Subscription } from "@/lib/finance-insights";
import { createId, useFinance } from "@/lib/finance-store";
import { preciseCurrency } from "@/lib/utils";

const blankSubscription: Subscription = {
  id: "",
  name: "",
  amount: 10,
  category: "Bills",
  cardId: "",
  renewalDay: 1,
  warningDays: 7,
  repeatPattern: "monthly",
  startDate: new Date().toISOString().slice(0, 10),
};

export function SubscriptionsContent() {
  const { cards, subscriptions, categoryOptions, saveSubscription, deleteSubscription } = useFinance();
  const [form, setForm] = useState<Subscription>(blankSubscription);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const upcoming = findUpcomingRenewals(subscriptions);
  const monthlyTotal = calculateMonthlySubscriptionTotal(subscriptions);

  function openAdd() {
    setForm({ ...blankSubscription, cardId: cards[0]?.id ?? "" });
    setOverlayOpen(true);
  }

  function openEdit(subscription: Subscription) {
    setForm(subscription);
    setOverlayOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveSubscription({ ...form, id: form.id || createId("sub"), cardId: form.cardId || cards[0]?.id || "" });
    setOverlayOpen(false);
    setForm(blankSubscription);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
          <Plus className="size-4" />
          Add subscription
        </button>
      </div>
      <GlideOverlay open={overlayOpen} title={form.id ? "Edit subscription" : "Add subscription"} onClose={() => setOverlayOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <NumberField label="Amount" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(category) => setForm({ ...form, category })}
            options={categoryOptions.filter((category) => category !== "Income").map((category) => ({ value: category, label: category }))}
          />
          <SelectField
            label="Repeat pattern"
            value={form.repeatPattern ?? "monthly"}
            onChange={(repeatPattern) => setForm({ ...form, repeatPattern })}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "four-weekly", label: "Every 4 weeks" },
              { value: "custom", label: "Custom" },
            ]}
          />
          <Field label="Start date" type="date" value={form.startDate ?? ""} onChange={(value) => setForm({ ...form, startDate: value })} />
          <SelectField label="Payment account" value={form.cardId} onChange={(cardId) => setForm({ ...form, cardId })} options={cards.map((card) => ({ value: card.id, label: card.name }))} />
          <NumberField label="Renewal day" min={1} max={31} value={form.renewalDay} onChange={(value) => setForm({ ...form, renewalDay: value })} />
          <NumberField label="Warning days" min={1} max={31} value={form.warningDays} onChange={(value) => setForm({ ...form, warningDays: value })} />
          <button className="h-11 w-full rounded-md bg-foreground px-4 font-black text-background">Save subscription</button>
        </form>
      </GlideOverlay>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="surface h-fit p-5">
          <div className="flex items-center gap-3">
            <BellRing className="size-5 text-accent" />
            <h2 className="text-xl font-black">Renewal warnings</h2>
          </div>
          <p className="mt-3 text-3xl font-black">{preciseCurrency.format(monthlyTotal)}</p>
          <p className="text-sm text-muted">Estimated monthly subscriptions.</p>
          <div className="mt-5 space-y-3">
            {upcoming.length ? (
              upcoming.map((item) => (
                <div key={item.id} className="rounded-md bg-soft p-3">
                  <p className="font-black">{item.name}</p>
                  <p className="text-sm text-muted">Renews in {item.daysUntilRenewal} days on {item.renewalDate}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No renewals inside their warning windows.</p>
            )}
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {subscriptions.map((item) => (
            <article key={item.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-muted">{item.category}</p>
                  <h2 className="text-2xl font-black">{item.name}</h2>
                </div>
                <div className="flex gap-2">
                  <button title="Edit subscription" type="button" onClick={() => openEdit(item)} className="grid size-9 place-items-center rounded-md border border-border">
                    <Pencil className="size-4" />
                  </button>
                  <button title="Delete subscription" type="button" onClick={() => deleteSubscription(item.id)} className="grid size-9 place-items-center rounded-md border border-border text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-4 text-xl font-black">{preciseCurrency.format(item.amount)}</p>
              <p className="mt-2 text-sm text-muted">
                Paid from {cards.find((card) => card.id === item.cardId)?.name ?? "Unknown account"} on day {item.renewalDay}. Repeats {repeatLabel(item.repeatPattern)}. Warning starts {item.warningDays} days before renewal.
              </p>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted">{label}</span>
      <input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
    </label>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted">{label}</span>
      <input required type="number" step="0.01" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
    </label>
  );
}

function repeatLabel(pattern: Subscription["repeatPattern"] = "monthly") {
  return {
    weekly: "weekly",
    monthly: "monthly",
    "four-weekly": "every 4 weeks",
    custom: "on a custom rhythm",
  }[pattern];
}
