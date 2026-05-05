import type { SupabaseClient } from "@supabase/supabase-js";
import { gocardlessFetch } from "@/lib/open-banking/gocardless";

export type GocardlessTransaction = {
  transactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
  additionalInformation?: string;
  creditorName?: string;
  debtorName?: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
};

type TransactionsResponse = {
  transactions: {
    booked?: GocardlessTransaction[];
    pending?: GocardlessTransaction[];
  };
};

type BalanceResponse = {
  balances: Array<{
    balanceAmount: { amount: string; currency: string };
    balanceType: string;
  }>;
};

type OpenBankingAccountRow = {
  id: string;
  user_id: string;
  external_account_id: string;
  card_id: string | null;
};

export function normaliseMerchant(tx: GocardlessTransaction) {
  return (
    tx.creditorName ??
    tx.debtorName ??
    tx.remittanceInformationUnstructured ??
    tx.remittanceInformationUnstructuredArray?.join(" ") ??
    tx.additionalInformation ??
    "Open Banking transaction"
  ).slice(0, 200);
}

export function fallbackTransactionId(accountId: string, tx: GocardlessTransaction) {
  return [
    accountId,
    tx.bookingDate ?? tx.valueDate ?? "",
    tx.transactionAmount.amount,
    normaliseMerchant(tx),
  ].join("|");
}

export function guessCategory(tx: GocardlessTransaction) {
  const merchant = normaliseMerchant(tx).toLowerCase();

  if (merchant.includes("salary") || merchant.includes("payroll")) return "Income";
  if (merchant.includes("tesco") || merchant.includes("sainsbury") || merchant.includes("aldi") || merchant.includes("lidl")) return "Groceries";
  if (merchant.includes("netflix") || merchant.includes("spotify") || merchant.includes("cinema")) return "Entertainment";
  if (/\btfl\b/.test(merchant) || merchant.includes("uber") || merchant.includes("trainline")) return "Transport";
  if (merchant.includes("octopus") || merchant.includes("british gas") || merchant.includes("water") || merchant.includes("council")) return "Bills";
  if (merchant.includes("rent") || merchant.includes("landlord")) return "Rent";

  return Number(tx.transactionAmount.amount) > 0 ? "Income" : "Shopping";
}

export function toOpenBankingTransactionRow(params: {
  userId: string;
  cardId: string | null;
  externalAccountId: string;
  tx: GocardlessTransaction;
  importedAt?: string;
}) {
  const { userId, cardId, externalAccountId, tx } = params;

  return {
    user_id: userId,
    card_id: cardId,
    external_account_id: externalAccountId,
    external_transaction_id: tx.transactionId ?? fallbackTransactionId(externalAccountId, tx),
    transaction_date: tx.bookingDate ?? tx.valueDate ?? new Date().toISOString().slice(0, 10),
    merchant: normaliseMerchant(tx),
    category: guessCategory(tx),
    amount: Number(tx.transactionAmount.amount),
    notes: null,
    source: "open_banking",
    imported_at: params.importedAt ?? new Date().toISOString(),
    pending: false,
  };
}

function chooseBalance(data: BalanceResponse) {
  return data.balances.find((balance) => balance.balanceType.toLowerCase().includes("interim")) ?? data.balances[0];
}

export async function syncOpenBankingAccounts(
  supabase: SupabaseClient,
  options: { userId?: string } = {},
) {
  let query = supabase
    .from("open_banking_accounts")
    .select("id, user_id, external_account_id, card_id")
    .order("created_at", { ascending: true });

  if (options.userId) {
    query = query.eq("user_id", options.userId);
  }

  const { data: accounts, error } = await query;

  if (error) {
    return { ok: false, imported: 0, updatedAccounts: 0, error: error.message };
  }

  let imported = 0;
  let updatedAccounts = 0;

  for (const account of (accounts ?? []) as OpenBankingAccountRow[]) {
    try {
      const [transactionsData, balancesData] = await Promise.all([
        gocardlessFetch<TransactionsResponse>(`/accounts/${account.external_account_id}/transactions/`),
        gocardlessFetch<BalanceResponse>(`/accounts/${account.external_account_id}/balances/`),
      ]);

      const importedAt = new Date().toISOString();
      const rows = (transactionsData.transactions.booked ?? []).map((tx) =>
        toOpenBankingTransactionRow({
          userId: account.user_id,
          cardId: account.card_id,
          externalAccountId: account.external_account_id,
          tx,
          importedAt,
        }),
      );

      if (rows.length > 0) {
        const { error: upsertError } = await supabase
          .from("transactions")
          .upsert(rows, {
            onConflict: "user_id,external_account_id,external_transaction_id",
            ignoreDuplicates: false,
          });

        if (upsertError) throw upsertError;
        imported += rows.length;
      }

      const selectedBalance = chooseBalance(balancesData);
      const balance = Number(selectedBalance?.balanceAmount.amount ?? 0);
      const now = new Date().toISOString();

      await supabase
        .from("open_banking_accounts")
        .update({
          current_balance: balance,
          available_balance: balance,
          last_synced_at: now,
        })
        .eq("id", account.id);

      if (account.card_id) {
        await supabase
          .from("cards")
          .update({ balance, last_synced_at: now })
          .eq("id", account.card_id)
          .eq("user_id", account.user_id);
      }

      updatedAccounts += 1;
    } catch (error) {
      console.error("Open Banking sync failed for account", account.id, error);
    }
  }

  return { ok: true, imported, updatedAccounts };
}
