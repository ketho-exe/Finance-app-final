import { LoansContent } from "@/components/loans-content";
import { PageHeader } from "@/components/page-header";

export default function LoansPage() {
  return (
    <>
      <PageHeader
        eyebrow="Loans"
        title="Debt and payoff tracker"
        description="Track credit and overdraft exposure with payoff estimates based on monthly repayment assumptions."
      />
      <LoansContent />
    </>
  );
}
