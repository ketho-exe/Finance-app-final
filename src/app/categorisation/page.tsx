import { CategorisationContent } from "@/components/categorisation-content";
import { PageHeader } from "@/components/page-header";

export default function CategorisationPage() {
  return (
    <>
      <PageHeader eyebrow="Categorisation" title="AI-style category suggestions" description="Rule and history based category suggestions with confidence scores, ready to upgrade to a real AI service later." />
      <CategorisationContent />
    </>
  );
}
