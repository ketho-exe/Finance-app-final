"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useFinance } from "@/lib/finance-store";
import { shouldShowOnboarding, toOnboardingUpdate, type OnboardingProfileState } from "@/lib/onboarding";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { session } = useFinance();
  const [loading, setLoading] = useState(authConfigured);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const supabase = useMemo(() => (authConfigured ? createClient() : null), []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!supabase || !session?.user.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      await supabase.from("profiles").upsert({ id: session.user.id }, { onConflict: "id" });

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_version,onboarding_completed_at,onboarding_skipped_at")
        .eq("id", session.user.id)
        .single<OnboardingProfileState>();

      if (!active) return;

      setShowOnboarding(error || !data ? true : shouldShowOnboarding(data));
      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [session?.user.id, supabase]);

  async function markDone(mode: "completed" | "skipped") {
    if (!supabase || !session?.user.id) return;

    await supabase
      .from("profiles")
      .update(toOnboardingUpdate(mode))
      .eq("id", session.user.id);

    setShowOnboarding(false);
  }

  if (!authConfigured || !session) return <>{children}</>;

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-background text-foreground">Loading your workspace...</main>;
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => markDone("completed")} onSkip={() => markDone("skipped")} />;
  }

  return <>{children}</>;
}
