"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArrowBigDown, Bookmark, ThumbsDown, ThumbsUp } from "lucide-react";
import { get, post } from "@/lib/api";
import { miniNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { VideoLibraryStatus, BookmarkCollection } from "@/types/library";
import type { Video } from "@/types/prisma";
import { BookmarkPickerDialog } from "@/components/library/bookmark-picker-dialog";

type VideoActionsProps = {
  video: Video;
  onDownload: () => void;
  variant?: "pill" | "overlay";
};

export function VideoActions({
  video,
  onDownload,
  variant = "pill",
}: VideoActionsProps) {
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);

  const { data: status, mutate } = useSWR<VideoLibraryStatus>(
    video?.id ? `/protected/library/videos/${video.id}/status` : null,
    (endpoint: string) => get({ endpoint, throwable: true }),
  );

  const liked = optimisticLiked ?? status?.liked ?? false;
  const bookmarked = status?.bookmarked ?? false;
  const likeCount = Number(video.like_count || 0) + (liked ? 1 : 0);

  const toggleLike = async () => {
    const nextLiked = !liked;
    setOptimisticLiked(nextLiked);
    try {
      const result = (await post({
        endpoint: `/protected/library/likes/${video.id}`,
        throwable: true,
      })) as { liked: boolean };
      setOptimisticLiked(result.liked);
      await mutate({ ...status!, liked: result.liked, bookmarked }, false);
    } catch {
      setOptimisticLiked(null);
    }
  };

  if (variant === "overlay") {
    return (
      <>
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={toggleLike}
            className="flex flex-col items-center text-white"
          >
            <ThumbsUp
              className={cn(
                "h-6 w-6 drop-shadow",
                liked && "fill-primary text-primary",
              )}
            />
            <span className="mt-1 text-xs drop-shadow">
              {miniNumber(likeCount)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBookmarkOpen(true)}
            className="flex flex-col items-center text-white"
          >
            <Bookmark
              className={cn(
                "h-6 w-6 drop-shadow",
                bookmarked && "fill-primary text-primary",
              )}
            />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex flex-col items-center text-white"
          >
            <ArrowBigDown className="h-6 w-6 drop-shadow" />
          </button>
        </div>
        <BookmarkPickerDialog
          open={bookmarkOpen}
          onClose={() => setBookmarkOpen(false)}
          videoId={video.id}
          onStatusChange={() => mutate()}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium",
            liked ? "bg-primary/20 text-primary" : "bg-muted",
          )}
        >
          <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
          {miniNumber(likeCount)}
        </button>

        <button
          type="button"
          className="flex items-center gap-1 rounded-full bg-muted px-4 py-2 text-sm font-medium"
        >
          <ThumbsDown className="h-4 w-4" />
          {miniNumber(Number(video.dislike_count) || 0)}
        </button>

        <button
          type="button"
          onClick={() => setBookmarkOpen(true)}
          className={cn(
            "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium",
            bookmarked ? "bg-primary/20 text-primary" : "bg-muted",
          )}
        >
          <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
          Save
        </button>

        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-1 rounded-full bg-muted px-4 py-2 text-sm font-medium"
        >
          <ArrowBigDown className="h-5 w-5" />
          Download
        </button>
      </div>

      <BookmarkPickerDialog
        open={bookmarkOpen}
        onClose={() => setBookmarkOpen(false)}
        videoId={video.id}
        onStatusChange={() => mutate()}
      />
    </>
  );
}
