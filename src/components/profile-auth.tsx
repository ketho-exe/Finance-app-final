"use client";

import { LogOut, Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SelectField } from "@/components/select-field";
import { createClient } from "@/lib/supabase-client";
import { useFinance } from "@/lib/finance-store";

const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type Profile = {
  display_name: string | null;
  currency: string;
};

export function ProfileAuth() {
  const { session } = useFinance();
  const supabase = useMemo(() => (authConfigured ? createClient() : null), []);
  const [profile, setProfile] = useState<Profile>({ display_name: "", currency: "GBP" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase || !session?.user.id) return;

    let active = true;
    supabase
      .from("profiles")
      .select("display_name,currency")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setProfile({ display_name: data.display_name, currency: data.currency });
      });

    return () => {
      active = false;
    };
  }, [session?.user.id, supabase]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !session?.user.id) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      display_name: profile.display_name,
      currency: profile.currency,
    });
    setLoading(false);
    setMessage(error ? error.message : "Profile saved.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile({ display_name: "", currency: "GBP" });
  }

  if (!authConfigured) {
    return (
      <section className="surface p-5">
        <h2 className="text-xl font-black">Local mode</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Supabase auth is not configured, so this workspace is running with the bundled demo data.</p>
      </section>
    );
  }

  if (!session) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="surface h-fit p-5">
        <div className="flex items-center gap-3">
          <UserRound className="size-5 text-accent" />
          <h2 className="text-xl font-black">Signed in</h2>
        </div>
        <p className="mt-3 break-all text-sm font-bold text-muted">{session.user.email}</p>
        <button onClick={signOut} type="button" className="mt-4 flex h-10 items-center gap-2 rounded-md border border-border px-3 font-bold text-danger">
          <LogOut className="size-4" />
          Sign out
        </button>
      </section>
      <form onSubmit={saveProfile} className="surface space-y-4 p-5">
        <h2 className="text-xl font-black">Profile</h2>
        <label className="block">
          <span className="text-sm font-bold text-muted">Display name</span>
          <input value={profile.display_name ?? ""} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
        </label>
        <SelectField
          label="Currency"
          value={profile.currency}
          onChange={(currency) => setProfile({ ...profile, currency })}
          options={[
            { value: "GBP", label: "GBP" },
            { value: "EUR", label: "EUR" },
            { value: "USD", label: "USD" },
          ]}
        />
        <button disabled={loading} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background disabled:opacity-60" type="submit">
          <Save className="size-4" />
          {loading ? "Saving..." : "Save profile"}
        </button>
        {message ? <p className="text-sm font-bold text-muted">{message}</p> : null}
      </form>
    </div>
  );
}
