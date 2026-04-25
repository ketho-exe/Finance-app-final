import { PageHeader } from "@/components/page-header";
import { SafeSpendContent } from "@/components/safe-spend-content";

export default function SafeSpendPage() {
  return (
    <>
      <PageHeader eyebrow="Safe spend" title="What can I spend today?" description="A daily discretionary spend number after bills, savings targets, and a buffer are reserved." />
      <SafeSpendContent />
    </>
  );
}
