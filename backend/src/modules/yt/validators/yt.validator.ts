import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === undefined
        ? 20
        : typeof val === "string"
        ? parseInt(val || "20", 10)
        : Number(val)
    ),
});

export const paginationSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === undefined
        ? 1
        : typeof val === "string"
        ? parseInt(val || "1", 10)
        : Number(val)
    ),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === undefined
        ? 20
        : typeof val === "string"
        ? parseInt(val || "20", 10)
        : Number(val)
    ),
});

export const idSchema = z.string().min(1, "Video ID is required");
