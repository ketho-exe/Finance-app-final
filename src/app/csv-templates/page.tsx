import { CsvTemplatesContent } from "@/components/csv-templates-content";
import { PageHeader } from "@/components/page-header";

export default function CsvTemplatesPage() {
  return (
    <>
      <PageHeader eyebrow="CSV templates" title="Bank import templates" description="Column expectations and mappings for Monzo, Starling, Chase, and Amex exports." />
      <CsvTemplatesContent />
    </>
  );
}
