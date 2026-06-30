import useSWR from "swr";
import { get } from "@/lib/api";

export const INITIAL_PLAYBACK_QUALITY = "720p";

export type PlayUrls = {
  video_fmt?: { url?: string };
  audio_fmt?: { url?: string } | null;
  is_muxed_fallback?: boolean;
};

const sessionPlayUrlCache = new Map<string, PlayUrls>();

function cacheKey(videoId: string, quality: string) {
  return `${videoId}:${quality}`;
}

export function normalizeVideoId(
  videoId?: string | string[],
): string | undefined {
  if (!videoId) return undefined;
  const id = Array.isArray(videoId) ? videoId[0] : videoId;
  return id?.trim() || undefined;
}

export function playUrlsSwrKey(videoId: string, quality: string) {
  return [`/download/video-audio/separate/${videoId}`, quality] as [
    string,
    string,
  ];
}

async function fetchPlayUrls([url, quality]: [
  string,
  string,
]): Promise<PlayUrls | null> {
  const videoId = url.split("/").pop() || "";
  const key = cacheKey(videoId, quality);
  const cached = sessionPlayUrlCache.get(key);
  if (cached?.video_fmt?.url) return cached;

  const result = (await get({
    endpoint: url,
    params: { quality },
    baseUrl: "/download-api/v1",
  })) as PlayUrls | null;

  if (!result?.video_fmt?.url) return null;
  sessionPlayUrlCache.set(key, result);
  return result;
}

export function usePlayUrls(
  videoId?: string | string[],
  quality = INITIAL_PLAYBACK_QUALITY,
) {
  const id = normalizeVideoId(videoId);
  const swrKey = id ? playUrlsSwrKey(id, quality) : null;

  return useSWR<PlayUrls | null>(swrKey, fetchPlayUrls, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });
}

export function prefetchPlayUrls(
  videoId: string,
  quality = INITIAL_PLAYBACK_QUALITY,
) {
  return fetchPlayUrls(playUrlsSwrKey(videoId, quality));
}
