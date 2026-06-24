import { YT, YTNodes } from "youtubei.js";
import { parseViewCount } from "utils/yt/parseViewCount";

function normalizeViewCount(text?: string): string {
  const parsed = parseViewCount(text || "0");
  return String(parsed ?? 0);
}

type Thumbnail = { url: string; width: number; height: number };

export type ParsedChannelVideo = {
  id: string;
  title: string;
  thumbnails: Thumbnail[];
  duration: number;
  view_count: string;
  published_text: string;
  createdAt: string | null;
};

export type ParsedChannelProfile = {
  id: string;
  title: string;
  handle: string | null;
  description: string | null;
  url: string;
  vanity_channel_url: string | null;
  avatars: Thumbnail[];
  banner: Thumbnail[] | null;
  subscriber_count: string | null;
  video_count: string | null;
  is_verified: boolean;
};

export type CreatorPageCursor = {
  phase: "yt" | "db" | "order";
  yt?: string;
  dbAfter?: string;
  orderOffset?: number;
};

export type ParsedChannelInfo = ParsedChannelProfile & {
  videos: ParsedChannelVideo[];
};

function normalizeThumbnails(
  images: Array<{ url?: string; width?: number; height?: number }> | undefined,
): Thumbnail[] {
  if (!images?.length) return [];

  return images.flatMap((image) => {
    if (!image.url) return [];
    return [
      {
        url: image.url.replace(/\?.*$/, ""),
        width: Number(image.width) || 0,
        height: Number(image.height) || 0,
      },
    ];
  });
}

function parseDurationBadge(text?: string): number {
  if (!text) return 0;
  const parts = text.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 3) {
    const [hours = 0, minutes = 0, seconds = 0] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const [minutes = 0, seconds = 0] = parts;
    return minutes * 60 + seconds;
  }
  return 0;
}

function readText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "text" in value) {
    const text = (value as { text?: unknown }).text;
    if (typeof text === "string") return text;
    if (text && typeof text === "object" && "toString" in text) {
      return String(text);
    }
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    return String(value);
  }
  return "";
}

function parseLockupView(item: any): ParsedChannelVideo | null {
  const type = item?.type ?? item?.constructor?.type;
  if (type !== "LockupView" || item.content_type !== "VIDEO") {
    return null;
  }

  const id =
    item.content_id ||
    item.renderer_context?.command_context?.on_tap?.payload?.videoId;
  if (!id) return null;

  const durationText = item.content_image?.overlays
    ?.flatMap((overlay: any) => overlay?.badges || [])
    ?.find((badge: any) => badge?.text)?.text;

  const metadataParts =
    item.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts || [];

  return {
    id,
    title: readText(item.metadata?.title) || "Untitled",
    thumbnails: normalizeThumbnails(item.content_image?.image),
    duration: parseDurationBadge(durationText),
    view_count: normalizeViewCount(metadataParts[0]?.text?.text),
    published_text: metadataParts[1]?.text?.text || "",
    createdAt: null,
  };
}

function parseGridVideo(item: any): ParsedChannelVideo | null {
  const id = item?.video_id || item?.id;
  if (!id) return null;

  return {
    id,
    title: readText(item.title) || "Untitled",
    thumbnails: normalizeThumbnails(item.thumbnails),
    duration: parseDurationBadge(readText(item.duration)),
    view_count: normalizeViewCount(
      readText(item.views) || readText(item.short_view_count),
    ),
    published_text: readText(item.published),
    createdAt: null,
  };
}

function parseChannelVideoPlayer(item: any): ParsedChannelVideo | null {
  if (item?.type !== "ChannelVideoPlayer" || !item.id) return null;

  return {
    id: item.id,
    title: item.title?.text || "Untitled",
    thumbnails: [],
    duration: 0,
    view_count: normalizeViewCount(item.view_count?.text),
    published_text: item.published_time?.text || "",
    createdAt: null,
  };
}

function collectChannelVideos(
  node: unknown,
  videos: ParsedChannelVideo[] = [],
) {
  if (!node || typeof node !== "object") return videos;

  if (Array.isArray(node)) {
    for (const item of node) collectChannelVideos(item, videos);
    return videos;
  }

  const lockup = parseLockupView(node);
  if (lockup) videos.push(lockup);

  const gridVideo = parseGridVideo(node);
  if (gridVideo) videos.push(gridVideo);

  const featured = parseChannelVideoPlayer(node);
  if (featured) videos.push(featured);

  for (const value of Object.values(node)) {
    collectChannelVideos(value, videos);
  }

  return videos;
}

