import type { Interval } from "../api/client";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const INTERVAL_MS: Record<Interval, number> = {
  minute: MINUTE,
  hour: HOUR,
  day: DAY,
};

export interface RangePreset {
  id: string;
  label: string;
  durationMs: number;
  interval: Interval;
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: "1h", label: "Last hour", durationMs: HOUR, interval: "minute" },
  { id: "24h", label: "24 hours", durationMs: DAY, interval: "hour" },
  { id: "7d", label: "7 days", durationMs: 7 * DAY, interval: "day" },
  { id: "30d", label: "30 days", durationMs: 30 * DAY, interval: "day" },
];

export type Filled<T> = { time: number } & Partial<T>;

/**
 * The API leaves out periods with no readings. Charts need those periods back as empty
 * buckets, otherwise a line would run straight across an outage as if it had readings.
 *
 * Buckets are aligned to the backend's local midnight, so the grid is anchored on a
 * bucket the API returned rather than on the requested start.
 */
export function fillGaps<T extends { timestamp: string }>(
  buckets: T[],
  start: Date,
  end: Date,
  interval: Interval,
): Filled<T>[] {
  if (buckets.length === 0) return [];

  const step = INTERVAL_MS[interval];
  const byTime = new Map(buckets.map((bucket) => [Date.parse(bucket.timestamp), bucket]));
  const anchor = Date.parse(buckets[0].timestamp);
  // The bucket holding the requested start, which the range only partly covers.
  const first = anchor - Math.ceil((anchor - start.getTime()) / step) * step;

  const filled: Filled<T>[] = [];
  for (let time = first; time < end.getTime(); time += step) {
    const bucket = byTime.get(time);
    filled.push({ time, ...(bucket ?? {}) } as Filled<T>);
  }
  return filled;
}
