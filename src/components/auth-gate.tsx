"use client";

import Image from "next/image";
import { Mail, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useFinance } from "@/lib/finance-store";

const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useFinance();

  if (!authConfigured) return <>{children}</>;
  if (session) return <>{children}</>;

  return <LoginScreen loadingSession={loading} />;
}

function LoginScreen({ loadingSession }: { loadingSession: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = authConfigured ? createClient() : null;

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Authentication is not configured for this deployment.");
      return;
    }

    setLoading(true);
    setMessage("");
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    setMessage(result.error ? result.error.message : mode === "signin" ? "Signed in." : "Account created. Check your email if confirmation is enabled.");
  }

  async function sendMagicLink() {
    if (!supabase) {
      setMessage("Authentication is not configured for this deployment.");
      return;
    }

    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    setMessage(error ? error.message : "Magic link sent. Check your email.");
  }

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_520px]">
      <section className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <div className="flex items-center gap-3">
          <Image src="/ledgerly-logo.png" alt="Ledgerly logo" width={48} height={48} className="size-12 rounded-lg object-contain" priority />
          <span className="text-2xl font-black">Ledgerly</span>
        </div>
        <div>
          <p className="text-sm font-black uppercase text-background/70">Financial control</p>
          <h1 className="mt-4 max-w-2xl text-6xl font-black leading-none">Know what is safe to spend before the month gets noisy.</h1>
          <p className="mt-6 max-w-xl text-lg text-background/75">Track salary, cards, budgets, pots, subscriptions, reports, and household finances from one secure workspace.</p>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <Image src="/ledgerly-logo.png" alt="Ledgerly logo" width={40} height={40} className="size-10 rounded-lg object-contain" priority />
              <span className="text-xl font-black">Ledgerly</span>
            </div>
            <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="grid size-10 place-items-center rounded-md border border-border">
              <Moon className="size-4 dark:hidden" />
              <Sun className="hidden size-4 dark:block" />
            </button>
          </div>
          <div className="surface p-6">
            <p className="text-sm font-black uppercase text-accent">{mode === "signin" ? "Welcome back" : "Create account"}</p>
            <h2 className="mt-2 text-3xl font-black">{mode === "signin" ? "Sign in to Ledgerly" : "Start your workspace"}</h2>
            <form onSubmit={submitPassword} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-muted">Email</span>
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-muted">Password</span>
                <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
              </label>
              <button disabled={loading || loadingSession} className="h-11 w-full rounded-md bg-foreground px-4 font-black text-background disabled:opacity-60">
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
            <button type="button" onClick={sendMagicLink} disabled={!email || loading} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-4 font-black disabled:opacity-60">
              <Mail className="size-4" />
              Email me a magic link
            </button>
            {message ? <p className="mt-4 text-sm font-bold text-muted">{message}</p> : null}
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-5 text-sm font-black text-accent">
              {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
