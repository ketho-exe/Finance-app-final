import { NextRequest, NextResponse } from "next/server";
import { gocardlessFetch } from "@/lib/open-banking/gocardless";
import { createAdminClient } from "@/lib/supabase-admin";

type RequisitionResponse = {
  id: string;
  status: string;
  accounts: string[];
  reference?: string;
};

export async function GET(request: NextRequest) {
  const connectionId = request.nextUrl.searchParams.get("connection_id");

  if (!connectionId) {
    return NextResponse.redirect(new URL("/settings?bank=missing_connection", request.url));
  }

  const supabase = createAdminClient();
  const { data: connection, error } = await supabase
    .from("open_banking_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (error || !connection?.requisition_id) {
    return NextResponse.redirect(new URL("/settings?bank=connection_not_found", request.url));
  }

  const requisition = await gocardlessFetch<RequisitionResponse>(`/requisitions/${connection.requisition_id}/`);
  const accountRows = requisition.accounts.map((accountId) => ({
    user_id: connection.user_id,
    connection_id: connection.id,
    provider: "gocardless",
    external_account_id: accountId,
  }));

  if (accountRows.length > 0) {
    await supabase
      .from("open_banking_accounts")
      .upsert(accountRows, { onConflict: "provider,external_account_id" });
  }

  await supabase
    .from("open_banking_connections")
    .update({
      status: requisition.status,
      consent_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", connection.id);

  return NextResponse.redirect(new URL("/settings?bank=connected", request.url));
}
