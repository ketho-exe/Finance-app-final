import { LedgerContent } from "@/components/ledger-content";
import { PageHeader } from "@/components/page-header";

export default function LedgerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account ledger"
        title="Financial-year ledger"
        description="A spreadsheet-style account ledger with period and category totals generated from your transactions."
      />
      <LedgerContent />
    </>
  );
}
