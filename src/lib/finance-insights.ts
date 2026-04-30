import type { Category, MoneyCard, Transaction, WishlistItem } from "@/lib/finance";

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  category: Category;
  cardId: string;
  renewalDay: number;
  warningDays: number;
  repeatPattern?: "weekly" | "monthly" | "four-weekly" | "custom";
  startDate?: string;
};

export type Budget = {
  id: string;
  category: Category;
  monthlyLimit: number;
  commitment?: "flexible" | "bill" | "reserve";
  dueDay?: number;
  cardId?: string;
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
  const todayStart = startOfLocalDay(today);

  return items
    .map((item) => {
      const renewal = nextOccurrence(item.renewalDay, today);
      const daysUntilRenewal = daysBetween(todayStart, renewal);
      return { ...item, renewalDate: localDateKey(renewal), daysUntilRenewal };
    })
    .filter((item) => item.daysUntilRenewal <= item.warningDays)
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}

export function calculateBudgetUsage(items: Budget[], transactions: Transaction[], monthPrefix = currentMonthKey()) {
  return items.map((budget) => {
    const spent = transactions
      .filter((transaction) => transaction.date.startsWith(monthPrefix) && transaction.category === budget.category && transaction.amount < 0)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const progress = budget.monthlyLimit > 0 ? Math.min(100, (spent / budget.monthlyLimit) * 100) : 0;
    return {
      ...budget,
      spent,
      remaining: Math.max(0, budget.monthlyLimit - spent),
      progress,
      overLimit: spent > budget.monthlyLimit,
    };
  });
}

export function calculateMonthlySubscriptionTotal(items: Subscription[]) {
  const total = items.reduce((sum, item) => sum + normalisedMonthlyAmount(item), 0);
  return Math.round(total * 100) / 100;
}

export function buildCashFlowSeries({
  transactions,
  monthlySalary,
  startDate,
  months = 6,
}: {
  transactions: Transaction[];
  monthlySalary: number;
  startDate?: Date;
  months?: number;
}) {
  const anchor = startDate ?? new Date();
  const firstMonth = startDate
    ? new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    : new Date(anchor.getFullYear(), anchor.getMonth() - (months - 1), 1);

  return Array.from({ length: months }, (_, index) => {
    const monthDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(key));
    const transactionIncome = monthTransactions
      .filter((transaction) => transaction.amount > 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const income = transactionIncome > 0 ? transactionIncome : monthlySalary;
    const outgoings = monthTransactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      month: monthDate.toLocaleString("en-GB", { month: "short" }),
      income,
      outgoings,
      net: income - outgoings,
      predicted: transactionIncome === 0,
    };
  });
}

export type TransactionFilters = {
  query?: string;
  startDate?: string;
  endDate?: string;
  cardId?: string;
  category?: Category | "all";
  direction?: "all" | "income" | "outgoing";
  minAmount?: number;
  maxAmount?: number;
};

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters) {
  const query = filters.query?.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const amount = Math.abs(transaction.amount);
    const searchable = `${transaction.merchant} ${transaction.notes ?? ""}`.toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (filters.startDate && transaction.date < filters.startDate) return false;
    if (filters.endDate && transaction.date > filters.endDate) return false;
    if (filters.cardId && filters.cardId !== "all" && transaction.cardId !== filters.cardId) return false;
    if (filters.category && filters.category !== "all" && transaction.category !== filters.category) return false;
    if (filters.direction === "income" && transaction.amount <= 0) return false;
    if (filters.direction === "outgoing" && transaction.amount >= 0) return false;
    if (filters.minAmount !== undefined && amount < filters.minAmount) return false;
    if (filters.maxAmount !== undefined && amount > filters.maxAmount) return false;

    return true;
  });
}

