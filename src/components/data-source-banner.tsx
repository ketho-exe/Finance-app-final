"use client";

import Link from "next/link";
import { Database, LogIn } from "lucide-react";
import { useFinance } from "@/lib/finance-store";

export function DataSourceBanner() {
  const { usingSupabase, session, loading, error } = useFinance();

  if (loading) {
    return (
      <div className="mb-5 rounded-md border border-border bg-soft px-4 py-3 text-sm font-bold text-muted">
        Loading Supabase finance data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-5 rounded-md border border-danger bg-soft px-4 py-3 text-sm font-bold text-danger">
        Supabase error: {error}
      </div>
    );
  }

  if (usingSupabase) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-md border border-border bg-soft px-4 py-3 text-sm font-bold text-muted">
        <Database className="size-4 text-accent" />
        Using Supabase data for {session?.user.email}
      </div>
    );
  }

  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-md border border-border bg-soft px-4 py-3 text-sm font-bold text-muted">
      <span>Using local demo data. Sign in to load and save finance data in Supabase.</span>
      <Link href="/profile" className="flex shrink-0 items-center gap-2 rounded-md bg-foreground px-3 py-2 text-background">
        <LogIn className="size-4" />
        Profile
      </Link>
    </div>
  );
}
