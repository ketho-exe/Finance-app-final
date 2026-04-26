"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlideOverlay } from "@/components/glide-overlay";
import { planWishlistAffordability } from "@/lib/finance-insights";
import type { WishlistItem } from "@/lib/finance";
import { createId, useFinance } from "@/lib/finance-store";
import { currency, percent } from "@/lib/utils";

const blank: WishlistItem = {
  id: "",
  name: "",
  price: 100,
  priority: "Medium",
  saved: 0,
};

export function WishlistManager() {
  const { wishlist, pots, saveWishlistItem, deleteWishlistItem } = useFinance();
  const [form, setForm] = useState<WishlistItem>(blank);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const monthlyWishSavings = pots.filter((pot) => pot.kind === "goal").reduce((sum, pot) => sum + pot.monthlyContribution, 0) || 100;
  const plannedWishlist = planWishlistAffordability(wishlist, monthlyWishSavings);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveWishlistItem({ ...form, id: form.id || createId("wish") });
    setForm(blank);
    setOverlayOpen(false);
  }

  function openAdd() {
    setForm(blank);
    setOverlayOpen(true);
  }

  function openEdit(item: WishlistItem) {
    setForm(item);
    setOverlayOpen(true);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
          <Plus className="size-4" />
          Add wishlist item
        </button>
      </div>
      <GlideOverlay open={overlayOpen} title={form.id ? "Edit wishlist item" : "Add wishlist item"} onClose={() => setOverlayOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-black">{form.id ? "Edit wishlist item" : "Add wishlist item"}</h2>
        <TextField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <NumberField label="Price" value={form.price} onChange={(value) => setForm({ ...form, price: value })} />
        <NumberField label="Saved" value={form.saved} onChange={(value) => setForm({ ...form, saved: value })} />
        <label className="block">
          <span className="text-sm font-bold text-muted">Priority</span>
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as WishlistItem["priority"] })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold">
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 font-black text-background" type="submit">
          <Plus className="size-4" />
          Save
        </button>
        </form>
      </GlideOverlay>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plannedWishlist.map((item) => {
          const progress = Math.min(100, (item.saved / item.price) * 100);
          return (
            <article key={item.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-md bg-soft px-2 py-1 text-xs font-black">{item.priority}</span>
                  <h2 className="mt-3 text-xl font-black">{item.name}</h2>
                </div>
                <div className="flex gap-2">
                  <button title="Edit wishlist item" type="button" onClick={() => openEdit(item)} className="grid size-9 place-items-center rounded-md border border-border">
                    <Pencil className="size-4" />
                  </button>
                  <button title="Delete wishlist item" type="button" onClick={() => deleteWishlistItem(item.id)} className="grid size-9 place-items-center rounded-md border border-border text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-4 text-3xl font-black">{currency.format(item.price)}</p>
              <p className="mt-1 text-sm text-muted">{currency.format(item.saved)} saved</p>
              <div className="mt-4 h-2 rounded-full bg-soft">
                <div className="h-full rounded-full bg-accent-2" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-sm font-bold">{percent(progress)} ready</p>
              <p className="mt-1 text-sm text-muted">
                {item.monthsUntilAffordable === 0 ? "Ready to buy now" : `About ${item.monthsUntilAffordable} month${item.monthsUntilAffordable === 1 ? "" : "s"} at current goal saving pace`}
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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
      <input required type="number" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
    </label>
  );
}
