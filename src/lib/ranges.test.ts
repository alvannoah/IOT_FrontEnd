import { describe, expect, it } from "vitest";
import { fillGaps } from "./ranges";

const at = (iso: string) => ({ timestamp: iso, value: 1 });

describe("fillGaps", () => {
  it("returns nothing when there are no readings at all", () => {
    expect(fillGaps([], new Date("2026-11-01T00:00:00Z"), new Date("2026-11-02T00:00:00Z"), "hour")).toEqual([]);
  });

  it("adds empty buckets for missing periods in the middle and at both edges", () => {
    const filled = fillGaps(
      [at("2026-11-01T01:00:00Z"), at("2026-11-01T03:00:00Z")],
      new Date("2026-11-01T00:00:00Z"),
      new Date("2026-11-01T05:00:00Z"),
      "hour",
    );

    expect(filled.map((bucket) => new Date(bucket.time).getUTCHours())).toEqual([0, 1, 2, 3, 4]);
    expect(filled.map((bucket) => "value" in bucket)).toEqual([false, true, false, true, false]);
  });

  it("keeps a partial first bucket that the API returned", () => {
    const filled = fillGaps(
      [at("2026-11-01T10:00:00Z")],
      new Date("2026-11-01T10:30:00Z"),
      new Date("2026-11-01T12:30:00Z"),
      "hour",
    );

    expect(filled.map((bucket) => new Date(bucket.time).getUTCHours())).toEqual([10, 11, 12]);
    expect("value" in filled[0]).toBe(true);
  });

  it("anchors day buckets on the backend's local midnight, not on UTC midnight", () => {
    // UTC+3: local midnight is 21:00 UTC the day before.
    const filled = fillGaps(
      [at("2026-11-02T21:00:00Z")],
      new Date("2026-11-01T12:00:00Z"),
      new Date("2026-11-04T12:00:00Z"),
      "day",
    );

    expect(filled.map((bucket) => new Date(bucket.time).toISOString())).toEqual([
      "2026-10-31T21:00:00.000Z",
      "2026-11-01T21:00:00.000Z",
      "2026-11-02T21:00:00.000Z",
      "2026-11-03T21:00:00.000Z",
    ]);
  });
});
