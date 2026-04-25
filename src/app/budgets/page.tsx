import { BudgetsContent } from "@/components/budgets-content";
import { PageHeader } from "@/components/page-header";

export default function BudgetsPage() {
  return (
    <>
      <PageHeader eyebrow="Budgets" title="Monthly category limits" description="See spending against category limits with progress bars and over-budget warnings." />
      <BudgetsContent />
    </>
  );
}
