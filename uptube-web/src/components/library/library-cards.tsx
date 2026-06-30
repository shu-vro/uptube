"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

export function SectionHeader({
  title,
  href,
  onAdd,
}: {
  title: string;
  href?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-4">
      {href ? (
        <Link
          href={href}
          className="flex items-center gap-1 text-lg font-bold hover:text-primary"
        >
          {title}
          <ChevronRight className="h-5 w-5" />
        </Link>
      ) : (
        <h2 className="text-lg font-bold">{title}</h2>
      )}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full p-2 hover:bg-muted"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 90;

export function LibraryMediaCard({
  video,
  onClick,
}: {
  video: {
    id: string;
    title: string;
    thumbnails?: { url: string; width: number }[];
    type?: string;
  };
  onClick?: () => void;
}) {
  const thumb = video.thumbnails?.sort(
    (a, b) => (b?.width || 0) - (a?.width || 0),
  )[0]?.url;
  const href =
    video.type === "SHORT"
      ? `/shorts?shortId=${video.id}`
      : `/video/${video.id}`;

  return (
    <Link
      href={href}
      onClick={onClick}
      className="mr-3 block shrink-0"
      style={{ width: CARD_WIDTH }}
    >
      <div
        className="mb-2 overflow-hidden rounded-lg bg-muted"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        {thumb && (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
    </Link>
  );
}

export function LikedVideosCard({
  count,
  preview,
}: {
  count: number;
  preview: { thumbnails?: { url: string; width: number }[] }[];
}) {
  const thumb = preview[0]?.thumbnails?.sort(
    (a, b) => (b?.width || 0) - (a?.width || 0),
  )[0]?.url;

  return (
    <Link
      href="/library/liked"
      className="mr-3 block shrink-0"
      style={{ width: CARD_WIDTH }}
    >
      <div
        className="relative mb-2 overflow-hidden rounded-lg bg-muted"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        {thumb ? (
          <>
            <img src={thumb} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm font-semibold text-white">
              {count} liked
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold">
            {count}
          </div>
        )}
      </div>
      <p className="text-sm font-medium">Liked videos</p>
      <p className="text-xs text-muted-foreground">Private</p>
    </Link>
  );
}

export function BookmarkCollectionCard({
  bookmark,
}: {
  bookmark: {
    id: string;
    name: string;
    count: number;
    preview: { thumbnails?: { url: string; width: number }[] } | null;
  };
}) {
  const thumb = bookmark.preview?.thumbnails?.sort(
    (a, b) => (b?.width || 0) - (a?.width || 0),
  )[0]?.url;

  return (
    <Link
      href={`/library/${bookmark.id}`}
      className="mr-3 block shrink-0"
      style={{ width: CARD_WIDTH }}
    >
      <div
        className="relative mb-2 overflow-hidden rounded-lg bg-muted"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {bookmark.count} videos
          </div>
        )}
        {thumb && (
          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            {bookmark.count}
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-medium">{bookmark.name}</p>
      <p className="text-xs text-muted-foreground">Private</p>
    </Link>
  );
}
