import { PageHeader } from "@/components/page-header";
import { ReconciliationContent } from "@/components/reconciliation-content";

export default function ReconciliationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Bank reconciliation"
        title="Match app balances to bank balances"
        description="Check imported bank balances against Ledgerly balances with money-in, money-out, and buffer adjustments."
      />
      <ReconciliationContent />
    </>
  );
}
