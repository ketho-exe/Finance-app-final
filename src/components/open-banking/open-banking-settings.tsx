"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Landmark, LinkIcon, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { CURRENT_ONBOARDING_VERSION } from "@/lib/onboarding";
import { useFinance } from "@/lib/finance-store";

type Institution = {
  id: string;
  name: string;
  countries?: string[];
  logo?: string;
};

type OpenBankingAccount = {
  id: string;
  external_account_id: string;
  display_name: string | null;
  currency: string | null;
  current_balance: number | string | null;
  last_synced_at: string | null;
  card_id: string | null;
  open_banking_connections?: {
    institution_name: string | null;
    status: string | null;
    consent_expires_at: string | null;
  } | null;
  cards?: {
    id: string;
    name: string;
    provider: string;
  } | null;
};

const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function OpenBankingSettings() {
  const { cards, session } = useFinance();
  const [accounts, setAccounts] = useState<OpenBankingAccount[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const filteredInstitutions = useMemo(
    () => institutions.filter((institution) => institution.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [institutions, query],
  );

  useEffect(() => {
    if (!session) return;
    loadAccounts();
  }, [session]);

  async function loadAccounts() {
    const response = await fetch("/api/open-banking/accounts");
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Could not load connected accounts.");
      return;
    }
    setAccounts(data.accounts ?? []);
  }

  async function loadInstitutions() {
    setLoadingInstitutions(true);
    setMessage("");
    const response = await fetch("/api/open-banking/institutions?country=gb");
    const data = await response.json();
    setLoadingInstitutions(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not load supported banks.");
      return;
    }
    setInstitutions(data.institutions ?? []);
  }

  async function connectBank(institution: Institution) {
    setMessage("");
    const response = await fetch("/api/open-banking/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ institutionId: institution.id, institutionName: institution.name }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Could not start bank connection.");
      return;
    }

    window.location.href = data.link;
  }

  async function mapAccount(openBankingAccountId: string, cardId: string) {
    const response = await fetch("/api/open-banking/accounts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ openBankingAccountId, cardId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Could not map account.");
      return;
    }
    setMessage("Account mapping saved.");
    await loadAccounts();
  }

  async function createCard(openBankingAccountId: string) {
    const response = await fetch("/api/open-banking/accounts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ openBankingAccountId, createCard: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Could not create account.");
      return;
    }
    setMessage("Ledgerly account created from bank data.");
    await loadAccounts();
  }

  async function syncNow() {
    setSyncing(true);
    setMessage("");
    const response = await fetch("/api/open-banking/sync-now", { method: "POST" });
    const data = await response.json();
    setSyncing(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not sync bank feeds.");
      return;
    }
    setMessage(`Sync complete. Imported ${data.imported ?? 0} booked transactions and updated ${data.updatedAccounts ?? 0} accounts.`);
    await loadAccounts();
  }

  async function restartOnboarding() {
    if (!authConfigured || !session?.user.id) return;
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        onboarding_version: Math.max(0, CURRENT_ONBOARDING_VERSION - 1),
        onboarding_completed_at: null,
        onboarding_skipped_at: null,
      })
      .eq("id", session.user.id);
    window.location.reload();
  }

  if (!authConfigured || !session) {
    return (
      <section className="surface p-5">
        <h2 className="text-xl font-black">Connected banks</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Supabase auth is not configured in this local workspace, so Open Banking is disabled until deployment secrets are set.</p>
      </section>
    );
  }

  return (
    <section className="surface p-5 xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-accent">Open Banking</p>
          <h2 className="mt-1 text-2xl font-black">Connected banks</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Securely connect supported UK banks and Ledgerly will import booked transactions once per day. You can keep using CSV import or manual entry any time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={syncNow} disabled={syncing} className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-black text-background disabled:opacity-60">
            <RefreshCw className="size-4" />
            {syncing ? "Syncing" : "Sync now"}
          </button>
          <button type="button" onClick={restartOnboarding} className="h-10 rounded-md border border-border px-4 text-sm font-black text-muted hover:bg-soft">
            Restart onboarding
          </button>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-md border border-border bg-soft px-3 py-2 text-sm font-bold text-muted">{message}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-md border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <Landmark className="size-5 text-accent" />
            <h3 className="font-black">Connect a bank</h3>
          </div>
          <p className="mt-2 text-sm text-muted">Find your institution, then continue through GoCardless and your bank’s hosted consent screens.</p>
          <button type="button" onClick={loadInstitutions} disabled={loadingInstitutions} className="mt-4 h-10 rounded-md border border-border px-4 text-sm font-black hover:bg-soft disabled:opacity-60">
            {loadingInstitutions ? "Loading banks" : "Load UK banks"}
          </button>
          {institutions.length > 0 ? (
            <div className="mt-4">
              <label className="flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2">
                <Search className="size-4 text-muted" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search institutions" className="w-full bg-transparent text-sm font-bold outline-none" />
              </label>
              <div className="mt-3 grid gap-2">
                {filteredInstitutions.map((institution) => (
                  <button key={institution.id} type="button" onClick={() => connectBank(institution)} className="flex items-center justify-between rounded-md bg-soft px-3 py-3 text-left text-sm font-black hover:bg-foreground hover:text-background">
                    {institution.name}
                    <ArrowUpRight className="size-4" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-md border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent" />
            <h3 className="font-black">Accounts discovered</h3>
          </div>
          {accounts.length === 0 ? (
            <div className="mt-4 rounded-md bg-soft p-4">
              <p className="font-black">No bank feeds connected yet</p>
              <p className="mt-1 text-sm text-muted">Connect a bank, import a CSV, or add accounts manually. Ledgerly works either way.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-md border border-border bg-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{account.display_name ?? account.open_banking_connections?.institution_name ?? "Connected account"}</p>
                      <p className="mt-1 text-xs font-bold text-muted">External ID: {account.external_account_id}</p>
                      <p className="mt-1 text-sm text-muted">
                        Balance {account.currency ?? "GBP"} {Number(account.current_balance ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1 text-xs font-black text-muted">
                      <CheckCircle2 className="size-3" />
                      {account.open_banking_connections?.status ?? "connected"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {account.cards ? (
                      <span className="inline-flex items-center gap-2 rounded-md bg-soft px-3 py-2 text-sm font-bold">
                        <LinkIcon className="size-4" />
                        Mapped to {account.cards.provider} {account.cards.name}
                      </span>
                    ) : (
                      <>
                        <button type="button" onClick={() => createCard(account.id)} className="h-9 rounded-md bg-foreground px-3 text-sm font-black text-background">
                          Create new account
                        </button>
                        <select onChange={(event) => event.target.value && mapAccount(account.id, event.target.value)} defaultValue="" className="h-9 rounded-md border border-border bg-background px-3 text-sm font-bold">
                          <option value="">Map to existing</option>
                          {cards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.provider} {card.name}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
