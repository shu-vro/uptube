import { describe, it, expect } from "vitest";
import { differenceInDays } from "../../src/utils/time";

describe("differenceInDays", () => {
  it("returns 0 for the same date", () => {
    const date = "2025-06-15T12:00:00Z";
    expect(differenceInDays(date, date)).toBe(0);
  });

  it("returns positive days when a > b", () => {
    const a = "2025-06-20T00:00:00Z";
    const b = "2025-06-15T00:00:00Z";
    expect(differenceInDays(a, b)).toBe(5);
  });

  it("returns negative days when a < b", () => {
    const a = "2025-06-10T00:00:00Z";
    const b = "2025-06-15T00:00:00Z";
    // Math.ceil(-5) = -5
    expect(differenceInDays(a, b)).toBe(-5);
  });

  it("rounds up partial days (a is slightly ahead)", () => {
    const a = "2025-06-16T01:00:00Z"; // 1 day + 1 hour
    const b = "2025-06-15T00:00:00Z";
    expect(differenceInDays(a, b)).toBe(2); // Math.ceil(1.04...) = 2
  });

  it("rounds up partial days (a is slightly behind full day)", () => {
    const a = "2025-06-15T23:00:00Z"; // 23 hours
    const b = "2025-06-15T00:00:00Z";
    expect(differenceInDays(a, b)).toBe(1); // Math.ceil(0.95...) = 1
  });

  it("handles dates across months", () => {
    const a = "2025-07-05T00:00:00Z";
    const b = "2025-06-25T00:00:00Z";
    expect(differenceInDays(a, b)).toBe(10);
  });

  it("handles dates across years", () => {
    const a = "2026-01-01T00:00:00Z";
    const b = "2025-12-31T00:00:00Z";
    expect(differenceInDays(a, b)).toBe(1);
  });

  it("handles leap year date", () => {
    const a = "2024-03-01T00:00:00Z";
    const b = "2024-02-28T00:00:00Z";
    expect(differenceInDays(a, b)).toBe(2); // leap year: Feb has 29 days
  });

  it("handles non-leap year date", () => {
    const a = "2025-03-01T00:00:00Z";
    const b = "2025-02-28T00:00:00Z";
    expect(differenceInDays(a, b)).toBe(1);
  });

  it("returns NaN for invalid date strings", () => {
    expect(differenceInDays("not-a-date", "2025-06-15T00:00:00Z")).toBeNaN();
  });

  it("returns NaN for epoch timestamps as strings", () => {
    // differenceInDays uses new Date(string) which doesn't parse epoch timestamp strings
    const a = String(new Date("2025-06-20T00:00:00Z").getTime());
    const b = "2025-06-15T00:00:00Z";
    expect(differenceInDays(a, b)).toBeNaN();
  });
});
