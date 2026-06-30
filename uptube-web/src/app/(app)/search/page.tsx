"use client";

import { useCallback, useEffect, useState } from "react";
import { Grid2x2, List, Search as SearchIcon } from "lucide-react";
import { get } from "@/lib/api";
import type { Video } from "@/types/prisma";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SearchResultVideo,
  ShortsSection,
} from "@/components/video/video-cards";
import { cn } from "@/lib/cn";

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [videoResults, setVideoResults] = useState<Video[]>([]);
  const [shortsResults, setShortsResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    const stored = localStorage.getItem("viewMode");
    if (stored === "list" || stored === "grid") setViewMode(stored);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    get({
      endpoint: "/public/yt/show-suggestions",
      params: { q: debouncedQuery },
    }).then((data) => {
      setSuggestions((data as string[]) || []);
    });
  }, [debouncedQuery]);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 3) return;
    setLoading(true);
    setHasSearched(true);
    setFocused(false);
    try {
      const data = (await get({
        endpoint: "/public/yt/search",
        params: { q },
      })) as
        | {
            videos?: Video[];
            shorts?: Video[];
          }
        | Video[]
        | null;

      if (Array.isArray(data)) {
        setVideoResults(data.filter((v) => v.type !== "SHORT"));
        setShortsResults(data.filter((v) => v.type === "SHORT"));
      } else {
        setVideoResults(data?.videos ?? []);
        setShortsResults(data?.shorts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleViewMode = (mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] px-4 py-4">
      <div
        className={cn(
          "mx-auto max-w-2xl transition-all",
          focused || hasSearched ? "mb-6" : "mt-[20vh]",
        )}
      >
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
          />
        </div>

        {focused && suggestions.length > 0 && !hasSearched && (
          <div className="mt-2 rounded-lg border bg-card shadow-sm">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setQuery(s);
                  runSearch(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasSearched && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Results for &quot;{query}&quot;
            </h2>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => toggleViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => toggleViewMode("grid")}
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!loading && shortsResults.length > 0 && (
            <ShortsSection shorts={shortsResults} />
          )}

          {!loading && (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "max-w-3xl",
              )}
            >
              {videoResults.map((item) => (
                <SearchResultVideo
                  key={item.id}
                  item={item}
                  variant={viewMode}
                />
              ))}
            </div>
          )}

          {!loading &&
            videoResults.length === 0 &&
            shortsResults.length === 0 && (
              <p className="text-center text-muted-foreground">
                No results found.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
