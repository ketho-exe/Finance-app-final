import type { MoneyCard, Pot, Transaction, WishlistItem } from "@/lib/finance";
import type { Budget, Subscription } from "@/lib/finance-insights";

export type Identified = { id: string };

type LocalSalarySettings = {
  gross: number;
  pension: number;
  studentLoan: "none" | "plan1" | "plan2" | "plan5";
  paydayDay: number;
  incomeCardId?: string;
};

export type LocalFinanceSnapshot = {
  version: 1;
  cards: MoneyCard[];
  transactions: Transaction[];
  pots: Pot[];
  wishlist: WishlistItem[];
  salary: LocalSalarySettings;
  budgets: Budget[];
  subscriptions: Subscription[];
  customCategories: Array<{ id: string; name: string; colour: string }>;
  csvTemplates: Array<{ id: string; bankName: string; columns: string[]; mapping: Record<string, string> }>;
  reportExports: Array<{ id: string; reportMonth: string; format: string; createdAt: string; summary: Record<string, unknown> }>;
};

export function upsertById<T extends Identified>(items: T[], nextItem: T) {
  const exists = items.some((item) => item.id === nextItem.id);

  if (!exists) {
    return [nextItem, ...items];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function removeById<T extends Identified>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}

export function deriveCardBalances(cards: MoneyCard[], transactions: Transaction[]) {
  const balances = transactions.reduce<Record<string, number>>((totals, transaction) => {
    if (!transaction.cardId) return totals;
    totals[transaction.cardId] = (totals[transaction.cardId] ?? 0) + transaction.amount;
    return totals;
  }, {});

  return cards.map((card) => ({
    ...card,
    balance: roundCurrency(balances[card.id] ?? 0),
  }));
}

export function toLocalSnapshot(snapshot: Omit<LocalFinanceSnapshot, "version">): LocalFinanceSnapshot {
  return {
    version: 1,
    cards: snapshot.cards,
    transactions: snapshot.transactions,
    pots: snapshot.pots,
    wishlist: snapshot.wishlist,
    salary: snapshot.salary,
    budgets: snapshot.budgets,
    subscriptions: snapshot.subscriptions,
    customCategories: snapshot.customCategories,
    csvTemplates: snapshot.csvTemplates,
    reportExports: snapshot.reportExports,
  };
}

export function hydrateLocalSnapshot(serialized: string | null): LocalFinanceSnapshot | null {
  if (!serialized) return null;

  try {
    const parsed = JSON.parse(serialized) as Partial<LocalFinanceSnapshot>;
    if (parsed.version !== 1) return null;

    return {
      version: 1,
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      pots: Array.isArray(parsed.pots) ? parsed.pots : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      salary: isSalary(parsed.salary) ? parsed.salary : { gross: 52000, pension: 5, studentLoan: "plan2", paydayDay: 25 },
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
      customCategories: Array.isArray(parsed.customCategories) ? parsed.customCategories : [],
      csvTemplates: Array.isArray(parsed.csvTemplates) ? parsed.csvTemplates : [],
      reportExports: Array.isArray(parsed.reportExports) ? parsed.reportExports : [],
    };
  } catch {
    return null;
  }
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function isSalary(value: unknown): value is LocalSalarySettings {
  if (!value || typeof value !== "object") return false;
  const salary = value as Partial<LocalSalarySettings>;
  return typeof salary.gross === "number" && typeof salary.pension === "number" && typeof salary.paydayDay === "number" && ["none", "plan1", "plan2", "plan5"].includes(String(salary.studentLoan));
}
