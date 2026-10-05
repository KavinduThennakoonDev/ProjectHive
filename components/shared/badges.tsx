import { Badge } from "@/components/ui/badge";
import {
  DEVELOPER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  type DeveloperStatus,
  type PaymentStatus,
  type Priority,
  type ProjectStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tone = "slate" | "blue" | "indigo" | "violet" | "amber" | "orange" | "green" | "red" | "gray";

const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  slate: { badge: "border-slate-200 bg-slate-50 text-slate-700", dot: "bg-slate-500" },
  blue: { badge: "border-blue-200 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  indigo: { badge: "border-indigo-200 bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  violet: { badge: "border-violet-200 bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  amber: { badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  orange: { badge: "border-orange-200 bg-orange-50 text-orange-800", dot: "bg-orange-500" },
  green: { badge: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  red: { badge: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
  gray: { badge: "border-zinc-200 bg-zinc-100 text-zinc-600", dot: "bg-zinc-400" },
};

function ToneBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", TONE_CLASSES[tone].badge, className)}>
      <span className={cn("size-1.5 rounded-full", TONE_CLASSES[tone].dot)} aria-hidden />
      {children}
    </Badge>
  );
}

const PROJECT_STATUS_TONES: Record<ProjectStatus, Tone> = {
  NEW: "slate",
  ASSIGNED: "blue",
  IN_PROGRESS: "indigo",
  REVIEW: "violet",
  CLIENT_REVIEW: "amber",
  REVISION: "orange",
  COMPLETED: "green",
  CANCELLED: "gray",
};

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <ToneBadge tone={PROJECT_STATUS_TONES[status]} className={className}>
      {PROJECT_STATUS_LABELS[status]}
    </ToneBadge>
  );
}

const PAYMENT_STATUS_TONES: Record<PaymentStatus, Tone> = {
  PENDING: "slate",
  PARTIALLY_PAID: "amber",
  FULLY_PAID: "green",
  REFUNDED: "red",
};

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <ToneBadge tone={PAYMENT_STATUS_TONES[status]} className={className}>
      {PAYMENT_STATUS_LABELS[status]}
    </ToneBadge>
  );
}

const PRIORITY_TONES: Record<Priority, Tone> = {
  LOW: "gray",
  MEDIUM: "blue",
  HIGH: "orange",
  URGENT: "red",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <ToneBadge tone={PRIORITY_TONES[priority]} className={className}>
      {PRIORITY_LABELS[priority]}
    </ToneBadge>
  );
}

export function DeveloperStatusBadge({ status, className }: { status: DeveloperStatus; className?: string }) {
  return (
    <ToneBadge tone={status === "ACTIVE" ? "green" : "gray"} className={className}>
      {DEVELOPER_STATUS_LABELS[status]}
    </ToneBadge>
  );
}
