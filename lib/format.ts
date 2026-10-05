import { APP_TIME_ZONE } from "@/lib/constants";

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an LKR amount as "Rs. 25,000.00". */
export function formatCurrency(amount: number): string {
  const formatted = amountFormatter.format(Math.abs(amount));
  return amount < 0 ? `-Rs. ${formatted}` : `Rs. ${formatted}`;
}

export function formatPercent(value: number): string {
  return `${Number(value.toFixed(1))}%`;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a date-only value (stored as UTC midnight), e.g. "05 Oct 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: APP_TIME_ZONE,
});

/** Formats a timestamp in Sri Lanka time, e.g. "05 Oct 2026, 10:30 am". */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}