function dedupeVideos(videos: ParsedChannelVideo[]) {
  const seen = new Set<string>();
  return videos.filter((video) => {
    if (seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

export function parseVideosFromFeed(feed: any): ParsedChannelVideo[] {
  const videos: ParsedChannelVideo[] = [];

  if (feed?.memo?.getType) {
    for (const lockup of feed.memo.getType(YTNodes.LockupView)) {
      const parsed = parseLockupView(lockup);
      if (parsed) videos.push(parsed);
    }

    for (const gridVideo of feed.memo.getType(YTNodes.GridVideo)) {
      const parsed = parseGridVideo(gridVideo);
      if (parsed) videos.push(parsed);
    }

    for (const compactVideo of feed.memo.getType(YTNodes.CompactVideo)) {
      const parsed = parseGridVideo(compactVideo);
      if (parsed) videos.push(parsed);
    }

    for (const video of feed.memo.getType(YTNodes.Video)) {
      const parsed = parseGridVideo(video);
      if (parsed) videos.push(parsed);
    }
  }

  if (feed?.videos?.length) {
    for (const video of feed.videos) {
      const parsed = parseGridVideo(video);
      if (parsed) videos.push(parsed);
    }
  }

  if (videos.length === 0) {
    collectChannelVideos(feed?.current_tab?.content?.contents || [], videos);
  }

  return dedupeVideos(videos);
}

export function extractYoutubeContinuationCursor(feed: any): string | null {
  if (feed?.has_continuation === false) return null;

  const items = feed?.memo?.getType?.(YTNodes.ContinuationItem) ?? [];
  return items[0]?.endpoint?.payload?.token ?? null;
}

export function encodeCreatorCursor(cursor: CreatorPageCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCreatorCursor(cursor: string): CreatorPageCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as CreatorPageCursor;

    if (
      parsed?.phase !== "yt" &&
      parsed?.phase !== "db" &&
      parsed?.phase !== "order"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function parseChannelProfile(channel: any): ParsedChannelProfile {
  const metadata = channel?.metadata || {};
  const headerContent = channel?.header?.content || {};
  const metadataRows = headerContent?.metadata?.metadata_rows || [];

  const handle = metadataRows[0]?.metadata_parts?.[0]?.text?.text || null;
  const statsParts =
    metadataRows[1]?.metadata_parts?.map(
      (part: any) => part?.text?.text as string | undefined,
    ) || [];

  const isVerified =
    headerContent?.title?.text?.runs?.some((run: any) =>
      run?.attachment?.element?.type?.imageType?.image?.sources?.some(
        (source: any) =>
          source?.clientResource?.imageName === "CHECK_CIRCLE_FILLED",
      ),
    ) ?? false;

  const avatars = normalizeThumbnails(
    headerContent?.image?.avatar?.image ||
      metadata?.avatar ||
      metadata?.thumbnail,
  );

  const bannerImages = headerContent?.banner?.image;
  const banner = bannerImages?.length
    ? normalizeThumbnails(bannerImages)
    : null;

  const description =
    headerContent?.description?.description?.text ||
    metadata?.description ||
    null;

  return {
    id: metadata.external_id || "",
    title:
      headerContent?.title?.text?.text ||
      channel?.header?.page_title ||
      metadata.title ||
      "Unknown Channel",
    handle,
    description,
    url:
      metadata.url || `https://www.youtube.com/channel/${metadata.external_id}`,
    vanity_channel_url: metadata.vanity_channel_url || null,
    avatars,
    banner,
    subscriber_count: statsParts[0] || null,
    video_count: statsParts[1] || null,
    is_verified: isVerified,
  };
}

export function parseChannelInfo(channel: any): ParsedChannelInfo {
  return {
    ...parseChannelProfile(channel),
    videos: parseVideosFromFeed(channel),
  };
}

export async function fetchYoutubeContinuationFeed(
  yt: { actions: any },
  token: string,
) {
  const data = await yt.actions.execute("/browse", {
    continuation: token,
    parse: true,
  });

  return new YT.ChannelListContinuation(yt.actions, data, true);
}
