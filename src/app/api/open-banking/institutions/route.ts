import { requireUser } from "@/lib/auth/require-user";
import { gocardlessFetch } from "@/lib/open-banking/gocardless";

type Institution = {
  id: string;
  name: string;
  bic?: string;
  transaction_total_days?: string;
  countries?: string[];
  logo?: string;
};

export async function GET(request: Request) {
  const { response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") ?? "gb";

  const institutions = await gocardlessFetch<Institution[]>(`/institutions/?country=${country}`);

  return Response.json({ institutions });
}
