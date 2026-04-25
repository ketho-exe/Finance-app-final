"use client";

import { useState } from "react";
import { householdMembers, type HouseholdMember } from "@/lib/finance-insights";
import { currency } from "@/lib/utils";

export function HouseholdContent() {
  const [members, setMembers] = useState(householdMembers);
  const [name, setName] = useState("");
  const total = members.reduce((sum, member) => sum + member.monthlyContribution, 0);

  function addMember(event: React.FormEvent) {
    event.preventDefault();
    setMembers((items) => [
      ...items,
      { id: `member-${Date.now()}`, name, role: "Viewer", monthlyContribution: 0 },
    ]);
    setName("");
  }

  function updateMember(id: string, next: Partial<HouseholdMember>) {
    setMembers((items) => items.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <form onSubmit={addMember} className="surface h-fit space-y-4 p-5">
        <h2 className="text-xl font-black">Add profile</h2>
        <input required placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} className="focus-ring w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
        <button className="h-11 rounded-md bg-foreground px-4 font-black text-background">Add household member</button>
      </form>
      <section className="surface p-5">
        <div className="flex justify-between gap-4">
          <h2 className="text-xl font-black">Household profiles</h2>
          <p className="font-black text-accent">{currency.format(total)}/mo</p>
        </div>
        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <div key={member.id} className="grid gap-3 rounded-md bg-soft p-3 md:grid-cols-[1fr_150px_160px]">
              <input value={member.name} onChange={(event) => updateMember(member.id, { name: event.target.value })} className="rounded-md border border-border bg-background px-3 py-2 font-bold" />
              <select value={member.role} onChange={(event) => updateMember(member.id, { role: event.target.value as HouseholdMember["role"] })} className="rounded-md border border-border bg-background px-3 py-2 font-bold">
                <option>Owner</option>
                <option>Partner</option>
                <option>Viewer</option>
              </select>
              <input type="number" value={member.monthlyContribution} onChange={(event) => updateMember(member.id, { monthlyContribution: Number(event.target.value) })} className="rounded-md border border-border bg-background px-3 py-2 font-bold" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
