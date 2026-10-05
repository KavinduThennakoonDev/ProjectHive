import { APP_TIME_ZONE, CLOSED_STATUSES, UPCOMING_DEADLINE_DAYS, type ProjectStatus } from "@/lib/constants";

// Start dates and deadlines are calendar dates with no time of day. They are
// stored as UTC midnight, and "today" is the current calendar date in Sri Lanka.

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** "2026-10-05" -> Date at UTC midnight. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date -> "2026-10-05", for <input type="date"> values. */
export function toDateOnly(value: string | Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

/** Today's calendar date in Sri Lanka, as UTC midnight. */
export function today(now: Date = new Date()): Date {
  const dateOnly = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(now);
  return parseDateOnly(dateOnly);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Whole days from today until the deadline. Negative when the deadline has passed. */
export function daysUntil(deadline: string | Date, now: Date = new Date()): number {
  return Math.round((new Date(deadline).getTime() - today(now).getTime()) / DAY_MS);
}

export type DeadlineState = "closed" | "overdue" | "today" | "upcoming" | "on-track";

export interface DeadlineInfo {
  state: DeadlineState;
  days: number;
  label: string;
}

export function getDeadlineInfo(deadline: string | Date, status: ProjectStatus, now: Date = new Date()): DeadlineInfo {
  const days = daysUntil(deadline, now);
  const plural = (count: number) => `${count} day${count === 1 ? "" : "s"}`;

  if (CLOSED_STATUSES.includes(status)) {
    return { state: "closed", days, label: status === "COMPLETED" ? "Completed" : "Cancelled" };
  }
  if (days < 0) return { state: "overdue", days, label: `${plural(-days)} overdue` };
  if (days === 0) return { state: "today", days, label: "Due today" };
  if (days === 1) return { state: "upcoming", days, label: "Due tomorrow" };
  if (days <= UPCOMING_DEADLINE_DAYS) return { state: "upcoming", days, label: `Due in ${plural(days)}` };
  return { state: "on-track", days, label: `${plural(days)} remaining` };
}
