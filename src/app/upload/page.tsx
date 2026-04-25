import { CsvImporter } from "@/components/csv-importer";
import { PageHeader } from "@/components/page-header";

export default function UploadPage() {
  return (
    <>
      <PageHeader
        eyebrow="CSV Upload"
        title="Import transactions from your bank"
        description="Preview CSV files locally before mapping them into transaction rows. This is ready to connect to Supabase storage or database inserts."
      />
      <CsvImporter />
    </>
  );
}
