"use client";

import { Bot } from "lucide-react";
import { useState } from "react";
import { suggestCategory } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";

export function CategorisationContent() {
  const { transactions } = useFinance();
  const [description, setDescription] = useState("Tesco Express weekly shop");
  const [amount, setAmount] = useState(-32);
  const suggestion = suggestCategory(description, amount, transactions);

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="surface space-y-4 p-5">
        <h2 className="text-xl font-black">Try a transaction</h2>
        <label className="block">
          <span className="text-sm font-bold text-muted">Description</span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-muted">Amount</span>
          <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
        </label>
      </section>
      <section className="surface p-6">
        <div className="flex items-center gap-3">
          <Bot className="size-6 text-accent" />
          <h2 className="text-2xl font-black">Suggested category</h2>
        </div>
        <p className="mt-5 text-5xl font-black">{suggestion.category}</p>
        <p className="mt-3 text-lg font-bold text-muted">{Math.round(suggestion.confidence * 100)}% confidence</p>
        <p className="mt-2 text-muted">{suggestion.reason}</p>
      </section>
    </div>
  );
}