function nextOccurrence(day: number, today: Date) {
  const todayStart = startOfLocalDay(today);
  let date = dateInMonth(today.getFullYear(), today.getMonth(), day);

  if (date < todayStart) {
    date = dateInMonth(today.getFullYear(), today.getMonth() + 1, day);
  }

  return date;
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateInMonth(year: number, month: number, day: number) {
  const monthEndDate = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Math.max(1, day), monthEndDate));
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonthKey(today = new Date()) {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function normalisedMonthlyAmount(subscription: Subscription) {
  const amount = Math.abs(subscription.amount);
  switch (subscription.repeatPattern ?? "monthly") {
    case "weekly":
      return (amount * 52) / 12;
    case "four-weekly":
      return (amount * 13) / 12;
    case "monthly":
    case "custom":
    default:
      return amount;
  }
}

function monthEnd(today: Date) {
  return new Date(today.getFullYear(), today.getMonth() + 1, 0);
}

export function buildMonthEndForecast({
  currentBalance,
  monthlyTakeHome,
  paydayDay,
  today = new Date(),
  subscriptions,
  budgets,
}: {
  currentBalance: number;
  monthlyTakeHome: number;
  paydayDay: number;
  today?: Date;
  subscriptions: Subscription[];
  budgets: Budget[];
}) {
  const end = monthEnd(today);
  const events: Array<{
    id: string;
    name: string;
    date: string;
    amount: number;
    kind: "salary" | "subscription" | "budget-bill" | "reserve";
  }> = [];

  const payday = nextOccurrence(paydayDay, today);
  if (payday <= end) {
    events.push({
      id: "salary",
      name: "Salary",
      date: localDateKey(payday),
      amount: monthlyTakeHome,
      kind: "salary",
    });
  }

  subscriptions.forEach((subscription) => {
    const dueDate = nextOccurrence(subscription.renewalDay, today);
    if (dueDate <= end) {
      events.push({
        id: subscription.id,
        name: subscription.name,
        date: localDateKey(dueDate),
        amount: -Math.abs(subscription.amount),
        kind: "subscription",
      });
    }
  });

  budgets.filter((budget) => budget.commitment === "bill").forEach((budget) => {
    const dueDate = nextOccurrence(budget.dueDay ?? 1, today);
    if (dueDate <= end) {
      events.push({
        id: budget.id,
        name: `${budget.category} reserve`,
        date: localDateKey(dueDate),
        amount: -Math.abs(budget.monthlyLimit),
        kind: "budget-bill",
      });
    }
  });

  const reservedAtMonthEnd = budgets
    .filter((budget) => budget.commitment === "reserve")
    .reduce((sum, budget) => sum + Math.abs(budget.monthlyLimit), 0);

  budgets.filter((budget) => budget.commitment === "reserve").forEach((budget) => {
    events.push({
      id: budget.id,
      name: `${budget.category} hold`,
      date: localDateKey(end),
      amount: 0,
      kind: "reserve",
    });
  });

  events.sort((a, b) => a.date.localeCompare(b.date));
  const projectedEndBalance = currentBalance + events.reduce((sum, event) => sum + event.amount, 0);

  return {
    events,
    projectedEndBalance,
    reservedAtMonthEnd,
    availableAtMonthEnd: projectedEndBalance - reservedAtMonthEnd,
  };
}

export function predictFutureBalance({
  currentBalance,
  monthlySalary,
  recurring,
  today = new Date(),
  paydayDay = 25,
  buffer = 250,
}: {
  currentBalance: number;
  monthlySalary: number;
  recurring: Subscription[];
  today?: Date;
  paydayDay?: number;
  buffer?: number;
}) {
  const payday = nextOccurrence(paydayDay, today);
  const upcomingRecurring = recurring
    .map((item) => ({ ...item, nextDate: nextOccurrence(item.renewalDay, today) }))
    .filter((item) => item.nextDate <= payday);

  let runningBalance = currentBalance;
  let bufferWarningDate: string | null = null;

  upcomingRecurring
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
    .forEach((item) => {
      runningBalance -= Math.abs(item.amount);
      if (runningBalance < buffer && !bufferWarningDate) {
        bufferWarningDate = localDateKey(item.nextDate);
      }
    });

  return {
    paydayDate: localDateKey(payday),
    daysUntilPayday: Math.max(0, daysBetween(startOfLocalDay(today), payday)),
    balanceByPayday: runningBalance + monthlySalary,
    bufferWarningDate,
    upcomingRecurring,
  };
}

export function calculatePaydayPlan({
  currentBalance,
  monthlySalary,
  transactions,
  recurring,
  today,
  paydayDay,
  buffer,
}: {
  currentBalance: number;
  monthlySalary: number;
  transactions: Transaction[];
  recurring: Subscription[];
  today: Date;
  paydayDay: number;
  buffer: number;
}) {
  const prediction = predictFutureBalance({ currentBalance, monthlySalary, recurring, today, paydayDay, buffer });
  const outgoingsUntilPayday = prediction.upcomingRecurring.reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const safe = calculateSafeToSpendToday({
    balance: currentBalance,
    upcomingBills: outgoingsUntilPayday,
    savingsTarget: 0,
    daysLeftInMonth: prediction.daysUntilPayday,
    buffer,
  });

  return {
    ...prediction,
    upcomingBills: outgoingsUntilPayday,
    safeDailySpend: safe.safeToday,
    overspendingWarning: transactions.some((transaction) => transaction.amount < 0 && Math.abs(transaction.amount) > safe.safeToday * 3),
  };
}

export function calculateAffordability({
  itemCost,
  safeToday,
  discretionaryRemaining,
  savingsTarget,
}: {
  itemCost: number;
  safeToday: number;
  discretionaryRemaining: number;
  savingsTarget: number;
}) {
  const remainingAfterPurchase = discretionaryRemaining - itemCost;
  return {
    affordable: remainingAfterPurchase >= 0,
    remainingAfterPurchase,
    savingsImpact: Math.min(savingsTarget, Math.max(0, itemCost - discretionaryRemaining)),
    dailySpendAfterPurchase: Math.max(0, safeToday - itemCost / 10),
  };
}

export function calculateEmergencyBuffer({
  targetMonths,
  transactions,
  savedAmount,
}: {
  targetMonths: number;
  transactions: Transaction[];
  savedAmount: number;
}) {
  const monthlySpend = transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const target = monthlySpend * targetMonths;
  return {
    target,
    savedAmount,
    shortfall: Math.max(0, target - savedAmount),
    progress: target > 0 ? Math.min(100, (savedAmount / target) * 100) : 0,
  };
}

export function buildBudgetAlerts(budgets: Budget[], transactions: Transaction[], subscriptions: Subscription[]) {
  const usage = calculateBudgetUsage(budgets, transactions);
  const budgetAlerts = usage
    .filter((item) => item.progress >= 80)
    .map((item) => ({
      id: `budget-${item.id}`,
      type: "budget" as const,
      title: `${item.category} budget is ${Math.round(item.progress)}% used`,
      detail: item.overLimit ? "You are over this budget." : `${item.remaining.toFixed(0)} left before the limit.`,
    }));
  const renewalAlerts = findUpcomingRenewals(subscriptions).map((item) => ({
    id: `subscription-${item.id}`,
    type: "subscription" as const,
    title: `${item.name} renews in ${item.daysUntilRenewal} days`,
    detail: `${item.amount.toFixed(2)} due on ${item.renewalDate}.`,
  }));

  return [...budgetAlerts, ...renewalAlerts];
}

export function planWishlistAffordability(items: WishlistItem[], monthlySavings: number) {
  return items.map((item) => {
    const remaining = Math.max(0, item.price - item.saved);
    return {
      ...item,
      remaining,
      monthsUntilAffordable: remaining === 0 ? 0 : Math.ceil(remaining / Math.max(1, monthlySavings)),
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

const categoryKeywords: Record<string, string[]> = {
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
      const apr = card.apr !== undefined ? card.apr / 100 : card.type === "credit" ? 0.249 : 0.399;
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
