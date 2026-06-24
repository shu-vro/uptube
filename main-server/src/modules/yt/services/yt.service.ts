import logger from "config/logger/pino.logger";
import { Innertube, YTNodes } from "youtubei.js";
import { sanitizeYtUrl } from "utils/yt";
import { parseViewCount } from "utils/yt/parseViewCount";
import { differenceInDays } from "utils/time";
import { Prisma, Video, VideoType, Creator } from "generated/prisma/client";
import { yt } from "modules/yt/controllers/yt.controller";
import _ from "lodash";
import { XMLParser } from "fast-xml-parser";
import parseYouTubeChapters from "utils/parse-youtube-chapters";
import {
  parseChannelProfile,
  parseVideosFromFeed,
  extractYoutubeContinuationCursor,
  encodeCreatorCursor,
  decodeCreatorCursor,
  fetchYoutubeContinuationFeed,
  ParsedChannelProfile,
  ParsedChannelVideo,
  CreatorPageCursor,
} from "utils/yt/parse-channel-info";

const parser = new XMLParser({
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  attributeNamePrefix: "$_",
});
/**
 * Partition 1: Search YouTube and return ordered video/creator IDs.
 */
async function searchYtVideos(yt: Innertube, query: string, limit = 20) {
  let shortIds: string[] = [];
  let videoIds: string[] = [];
  let creatorIds: string[] = [];

  try {
    const videos = await yt.search(query, { type: "all" });

    const uploadableVideos: YTNodes.Video[] = videos.videos
      .filter((e) => e.type === "Video")
      .splice(0, limit) as YTNodes.Video[];

    shortIds = _.uniq(
      (
        (videos?.results ?? []).flatMap((r) =>
          r?.type === "GridShelfView"
            ? ((r as YTNodes.GridShelfView)?.contents ?? [])
            : [],
        ) as YTNodes.ShortsLockupView[]
      )
        .map((v) => v?.on_tap_endpoint?.payload?.videoId)
        .filter(Boolean),
    );

    videoIds = _.uniq(uploadableVideos.map((v) => v.video_id));
    creatorIds = _.uniq(
      uploadableVideos.map((v) => v.author?.id).filter(Boolean) as string[],
    );
  } catch (error) {}

  return { videoIds, shortIds, creatorIds };
}

type UpsertMissingCreatorsInput = {
  yt: Innertube;
  missingCreatorIds: string[];
};

/**
 * Partition 2: Upsert any creators not yet present in the DB.
 */
async function upsertMissingCreators({
  yt,
  missingCreatorIds,
}: UpsertMissingCreatorsInput): Promise<any[]> {
  if (missingCreatorIds.length === 0) return [];

  const channelInfos = await Promise.allSettled(
    missingCreatorIds.map((id) => yt.getChannel(id)),
  );

  const upsertOps = channelInfos.flatMap((info) => {
    if (info.status !== "fulfilled") return [];
    const md = info.value.metadata;
    const avatars = _.uniqBy(
      (md.thumbnail || []).map((t) => ({
        url: t.url.split("?")[0],
        width: parseInt(t.width?.toString() ?? "0", 10),
        height: parseInt(t.height?.toString() ?? "0", 10),
      })),
      "url",
    );
    return [
      prisma.creator.upsert({
        where: { id: md.external_id },
        update: {
          title: md.title,
          description: md.description,
          url: md.url,
          vanity_channel_url: md.vanity_channel_url,
          avatars,
        },
        create: {
          id: md.external_id,
          title: md.title || "Unknown Title",
          description: md.description || "No Description",
          url: md.url || `https://www.youtube.com/channel/${md.external_id}`,
          vanity_channel_url: md.vanity_channel_url || null,
          avatars,
        },
      }),
    ];
  });

  return prisma.$transaction(upsertOps);
}

/**
 * Partition 3: Upsert any videos not yet present in the DB.
 */
type VideoWithCreator = Prisma.VideoGetPayload<{ include: { creator: true } }>;

type VideoUpsertInput = {
  yt: Innertube;
  missingVideoIds: string[];
  existingCreatorMap?: Map<string, any>;
  newCreators?: any[];
  type?: VideoType;
};

