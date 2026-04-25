import { PageHeader } from "@/components/page-header";
import { StatisticsContent } from "@/components/statistics-content";

export default function StatisticsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Statistics"
        title="Spending patterns and predictions"
        description="See where your money goes most often, then compare historic cash flow with predicted months."
      />
      <StatisticsContent />
    </>
  );
}
