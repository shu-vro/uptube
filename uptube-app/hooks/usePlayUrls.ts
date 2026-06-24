import useSWR, { mutate } from 'swr';
import Constants from 'expo-constants';
import { get } from '@/lib/utils/fetch';

/** Default quality for first paint — download server falls back to ≤720p if unavailable. */
export const INITIAL_PLAYBACK_QUALITY = '720p';

export type PlayUrls = {
  video_fmt?: { url?: string };
  audio_fmt?: { url?: string } | null;
  is_muxed_fallback?: boolean;
};

/** Once resolved, URLs are never replaced for the same video+quality in this session. */
const sessionPlayUrlCache = new Map<string, PlayUrls>();

function cacheKey(videoId: string, quality: string) {
  return `${videoId}:${quality}`;
}

export function normalizeVideoId(videoId?: string | string[]): string | undefined {
  if (!videoId) return undefined;
  const id = Array.isArray(videoId) ? videoId[0] : videoId;
  return id?.trim() || undefined;
}

export function playUrlsSwrKey(videoId: string, quality: string) {
  return [`/download/video-audio/separate/${videoId}`, quality] as [string, string];
}

async function fetchPlayUrls([url, quality]: [string, string]): Promise<PlayUrls | null> {
  const videoId = url.split('/').pop() || '';
  const key = cacheKey(videoId, quality);
  const cached = sessionPlayUrlCache.get(key);
  if (cached?.video_fmt?.url) {
    return cached;
  }

  const result = await get({
    endpoint: url,
    params: { quality },
    baseUrl: Constants.expoConfig?.extra?.UPTUBE_DOWNLOAD_API,
    overrideEncryptedResponsesOnly: true,
    skipRequestEncryption: true,
  });

  if (!result?.video_fmt?.url) {
    return null;
  }

  sessionPlayUrlCache.set(key, result);
  return result;
}

export function usePlayUrls(videoId?: string | string[], quality = INITIAL_PLAYBACK_QUALITY) {
  const id = normalizeVideoId(videoId);
  const swrKey = id ? playUrlsSwrKey(id, quality) : null;

  return useSWR<PlayUrls | null>(swrKey, fetchPlayUrls, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 60 * 60 * 1000,
  });
}

/** Warm cache on card press — never overwrites URLs already resolved for this video. */
export function prefetchPlayUrls(videoId: string | string[], quality = INITIAL_PLAYBACK_QUALITY) {
  const id = normalizeVideoId(videoId);
  if (!id) return;

  const swrKey = playUrlsSwrKey(id, quality);
  const cached = sessionPlayUrlCache.get(cacheKey(id, quality));
  if (cached?.video_fmt?.url) {
    void mutate(swrKey, cached, { revalidate: false });
    return;
  }

  void fetchPlayUrls(swrKey).then((data) => {
    if (data?.video_fmt?.url) {
      void mutate(swrKey, data, { revalidate: false });
    }
  });
}
