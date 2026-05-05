export const CURRENT_ONBOARDING_VERSION = 1;

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  optional?: boolean;
};

export type OnboardingProfileState = {
  onboarding_version: number | null;
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
};

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Ledgerly",
    description: "Get your accounts, categories, salary, and goals set up in a few minutes.",
  },
  {
    id: "profile",
    title: "Choose your preferences",
    description: "Confirm currency, theme, payday day, and household mode.",
  },
  {
    id: "accounts",
    title: "Add your accounts",
    description: "Connect a bank, import CSVs, or add accounts manually.",
  },
  {
    id: "open-banking",
    title: "Connect bank feeds",
    description: "Securely link bank accounts to sync booked transactions daily.",
    optional: true,
  },
  {
    id: "salary-budget",
    title: "Set salary and budgets",
    description: "Enter salary details and monthly limits so forecasts are meaningful.",
    optional: true,
  },
  {
    id: "finish",
    title: "You are ready",
    description: "Review your setup and enter the dashboard.",
  },
];

export function shouldShowOnboarding(profile: OnboardingProfileState | null | undefined) {
  if (!profile) return true;

  const seenCurrentVersion = Number(profile.onboarding_version ?? 0) >= CURRENT_ONBOARDING_VERSION;
  const finishedOrSkipped = Boolean(profile.onboarding_completed_at || profile.onboarding_skipped_at);

  return !(seenCurrentVersion && finishedOrSkipped);
}

export function toOnboardingUpdate(mode: "completed" | "skipped", timestamp = new Date().toISOString()) {
  return {
    onboarding_version: CURRENT_ONBOARDING_VERSION,
    onboarding_completed_at: mode === "completed" ? timestamp : null,
    onboarding_skipped_at: mode === "skipped" ? timestamp : null,
  };
}
