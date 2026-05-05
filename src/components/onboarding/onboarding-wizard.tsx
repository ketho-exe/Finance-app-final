"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Landmark, Upload, WalletCards } from "lucide-react";
import { onboardingSteps } from "@/lib/onboarding";

export function OnboardingWizard({
  onComplete,
  onSkip,
}: {
  onComplete: () => Promise<void> | void;
  onSkip: () => Promise<void> | void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const step = onboardingSteps[stepIndex];
  const isLast = stepIndex === onboardingSteps.length - 1;

  async function completeAndContinue() {
    setSaving(true);
    await onComplete();
    setSaving(false);
  }

  async function skipSetup() {
    setSaving(true);
    await onSkip();
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-accent">Setup</p>
            <h1 className="text-2xl font-black">Ledgerly onboarding</h1>
          </div>
          <button type="button" onClick={skipSetup} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm font-black text-muted hover:bg-soft disabled:opacity-60">
            Skip setup
          </button>
        </header>

        <section className="mt-8 grid flex-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="surface h-fit p-4">
            {onboardingSteps.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStepIndex(index)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-black ${index === stepIndex ? "bg-foreground text-background" : "text-muted hover:bg-soft"}`}
              >
                <span className="grid size-7 place-items-center rounded-full border border-current text-xs">{index + 1}</span>
                <span>
                  {item.title}
                  {item.optional ? <span className="ml-2 text-xs opacity-70">Optional</span> : null}
                </span>
              </button>
            ))}
          </aside>

          <div className="surface overflow-hidden p-6 sm:p-8">
            <p className="text-sm font-black uppercase text-accent">Step {stepIndex + 1} of {onboardingSteps.length}</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">{step.title}</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">{step.description}</p>

            {step.id === "profile" ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <SetupChoice title="GBP by default" description="Ledgerly is tuned for UK accounts, salary, and forecasting." />
                <SetupChoice title="Light or dark" description="Use the theme toggle any time from the app header." />
              </div>
            ) : null}

            {step.id === "accounts" ? (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <SetupChoice icon={<Landmark className="size-5" />} title="Connect bank" description="Sync transactions daily using Open Banking." />
                <LinkChoice href="/upload" onBeforeNavigate={completeAndContinue} icon={<Upload className="size-5" />} title="Import CSV" description="Use existing CSV upload for unsupported banks." />
                <LinkChoice href="/cards" onBeforeNavigate={completeAndContinue} icon={<WalletCards className="size-5" />} title="Add manually" description="Create accounts yourself and add transactions later." />
              </div>
            ) : null}

            {step.id === "open-banking" ? (
              <div className="mt-8 rounded-md border border-border bg-soft p-5">
                <h3 className="text-xl font-black">Connect bank feeds</h3>
                <p className="mt-2 text-muted">This is optional. You can connect now, skip, or do it later from Settings.</p>
                <Link href="/settings?openBanking=connect" onClick={completeAndContinue} className="mt-5 inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 font-black text-background">
                  Open bank connection settings <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : null}

            {step.id === "salary-budget" ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <LinkChoice href="/salary" onBeforeNavigate={completeAndContinue} title="Salary calculator" description="Add take-home pay assumptions and payday settings." />
                <LinkChoice href="/budgets" onBeforeNavigate={completeAndContinue} title="Budgets" description="Create flexible limits and bill reserves." />
              </div>
            ) : null}

            {step.id === "finish" ? (
              <div className="mt-8 rounded-md bg-soft p-5">
                <p className="font-black">You can change everything later.</p>
                <p className="mt-2 text-muted">Settings includes connected banks, onboarding restart, categories, reports, and workspace preferences.</p>
              </div>
            ) : null}

            <footer className="mt-10 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={stepIndex === 0 || saving}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                className="rounded-md border border-border px-5 py-3 font-black disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => (isLast ? completeAndContinue() : setStepIndex((current) => current + 1))}
                className="rounded-md bg-foreground px-5 py-3 font-black text-background disabled:opacity-60"
              >
                {isLast ? "Finish setup" : "Continue"}
              </button>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function SetupChoice({ icon, title, description }: { icon?: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-5 shadow-sm">
      {icon ? <div className="grid size-12 place-items-center rounded-md bg-soft">{icon}</div> : null}
      <h3 className={icon ? "mt-4 text-lg font-black" : "text-lg font-black"}>{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

function LinkChoice({
  href,
  onBeforeNavigate,
  icon,
  title,
  description,
}: {
  href: string;
  onBeforeNavigate: () => Promise<void> | void;
  icon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} onClick={onBeforeNavigate} className="rounded-md border border-border bg-background p-5 shadow-sm hover:bg-soft">
      {icon ? <div className="grid size-12 place-items-center rounded-md bg-soft">{icon}</div> : null}
      <h3 className={icon ? "mt-4 text-lg font-black" : "text-lg font-black"}>{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </Link>
  );
}
