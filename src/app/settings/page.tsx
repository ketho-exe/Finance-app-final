import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const settings = [
  "Light, dark, and system theme support",
  "Supabase browser and server clients",
  "Supabase auth and profile page",
  "Vercel-ready environment variable names",
  "Self-hosted Satoshi font files",
  "Local CRUD store ready to replace with database queries",
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Deployment and app preferences"
        description="A setup page for the pieces you will connect after creating your Supabase project and Vercel deployment."
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
          <h2 className="text-xl font-black">Environment variables</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Add these to `.env.local` for local work and to Vercel Project Settings for production.</p>
          <pre className="mt-4 overflow-x-auto rounded-md bg-soft p-4 text-sm font-bold text-foreground">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=`}
          </pre>
        </section>
      </div>
    </>
  );
}
