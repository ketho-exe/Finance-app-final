import type { NextRequest } from "next/server";
import { syncOpenBankingAccounts } from "@/lib/open-banking/sync";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return Response.json({ ok: false, error: "user_id is required" }, { status: 400 });
  }

  const result = await syncOpenBankingAccounts(createAdminClient(), { userId });
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