async function upsertMissingVideos({
  yt,
  missingVideoIds,
  existingCreatorMap = new Map(),
  newCreators = [],
  type = VideoType.VIDEO,
}: VideoUpsertInput): Promise<VideoWithCreator[]> {
  if (missingVideoIds.length === 0) return [];

  const videoInfos = await Promise.allSettled(
    missingVideoIds.map(async (id) => {
      const videoId = sanitizeYtUrl(id);
      if (!videoId) return null;

      try {
        const videoInfo = await yt.actions.execute("/player", {
          videoId,
          client: "YTMUSIC",
          parse: true,
        });
        const videoDetails = videoInfo.video_details;
        if (!videoDetails) return null;

        let creator =
          existingCreatorMap.get(videoDetails.channel_id) ||
          newCreators.find((c) => c.id === videoDetails.channel_id);

        if (!creator) {
          const [fetched] = await upsertMissingCreators({
            yt,
            missingCreatorIds: [videoDetails.channel_id],
          });
          if (!fetched) {
            logger.warn(
              `Failed to fetch creator for channel ${videoDetails.channel_id}`,
            );
            return null;
          }
          creator = fetched;
        }

        return {
          where: { id: videoDetails.id },
          update: {
            title: videoDetails.title,
            short_description: videoDetails?.short_description,
            duration: videoDetails.duration,
            view_count: String(videoDetails.view_count || 0),
            type,
            thumbnails: _.uniqBy(
              (videoDetails.thumbnail || []).map((t) => ({
                url: t.url.split("?")[0],
                width: t.width || 0,
                height: t.height || 0,
              })),
              "url",
            ),
          },
          create: {
            id: videoDetails.id,
            title: videoDetails.title || "Unknown Title",
            channel_id: creator.id,
            short_description: videoDetails?.short_description,
            duration: videoDetails.duration || 0,
            view_count: String(videoDetails.view_count || 0),
            type,
            thumbnails: _.uniqBy(
              (videoDetails.thumbnail || []).map((t) => ({
                url: t.url.split("?")[0],
                width: t.width || 0,
                height: t.height || 0,
              })),
              "url",
            ),
          },
          include: { creator: true },
        };
      } catch (error: any) {
        logger.warn(`Failed to fetch video ${videoId}:`, error);
        return null;
      }
    }),
  );

  return prisma.$transaction(
    videoInfos.flatMap((info) => {
      if (info && info.status === "fulfilled" && info.value !== null) {
        return [prisma.video.upsert(info.value)];
      }
      return [];
    }),
  );
}

/**
 * Orchestrator: search YouTube, upsert missing creators & videos, return results
 * in original search order.
 *
 * ## Explanation of how this algo works:
 * 1. searchYtVideos        – fetch search results and extract IDs
 * 2. DB lookup             – find what already exists
 * 3. upsertMissingCreators – fetch + save any new creators
 * 4. upsertMissingVideos   – fetch + save any new videos (needs creator map)
 * 5. Return videos ordered by original search rank
 */
const CREATOR_DB_BATCH_SIZE = 20;

type CreatorPageResult = {
  profile: ParsedChannelProfile | null;
  videos: ParsedChannelVideo[];
  nextCursor: string | null;
};

const dbVideoSelect = {
  id: true,
  title: true,
  thumbnails: true,
  duration: true,
  view_count: true,
  trulyCreatedAt: true,
} as const;

function mapDbVideoToPreview(video: {
  id: string;
  title: string;
  thumbnails: unknown;
  duration: number;
  view_count: string;
  trulyCreatedAt: Date;
}): ParsedChannelVideo {
  return {
    id: video.id,
    title: video.title,
    thumbnails: Array.isArray(video.thumbnails)
      ? (video.thumbnails as ParsedChannelVideo["thumbnails"])
      : [],
    duration: video.duration,
    view_count: video.view_count,
    published_text: "",
    createdAt: video.trulyCreatedAt.toISOString(),
  };
}

