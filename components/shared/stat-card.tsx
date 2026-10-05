import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatTone = "default" | "blue" | "green" | "amber" | "red";

const ICON_TONES: Record<StatTone, string> = {
  default: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: React.ReactNode;
  /** Draws attention to the card, e.g. when there are overdue projects. */
  highlight?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "default", hint, highlight, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border bg-card p-4",
        highlight && "border-red-200 bg-red-50/40",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", ICON_TONES[tone])}>
        <Icon className="size-4.5" aria-hidden />
      </div>
    </div>
  );
}
