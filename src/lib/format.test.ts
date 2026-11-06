import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("uses the currency from the backend", () => {
    expect(formatMoney(1500, "UGX")).toMatch(/UGX|USh/);
  });

  it("never assumes a currency before the backend has sent one", () => {
    expect(formatMoney(1500)).toBe((1500).toLocaleString());
  });

  it("falls back to the plain code when it isn't a valid ISO currency", () => {
    expect(formatMoney(2, "Shillings")).toBe(`${(2).toLocaleString()} Shillings`);
  });

  it("marks a missing cost as unpriced", () => {
    expect(formatMoney(null, "UGX")).toBe("Unpriced");
  });
});