async function fetchDbVideos({
  channelId,
  excludeIds = [],
  dbAfter,
  take = CREATOR_DB_BATCH_SIZE,
}: {
  channelId: string;
  excludeIds?: string[];
  dbAfter?: string;
  take?: number;
}) {
  if (dbAfter) {
    return prisma.video.findMany({
      where: {
        channel_id: channelId,
        type: VideoType.VIDEO,
        id: {
          notIn: excludeIds,
        },
      },
      orderBy: [{ trulyCreatedAt: "desc" }, { id: "desc" }],
      take,
      skip: 1,
      cursor: { id: dbAfter },
      select: dbVideoSelect,
    });
  }

  return prisma.video.findMany({
    where: {
      channel_id: channelId,
      type: VideoType.VIDEO,
      ...(excludeIds.length
        ? {
            id: {
              notIn: excludeIds,
            },
          }
        : {}),
    },
    orderBy: [{ trulyCreatedAt: "desc" }, { id: "desc" }],
    take,
    select: dbVideoSelect,
  });
}

async function hasMoreDbVideos({
  channelId,
  dbAfter,
  excludeIds = [],
}: {
  channelId: string;
  dbAfter?: string;
  excludeIds?: string[];
}) {
  const next = await fetchDbVideos({
    channelId,
    dbAfter,
    excludeIds,
    take: 1,
  });
  return next.length > 0;
}

async function upsertCreatorProfile(
  channel: any,
  profile: ParsedChannelProfile,
) {
  const avatars = _.uniqBy(
    (channel.metadata?.thumbnail || profile.avatars).map(
      (thumbnail: { url: string; width?: number; height?: number }) => ({
        url: thumbnail.url.split("?")[0],
        width: Number(thumbnail.width) || 0,
        height: Number(thumbnail.height) || 0,
      }),
    ),
    "url",
  );

  const profileExtra = {
    banner: profile.banner as Prisma.InputJsonValue,
    handle: profile.handle,
    subscriber_count: profile.subscriber_count,
    video_count: profile.video_count,
    is_verified: profile.is_verified,
    last_manual_fetch: new Date().toISOString(),
  };

  const existing = await prisma.creator.findUnique({
    where: { id: profile.id },
    select: { extra: true },
  });

  const mergedExtra = {
    ...(typeof existing?.extra === "object" && existing.extra !== null
      ? existing.extra
      : {}),
    ...profileExtra,
  };

  await prisma.creator.upsert({
    where: { id: profile.id },
    update: {
      title: profile.title,
      description: profile.description,
      url: profile.url,
      vanity_channel_url: profile.vanity_channel_url,
      avatars: avatars as unknown as Prisma.InputJsonValue,
      extra: mergedExtra,
    },
    create: {
      id: profile.id,
      title: profile.title || "Unknown Title",
      description: profile.description || null,
      url: profile.url || `https://www.youtube.com/channel/${profile.id}`,
      vanity_channel_url: profile.vanity_channel_url || null,
      avatars: avatars as unknown as Prisma.InputJsonValue,
      extra: profileExtra,
    },
  });
}

function hasFullChannelProfile(creator: Creator) {
  const extra =
    typeof creator.extra === "object" && creator.extra !== null
      ? (creator.extra as Record<string, unknown>)
      : {};

  return typeof extra.last_manual_fetch === "string";
}

function shouldRefreshCreator(creator: Creator) {
  const extra =
    typeof creator.extra === "object" && creator.extra !== null
      ? (creator.extra as Record<string, unknown>)
      : {};
  const lastFetch =
    (extra.last_manual_fetch as string | undefined) || creator.createdAt;

  return (
    differenceInDays(Date.now().toString(), lastFetch.toString()) > 7 ||
    Math.abs(creator.updatedAt.getTime() - creator.createdAt.getTime()) < 1000
  );
}

function getChannelVideoOrder(creator: Creator): string[] {
  const extra =
    typeof creator.extra === "object" && creator.extra !== null
      ? (creator.extra as Record<string, unknown>)
      : {};

  return Array.isArray(extra.channel_video_order)
    ? (extra.channel_video_order as string[])
    : [];
}

