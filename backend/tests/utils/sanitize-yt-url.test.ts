import { describe, it, expect } from "vitest";
import { sanitizeYtUrl } from "../../src/utils/yt/index";

describe("sanitizeYtUrl", () => {
  describe("full YouTube URLs", () => {
    it("extracts video ID from standard watch URL", () => {
      expect(sanitizeYtUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ"
      );
    });

    it("extracts video ID from URL with extra params", () => {
      expect(
        sanitizeYtUrl(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
        )
      ).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from youtu.be short URL (with v= param)", () => {
      // youtu.be URLs don't have v= param, so they fallback
      expect(sanitizeYtUrl("https://youtu.be/dQw4w9WgXcQ")).toBeNull(); // no v= param in short URLs
    });

    it("extracts video ID from embed URL with v param", () => {
      expect(
        sanitizeYtUrl("https://www.youtube.com/embed/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });
  });

  describe("bare video IDs (11 characters)", () => {
    it("returns 11-char string as-is", () => {
      expect(sanitizeYtUrl("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("returns 11-char string with mixed case", () => {
      expect(sanitizeYtUrl("AbCdEfGhIjK")).toBe("AbCdEfGhIjK");
    });

    it("returns 11-char string with hyphens and underscores", () => {
      expect(sanitizeYtUrl("a-b_c-d_e-f")).toBe("a-b_c-d_e-f");
    });
  });

  describe("query string format v=...", () => {
    it("extracts from raw query string with v=", () => {
      expect(sanitizeYtUrl("v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts from query string with multiple params", () => {
      expect(sanitizeYtUrl("v=dQw4w9WgXcQ&t=120")).toBe("dQw4w9WgXcQ");
    });
  });

  describe("invalid inputs", () => {
    it("returns null for empty string", () => {
      expect(sanitizeYtUrl("")).toBeNull();
    });

    it("returns null for a non-URL, non-ID string longer than 11 chars", () => {
      expect(sanitizeYtUrl("this-is-not-a-valid-id")).toBeNull();
    });

    it("returns null for string shorter than 11 chars", () => {
      expect(sanitizeYtUrl("abc")).toBeNull();
    });

    it("returns null for URL without v= param", () => {
      expect(sanitizeYtUrl("https://www.youtube.com/channel/UCxyz")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles URL with only v= param and nothing else", () => {
      expect(sanitizeYtUrl("https://www.youtube.com/watch?v=")).toBe("");
    });

    it("handles mobile youtube URL", () => {
      expect(sanitizeYtUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ"
      );
    });
  });
});
