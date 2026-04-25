import { DebtPlannerContent } from "@/components/debt-planner-content";
import { PageHeader } from "@/components/page-header";

export default function DebtPage() {
  return (
    <>
      <PageHeader eyebrow="Debt" title="Debt payoff planner" description="Estimate months and interest for credit card and overdraft balances at different monthly payment levels." />
      <DebtPlannerContent />
    </>
  );
}
