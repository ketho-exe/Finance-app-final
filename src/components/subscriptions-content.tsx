"use client";

import { BellRing } from "lucide-react";
import { findUpcomingRenewals, subscriptions } from "@/lib/finance-insights";
import { useFinance } from "@/lib/finance-store";
import { preciseCurrency } from "@/lib/utils";

export function SubscriptionsContent() {
  const { cards } = useFinance();
  const upcoming = findUpcomingRenewals(subscriptions);
  const monthlyTotal = subscriptions.reduce((sum, item) => sum + item.amount, 0);

  return (
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
                <p className="text-sm text-muted">
                  Renews in {item.daysUntilRenewal} days on {item.renewalDate}
                </p>
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
              <p className="text-xl font-black">{preciseCurrency.format(item.amount)}</p>
            </div>
            <p className="mt-4 text-sm text-muted">
              Paid from {cards.find((card) => card.id === item.cardId)?.name ?? "Unknown card"} on day {item.renewalDay}. Warning starts {item.warningDays} days before renewal.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
