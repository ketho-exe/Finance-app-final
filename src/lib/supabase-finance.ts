import type { Category, MoneyCard, Pot, Transaction, WishlistItem } from "@/lib/finance";
import type { Budget, Subscription } from "@/lib/finance-insights";
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
    apr: nullableNumber(row.apr),
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
    ...(card.apr !== undefined ? { apr: card.apr } : {}),
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
    pensionTiming: row.pension_tax_timing === "after-tax" ? "after-tax" : "before-tax",
    studentLoan: row.student_loan_plan as SalarySettings["studentLoan"],
    paydayDay: numberValue(row.payday_day ?? 25),
    incomeCardId: row.income_card_id ? String(row.income_card_id) : undefined,
  };
}

export function salaryToRow(salary: SalarySettings, userId: string, options: { includeExtendedColumns?: boolean } = {}) {
  const includeExtendedColumns = options.includeExtendedColumns ?? true;
  return {
    user_id: userId,
    gross_annual: salary.gross,
    pension_percent: salary.pension,
    ...(includeExtendedColumns ? { pension_tax_timing: salary.pensionTiming } : {}),
    student_loan_plan: salary.studentLoan,
    updated_at: new Date().toISOString(),
  };
}

export function budgetFromRow(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    category: row.category as Category,
    monthlyLimit: numberValue(row.monthly_limit),
    commitment: (row.commitment_type as Budget["commitment"]) ?? "flexible",
    dueDay: nullableNumber(row.due_day),
    cardId: row.card_id ? String(row.card_id) : undefined,
  };
}

export function budgetToRow(budget: Budget, userId: string) {
  return {
    id: rowId(budget.id),
    user_id: userId,
    category: budget.category,
    monthly_limit: budget.monthlyLimit,
  };
}

export function subscriptionFromRow(row: Record<string, unknown>): Subscription {
  return {
    id: String(row.id),
    name: String(row.name),
    amount: numberValue(row.amount),
    category: row.category as Category,
    cardId: String(row.card_id ?? ""),
    renewalDay: numberValue(row.renewal_day),
    warningDays: numberValue(row.warning_days),
    repeatPattern: (row.repeat_pattern as Subscription["repeatPattern"]) ?? "monthly",
    startDate: row.start_date ? String(row.start_date) : undefined,
  };
}

export function subscriptionToRow(subscription: Subscription, userId: string) {
  return {
    id: rowId(subscription.id),
    user_id: userId,
    name: subscription.name,
    amount: subscription.amount,
    category: subscription.category,
    card_id: rowId(subscription.cardId) ?? null,
    renewal_day: subscription.renewalDay,
    warning_days: subscription.warningDays,
    repeat_pattern: subscription.repeatPattern ?? "monthly",
    start_date: subscription.startDate ?? null,
    active: true,
  };
}

export function customCategoryFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    colour: String(row.colour ?? "#2457c5"),
  };
}

export function customCategoryToRow(category: { id: string; name: string; colour: string }, userId: string) {
  return {
    id: rowId(category.id),
    user_id: userId,
    name: category.name,
    colour: category.colour,
  };
}

export function csvTemplateFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    bankName: String(row.bank_name),
    columns: Array.isArray(row.columns) ? row.columns.map(String) : [],
    mapping: typeof row.mapping === "object" && row.mapping ? row.mapping as Record<string, string> : {},
  };
}

export function csvTemplateToRow(template: { id: string; bankName: string; columns: string[]; mapping: Record<string, string> }, userId: string) {
  return {
    id: rowId(template.id),
    user_id: userId,
    bank_name: template.bankName,
    columns: template.columns,
    mapping: template.mapping,
  };
}

export function reportExportFromRow(row: Record<string, unknown>) {
  const summary = typeof row.summary === "object" && row.summary ? row.summary as Record<string, unknown> : {};
  return {
    id: String(row.id),
    reportMonth: String(row.report_month),
    format: String(row.format ?? "pdf"),
    createdAt: String(row.created_at ?? ""),
    summary,
  };
}

export function reportExportToRow(report: { id: string; reportMonth: string; format: string; summary: Record<string, unknown> }, userId: string) {
  return {
    id: rowId(report.id),
    user_id: userId,
    report_month: report.reportMonth,
    format: report.format,
    summary: report.summary,
  };
}
