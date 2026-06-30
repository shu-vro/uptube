"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { get } from "@/lib/api";
import type {
  CreatorPageResponse,
  CreatorProfile,
  ChannelVideoPreview,
} from "@/types/channel";
import type { Video } from "@/types/prisma";
import { VideoCardGrid } from "@/components/video/video-cards";

function previewToVideo(
  preview: ChannelVideoPreview,
  profile: CreatorProfile,
): Video {
  const createdAt = preview.createdAt || "";
  return {
    id: preview.id,
    title: preview.title,
    channel_id: profile.id,
    short_description: null,
    duration: preview.duration,
    view_count: preview.view_count,
    type: "VIDEO",
    keywords: [],
    like_count: "0",
    dislike_count: "0",
    category: null,
    extra: null,
    last_manual_fetch: createdAt,
    available_qualities: [],
    thumbnails: preview.thumbnails,
    sponsorblocks: [],
    chapters: null,
    trulyCreatedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    heatmap: null,
    creator: {
      id: profile.id,
      title: profile.title,
      description: profile.description,
      url: profile.url,
      vanity_channel_url: profile.vanity_channel_url,
      avatars: profile.avatars,
      createdAt: "",
      updatedAt: "",
      extra: null,
    },
  };
}

export default function CreatorPage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [videos, setVideos] = useState<ChannelVideoPreview[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const loadingMoreRef = useRef(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const mergeVideos = useCallback(
    (current: ChannelVideoPreview[], incoming: ChannelVideoPreview[]) => {
      const seen = new Set(current.map((v) => v.id));
      return [...current, ...incoming.filter((v) => !seen.has(v.id))];
    },
    [],
  );

  const fetchCreatorPage = useCallback(
    async (cursor?: string | null) => {
      if (!id) return;
      const isInitial = !cursor;

      if (isInitial) {
        setIsLoading(true);
        setError(false);
      } else {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);
      }

      try {
        const data = (await get({
          endpoint: "/public/yt/creator",
          params: { id, ...(cursor ? { cursor } : {}) },
        })) as CreatorPageResponse;

        if (data.profile) setProfile(data.profile);
        setVideos((current) =>
          isInitial ? data.videos : mergeVideos(current, data.videos),
        );
        setNextCursor(data.nextCursor);
      } catch {
        if (isInitial) setError(true);
      } finally {
        if (isInitial) setIsLoading(false);
        else {
          loadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    },
    [id, mergeVideos],
  );

  useEffect(() => {
    if (id) fetchCreatorPage();
  }, [id, fetchCreatorPage]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore && !isLoading) {
          fetchCreatorPage(nextCursor);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, isLoadingMore, isLoading, fetchCreatorPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="px-4 py-8 text-center">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-xl font-bold">Channel Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          Could not load this creator.
        </p>
      </div>
    );
  }

  const bannerUrl = profile.banner?.sort(
    (a, b) => (b.width || 0) - (a.width || 0),
  )[0]?.url;
  const avatarUrl = profile.avatars?.sort(
    (a, b) => (b.width || 0) - (a.width || 0),
  )[0]?.url;

  return (
    <div className="pb-8">
      <div className="relative mb-14">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt=""
            className="h-36 w-full object-cover bg-muted"
          />
        ) : (
          <div className="h-28 w-full bg-muted" />
        )}
        <div className="absolute -bottom-10 left-4 overflow-hidden rounded-full border-4 border-background bg-muted">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-20 w-20 object-cover" />
          ) : (
            <div className="h-20 w-20" />
          )}
        </div>
      </div>

      <div className="mb-6 px-4">
        <div className="mb-1 flex items-center gap-1">
          <h1 className="text-2xl font-bold">{profile.title}</h1>
          {profile.is_verified && (
            <BadgeCheck className="h-5 w-5 text-primary" />
          )}
        </div>
        {profile.handle && (
          <p className="mb-2 text-sm text-muted-foreground">{profile.handle}</p>
        )}
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {profile.subscriber_count && <span>{profile.subscriber_count}</span>}
          {profile.subscriber_count && profile.video_count && <span>•</span>}
          {profile.video_count && <span>{profile.video_count}</span>}
        </div>

        {profile.description && (
          <div className="mb-4 rounded-xl bg-muted p-3">
            <p
              className={
                descExpanded
                  ? "text-sm leading-5"
                  : "line-clamp-3 text-sm leading-5"
              }
            >
              {profile.description}
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-bold text-primary"
              onClick={() => setDescExpanded(!descExpanded)}
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}

        <h2 className="text-lg font-bold">Videos</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((item) => (
          <VideoCardGrid
            key={item.id}
            item={previewToVideo(item, profile)}
            hideCreator
            publishedText={item.published_text || undefined}
          />
        ))}
      </div>

      {videos.length === 0 && (
        <p className="px-4 text-center text-muted-foreground">
          No videos found for this channel.
        </p>
      )}

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div ref={observerRef} className="h-4" />
    </div>
  );
}