function hasChannelVideoOrder(creator: Creator) {
  return getChannelVideoOrder(creator).length > 0;
}

function appendUniqueIds(existing: string[], incoming: string[]) {
  const seen = new Set(existing);
  const merged = [...existing];

  for (const id of incoming) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }

  return merged;
}

async function saveChannelVideoOrder(
  channelId: string,
  videoIds: string[],
  mode: "replace" | "append",
) {
  if (videoIds.length === 0) return;

  const creator = await prisma.creator.findUnique({
    where: { id: channelId },
    select: { extra: true },
  });
  if (!creator) return;

  const extra =
    typeof creator.extra === "object" && creator.extra !== null
      ? (creator.extra as Record<string, unknown>)
      : {};

  const existingOrder = Array.isArray(extra.channel_video_order)
    ? (extra.channel_video_order as string[])
    : [];
  const channel_video_order =
    mode === "replace" ? videoIds : appendUniqueIds(existingOrder, videoIds);

  await prisma.creator.update({
    where: { id: channelId },
    data: {
      extra: {
        ...extra,
        channel_video_order,
      },
    },
  });
}

async function fetchDbVideosInChannelOrder(
  creator: Creator,
  offset: number,
  take = CREATOR_DB_BATCH_SIZE,
) {
  const order = getChannelVideoOrder(creator);
  const ids = order.slice(offset, offset + take);
  if (ids.length === 0) return [];

  const videos = await prisma.video.findMany({
    where: {
      id: { in: ids },
      channel_id: creator.id,
      type: VideoType.VIDEO,
    },
    select: dbVideoSelect,
  });

  const videoMap = new Map(videos.map((video) => [video.id, video]));

  return ids
    .map((id) => videoMap.get(id))
    .filter((video): video is NonNullable<typeof video> => !!video)
    .map(mapDbVideoToPreview);
}

export async function updateCreator(creator: Creator) {
  if (!shouldRefreshCreator(creator)) return;

  try {
    logger.info(`Updating creator ${creator.id}`);
    const channel = await yt.getChannel(creator.id);
    const profile = parseChannelProfile(channel);
    await upsertCreatorProfile(channel, profile);
  } catch (error) {
    logger.error({ err: error }, `Failed to update creator ${creator.id}`);
  }
}

