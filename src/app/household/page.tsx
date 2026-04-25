import { HouseholdContent } from "@/components/household-content";
import { PageHeader } from "@/components/page-header";

export default function HouseholdPage() {
  return (
    <>
      <PageHeader eyebrow="Household" title="Shared household profiles" description="Plan shared finances with multiple profiles, roles, and monthly contribution amounts." />
      <HouseholdContent />
    </>
  );
}
