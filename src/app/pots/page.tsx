import { PageHeader } from "@/components/page-header";
import { PotsManager } from "@/components/pots-manager";

export default function PotsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pots"
        title="Savings pots and mixed goals"
        description="Treat long-term savings, short-term goals, and monthly contributions as one planning surface."
      />
      <PotsManager />
    </>
  );
}
