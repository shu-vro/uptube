import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === undefined
        ? 1
        : typeof val === "string"
          ? parseInt(val || "1", 10)
          : Number(val),
    ),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      Math.min(
        20,
        val === undefined
          ? 20
          : typeof val === "string"
            ? parseInt(val || "20", 10)
            : Number(val),
      ),
    ),
});

export const videoIdSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
});

export const bookmarkIdSchema = z.object({
  id: z.string().min(1, "Bookmark ID is required"),
});

export const bookmarkIdVideoIdSchema = z.object({
  id: z.string().min(1, "Bookmark ID is required"),
  videoId: z.string().min(1, "Video ID is required"),
});

export const createBookmarkSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const renameBookmarkSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const recordHistorySchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
});
