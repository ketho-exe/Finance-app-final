"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlideOverlay } from "@/components/glide-overlay";
import { createId, type CustomCategory, useFinance } from "@/lib/finance-store";

const blank: CustomCategory = {
  id: "",
  name: "",
  colour: "#2457c5",
};

export function CustomCategoriesContent() {
  const { customCategories, saveCustomCategory, deleteCustomCategory } = useFinance();
  const [form, setForm] = useState<CustomCategory>(blank);
  const [open, setOpen] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveCustomCategory({ ...form, id: form.id || createId("category") });
    setForm(blank);
    setOpen(false);
  }

  function openAdd() {
    setForm(blank);
    setOpen(true);
  }

  function openEdit(category: CustomCategory) {
    setForm(category);
    setOpen(true);
  }

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Custom categories</h2>
          <p className="mt-1 text-sm text-muted">Use your own labels in transactions, budgets, CSV imports, and subscriptions.</p>
        </div>
        <button type="button" onClick={openAdd} className="grid size-10 place-items-center rounded-md bg-foreground text-background" title="Add category">
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {customCategories.length ? customCategories.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-3 rounded-md bg-soft px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="size-4 rounded-full" style={{ background: category.colour }} />
              <span className="font-black">{category.name}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(category)} className="grid size-8 place-items-center rounded-md border border-border" title="Edit category">
                <Pencil className="size-4" />
              </button>
              <button type="button" onClick={() => deleteCustomCategory(category.id)} className="grid size-8 place-items-center rounded-md border border-border text-danger" title="Delete category">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        )) : <p className="text-sm text-muted">No custom categories yet.</p>}
      </div>
      <GlideOverlay open={open} title={form.id ? "Edit category" : "Add category"} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-muted">Name</span>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-muted">Colour</span>
            <input type="color" value={form.colour} onChange={(event) => setForm({ ...form, colour: event.target.value })} className="focus-ring mt-2 h-12 w-full rounded-md border border-border bg-background px-2 py-1" />
          </label>
          <button className="h-11 w-full rounded-md bg-foreground px-4 font-black text-background">Save category</button>
        </form>
      </GlideOverlay>
    </section>
  );
}
