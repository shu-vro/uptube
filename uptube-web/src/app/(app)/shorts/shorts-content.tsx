"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { get } from "@/lib/api";
import type { Video } from "@/types/prisma";
import { ShortSlide } from "@/components/video/short-slide";

function parseIdsParam(value: string | null) {
  if (!value) return [] as string[];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed))
        return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      // fall through
    }
  }
  return trimmed
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

export default function ShortsPage() {
  const searchParams = useSearchParams();
  const shortId = searchParams.get("shortId");
  const idsParam = searchParams.get("ids") ?? searchParams.get("shortIds");

  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [videosById, setVideosById] = useState<Record<string, Video>>({});
  const [bootstrapping, setBootstrapping] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchVideoById = useCallback(async (id: string) => {
    const video = (await get({
      endpoint: "/public/yt/video",
      params: { id },
    })) as Video | null;
    return video;
  }, []);

  const fetchRandomShort = useCallback(async () => {
    const data = (await get({ endpoint: "/public/shorts/random" })) as {
      shorts?: Video[];
    } | null;
    return data?.shorts?.[0] ?? null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setBootstrapping(true);
      const paramIds = parseIdsParam(idsParam);
      let initialIds = uniqueIds(paramIds);
      if (shortId)
        initialIds = [shortId, ...initialIds.filter((id) => id !== shortId)];

      if (initialIds.length > 0) {
        if (!cancelled) {
          setQueueIds(initialIds);
          setVideosById({});
          setBootstrapping(false);
        }
        return;
      }

      const randomShort = await fetchRandomShort();
      if (cancelled) return;

      if (!randomShort) {
        setQueueIds([]);
        setBootstrapping(false);
        return;
      }

      setQueueIds([randomShort.id]);
      setVideosById({ [randomShort.id]: randomShort });
      setBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [shortId, idsParam, fetchRandomShort]);

  useEffect(() => {
    for (const id of queueIds) {
      if (videosById[id]) continue;
      fetchVideoById(id).then((video) => {
        if (video) setVideosById((prev) => ({ ...prev, [id]: video }));
      });
    }
  }, [queueIds, videosById, fetchVideoById]);

  const appendRandom = useCallback(async () => {
    const randomShort = await fetchRandomShort();
    if (!randomShort) return;
    setQueueIds((prev) => uniqueIds([...prev, randomShort.id]));
    setVideosById((prev) => ({ ...prev, [randomShort.id]: randomShort }));
  }, [fetchRandomShort]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < clientHeight * 0.5) {
        appendRandom();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [appendRandom]);

  if (bootstrapping) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (queueIds.length === 0) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center text-muted-foreground">
        No shorts available.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-5rem)] snap-y snap-mandatory overflow-y-scroll md:h-[calc(100vh-2rem)]"
    >
      {queueIds.map((id) => (
        <div
          key={id}
          className="h-[calc(100vh-5rem)] snap-start md:h-[calc(100vh-2rem)]"
        >
          <ShortSlide video={videosById[id]} videoId={id} />
        </div>
      ))}
    </div>
  );
}
