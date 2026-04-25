"use client";

import type { Session } from "@supabase/supabase-js";
import { LogOut, Mail, Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Profile = {
  display_name: string | null;
  currency: string;
};

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function ProfileAuth() {
  const supabase = useMemo(() => (supabaseConfigured ? createClient() : null), []);
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>({ display_name: "", currency: "GBP" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

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

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/profile` },
    });
    setLoading(false);
    setMessage(error ? error.message : "Magic link sent. Check your email.");
  }

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

  if (!supabaseConfigured) {
    return (
      <div className="surface p-5">
        <h2 className="text-xl font-black">Supabase is not configured yet</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Add these values to `.env.local` and to Vercel when deployed. Once present, this page becomes a magic-link login and profile editor.</p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-soft p-4 text-sm font-bold">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=`}
        </pre>
      </div>
    );
  }

  if (!session) {
    return (
      <form onSubmit={sendMagicLink} className="surface max-w-xl space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Mail className="size-5 text-accent" />
          <h2 className="text-xl font-black">Sign in with email</h2>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-muted">Email address</span>
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
        </label>
        <button disabled={loading} className="h-11 rounded-md bg-foreground px-4 font-black text-background disabled:opacity-60" type="submit">
          {loading ? "Sending..." : "Send magic link"}
        </button>
        {message ? <p className="text-sm font-bold text-muted">{message}</p> : null}
      </form>
    );
  }

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
        <label className="block">
          <span className="text-sm font-bold text-muted">Currency</span>
          <select value={profile.currency} onChange={(event) => setProfile({ ...profile, currency: event.target.value })} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold">
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <button disabled={loading} className="flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background disabled:opacity-60" type="submit">
          <Save className="size-4" />
          {loading ? "Saving..." : "Save profile"}
        </button>
        {message ? <p className="text-sm font-bold text-muted">{message}</p> : null}
      </form>
    </div>
  );
}
