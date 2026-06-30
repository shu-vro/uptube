import { useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { get } from "@/lib/api";
import type { Video } from "@/types/prisma";

type VideoExtended = Pick<Video, "captions" | "chapters" | "nextEdges">;

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

const swrOpts = {
  revalidateOnFocus: true,
  dedupingInterval: 2000,
} as const;

export function needsVideoEnrichment(basic?: Video | null): boolean {
  if (!basic) return false;
  if (!basic.short_description?.trim()) return true;
  if (!basic.available_qualities?.length) return true;
  return false;
}

export function useVideoDetails(videoId?: string) {
  const pollAttemptsRef = useRef(0);

  const {
    data: basic,
    error: basicError,
    isLoading: isBasicLoading,
    mutate: mutateBasic,
  } = useSWR<Video>(
    videoId ? `/public/yt/video?id=${videoId}` : null,
    (url: string) => get({ endpoint: url }),
    swrOpts,
  );

  const { data: extended, mutate: mutateExtended } =
    useSWR<VideoExtended | null>(
      videoId ? `/public/yt/video/extended?id=${videoId}` : null,
      (url: string) => get({ endpoint: url }),
      swrOpts,
    );

  const video = useMemo<Video | undefined>(() => {
    if (!basic) return undefined;
    if (!extended) return basic;
    return { ...basic, ...extended };
  }, [basic, extended]);

  const isEnriching = needsVideoEnrichment(basic);

  useEffect(() => {
    pollAttemptsRef.current = 0;
  }, [videoId]);

  useEffect(() => {
    if (!videoId || !isEnriching) return;

    const poll = () => {
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) return;
      pollAttemptsRef.current += 1;
      void mutateBasic(undefined, { revalidate: true });
      void mutateExtended(undefined, { revalidate: true });
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [videoId, isEnriching, mutateBasic, mutateExtended]);

  const mutate = async () => {
    await Promise.all([
      mutateBasic(undefined, { revalidate: true }),
      mutateExtended(undefined, { revalidate: true }),
    ]);
  };

  return {
    video,
    basic,
    extended,
    isLoading: isBasicLoading,
    isEnriching,
    error: basicError,
    mutate,
  };
}
