import type { Category, MoneyCard, Transaction } from "@/lib/finance";

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  category: Category;
  cardId: string;
  renewalDay: number;
  warningDays: number;
};

export type Budget = {
  id: string;
  category: Category;
  monthlyLimit: number;
};

export type HouseholdMember = {
  id: string;
  name: string;
  role: "Owner" | "Partner" | "Viewer";
  monthlyContribution: number;
};

export const subscriptions: Subscription[] = [
  { id: "sub-netflix", name: "Netflix", amount: 17.99, category: "Entertainment", cardId: "amex", renewalDay: 27, warningDays: 7 },
  { id: "sub-spotify", name: "Spotify", amount: 11.99, category: "Entertainment", cardId: "amex", renewalDay: 3, warningDays: 5 },
  { id: "sub-apple", name: "Apple iCloud", amount: 8.99, category: "Bills", cardId: "monzo", renewalDay: 29, warningDays: 7 },
  { id: "sub-gym", name: "Gym", amount: 42, category: "Health", cardId: "monzo", renewalDay: 12, warningDays: 7 },
];

export const budgets: Budget[] = [
  { id: "budget-groceries", category: "Groceries", monthlyLimit: 420 },
  { id: "budget-eating", category: "Eating out", monthlyLimit: 240 },
  { id: "budget-shopping", category: "Shopping", monthlyLimit: 180 },
  { id: "budget-transport", category: "Transport", monthlyLimit: 160 },
  { id: "budget-entertainment", category: "Entertainment", monthlyLimit: 120 },
];

export const householdMembers: HouseholdMember[] = [
  { id: "member-you", name: "You", role: "Owner", monthlyContribution: 2200 },
  { id: "member-partner", name: "Partner", role: "Partner", monthlyContribution: 1800 },
  { id: "member-viewer", name: "Accountant", role: "Viewer", monthlyContribution: 0 },
];

export const csvTemplates = [
  {
    bank: "Monzo",
    columns: ["Date", "Name", "Type", "Amount", "Category", "Notes"],
    mapping: { date: "Date", merchant: "Name", amount: "Amount", category: "Category", notes: "Notes" },
  },
  {
    bank: "Starling",
    columns: ["Date", "Counter Party", "Reference", "Amount (GBP)", "Spending Category"],
    mapping: { date: "Date", merchant: "Counter Party", amount: "Amount (GBP)", category: "Spending Category", notes: "Reference" },
  },
  {
    bank: "Chase",
    columns: ["Transaction Date", "Description", "Amount", "Balance", "Type"],
    mapping: { date: "Transaction Date", merchant: "Description", amount: "Amount", category: "Type", notes: "Description" },
  },
  {
    bank: "Amex",
    columns: ["Date", "Description", "Card Member", "Amount", "Category"],
    mapping: { date: "Date", merchant: "Description", amount: "Amount", category: "Category", notes: "Card Member" },
  },
];

export function findUpcomingRenewals(items: Subscription[], today = new Date()) {
  return items
    .map((item) => {
      const renewal = new Date(today);
      renewal.setHours(0, 0, 0, 0);
      renewal.setDate(item.renewalDay);

      if (renewal < today) {
        renewal.setMonth(renewal.getMonth() + 1);
      }

      const daysUntilRenewal = Math.ceil((renewal.getTime() - today.getTime()) / 86_400_000);
      return { ...item, renewalDate: renewal.toISOString().slice(0, 10), daysUntilRenewal };
    })
    .filter((item) => item.daysUntilRenewal <= item.warningDays)
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}

export function calculateBudgetUsage(items: Budget[], transactions: Transaction[], monthPrefix = "2026-04") {
  return items.map((budget) => {
    const spent = transactions
      .filter((transaction) => transaction.date.startsWith(monthPrefix) && transaction.category === budget.category && transaction.amount < 0)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    return {
      ...budget,
      spent,
      remaining: Math.max(0, budget.monthlyLimit - spent),
      progress: Math.min(100, (spent / budget.monthlyLimit) * 100),
      overLimit: spent > budget.monthlyLimit,
    };
  });
}

export function calculateSafeToSpendToday({
  balance,
  upcomingBills,
  savingsTarget,
  daysLeftInMonth,
  buffer,
}: {
  balance: number;
  upcomingBills: number;
  savingsTarget: number;
  daysLeftInMonth: number;
  buffer: number;
}) {
  const discretionaryRemaining = Math.max(0, balance - upcomingBills - savingsTarget - buffer);
  return {
    discretionaryRemaining,
    safeToday: Math.max(0, discretionaryRemaining / Math.max(1, daysLeftInMonth)),
  };
}

const categoryKeywords: Record<Category, string[]> = {
  Income: ["salary", "payroll", "wage"],
  Rent: ["rent", "landlord"],
  Bills: ["octopus", "energy", "water", "council", "icloud", "insurance"],
  Groceries: ["tesco", "sainsbury", "aldi", "lidl", "waitrose", "morrisons", "grocery"],
  "Eating out": ["restaurant", "cafe", "dishoom", "deliveroo", "uber eats", "pret"],
  Transport: ["tfl", "train", "uber", "bolt", "rail"],
  Shopping: ["amazon", "uniqlo", "john lewis", "argos"],
  Travel: ["hotel", "airbnb", "ryanair", "easyjet", "trainline"],
  Health: ["boots", "gym", "pharmacy", "dental"],
  Entertainment: ["netflix", "spotify", "cinema", "theatre"],
  Savings: ["vanguard", "isa", "savings", "investment"],
};

export function suggestCategory(description: string, amount: number, history: Transaction[]) {
  const text = description.toLowerCase();
  const keywordMatch = Object.entries(categoryKeywords).find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));
  if (keywordMatch) {
    return { category: keywordMatch[0] as Category, confidence: amount > 0 && keywordMatch[0] === "Income" ? 0.95 : 0.86, reason: "Matched merchant keywords" };
  }

  const merchantWord = text.split(/\s+/)[0];
  const historic = history.find((transaction) => transaction.merchant.toLowerCase().includes(merchantWord));
  if (historic) {
    return { category: historic.category, confidence: 0.72, reason: "Matched previous transaction history" };
  }

  return { category: amount > 0 ? "Income" : "Shopping", confidence: 0.45, reason: "Fallback based on amount direction" };
}

export function calculateDebtPayoff(cards: MoneyCard[], monthlyPayment: number) {
  return cards
    .filter((card) => card.balance < 0 || card.overdraft)
    .map((card) => {
      const debt = Math.abs(Math.min(0, card.balance));
      const apr = card.type === "credit" ? 0.249 : 0.399;
      const monthlyRate = apr / 12;
      let remaining = debt;
      let months = 0;
      let interest = 0;

      while (remaining > 0 && months < 360) {
        const monthlyInterest = remaining * monthlyRate;
        interest += monthlyInterest;
        remaining = Math.max(0, remaining + monthlyInterest - monthlyPayment);
        months += 1;
      }

      return {
        cardId: card.id,
        cardName: card.name,
        startingDebt: debt,
        apr,
        monthsToPayoff: debt === 0 ? 0 : months,
        totalInterest: debt === 0 ? 0 : interest,
      };
    })
    .filter((item) => item.startingDebt > 0);
}
