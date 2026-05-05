import { requireUser } from "@/lib/auth/require-user";
import { gocardlessFetch } from "@/lib/open-banking/gocardless";

export async function POST(request: Request) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const institutionId = String(body.institutionId ?? "");
  const institutionName = body.institutionName ? String(body.institutionName) : null;

  if (!institutionId) {
    return Response.json({ error: "institutionId is required" }, { status: 400 });
  }

  const { data: connection, error: insertError } = await supabase
    .from("open_banking_connections")
    .insert({
      user_id: user!.id,
      provider: "gocardless",
      institution_id: institutionId,
      institution_name: institutionName,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const appUrl = process.env.APP_URL ?? new URL(request.url).origin;
  const redirect = `${appUrl}/api/open-banking/callback?connection_id=${connection.id}`;

  const requisition = await gocardlessFetch<{ id: string; link: string }>("/requisitions/", {
    method: "POST",
    body: JSON.stringify({
      redirect,
      institution_id: institutionId,
      reference: connection.id,
      user_language: "EN",
    }),
  });

  const { error: updateError } = await supabase
    .from("open_banking_connections")
    .update({ requisition_id: requisition.id, status: "created" })
    .eq("id", connection.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ link: requisition.link, connectionId: connection.id });
}
