import { CsvImporter } from "@/components/csv-importer";
import { CsvTemplatesContent } from "@/components/csv-templates-content";
import { PageHeader } from "@/components/page-header";

export default function UploadPage() {
  return (
    <>
      <PageHeader
        eyebrow="CSV Upload"
        title="Import transactions from your bank"
        description="Preview bank exports, map categories and cards, then import clean transaction rows."
      />
      <CsvImporter />
      <section className="mt-6">
        <PageHeader eyebrow="Templates" title="Supported bank formats" description="Column guides for common UK card and bank exports." />
        <CsvTemplatesContent />
      </section>
    </>
  );
}
