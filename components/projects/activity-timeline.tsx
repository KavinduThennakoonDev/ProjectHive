import {
  CircleCheck,
  CreditCard,
  FilePlus2,
  Pencil,
  RefreshCw,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { ACTIVITY_ACTION_LABELS, type ActivityAction } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { ProjectActivityDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTION_STYLES: Record<ActivityAction, { icon: LucideIcon; className: string }> = {
  PROJECT_CREATED: { icon: FilePlus2, className: "bg-slate-100 text-slate-600" },
  PROJECT_UPDATED: { icon: Pencil, className: "bg-slate-100 text-slate-600" },
  DEVELOPER_ASSIGNED: { icon: UserRoundCheck, className: "bg-blue-50 text-blue-600" },
  STATUS_CHANGED: { icon: RefreshCw, className: "bg-indigo-50 text-indigo-600" },
  PAYMENT_UPDATED: { icon: CreditCard, className: "bg-amber-50 text-amber-600" },
  PROJECT_COMPLETED: { icon: CircleCheck, className: "bg-emerald-50 text-emerald-600" },
};

/** The project's history, newest first. */
export function ActivityTimeline({ activities }: { activities: ProjectActivityDTO[] }) {
  if (activities.length === 0) {
    return <EmptyState title="No activity yet" className="py-8" />;
  }

  return (
    <ol className="space-y-0">
      {activities.map((activity, index) => {
        const { icon: Icon, className } = ACTION_STYLES[activity.action];
        const isLast = index === activities.length - 1;
        return (
          <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span className="absolute top-8 bottom-0 left-4 w-px bg-border" aria-hidden />}
            <span className={cn("z-10 flex size-8 shrink-0 items-center justify-center rounded-full", className)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium">{ACTIVITY_ACTION_LABELS[activity.action]}</p>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <time dateTime={activity.createdAt} className="text-xs text-muted-foreground">
                {formatDateTime(activity.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