function queueCreatorVideoUpserts(channelId: string, videoIds: string[]) {
  if (videoIds.length === 0) return Promise.resolve();

  return (async () => {
    try {
      const existingVideos = await prisma.video.findMany({
        where: { id: { in: videoIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingVideos.map((video) => video.id));
      const missingVideoIds = videoIds.filter((id) => !existingIds.has(id));
      if (missingVideoIds.length === 0) return;

      const creator = await prisma.creator.findUnique({
        where: { id: channelId },
      });
      if (!creator) return;

      await upsertMissingVideos({
        yt,
        missingVideoIds: missingVideoIds.slice(0, 30),
        existingCreatorMap: new Map([[channelId, creator]]),
        type: VideoType.VIDEO,
      });
    } catch (error) {
      logger.error(
        { err: error, channelId },
        "Failed to upsert channel videos in background",
      );
    }
  })();
}

function buildNextCursor({
  phase,
  yt,
  dbAfter,
  orderOffset,
}: CreatorPageCursor): string | null {
  if (phase === "yt" && yt) {
    return encodeCreatorCursor({ phase: "yt", yt, dbAfter });
  }

  if (phase === "db" && dbAfter) {
    return encodeCreatorCursor({ phase: "db", dbAfter });
  }

  if (phase === "order" && orderOffset !== undefined) {
    return encodeCreatorCursor({ phase: "order", orderOffset });
  }

  return null;
}

function buildOrderNextCursor(creator: Creator, nextOffset: number) {
  const order = getChannelVideoOrder(creator);
  if (nextOffset >= order.length) return null;
  return buildNextCursor({ phase: "order", orderOffset: nextOffset });
}

async function fetchCreatorPageFromYoutube(
  channelId: string,
): Promise<CreatorPageResult> {
  const channel = await yt.getChannel(channelId);
  const videosTab = await channel.getVideos();
  const profile = parseChannelProfile(channel);
  const ytVideos = parseVideosFromFeed(videosTab);
  const ytCursor = extractYoutubeContinuationCursor(videosTab);

  await upsertCreatorProfile(channel, profile);

  const ytIds = ytVideos.map((video) => video.id);
  await saveChannelVideoOrder(channelId, ytIds, "replace");
  const dbVideos = await fetchDbVideos({
    channelId,
    excludeIds: ytIds,
    take: CREATOR_DB_BATCH_SIZE,
  });

  const lastDbVideo = dbVideos[dbVideos.length - 1];
  const dbAfter = lastDbVideo?.id;

  await queueCreatorVideoUpserts(channelId, ytIds);

  let nextCursor: string | null = null;
  if (ytCursor) {
    nextCursor = buildNextCursor({
      phase: "yt",
      yt: ytCursor,
      dbAfter,
    });
  } else if (
    dbAfter &&
    (await hasMoreDbVideos({ channelId, dbAfter, excludeIds: ytIds }))
  ) {
    nextCursor = buildNextCursor({ phase: "db", dbAfter });
  }

  return {
    profile,
    videos: [...ytVideos, ...dbVideos.map(mapDbVideoToPreview)],
    nextCursor,
  };
}

async function loadInitialCreatorPage(
  channelId: string,
): Promise<CreatorPageResult> {
  const creator = await prisma.creator.findFirst({
    where: { id: channelId },
  });

  if (!creator) {
    return fetchCreatorPageFromYoutube(channelId);
  }

  if (!hasFullChannelProfile(creator) || !hasChannelVideoOrder(creator)) {
    return fetchCreatorPageFromYoutube(channelId);
  }

  if (shouldRefreshCreator(creator)) {
    updateCreator(creator);
  }

  return loadCreatorPageFromDbOnly(channelId);
}

async function loadYoutubeCreatorPage({
  channelId,
  cursor,
}: {
  channelId: string;
  cursor: CreatorPageCursor;
}): Promise<CreatorPageResult> {
  if (!cursor.yt) {
    return loadDbCreatorPage({
      channelId,
      cursor: { phase: "db", dbAfter: cursor.dbAfter },
    });
  }

  const feed = await fetchYoutubeContinuationFeed(yt, cursor.yt);
  const ytVideos = parseVideosFromFeed(feed);
  const ytCursor = extractYoutubeContinuationCursor(feed);

  await saveChannelVideoOrder(
    channelId,
    ytVideos.map((video) => video.id),
    "append",
  );

  queueCreatorVideoUpserts(
    channelId,
    ytVideos.map((video) => video.id),
  );

  let nextCursor: string | null = null;
  if (ytCursor) {
    nextCursor = buildNextCursor({
      phase: "yt",
      yt: ytCursor,
      dbAfter: cursor.dbAfter,
    });
  } else if (
    cursor.dbAfter &&
    (await hasMoreDbVideos({ channelId, dbAfter: cursor.dbAfter }))
  ) {
    nextCursor = buildNextCursor({ phase: "db", dbAfter: cursor.dbAfter });
  }

  return {
    profile: null,
    videos: ytVideos,
    nextCursor,
  };
}

async function loadDbCreatorPage({
  channelId,
  cursor,
}: {
  channelId: string;
  cursor: CreatorPageCursor;
}): Promise<CreatorPageResult> {
  const dbVideos = await fetchDbVideos({
    channelId,
    dbAfter: cursor.dbAfter,
    take: CREATOR_DB_BATCH_SIZE,
  });

  const lastDbVideo = dbVideos[dbVideos.length - 1];
  let nextCursor: string | null = null;

  if (
    lastDbVideo &&
    (await hasMoreDbVideos({ channelId, dbAfter: lastDbVideo.id }))
  ) {
    nextCursor = buildNextCursor({ phase: "db", dbAfter: lastDbVideo.id });
  }

  return {
    profile: null,
    videos: dbVideos.map(mapDbVideoToPreview),
    nextCursor,
  };
}

async function loadCreatorPageFromDbOnly(
  channelId: string,
  cursor?: CreatorPageCursor,
): Promise<CreatorPageResult> {
  const creator = await prisma.creator.findFirst({
    where: { id: channelId },
  });

  if (!creator) {
    throw new Error("Channel not found");
  }

  const extra = (creator.extra as Record<string, any>) || {};
  const orderOffset = cursor?.phase === "order" ? (cursor.orderOffset ?? 0) : 0;

  const videos = hasChannelVideoOrder(creator)
    ? await fetchDbVideosInChannelOrder(creator, orderOffset)
    : (
        await fetchDbVideos({
          channelId,
          dbAfter: cursor?.dbAfter,
          take: CREATOR_DB_BATCH_SIZE,
        })
      ).map(mapDbVideoToPreview);

  let nextCursor: string | null = null;
  if (hasChannelVideoOrder(creator)) {
    nextCursor = buildOrderNextCursor(creator, orderOffset + videos.length);
  } else {
    const lastDbVideo = videos[videos.length - 1];
    if (
      lastDbVideo &&
      (await hasMoreDbVideos({ channelId, dbAfter: lastDbVideo.id }))
    ) {
      nextCursor = buildNextCursor({ phase: "db", dbAfter: lastDbVideo.id });
    }
  }

  return {
    profile: cursor
      ? null
      : {
          id: creator.id,
          title: creator.title,
          handle: extra.handle || null,
          description: creator.description,
          url: creator.url,
          vanity_channel_url: creator.vanity_channel_url,
          avatars: (creator.avatars as ParsedChannelProfile["avatars"]) || [],
          banner: extra.banner || null,
          subscriber_count: extra.subscriber_count || null,
          video_count: extra.video_count || null,
          is_verified: extra.is_verified || false,
        },
    videos,
    nextCursor,
  };
}

export async function getCreatorPage({
  channelId,
  cursor,
}: {
  channelId: string;
  cursor?: string | null;
}): Promise<CreatorPageResult> {
  if (!cursor) {
    try {
      return await loadInitialCreatorPage(channelId);
    } catch (error) {
      logger.error(
        { err: error, channelId },
        "Failed initial creator page fetch, falling back to DB",
      );
      return loadCreatorPageFromDbOnly(channelId);
    }
  }

  const decoded = decodeCreatorCursor(cursor);
  if (!decoded) {
    return loadInitialCreatorPage(channelId);
  }

  try {
    if (decoded.phase === "yt") {
      return await loadYoutubeCreatorPage({ channelId, cursor: decoded });
    }

    if (decoded.phase === "order") {
      return await loadCreatorPageFromDbOnly(channelId, decoded);
    }

    return await loadDbCreatorPage({ channelId, cursor: decoded });
  } catch (error) {
    logger.error(
      { err: error, channelId, cursor: decoded },
      "Failed creator page continuation, falling back to DB",
    );
    return loadCreatorPageFromDbOnly(channelId, decoded);
  }
}

export async function searchYtVideosAndSaveToDB(
  yt: Innertube,
  query: string,
  limit = 20,
) {
  // Step 1 – search
  const { videoIds, creatorIds, shortIds } = await searchYtVideos(
    yt,
    query,
    limit,
  );

  // Step 2 – check what already exists in DB
  const [existingVideos, existingShorts, existingCreators] = await Promise.all([
    prisma.video.findMany({
      where: { id: { in: videoIds }, type: VideoType.VIDEO },
      include: { creator: true },
    }),
    prisma.video.findMany({
      where: { id: { in: shortIds }, type: VideoType.SHORT },
      include: { creator: true },
    }),
    prisma.creator.findMany({
      where: { id: { in: creatorIds } },
    }),
  ]);

  const existingVideoMap = new Map(existingVideos.map((v) => [v.id, v]));
  const existingShortMap = new Map(existingShorts.map((v) => [v.id, v]));
  const existingCreatorMap = new Map(existingCreators.map((c) => [c.id, c]));

  const missingCreatorIds = creatorIds.filter(
    (id) => !existingCreatorMap.has(id),
  );
  const missingVideoIds = videoIds.filter((id) => !existingVideoMap.has(id));
  const missingShortIds = shortIds.filter((id) => !existingShortMap.has(id));

  // Step 3 – upsert missing creators (must run before videos)
  const newCreators = await upsertMissingCreators({
    yt,
    missingCreatorIds: missingCreatorIds,
  });

  // Step 4 – upsert missing videos and shorts in parallel
  const [newVideos, newShorts] = await Promise.all([
    upsertMissingVideos({
      yt,
      missingVideoIds,
      existingCreatorMap,
      newCreators,
      type: VideoType.VIDEO,
    }),
    upsertMissingVideos({
      yt,
      missingVideoIds: missingShortIds,
      existingCreatorMap,
      newCreators,
      type: VideoType.SHORT,
    }),
  ]);

  // Step 5 – return in original search order
  const allVideosMap = new Map([
    ...existingVideos.map((v) => [v.id, v] as const),
    ...newVideos.map((v) => [v.id, v] as const),
  ]);
  const allShortsMap = new Map([
    ...existingShorts.map((v) => [v.id, v] as const),
    ...newShorts.map((v) => [v.id, v] as const),
  ]);

  return {
    videos: videoIds
      .map((id) => allVideosMap.get(id))
      .filter((v): v is NonNullable<typeof v> => v !== undefined),
    shorts: shortIds
      .map((id) => allShortsMap.get(id))
      .filter((v): v is NonNullable<typeof v> => v !== undefined),
  };
}

export async function updateVideo(videoInfo: Video) {
  if (
    differenceInDays(
      Date.now().toString(),
      videoInfo?.last_manual_fetch.toString() || Date.now().toString(),
    ) > 7 ||
    Math.abs(videoInfo.updatedAt.getTime() - videoInfo.createdAt.getTime()) <
      1000 ||
    videoInfo.available_qualities.length === 0
  ) {
    logger.info(`Updating video ${videoInfo.id}`);
    const info = await yt.getInfo(videoInfo.id);

    const captions = {};

    await Promise.all(
      info.captions?.caption_tracks?.map(async (track) => {
        try {
          const xml = await fetch(track.base_url).then((res) => res.text());
          const json = parser.parse(xml);
          captions[track.base_url] = json;
        } catch (error) {
          logger.error(
            { err: error },
            `Failed to fetch caption for ${track.language_code}`,
          );
        }
      }) || [],
    );

    const chapters = parseYouTubeChapters(
      info.basic_info.short_description || "",
    );

    let nextVideos =
      info.player_overlays?.end_screen?.results
        ?.filter((v) => v.is(YTNodes.EndScreenVideo))
        .map((v) => v.as(YTNodes.EndScreenVideo))
        .map((video) => ({
          id: video.id,
          title: video.title.toString(),
          duration: video.duration.seconds,
          view_count: String(
            parseViewCount(video.short_view_count.text?.toString() || "0") || 0,
          ),
          thumbnails: _.uniqBy(
            video.thumbnails.map((thumbnail) => ({
              url: thumbnail.url.split("?")[0],
              width: thumbnail.width,
              height: thumbnail.height,
            })),
            "url",
          ),
          creator: {
            id: video.author.id,
            name: video.author.name,
            url: video.author.url,
          },
        }))
        .splice(0, 6) || [];

    if (videoInfo.type === VideoType.SHORT) {
      const nextVideoInfoExtractor = await yt.getShortsVideoInfo(videoInfo.id);
      const nextVideoPayloads = nextVideoInfoExtractor?.watch_next_feed;

      if (
        nextVideoPayloads &&
        nextVideoPayloads.length &&
        nextVideoPayloads[0]
      ) {
        const nextVideoDetails =
          nextVideoPayloads[0].payload.unserializedPrefetchData?.playerResponse
            .videoDetails;

        const [fetchedNextVideo] = await upsertMissingVideos({
          yt,
          missingVideoIds: [nextVideoDetails.videoId],
          type: VideoType.SHORT,
        });

        if (!fetchedNextVideo) {
          logger.warn(`Failed to fetch next video for shorts ${videoInfo.id}`);
        } else {
          const nextVideoFormatted = {
            id: fetchedNextVideo.id,
            title: fetchedNextVideo.title,
            duration: fetchedNextVideo.duration,
            thumbnails: fetchedNextVideo.thumbnails,
            view_count: fetchedNextVideo.view_count,
            creator: {
              id: fetchedNextVideo.creator?.id || "",
              name: fetchedNextVideo.creator?.title || "",
              url: fetchedNextVideo.creator?.url || "",
            },
          } as (typeof nextVideos)[number];
          nextVideos = [nextVideoFormatted];
        }
      }
    }

    try {
      await prisma.video.update({
        where: {
          id: videoInfo.id,
        },
        data: {
          short_description: info.basic_info.short_description
            ? String(info.basic_info.short_description)
            : null,
          title: info.basic_info.title ? String(info.basic_info.title) : "",
          view_count: String(info.basic_info.view_count || 0),
          duration: Number(info.basic_info.duration) || 0,
          like_count: String(info.basic_info.like_count || 0),
          keywords: info.basic_info.keywords || [],
          heatmap: (info.heat_map as any) || {},
          chapters: {
            deleteMany: {},
            create: chapters.map((chapter) => ({
              title: chapter.title,
              start: chapter.start,
              end: chapter.end || Number(info.basic_info.duration) || 0,
            })),
          },
          available_qualities: info.streaming_data
            ? (
                Array.from(
                  new Set(
                    info.streaming_data.adaptive_formats.map(
                      (e) => e.quality_label,
                    ),
                  ),
                ).filter((e) => !!e) as string[]
              ).concat(["best", "bestefficiency"])
            : [],
          category: info.basic_info.category
            ? String(info.basic_info.category)
            : null,
          captions: {
            upsert:
              info.captions?.caption_tracks?.map((track) => ({
                where: {
                  base_url: track.base_url,
                },
                create: {
                  base_url: track.base_url,
                  language_code: track.language_code,
                  base_url_to_json: captions?.[track.base_url],
                },
                update: {
                  language_code: track.language_code,
                  base_url_to_json: captions?.[track.base_url],
                },
              })) || [],
          },
          thumbnails: _.uniqBy(
            info.basic_info.thumbnail?.map((thumbnail) => ({
              url: thumbnail.url.split("?")[0],
              width: thumbnail.width,
              height: thumbnail.height,
            })) || [],
            "url",
          ),
          nextEdges: {
            upsert: nextVideos.map((video, i) => ({
              where: {
                fromId_toId: {
                  fromId: videoInfo.id,
                  toId: video.id,
                },
              },
              update: {
                position: i,
                to: {
                  update: {
                    title: video.title.toString(),
                    duration: video.duration,
                    view_count: video.view_count,
                    thumbnails: _.uniqBy(
                      video.thumbnails.map((thumbnail) => ({
                        url: thumbnail.url?.split("?")[0],
                        width: thumbnail.width,
                        height: thumbnail.height,
                      })),
                      "url",
                    ),
                  },
                },
              },
              create: {
                position: i,
                to: {
                  connectOrCreate: {
                    where: {
                      id: video.id,
                    },
                    create: {
                      id: video.id,
                      title: video.title.toString(),
                      duration: video.duration,
                      view_count: video.view_count,
                      thumbnails: _.uniqBy(
                        video.thumbnails.map((thumbnail) => ({
                          url: thumbnail.url?.split("?")[0],
                          width: thumbnail.width,
                          height: thumbnail.height,
                        })),
                        "url",
                      ),
                      creator: {
                        connectOrCreate: {
                          where: {
                            id: video.creator.id,
                          },
                          create: {
                            id: video.creator.id,
                            title: video.creator.name,
                            url: video.creator.url,
                          },
                        },
                      },
                    },
                  },
                },
              },
            })),
          },
        },
      });
    } catch (error) {
      logger.error({ err: error }, `Failed to update video ${videoInfo.id}`);
      console.error(error);
    }
  }
}
