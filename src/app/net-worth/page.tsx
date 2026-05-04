import { NetWorthContent } from "@/components/net-worth-content";
import { PageHeader } from "@/components/page-header";

export default function NetWorthPage() {
  return (
    <>
      <PageHeader
        eyebrow="Net worth"
        title="Assets and liabilities"
        description="See account balances, savings pots, debts, and the net worth figure that replaces the workbook balance section."
      />
      <NetWorthContent />
    </>
  );
}
