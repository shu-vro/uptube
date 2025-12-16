import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "20", 10)),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1", 10)),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "20", 10)),
});

export const idSchema = z.string().min(1, "Video ID is required");
