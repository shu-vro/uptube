import { describe, it, expect } from "vitest";
import {
  searchQuerySchema,
  paginationSchema,
  idSchema,
  updateDislikesSchema,
  downloadVideoSchema,
  downloadVideoQualityOptionsSchema,
} from "../../src/modules/yt/validators/yt.validator";

describe("searchQuerySchema", () => {
  it("validates a valid search query", () => {
    const result = searchQuerySchema.safeParse({ q: "typescript tutorial" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("typescript tutorial");
      expect(result.data.limit).toBe(20); // default
    }
  });

  it("validates with custom limit as string", () => {
    const result = searchQuerySchema.safeParse({ q: "react", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("validates with custom limit as number", () => {
    const result = searchQuerySchema.safeParse({ q: "vue", limit: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(5);
    }
  });

  it("fails for empty query", () => {
    const result = searchQuerySchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("fails for missing query", () => {
    const result = searchQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("defaults limit to 20 when undefined", () => {
    const result = searchQuerySchema.safeParse({ q: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("handles limit as '0' string", () => {
    const result = searchQuerySchema.safeParse({ q: "test", limit: "0" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(0);
    }
  });
});

describe("paginationSchema", () => {
  it("uses defaults when no params provided", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("parses page and limit as strings", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "15" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(15);
    }
  });

  it("parses page and limit as numbers", () => {
    const result = paginationSchema.safeParse({ page: 2, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("handles page '0' string", () => {
    const result = paginationSchema.safeParse({ page: "0" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(0);
    }
  });
});

describe("idSchema", () => {
  it("validates a non-empty string", () => {
    const result = idSchema.safeParse("dQw4w9WgXcQ");
    expect(result.success).toBe(true);
  });

  it("fails for empty string", () => {
    const result = idSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Video ID is required");
    }
  });

  it("validates long string", () => {
    const result = idSchema.safeParse("a".repeat(100));
    expect(result.success).toBe(true);
  });

  it("fails for non-string types", () => {
    const result = idSchema.safeParse(123);
    expect(result.success).toBe(false);
  });

  it("fails for null", () => {
    const result = idSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("fails for undefined", () => {
    const result = idSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });
});

describe("updateDislikesSchema", () => {
  it("validates valid input", () => {
    const result = updateDislikesSchema.safeParse({
      video_id: "abc123",
      dislike_count: 42,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.video_id).toBe("abc123");
      expect(result.data.dislike_count).toBe(42);
    }
  });

  it("transforms string dislike_count to number", () => {
    const result = updateDislikesSchema.safeParse({
      video_id: "abc123",
      dislike_count: "100",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dislike_count).toBe(100);
    }
  });

  it("clamps negative dislike_count to 0", () => {
    const result = updateDislikesSchema.safeParse({
      video_id: "abc123",
      dislike_count: -5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dislike_count).toBe(0);
    }
  });

  it("clamps negative string dislike_count to 0", () => {
    const result = updateDislikesSchema.safeParse({
      video_id: "abc123",
      dislike_count: "-10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dislike_count).toBe(0);
    }
  });

  it("fails for empty video_id", () => {
    const result = updateDislikesSchema.safeParse({
      video_id: "",
      dislike_count: 1,
    });
    expect(result.success).toBe(false);
  });

  it("fails for missing video_id", () => {
    const result = updateDislikesSchema.safeParse({ dislike_count: 1 });
    expect(result.success).toBe(false);
  });

  it("fails for missing dislike_count", () => {
    const result = updateDislikesSchema.safeParse({ video_id: "abc" });
    expect(result.success).toBe(false);
  });

  it("handles zero dislike_count", () => {
    const result = updateDislikesSchema.safeParse({
      video_id: "abc",
      dislike_count: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dislike_count).toBe(0);
    }
  });
});

describe("downloadVideoSchema", () => {
  it("validates valid video_id", () => {
    const result = downloadVideoSchema.safeParse({ video_id: "dQw4w9WgXcQ" });
    expect(result.success).toBe(true);
  });

  it("fails for empty video_id", () => {
    const result = downloadVideoSchema.safeParse({ video_id: "" });
    expect(result.success).toBe(false);
  });

  it("fails for missing video_id", () => {
    const result = downloadVideoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("downloadVideoQualityOptionsSchema", () => {
  it("validates empty object (all optional)", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates with quality", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({
      quality: "720p",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quality).toBe("720p");
    }
  });

  it("validates with itag as string (coerced to number)", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({
      itag: "18",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.itag).toBe(18);
    }
  });

  it("validates with itag as number", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({ itag: 303 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.itag).toBe(303);
    }
  });

  it("validates type enum values", () => {
    for (const type of ["video", "audio", "video+audio"]) {
      const result = downloadVideoQualityOptionsSchema.safeParse({ type });
      expect(result.success).toBe(true);
    }
  });

  it("fails for invalid type value", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("validates all options together", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({
      quality: "360p",
      itag: 18,
      type: "video+audio",
      language: "en",
      format: "mp4",
      codec: "h264",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quality).toBe("360p");
      expect(result.data.itag).toBe(18);
      expect(result.data.type).toBe("video+audio");
      expect(result.data.language).toBe("en");
      expect(result.data.format).toBe("mp4");
      expect(result.data.codec).toBe("h264");
    }
  });

  it("accepts language as optional", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({
      language: "ja",
    });
    expect(result.success).toBe(true);
  });

  it("accepts format as optional", () => {
    const result = downloadVideoQualityOptionsSchema.safeParse({
      format: "webm",
    });
    expect(result.success).toBe(true);
  });
});
