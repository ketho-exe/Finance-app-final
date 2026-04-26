import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const settings = [
  "Light, dark, and system theme support",
  "Self-hosted Satoshi font files",
  "Password sign-in with optional magic link",
  "Private account data for cards, pots, wishlist, and transactions",
  "PDF monthly reports",
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="App preferences"
        description="A quick overview of enabled workspace features and account behaviour."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface p-5">
          <h2 className="text-xl font-black">Readiness checklist</h2>
          <div className="mt-4 space-y-3">
            {settings.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md bg-soft px-3 py-3 text-sm font-bold">
                <CheckCircle2 className="size-4 shrink-0 text-accent" />
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="surface p-5">
          <h2 className="text-xl font-black">Workspace defaults</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Ledgerly keeps each signed-in workspace separate, uses GBP by default, and gives every user a private set of cards, transactions, goals, budgets, and reports.</p>
        </section>
      </div>
    </>
  );
}
