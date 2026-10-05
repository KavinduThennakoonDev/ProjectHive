import { CircleCheck, Clock, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ProjectStatus } from "@/lib/constants";
import { getDeadlineInfo, type DeadlineState } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<DeadlineState, { icon: LucideIcon | null; className: string }> = {
  overdue: { icon: TriangleAlert, className: "text-red-600" },
  today: { icon: Clock, className: "text-amber-600" },
  upcoming: { icon: Clock, className: "text-amber-600" },
  "on-track": { icon: CircleCheck, className: "text-emerald-600" },
  closed: { icon: null, className: "text-muted-foreground" },
};

interface DeadlineIndicatorProps {
  deadline: string;
  status: ProjectStatus;
  /** Hide the date and only show "2 days overdue", "Due tomorrow", etc. */
  labelOnly?: boolean;
  className?: string;
}

/** Shows a deadline with a coloured "5 days remaining" / "2 days overdue" note. */
export function DeadlineIndicator({ deadline, status, labelOnly = false, className }: DeadlineIndicatorProps) {
  const info = getDeadlineInfo(deadline, status);
  const { icon: Icon, className: stateClassName } = STATE_STYLES[info.state];

  const label = info.state !== "closed" && (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap", stateClassName)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {info.label}
    </span>
  );

  if (labelOnly) return label || <span className="text-xs text-muted-foreground">{info.label}</span>;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="whitespace-nowrap">{formatDate(deadline)}</span>
      {label}
    </div>
  );
}
