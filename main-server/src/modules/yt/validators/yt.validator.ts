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
          : Number(val),
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
          : Number(val),
    ),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === undefined
        ? 20
        : typeof val === "string"
          ? parseInt(val || "20", 10)
          : Number(val),
    ),
});

export const idSchema = z.string().min(1, "Video ID is required");

export const channelIdSchema = z
  .string()
  .min(1, "Channel ID is required")
  .regex(/^UC[\w-]{22}$/, "Invalid channel ID");

export const creatorPageQuerySchema = z.object({
  id: channelIdSchema,
  cursor: z.string().min(1).optional(),
});

export const updateDislikesSchema = z.object({
  video_id: idSchema,
  dislike_count: z
    .union([z.string(), z.number()])
    .transform((val) =>
      Math.max(typeof val === "string" ? parseInt(val, 10) : Number(val), 0),
    ),
});

export const downloadVideoSchema = z.object({
  video_id: idSchema,
});

export const downloadVideoQualityOptionsSchema = z.object({
  quality: z.string().optional(),
  itag: z.coerce.number().optional(),
  type: z.enum(["video", "audio", "video+audio"]).optional(),
  language: z.string().optional(),
  format: z.string().optional(),
  codec: z.string().optional(),
  // range: z
  //   .object({
  //     start: z
  //       .number()
  //       .min(0, "Range start must be a non-negative integer")
  //       .default(0),
  //     end: z
  //       .number()
  //       .min(0, "Range end must be a non-negative integer")
  //       .default(0),
  //   })
  //   .refine((data) => data.end >= data.start, {
  //     message: "Range end must be greater than or equal to start",
  //     path: ["end"],
  //   })
  // .optional(),
});
