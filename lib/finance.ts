import type { PaymentStatus } from "@/lib/constants";

export interface FinancialInput {
  clientPrice: number;
  developerCost: number;
  advancePaid: number;
}

export interface Financials {
  /** Client Price - Developer Cost */
  profit: number;
  /** (Profit / Client Price) * 100, or 0 when there is no client price. */
  profitPercent: number;
  /** Client Price - Advance Paid */
  remainingAmount: number;
}

/** Rounds to 2 decimal places, avoiding binary floating point drift. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateFinancials({ clientPrice, developerCost, advancePaid }: FinancialInput): Financials {
  const profit = roundMoney(clientPrice - developerCost);
  const profitPercent = clientPrice > 0 ? roundMoney((profit / clientPrice) * 100) : 0;
  const remainingAmount = roundMoney(Math.max(clientPrice - advancePaid, 0));
  return { profit, profitPercent, remainingAmount };
}

/** Payment status always follows the amounts, unless the project was refunded. */
export function derivePaymentStatus(clientPrice: number, advancePaid: number, refunded: boolean): PaymentStatus {
  if (refunded) return "REFUNDED";
  if (advancePaid <= 0) return "PENDING";
  if (advancePaid < clientPrice) return "PARTIALLY_PAID";
  return "FULLY_PAID";
}
