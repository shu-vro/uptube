import { describe, it, expect } from "vitest";
import { parseDurationToSeconds } from "../../src/utils/yt/parseDurationToSeconds";

describe("parseDurationToSeconds", () => {
  describe("null/undefined/empty handling", () => {
    it("returns null for null", () => {
      expect(parseDurationToSeconds(null)).toBeNull();
    });

    it("returns null for undefined", () => {
      expect(parseDurationToSeconds(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseDurationToSeconds("")).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(parseDurationToSeconds("   ")).toBeNull();
    });
  });

  describe("h/m/s format", () => {
    it("parses hours only", () => {
      expect(parseDurationToSeconds("2h")).toBe(7200);
    });

    it("parses minutes only", () => {
      expect(parseDurationToSeconds("45m")).toBe(2700);
    });

    it("parses seconds only", () => {
      expect(parseDurationToSeconds("30s")).toBe(30);
    });

    it("parses full hms", () => {
      expect(parseDurationToSeconds("1h2m3s")).toBe(3723);
    });

    it("parses hours and minutes", () => {
      expect(parseDurationToSeconds("1h30m")).toBe(5400);
    });

    it("parses minutes and seconds", () => {
      expect(parseDurationToSeconds("5m30s")).toBe(330);
    });

    it("parses with spaces between components", () => {
      expect(parseDurationToSeconds("1h 2m 3s")).toBe(3723);
    });

    it("parses with 'hours', 'minutes', 'seconds' words", () => {
      expect(parseDurationToSeconds("1hours 2minutes 3seconds")).toBe(3723);
    });

    it("parses with 'hour', 'min', 'sec' words", () => {
      expect(parseDurationToSeconds("1hour 2min 3sec")).toBe(3723);
    });
  });

  describe("colon-separated format (MM:SS, HH:MM:SS)", () => {
    it("parses MM:SS", () => {
      expect(parseDurationToSeconds("5:30")).toBe(330);
    });

    it("parses HH:MM:SS", () => {
      expect(parseDurationToSeconds("1:02:03")).toBe(3723);
    });

    it("parses 0:00", () => {
      expect(parseDurationToSeconds("0:00")).toBe(0);
    });

    it("parses 0:30", () => {
      expect(parseDurationToSeconds("0:30")).toBe(30);
    });

    it("parses 10:00", () => {
      expect(parseDurationToSeconds("10:00")).toBe(600);
    });

    it("parses 1:00:00", () => {
      expect(parseDurationToSeconds("1:00:00")).toBe(3600);
    });
  });

  describe("plain numeric", () => {
    it("parses plain number as seconds", () => {
      expect(parseDurationToSeconds("120")).toBe(120);
    });

    it("parses 0", () => {
      expect(parseDurationToSeconds("0")).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles leading/trailing whitespace", () => {
      expect(parseDurationToSeconds("  5:30  ")).toBe(330);
    });

    it("handles large values", () => {
      expect(parseDurationToSeconds("100:00:00")).toBe(360000);
    });
  });
});
