import { CardsManager } from "@/components/cards-manager";
import { PageHeader } from "@/components/page-header";

export default function CardsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Accounts, limits, overdrafts, and spend"
        description="Separate accounts keep their own balances, transaction streams, credit limits, and overdraft buffers."
      />
      <CardsManager />
    </>
  );
}
