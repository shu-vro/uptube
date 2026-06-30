"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { get } from "@/lib/api";
import type { Video } from "@/types/prisma";
import { ShortsSection, VideoCardGrid } from "@/components/video/video-cards";
import { Skeleton } from "@/components/ui/skeleton";

type HomeItem = Video | { type: "SHORTS_SHELF"; shorts: Video[] };

export default function HomePage() {
  const [shelf, setShelf] = useState<HomeItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const data = (await get({
        endpoint: "/public/yt/home",
        params: { page, limit: 20 },
      })) as { shelf: HomeItem[] } | null;

      if (data?.shelf?.length) {
        setShelf((prev) =>
          page === 1 ? data.shelf : [...prev, ...data.shelf],
        );
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    fetchData();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && hasMore) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  return (
    <div className="px-2 py-2 md:px-4">
      {initialLoad && shelf.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={`skel-${i}`}
              className="aspect-video w-full rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shelf.map((item, index) => {
            if ("type" in item && item.type === "SHORTS_SHELF") {
              return (
                <div key={`shorts-${index}`} className="col-span-full">
                  <ShortsSection shorts={item.shorts} />
                </div>
              );
            }
            return (
              <VideoCardGrid key={(item as Video).id} item={item as Video} />
            );
          })}
        </div>
      )}

      {loading && !initialLoad && (
        <div className="flex justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && shelf.length === 0 && (
        <p className="p-4 text-center text-muted-foreground">
          No videos found.
        </p>
      )}

      <div ref={observerRef} className="h-4" />
    </div>
  );
}
