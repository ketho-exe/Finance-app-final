"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlideOverlay } from "@/components/glide-overlay";
import { SelectField } from "@/components/select-field";
import type { Pot } from "@/lib/finance";
import { createId, useFinance } from "@/lib/finance-store";
import { currency, percent } from "@/lib/utils";

const blank: Pot = {
  id: "",
  name: "",
  current: 0,
  target: 1000,
  monthlyContribution: 100,
  kind: "saving",
};

export function PotsManager() {
  const { pots, savePot, deletePot } = useFinance();
  const [form, setForm] = useState<Pot>(blank);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [formError, setFormError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.target <= 0) {
      setFormError("Target must be greater than zero.");
      return;
    }
    savePot({ ...form, id: form.id || createId("pot") });
    setForm(blank);
    setFormError("");
    setOverlayOpen(false);
  }

  function openAdd() {
    setForm(blank);
    setFormError("");
    setOverlayOpen(true);
  }

  function openEdit(pot: Pot) {
    setForm(pot);
    setFormError("");
    setOverlayOpen(true);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
          <Plus className="size-4" />
          Add pot
        </button>
      </div>
      <GlideOverlay open={overlayOpen} title={form.id ? "Edit pot" : "Add pot"} onClose={() => setOverlayOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-black">{form.id ? "Edit pot" : "Add pot"}</h2>
        <TextField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <SelectField
          label="Kind"
          value={form.kind}
          onChange={(kind) => setForm({ ...form, kind })}
          options={[
            { value: "saving", label: "Saving" },
            { value: "goal", label: "Goal" },
          ]}
        />
        <NumberField label="Current" value={form.current} onChange={(value) => setForm({ ...form, current: value })} />
        <NumberField label="Target" value={form.target} onChange={(value) => setForm({ ...form, target: value })} />
        <NumberField label="Monthly contribution" value={form.monthlyContribution} onChange={(value) => setForm({ ...form, monthlyContribution: value })} />
        {formError ? <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{formError}</p> : null}
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 font-black text-background" type="submit">
          <Plus className="size-4" />
          Save
        </button>
        </form>
      </GlideOverlay>
      <div className="grid gap-5 md:grid-cols-2">
        {pots.map((pot) => {
          const progress = pot.target > 0 ? Math.min(100, (pot.current / pot.target) * 100) : 0;
          const remaining = Math.max(0, pot.target - pot.current);
          const months = Math.ceil(remaining / Math.max(1, pot.monthlyContribution));
          return (
            <article key={pot.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-md bg-soft px-2 py-1 text-xs font-black uppercase">{pot.kind}</span>
                  <h2 className="mt-3 text-2xl font-black">{pot.name}</h2>
                </div>
                <div className="flex gap-2">
                  <button title="Edit pot" type="button" onClick={() => openEdit(pot)} className="grid size-9 place-items-center rounded-md border border-border">
                    <Pencil className="size-4" />
                  </button>
                  <button title="Delete pot" type="button" onClick={() => window.confirm(`Delete ${pot.name}?`) && deletePot(pot.id)} className="grid size-9 place-items-center rounded-md border border-border text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <p className="text-3xl font-black">{currency.format(pot.current)}</p>
                <p className="font-bold text-muted">of {currency.format(pot.target)}</p>
              </div>
              <div className="mt-4 h-3 rounded-full bg-soft">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex justify-between text-sm font-bold">
                <span>{percent(progress)} funded</span>
                <span>{months} months</span>
              </div>
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
