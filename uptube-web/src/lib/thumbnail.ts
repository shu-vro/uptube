import type { Video } from "@/types/prisma";

export function getVideoThumbnailUrl(
  video?: { thumbnails?: Video["thumbnails"] } | null,
) {
  if (!video?.thumbnails?.length) return undefined;
  const sorted = [...video.thumbnails].sort(
    (a, b) => (b?.width || 0) - (a?.width || 0),
  );
  return sorted[0]?.url;
}
