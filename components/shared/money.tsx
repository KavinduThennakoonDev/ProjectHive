import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/** An LKR amount in tabular figures, e.g. "Rs. 25,000.00". */
export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn("whitespace-nowrap tabular-nums", className)}>{formatCurrency(amount)}</span>;
}

/** Profit is green, a loss is red. */
export function Profit({ amount, className }: { amount: number; className?: string }) {
  return (
    <Money
      amount={amount}
      className={cn("font-medium", amount < 0 ? "text-red-600" : "text-emerald-700", className)}
    />
  );
}
