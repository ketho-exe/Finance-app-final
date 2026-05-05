import type { NextRequest } from "next/server";
import { syncOpenBankingAccounts } from "@/lib/open-banking/sync";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await syncOpenBankingAccounts(createAdminClient());
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
