import { Video } from '@/types/prisma';

export function getVideoThumbnailUrl(video?: Pick<Video, 'thumbnails'> | null) {
  if (!video?.thumbnails?.length) return undefined;
  const sorted = [...video.thumbnails].sort((a, b) => (a?.width || 0) - (b?.width || 0));
  return sorted[Math.min(sorted.length - 1, 1)]?.url;
}
