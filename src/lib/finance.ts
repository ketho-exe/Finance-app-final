export type Category = string;

export const categories = [
  "Income",
  "Rent",
  "Bills",
  "Groceries",
  "Eating out",
  "Transport",
  "Shopping",
  "Travel",
  "Health",
  "Entertainment",
  "Savings",
] satisfies Category[];

export type Transaction = {
  id: string;
  date: string;
  merchant: string;
  category: Category;
  amount: number;
  cardId: string;
  notes?: string;
};

export type MoneyCard = {
  id: string;
  name: string;
  provider: string;
  type: "current" | "credit" | "savings";
  balance: number;
  limit?: number;
  overdraft?: number;
  apr?: number;
  colour: string;
};

export type Pot = {
  id: string;
  name: string;
  current: number;
  target: number;
  monthlyContribution: number;
  kind: "saving" | "goal";
};

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  priority: "High" | "Medium" | "Low";
  saved: number;
};

export const cards: MoneyCard[] = [
  {
    id: "monzo",
    name: "Everyday",
    provider: "Monzo",
    type: "current",
    balance: 1840,
    overdraft: 500,
    colour: "bg-[#ff5a5f]",
  },
  {
    id: "amex",
    name: "Rewards Credit",
    provider: "Amex",
    type: "credit",
    balance: -820,
    limit: 4500,
    colour: "bg-[#2f80ed]",
  },
  {
    id: "chase",
    name: "Bills",
    provider: "Chase",
    type: "current",
    balance: 940,
    overdraft: 250,
    colour: "bg-[#111827]",
  },
  {
    id: "isa",
    name: "Cash ISA",
    provider: "Paragon",
    type: "savings",
    balance: 6200,
    colour: "bg-[#0f766e]",
  },
];

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-04-24", merchant: "Salary", category: "Income", amount: 3250, cardId: "monzo" },
  { id: "t2", date: "2026-04-23", merchant: "Tesco", category: "Groceries", amount: -74.23, cardId: "amex" },
  { id: "t3", date: "2026-04-22", merchant: "TfL", category: "Transport", amount: -18.4, cardId: "amex" },
  { id: "t4", date: "2026-04-21", merchant: "Octopus Energy", category: "Bills", amount: -126, cardId: "chase" },
  { id: "t5", date: "2026-04-20", merchant: "Dishoom", category: "Eating out", amount: -62.9, cardId: "amex" },
  { id: "t6", date: "2026-04-18", merchant: "Landlord", category: "Rent", amount: -1150, cardId: "chase" },
  { id: "t7", date: "2026-04-16", merchant: "Uniqlo", category: "Shopping", amount: -89.8, cardId: "amex" },
  { id: "t8", date: "2026-04-14", merchant: "Vanguard", category: "Savings", amount: -350, cardId: "monzo" },
  { id: "t9", date: "2026-04-11", merchant: "Netflix", category: "Entertainment", amount: -17.99, cardId: "amex" },
  { id: "t10", date: "2026-04-09", merchant: "Boots", category: "Health", amount: -23.45, cardId: "monzo" },
  { id: "t11", date: "2026-03-29", merchant: "Salary", category: "Income", amount: 3250, cardId: "monzo" },
  { id: "t12", date: "2026-03-25", merchant: "Ryanair", category: "Travel", amount: -144, cardId: "amex" },
  { id: "t13", date: "2026-03-20", merchant: "Sainsbury's", category: "Groceries", amount: -91.2, cardId: "amex" },
  { id: "t14", date: "2026-03-18", merchant: "Landlord", category: "Rent", amount: -1150, cardId: "chase" },
  { id: "t15", date: "2026-03-12", merchant: "Gym", category: "Health", amount: -42, cardId: "monzo" },
];

export const pots: Pot[] = [
  { id: "pot-emergency", name: "Emergency buffer", current: 4200, target: 8000, monthlyContribution: 300, kind: "saving" },
  { id: "pot-japan", name: "Japan trip", current: 1750, target: 3600, monthlyContribution: 250, kind: "goal" },
  { id: "pot-house", name: "House deposit", current: 12800, target: 35000, monthlyContribution: 600, kind: "saving" },
  { id: "pot-laptop", name: "New laptop", current: 620, target: 1800, monthlyContribution: 150, kind: "goal" },
];

export const wishlist: WishlistItem[] = [
  { id: "wish-chair", name: "Ergonomic chair", price: 520, priority: "High", saved: 260 },
  { id: "wish-lens", name: "Sony camera lens", price: 899, priority: "Medium", saved: 180 },
  { id: "wish-bath", name: "Weekend in Bath", price: 430, priority: "High", saved: 110 },
  { id: "wish-keyboard", name: "Mechanical keyboard", price: 190, priority: "Low", saved: 90 },
];

export type PensionTiming = "before-tax" | "after-tax";

export function calculateUkSalary(grossAnnual: number, pensionPercent: number, studentLoanPlan: "none" | "plan1" | "plan2" | "plan5", pensionTiming: PensionTiming = "before-tax") {
  const pension = grossAnnual * (pensionPercent / 100);
  const pensionReliefBeforeTax = pensionTiming === "before-tax";
  const taxableGross = Math.max(0, grossAnnual - (pensionReliefBeforeTax ? pension : 0));
  const personalAllowance = grossAnnual > 125140 ? 0 : Math.max(0, 12570 - Math.max(0, grossAnnual - 100000) / 2);
  const incomeTax =
    Math.max(0, Math.min(taxableGross, 50270) - personalAllowance) * 0.2 +
    Math.max(0, Math.min(taxableGross, 125140) - 50270) * 0.4 +
    Math.max(0, taxableGross - 125140) * 0.45;
  const ni = Math.max(0, Math.min(grossAnnual, 50270) - 12570) * 0.08 + Math.max(0, grossAnnual - 50270) * 0.02;
  const thresholds = { none: Infinity, plan1: 24990, plan2: 27295, plan5: 25000 };
  const loanAssessmentGross = pensionReliefBeforeTax ? taxableGross : grossAnnual;
  const studentLoan = studentLoanPlan === "none" ? 0 : Math.max(0, loanAssessmentGross - thresholds[studentLoanPlan]) * 0.09;
  const takeHome = grossAnnual - pension - incomeTax - ni - studentLoan;

  return {
    grossAnnual,
    pension,
    incomeTax,
    nationalInsurance: ni,
    studentLoan,
    takeHomeAnnual: takeHome,
    takeHomeMonthly: takeHome / 12,
  };
}

export function categorySpend(items: Transaction[] = []) {
  return items
    .filter((transaction) => transaction.amount < 0)
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] ?? 0) + Math.abs(transaction.amount);
      return totals;
    }, {});
}

export function monthlyCashFlow() {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, index) => {
    const income = index > 5 ? 3250 + index * 50 : 3250;
    const outgoings = [2580, 2660, 2410, 2790, 2860, 3050, 2925, 2880][index];
    return {
      month,
      income,
      outgoings,
      net: income - outgoings,
      predicted: index > 5,
    };
  });
}

export function cardTransactions(cardId: string, items: Transaction[] = []) {
  return items.filter((transaction) => transaction.cardId === cardId);
}
