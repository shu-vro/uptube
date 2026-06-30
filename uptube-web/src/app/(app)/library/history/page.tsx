"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { get } from "@/lib/api";
import type { LibraryVideo, PaginatedLibraryVideos } from "@/types/library";
import { VideoCardList } from "@/components/video/video-cards";

function usePaginatedLibrary(endpoint: string) {
  const [items, setItems] = useState<LibraryVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      if (loading) return;
      setLoading(true);
      try {
        const data = (await get({
          endpoint,
          params: { page: nextPage, limit: 20 },
          throwable: true,
        })) as PaginatedLibraryVideos;
        setItems((prev) =>
          nextPage === 1 ? data.items : [...prev, ...data.items],
        );
        setHasMore(data.hasMore);
        setPage(nextPage);
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, loading],
  );

  useEffect(() => {
    fetchPage(1);
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading)
          fetchPage(page + 1);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  return { items, loading, hasMore, observerRef };
}

export default function HistoryPage() {
  const { items, loading, observerRef } = usePaginatedLibrary(
    "/protected/library/history",
  );

  return (
    <div className="px-4 py-4">
      <Link
        href="/library"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </Link>
      <h1 className="mb-4 text-2xl font-bold">History</h1>

      <div className="max-w-3xl">
        {items.map((item) => (
          <VideoCardList key={item.id} item={item} />
        ))}
      </div>

      {!loading && items.length === 0 && (
        <p className="text-center text-muted-foreground">
          No watch history yet.
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div ref={observerRef} className="h-4" />
    </div>
  );
}
