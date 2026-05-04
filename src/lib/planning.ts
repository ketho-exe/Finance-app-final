import { divideMoney, roundMoney } from "@/lib/money";

export type PlanItemKind = "salary" | "saving" | "necessity" | "bill" | "debt" | "subscription" | "buffer";
export type PlanFrequency = "daily" | "weekly" | "four-weekly" | "monthly" | "annual" | "custom";

export type MonthlyPlanItem = {
  id: string;
  name: string;
  amount: number;
  category: string;
  kind: PlanItemKind;
  frequency: PlanFrequency;
  active: boolean;
  includeInSafeToSpend?: boolean;
};

export function calculateSalaryBreakdown(input: {
  grossAnnual: number;
  takeHomeAnnual: number;
  pensionPercent: number;
  savingsPercent: number;
}) {
  const pensionAnnual = roundMoney(input.grossAnnual * (input.pensionPercent / 100));
  const savingsAnnual = roundMoney(input.takeHomeAnnual * (input.savingsPercent / 100));

  return {
    gross: toPeriods(input.grossAnnual),
    pension: toPeriods(pensionAnnual),
    takeHome: toPeriods(input.takeHomeAnnual),
    savings: toPeriods(savingsAnnual),
  };
}

export function normalisePlanAmount(item: MonthlyPlanItem) {
  if (!item.active) return 0;
  if (item.frequency === "daily") return roundMoney(item.amount * 365 / 12);
  if (item.frequency === "weekly") return roundMoney(item.amount * 52 / 12);
  if (item.frequency === "four-weekly") return roundMoney(item.amount * 13 / 12);
  if (item.frequency === "annual") return divideMoney(item.amount, 12);
  return roundMoney(item.amount);
}

export function buildMonthlyPlan(input: { takeHomeMonthly: number; items: MonthlyPlanItem[] }) {
  const items = input.items.map((item) => {
    const monthlyAmount = normalisePlanAmount(item);
    return {
      ...item,
      monthlyAmount,
      weeklyAmount: divideMoney(monthlyAmount, 4.33334),
      dailyAmount: divideMoney(divideMoney(monthlyAmount, 4.33334), 5),
      percentageOfTakeHome: input.takeHomeMonthly > 0 ? roundMoney((monthlyAmount / input.takeHomeMonthly) * 100) : 0,
    };
  });
  const monthlyTotal = roundMoney(items.reduce((sum, item) => sum + item.monthlyAmount, 0));
  const remainingMonthly = roundMoney(input.takeHomeMonthly - monthlyTotal);

  return {
    items,
    monthlyTotal,
    weeklyTotal: divideMoney(monthlyTotal, 4.33334),
    dailyTotal: divideMoney(divideMoney(monthlyTotal, 4.33334), 5),
    remainingMonthly,
    remainingWeekly: divideMoney(remainingMonthly, 4.33334),
    remainingDaily: divideMoney(divideMoney(remainingMonthly, 4.33334), 5),
    remainingPercent: input.takeHomeMonthly > 0 ? roundMoney((remainingMonthly / input.takeHomeMonthly) * 100) : 0,
  };
}

function toPeriods(annual: number) {
  const monthly = divideMoney(annual, 12);
  const weekly = divideMoney(monthly, 4.33334);
  return {
    annual: roundMoney(annual),
    monthly,
    weekly,
    daily: divideMoney(weekly, 5),
  };
}
