import { describe, it, expect } from "vitest";
import {
  paginationSchema,
  videoIdSchema,
  bookmarkIdSchema,
  bookmarkIdVideoIdSchema,
  createBookmarkSchema,
  renameBookmarkSchema,
  recordHistorySchema,
} from "../../src/modules/library/validators/library.validator";

describe("library paginationSchema", () => {
  it("uses defaults and caps limit at 20", () => {
    const parsed = paginationSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  it("parses string values", () => {
    const parsed = paginationSchema.parse({ page: "3", limit: "10" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(10);
  });

  it("caps oversized limits", () => {
    const parsed = paginationSchema.parse({ page: 1, limit: 99 });
    expect(parsed.limit).toBe(20);
  });
});

describe("library id schemas", () => {
  it("validates videoIdSchema", () => {
    expect(videoIdSchema.safeParse({ videoId: "abc" }).success).toBe(true);
    expect(videoIdSchema.safeParse({ videoId: "" }).success).toBe(false);
  });

  it("validates bookmarkIdSchema", () => {
    expect(bookmarkIdSchema.safeParse({ id: "b1" }).success).toBe(true);
    expect(bookmarkIdSchema.safeParse({ id: "" }).success).toBe(false);
  });

  it("validates bookmarkIdVideoIdSchema", () => {
    expect(
      bookmarkIdVideoIdSchema.safeParse({ id: "b1", videoId: "v1" }).success,
    ).toBe(true);
    expect(bookmarkIdVideoIdSchema.safeParse({ id: "b1", videoId: "" }).success).toBe(
      false,
    );
  });
});

describe("library payload schemas", () => {
  it("validates createBookmarkSchema and renameBookmarkSchema", () => {
    expect(createBookmarkSchema.safeParse({ name: "My list" }).success).toBe(true);
    expect(renameBookmarkSchema.safeParse({ name: "Renamed" }).success).toBe(true);
    expect(createBookmarkSchema.safeParse({ name: "" }).success).toBe(false);
    expect(renameBookmarkSchema.safeParse({ name: "a".repeat(101) }).success).toBe(
      false,
    );
  });

  it("validates recordHistorySchema", () => {
    expect(recordHistorySchema.safeParse({ videoId: "vid123" }).success).toBe(true);
    expect(recordHistorySchema.safeParse({ videoId: "" }).success).toBe(false);
  });
});
