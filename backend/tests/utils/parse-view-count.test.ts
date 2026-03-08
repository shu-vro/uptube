import { describe, it, expect } from "vitest";
import { parseViewCount } from "../../src/utils/yt/parseViewCount";

describe("parseViewCount", () => {
  describe("null/empty handling", () => {
    it("returns null for empty string", () => {
      expect(parseViewCount("")).toBeNull();
    });

    it("returns null for null-like input (cast)", () => {
      expect(parseViewCount(null as any)).toBeNull();
    });
  });

  describe("no views", () => {
    it('returns 0 for "no views"', () => {
      expect(parseViewCount("no views")).toBe(0);
    });

    it('returns 0 for "No Views"', () => {
      expect(parseViewCount("No Views")).toBe(0);
    });

    it('returns 0 for "No view"', () => {
      expect(parseViewCount("No view")).toBe(0);
    });
  });

  describe("plain numbers", () => {
    it("parses simple number", () => {
      expect(parseViewCount("1234")).toBe(1234);
    });

    it("parses number with commas", () => {
      expect(parseViewCount("1,234,567")).toBe(1234567);
    });

    it('parses "0"', () => {
      expect(parseViewCount("0")).toBe(0);
    });

    it('parses "1234 views"', () => {
      expect(parseViewCount("1234 views")).toBe(1234);
    });

    it('parses "1,000 views"', () => {
      expect(parseViewCount("1,000 views")).toBe(1000);
    });
  });

  describe("k/m/b/t suffixes", () => {
    it('parses "1.5K"', () => {
      expect(parseViewCount("1.5K")).toBe(1500);
    });

    it('parses "2.3M views"', () => {
      expect(parseViewCount("2.3M views")).toBe(2300000);
    });

    it('parses "1B"', () => {
      expect(parseViewCount("1B")).toBe(1000000000);
    });

    it('parses "1T"', () => {
      expect(parseViewCount("1T")).toBe(1000000000000);
    });

    it('parses "10k"', () => {
      expect(parseViewCount("10k")).toBe(10000);
    });

    it('parses "500k views"', () => {
      expect(parseViewCount("500k views")).toBe(500000);
    });

    it('parses "1.23m"', () => {
      expect(parseViewCount("1.23m")).toBe(1230000);
    });

    it("rounds correctly for floating point", () => {
      expect(parseViewCount("1.1k")).toBe(1100);
    });

    it('parses "3.7b"', () => {
      expect(parseViewCount("3.7b")).toBe(3700000000);
    });
  });

  describe("edge cases", () => {
    it("returns null for garbage text", () => {
      expect(parseViewCount("hello world")).toBeNull();
    });

    it("handles non-breaking spaces", () => {
      // parseViewCount stops at first non-numeric, non-dot character
      // \u00A0 is non-breaking space - the function treats it as a separator and only parses the first part
      expect(parseViewCount("1\u00A0234")).toBe(1);
    });

    it('parses "0 views"', () => {
      expect(parseViewCount("0 views")).toBe(0);
    });
  });
});
