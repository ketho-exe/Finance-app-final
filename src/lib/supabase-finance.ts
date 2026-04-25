import type { Category, MoneyCard, Pot, Transaction, WishlistItem } from "@/lib/finance";
import type { SalarySettings } from "@/lib/finance-store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function numberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  return numberValue(value);
}

function rowId(id: string) {
  return uuidPattern.test(id) ? id : undefined;
}

export function cardFromRow(row: Record<string, unknown>): MoneyCard {
  return {
    id: String(row.id),
    name: String(row.name),
    provider: String(row.provider),
    type: row.type as MoneyCard["type"],
    balance: numberValue(row.balance),
    limit: nullableNumber(row.credit_limit),
    overdraft: nullableNumber(row.overdraft_limit),
    colour: String(row.colour ?? "bg-[#0f766e]"),
  };
}

export function cardToRow(card: MoneyCard, userId: string) {
  return {
    id: rowId(card.id),
    user_id: userId,
    name: card.name,
    provider: card.provider,
    type: card.type,
    balance: card.balance,
    credit_limit: card.limit ?? null,
    overdraft_limit: card.overdraft ?? null,
    colour: card.colour,
  };
}

export function transactionFromRow(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    date: String(row.transaction_date),
    merchant: String(row.merchant),
    category: row.category as Category,
    amount: numberValue(row.amount),
    cardId: String(row.card_id ?? ""),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function transactionToRow(transaction: Transaction, userId: string) {
  return {
    id: rowId(transaction.id),
    user_id: userId,
    transaction_date: transaction.date,
    merchant: transaction.merchant,
    category: transaction.category,
    amount: transaction.amount,
    card_id: rowId(transaction.cardId) ?? null,
    notes: transaction.notes ?? null,
    source: "manual",
  };
}

export function potFromRow(row: Record<string, unknown>): Pot {
  return {
    id: String(row.id),
    name: String(row.name),
    kind: row.kind as Pot["kind"],
    current: numberValue(row.current_amount),
    target: numberValue(row.target_amount),
    monthlyContribution: numberValue(row.monthly_contribution),
  };
}

export function potToRow(pot: Pot, userId: string) {
  return {
    id: rowId(pot.id),
    user_id: userId,
    name: pot.name,
    kind: pot.kind,
    current_amount: pot.current,
    target_amount: pot.target,
    monthly_contribution: pot.monthlyContribution,
  };
}

export function wishlistFromRow(row: Record<string, unknown>): WishlistItem {
  return {
    id: String(row.id),
    name: String(row.name),
    price: numberValue(row.price),
    saved: numberValue(row.saved_amount),
    priority: row.priority as WishlistItem["priority"],
  };
}

export function wishlistToRow(item: WishlistItem, userId: string) {
  return {
    id: rowId(item.id),
    user_id: userId,
    name: item.name,
    price: item.price,
    saved_amount: item.saved,
    priority: item.priority,
  };
}

export function salaryFromRow(row: Record<string, unknown>): SalarySettings {
  return {
    gross: numberValue(row.gross_annual),
    pension: numberValue(row.pension_percent),
    studentLoan: row.student_loan_plan as SalarySettings["studentLoan"],
  };
}

export function salaryToRow(salary: SalarySettings, userId: string) {
  return {
    user_id: userId,
    gross_annual: salary.gross,
    pension_percent: salary.pension,
    student_loan_plan: salary.studentLoan,
    updated_at: new Date().toISOString(),
  };
}
