import type { Interval } from "../api/client";

export const NO_VALUE = "—";

export function formatNumber(value: number | null | undefined, maxDigits = 2): string {
  if (value == null) return NO_VALUE;
  return value.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
}

export function formatAxisNumber(value: number): string {
  // A minute's energy is around 0.005 kWh, which two decimals would round away.
  if (Math.abs(value) < 1) return value.toLocaleString(undefined, { maximumSignificantDigits: 2 });
  return value.toLocaleString(undefined, {
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  });
}

export function formatMoney(value: number | null | undefined, currency?: string): string {
  if (value == null) return "Unpriced";
  // The currency comes from the backend, so show a bare number until it has loaded.
  if (!currency) return formatNumber(value);
  try {
    return value.toLocaleString(undefined, { style: "currency", currency });
  } catch {
    // CURRENCY in the backend's .env isn't an ISO code, e.g. "KSH".
    return `${formatNumber(value)} ${currency}`;
  }
}

const TIME: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
const DATE: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

export function formatTick(time: number, interval: Interval): string {
  return new Date(time).toLocaleString(undefined, interval === "day" ? DATE : TIME);
}

export function formatBucket(time: number, interval: Interval): string {
  return new Date(time).toLocaleString(undefined, interval === "day" ? DATE : { ...DATE, ...TIME });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { ...DATE, ...TIME });
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  return formatDateTime(iso);
}
