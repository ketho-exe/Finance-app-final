import { PageHeader } from "@/components/page-header";
import { SubscriptionsContent } from "@/components/subscriptions-content";

export default function SubscriptionsPage() {
  return (
    <>
      <PageHeader eyebrow="Subscriptions" title="Recurring bills and renewal warnings" description="Track subscriptions, renewal dates, payment cards, and warning windows before they hit your account." />
      <SubscriptionsContent />
    </>
  );
}
