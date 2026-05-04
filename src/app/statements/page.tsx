import { PageHeader } from "@/components/page-header";
import { StatementsContent } from "@/components/statements-content";

export default function StatementsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Statements"
        title="Credit statement averages"
        description="Estimate monthly credit-card statement averages from your tracked account transactions."
      />
      <StatementsContent />
    </>
  );
}
