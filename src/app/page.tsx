import { DashboardContent } from "@/components/dashboard-content";
import { PageHeader } from "@/components/page-header";

export default function Home() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Your money, forecasted before it surprises you."
        description="Track UK take-home pay, card balances, category spending, savings pots, wishlist goals, and predicted cash flow from one calm workspace."
      />
      <DashboardContent />
    </>
  );
}
