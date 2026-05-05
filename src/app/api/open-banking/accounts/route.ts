import { requireUser } from "@/lib/auth/require-user";
import { gocardlessFetch } from "@/lib/open-banking/gocardless";

type AccountDetailsResponse = {
  account: {
    resourceId?: string;
    iban?: string;
    currency?: string;
    ownerName?: string;
    name?: string;
    displayName?: string;
    product?: string;
    cashAccountType?: string;
    details?: string;
  };
};

type BalanceResponse = {
  balances: Array<{
    balanceAmount: { amount: string; currency: string };
    balanceType: string;
  }>;
};

function chooseBalance(data: BalanceResponse) {
  return data.balances.find((balance) => balance.balanceType.toLowerCase().includes("interim")) ?? data.balances[0];
}

function last4(value?: string) {
  return value ? value.slice(-4) : null;
}

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data: accounts, error } = await supabase
    .from("open_banking_accounts")
    .select("*, open_banking_connections(institution_name, status, consent_expires_at), cards(id, name, provider)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ accounts });
}

export async function PATCH(request: Request) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const openBankingAccountId = String(body.openBankingAccountId ?? "");
  const cardId = body.cardId ? String(body.cardId) : null;
  const createCard = Boolean(body.createCard);

  const { data: account, error: accountError } = await supabase
    .from("open_banking_accounts")
    .select("*, open_banking_connections(institution_name)")
    .eq("id", openBankingAccountId)
    .eq("user_id", user!.id)
    .single();

  if (accountError || !account) {
    return Response.json({ error: "Open Banking account not found" }, { status: 404 });
  }

  let finalCardId = cardId;

  if (createCard) {
    const [details, balances] = await Promise.all([
      gocardlessFetch<AccountDetailsResponse>(`/accounts/${account.external_account_id}/details/`),
      gocardlessFetch<BalanceResponse>(`/accounts/${account.external_account_id}/balances/`),
    ]);
    const selectedBalance = chooseBalance(balances);
    const now = new Date().toISOString();
    const institutionName = account.open_banking_connections?.institution_name ?? "Connected bank";

    const { data: card, error: cardError } = await supabase
      .from("cards")
      .insert({
        user_id: user!.id,
        name: details.account.displayName ?? details.account.name ?? details.account.product ?? "Connected account",
        provider: institutionName,
        type: "current",
        balance: Number(selectedBalance?.balanceAmount.amount ?? 0),
        colour: "bg-[#0f766e]",
        source: "open_banking",
        external_account_id: account.external_account_id,
        open_banking_account_id: account.id,
        last_synced_at: now,
      })
      .select()
      .single();

    if (cardError) {
      return Response.json({ error: cardError.message }, { status: 500 });
    }

    finalCardId = card.id;

    await supabase
      .from("open_banking_accounts")
      .update({
        display_name: details.account.displayName ?? details.account.name ?? details.account.product ?? null,
        iban_last4: last4(details.account.iban),
        currency: details.account.currency ?? selectedBalance?.balanceAmount.currency ?? "GBP",
        account_type: details.account.cashAccountType ?? details.account.product ?? null,
        owner_name: details.account.ownerName ?? null,
        current_balance: Number(selectedBalance?.balanceAmount.amount ?? 0),
        available_balance: Number(selectedBalance?.balanceAmount.amount ?? 0),
        last_synced_at: now,
      })
      .eq("id", account.id)
      .eq("user_id", user!.id);
  }

  const { error: updateError } = await supabase
    .from("open_banking_accounts")
    .update({ card_id: finalCardId })
    .eq("id", account.id)
    .eq("user_id", user!.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ ok: true, cardId: finalCardId });
}
