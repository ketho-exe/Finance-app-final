import type { Category, Transaction } from "@/lib/finance";

export type CsvMapping = {
  date?: string;
  merchant?: string;
  amount?: string;
  notes?: string;
  category?: string;
  account?: string;
};

export type CsvCandidate = {
  index: number;
  raw: Record<string, unknown>;
  date: string;
  merchant: string;
  amount: number;
  category: Category;
  cardId: string;
  notes?: string;
  fingerprint: string;
  duplicate: boolean;
  valid: boolean;
  errors: string[];
};

const aliases: Record<keyof CsvMapping, string[]> = {
  date: ["date", "transaction date", "posted date", "completed date"],
  merchant: ["merchant", "name", "description", "counter party", "payee"],
  amount: ["amount", "value", "amount gbp", "amount (gbp)", "gross amount"],
  notes: ["notes", "note", "reference", "memo", "description"],
  category: ["category", "spending category", "type"],
  account: ["account", "account name", "card", "card member"],
};

export function autoDetectCsvMapping(columns: string[]): CsvMapping {
  return {
    date: findColumn(columns, aliases.date),
    merchant: findColumn(columns, aliases.merchant),
    amount: findColumn(columns, aliases.amount),
    notes: findColumn(columns, aliases.notes.filter((alias) => alias !== normalise(findColumn(columns, aliases.merchant) ?? ""))),
    category: findColumn(columns, aliases.category),
    account: findColumn(columns, aliases.account),
  };
}

export function parseCsvDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (slash) return `${slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

export function parseCsvAmount(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const negative = raw.startsWith("(") && raw.endsWith(")");
  const normalised = raw.replace(/[£,\s()]/g, "");
  const amount = Number(normalised);
  if (!Number.isFinite(amount)) return undefined;
  return negative ? -Math.abs(amount) : amount;
}

export function buildCsvCandidates(
  rows: Record<string, unknown>[],
  options: {
    mapping: CsvMapping;
    cards: Array<{ id: string; name: string }>;
    categories: string[];
    defaultCardId: string;
    defaultCategory: Category;
    existingFingerprints: Set<string>;
  },
) {
  const seen = new Set<string>();

  return rows.map<CsvCandidate>((row, index) => {
    const date = parseCsvDate(readMapped(row, options.mapping.date)) ?? "";
    const merchant = String(readMapped(row, options.mapping.merchant) ?? "").trim();
    const amount = parseCsvAmount(readMapped(row, options.mapping.amount));
    const mappedCategory = String(readMapped(row, options.mapping.category) ?? "").trim();
    const mappedAccount = String(readMapped(row, options.mapping.account) ?? "").trim();
    const category = options.categories.includes(mappedCategory) ? mappedCategory : options.defaultCategory;
    const cardId = findCardId(mappedAccount, options.cards) ?? options.defaultCardId;
    const notes = String(readMapped(row, options.mapping.notes) ?? "").trim() || undefined;
    const errors: string[] = [];

    if (!date) errors.push("Date is missing or invalid");
    if (!merchant) errors.push("Merchant is missing");
    if (amount === undefined) errors.push("Amount is missing or invalid");
    if (!cardId) errors.push("Account is missing");
    if (!category) errors.push("Category is missing");

    const fingerprint = `${date}|${merchant}|${amount ?? ""}|${cardId}`;
    const duplicate = Boolean(date && merchant && amount !== undefined && cardId && (seen.has(fingerprint) || options.existingFingerprints.has(fingerprint)));
    if (duplicate) errors.push("Possible duplicate");
    seen.add(fingerprint);

    return {
      index,
      raw: row,
      date,
      merchant,
      amount: amount ?? 0,
      category,
      cardId,
      notes,
      fingerprint,
      duplicate,
      valid: errors.length === 0,
      errors,
    };
  });
}

export function csvCandidateToTransaction(candidate: CsvCandidate, id: string): Transaction {
  return {
    id,
    date: candidate.date,
    merchant: candidate.merchant,
    category: candidate.category,
    amount: candidate.amount,
    cardId: candidate.cardId,
    notes: candidate.notes,
    source: "csv",
  };
}

export function transactionFingerprint(transaction: Pick<Transaction, "date" | "merchant" | "amount" | "cardId">) {
  return `${transaction.date}|${transaction.merchant}|${transaction.amount}|${transaction.cardId}`;
}

function findColumn(columns: string[], candidates: string[]) {
  return columns.find((column) => candidates.includes(normalise(column)));
}

function normalise(value: string) {
  return value.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

function readMapped(row: Record<string, unknown>, column?: string) {
  return column ? row[column] : undefined;
}

function findCardId(value: string, cards: Array<{ id: string; name: string }>) {
  if (!value) return undefined;
  const normalised = normalise(value);
  return cards.find((card) => normalise(card.name) === normalised || card.id === value)?.id;
}
