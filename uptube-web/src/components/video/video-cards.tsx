import Link from "next/link";
import { CirclePlay, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { distanceFromToday, miniNumber, numberToTime } from "@/lib/format";
import type { Video } from "@/types/prisma";
import { cn } from "@/lib/cn";

function thumbnailUrl(item: Video, preferLarge = false) {
  const sorted = [...(item.thumbnails ?? [])].sort(
    (a, b) => (a?.width || 0) - (b?.width || 0),
  );
  const idx = preferLarge ? sorted.length - 1 : Math.min(sorted.length - 1, 1);
  return sorted[idx]?.url;
}

export function VideoCardList({ item }: { item: Video }) {
  return (
    <Link href={`/video/${item.id}`} className="mb-3 block">
      <Card className="gap-0 py-2">
        <CardContent className="p-3 py-0">
          <div className="flex flex-row">
            <div className="relative mr-3 aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
              {thumbnailUrl(item) && (
                <img
                  src={thumbnailUrl(item)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <CirclePlay className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="absolute bottom-1 right-1 rounded-sm bg-background/80 px-1.5 py-0.5 text-xs text-muted-foreground">
                {numberToTime(item.duration || 0)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 line-clamp-2 text-sm font-semibold leading-5">
                {item.title}
              </p>
              <p className="mb-1 line-clamp-1 text-xs text-muted-foreground">
                {item.creator?.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {miniNumber(Number(item.view_count) || 0)} views •{" "}
                {distanceFromToday(item.createdAt.toString())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function VideoCardGrid({
  item,
  hideCreator = false,
  publishedText,
  className,
}: {
  item: Video;
  hideCreator?: boolean;
  publishedText?: string;
  className?: string;
}) {
  const dateLabel =
    publishedText ||
    (item.createdAt ? distanceFromToday(item.createdAt.toString()) : "");

  return (
    <Link href={`/video/${item.id}`} className={cn("mb-3 block", className)}>
      <Card>
        <CardContent className="px-3">
          <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {thumbnailUrl(item) && (
              <img
                src={thumbnailUrl(item)}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute bottom-2 right-2 rounded-sm bg-background/80 px-1.5 py-0.5 text-xs text-muted-foreground">
              {numberToTime(item.duration || 0)}
            </div>
          </div>
          <p className="mb-1 line-clamp-2 text-sm font-semibold leading-4">
            {item.title}
          </p>
          {!hideCreator && item.creator?.title && (
            <p className="mb-1 line-clamp-1 text-xs text-muted-foreground">
              {item.creator.title}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {miniNumber(Number(item.view_count) || 0)} views
            {dateLabel && ` • ${dateLabel}`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ShortCard({
  item,
  shortIds,
}: {
  item: Video;
  shortIds: string[];
}) {
  const url = thumbnailUrl(item, true);
  return (
    <Link
      href={`/shorts?shortId=${item.id}&ids=${shortIds.join(",")}`}
      className="mr-3 block w-[45vw] max-w-[200px] shrink-0 md:w-[200px]"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
        {url && <img src={url} alt="" className="h-full w-full object-cover" />}
        <div className="absolute bottom-2 left-2 rounded-sm bg-background/80 px-1.5 py-0.5 text-xs font-semibold">
          {numberToTime(item.duration || 0)}
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold">{item.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {miniNumber(Number(item.view_count) || 0)} views
      </p>
    </Link>
  );
}

export function ShortsSection({ shorts }: { shorts: Video[] }) {
  if (!shorts?.length) return null;
  const shortIds = shorts.map((s) => s.id);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center px-4">
        <Zap className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Shorts</h2>
      </div>
      <div className="flex gap-0 overflow-x-auto px-4 pb-2 scrollbar-none">
        {shorts.map((item) => (
          <ShortCard key={item.id} item={item} shortIds={shortIds} />
        ))}
      </div>
    </div>
  );
}

export function SearchResultVideo({
  item,
  variant = "grid",
}: {
  item: Video;
  variant?: "list" | "grid";
}) {
  return variant === "list" ? (
    <VideoCardList item={item} />
  ) : (
    <VideoCardGrid item={item} />
  );
}
