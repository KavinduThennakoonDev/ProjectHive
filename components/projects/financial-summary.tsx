import { calculateFinancials, type FinancialInput } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

function SummaryCard({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** The four large cards: Client Price - Developer Cost = Profit, and Profit %. */
export function FinancialSummary({ clientPrice, developerCost, advancePaid, className }: FinancialInput & { className?: string }) {
  const { profit, profitPercent } = calculateFinancials({ clientPrice, developerCost, advancePaid });
  const loss = profit < 0;

  return (
    <div className={cn("grid grid-cols-2 gap-4 xl:grid-cols-4", className)}>
      <SummaryCard label="Client Price" value={formatCurrency(clientPrice)} hint="What the client pays ProjectHive" />
      <SummaryCard label="Developer Cost" value={formatCurrency(developerCost)} hint="What ProjectHive pays the developer" />
      <SummaryCard
        label={loss ? "Loss" : "Profit"}
        value={formatCurrency(profit)}
        hint="Client Price − Developer Cost"
        className={loss ? "border-red-200 bg-red-50/50 text-red-700" : "border-emerald-200 bg-emerald-50/50 text-emerald-800"}
      />
      <SummaryCard label="Profit %" value={formatPercent(profitPercent)} hint="Profit ÷ Client Price" />
    </div>
  );
}
