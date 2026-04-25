import { PageHeader } from "@/components/page-header";
import { SalaryCalculator } from "@/components/salary-calculator";

export default function SalaryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Salary"
        title="UK salary calculator"
        description="Estimate monthly take-home pay with pension, employee National Insurance, income tax, and student loan deductions."
      />
      <SalaryCalculator />
    </>
  );
}
