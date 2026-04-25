import { PageHeader } from "@/components/page-header";
import { TransactionsManager } from "@/components/transactions-manager";

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Transactions"
        title="All spending, credits, and transfers"
        description="A ledger view that can later be backed by Supabase rows and CSV imports."
      />
      <TransactionsManager />
    </>
  );
}
