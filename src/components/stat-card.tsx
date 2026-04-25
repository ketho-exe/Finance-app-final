import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div className="surface p-5">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-black",
          tone === "good" && "text-accent",
          tone === "warn" && "text-danger",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  );
}
