import { PageHeader } from "@/components/page-header";
import { PlanningContent } from "@/components/planning-content";

export default function PlanningPage() {
  return (
    <>
      <PageHeader
        eyebrow="Monthly plan"
        title="Workbook-style planning"
        description="Salary, pension, savings, recurring costs, and remaining money broken down into annual, monthly, weekly, and daily views."
      />
      <PlanningContent />
    </>
  );
}
