import { PageHeader } from "@/components/page-header";
import { ReportsContent } from "@/components/reports-content";

export default function ReportsPage() {
  return (
    <>
      <PageHeader eyebrow="Reports" title="Monthly PDF report" description="Export a compact monthly summary with balances, salary settings, pots, and top spending categories." />
      <ReportsContent />
    </>
  );
}
