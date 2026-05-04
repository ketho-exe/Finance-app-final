import { roundMoney } from "@/lib/money";

export type ReconciliationStatus = "matched" | "needs_review" | "open";

export function calculateReconciliation(input: {
  appBalance: number;
  bankBalance: number;
  moneyInAfterDate: number;
  moneyOutAfterDate: number;
  bufferAmount: number;
  tolerance?: number;
}) {
  const expectedBalance = roundMoney(input.bankBalance + input.moneyOutAfterDate - input.moneyInAfterDate);
  const difference = roundMoney(input.appBalance - expectedBalance);
  const tolerance = input.tolerance ?? 0.01;
  const status: ReconciliationStatus = Math.abs(difference) <= tolerance ? "matched" : "needs_review";

  return {
    expectedBalance,
    difference,
    status,
    bufferAmount: input.bufferAmount,
  };
}
