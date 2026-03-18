import logger from "config/logger/pino.logger";
import { Innertube, YTNodes } from "youtubei.js";
import { sanitizeYtUrl } from "utils/yt";
import { parseDurationToSeconds } from "utils/yt/parseDurationToSeconds";
import { parseViewCount } from "utils/yt/parseViewCount";
import { differenceInDays } from "utils/time";
import { Prisma, Video, VideoType } from "generated/prisma/client";
import { yt } from "modules/yt/controllers/yt.controller";
import _ from "lodash";
import { XMLParser } from "fast-xml-parser";
import parseYouTubeChapters from "utils/parse-youtube-chapters";

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
            ? (r as YTNodes.GridShelfView)?.contents ?? []
            : []
        ) as YTNodes.ShortsLockupView[]
      )
        .map((v) => v?.on_tap_endpoint?.payload?.videoId)
        .filter(Boolean)
    );

    videoIds = _.uniq(uploadableVideos.map((v) => v.video_id));
    creatorIds = _.uniq(
      uploadableVideos.map((v) => v.author?.id).filter(Boolean) as string[]
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
    missingCreatorIds.map((id) => yt.getChannel(id))
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
      "url"
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
              `Failed to fetch creator for channel ${videoDetails.channel_id}`
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
              "url"
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
              "url"
            ),
          },
          include: { creator: true },
        };
      } catch (error: any) {
        logger.warn(`Failed to fetch video ${videoId}:`, error);
        return null;
      }
    })
  );

  return prisma.$transaction(
    videoInfos.flatMap((info) => {
      if (info && info.status === "fulfilled" && info.value !== null) {
        return [prisma.video.upsert(info.value)];
      }
      return [];
    })
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
export async function searchYtVideosAndSaveToDB(
  yt: Innertube,
  query: string,
  limit = 20
) {
  // Step 1 – search
  const { videoIds, creatorIds, shortIds } = await searchYtVideos(
    yt,
    query,
    limit
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
    (id) => !existingCreatorMap.has(id)
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
      videoInfo?.last_manual_fetch.toString() || Date.now().toString()
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
            `Failed to fetch caption for ${track.language_code}`
          );
        }
      }) || []
    );

    const chapters = parseYouTubeChapters(
      info.basic_info.short_description || ""
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
            parseViewCount(video.short_view_count.text?.toString() || "0") || 0
          ),
          thumbnails: _.uniqBy(
            video.thumbnails.map((thumbnail) => ({
              url: thumbnail.url.split("?")[0],
              width: thumbnail.width,
              height: thumbnail.height,
            })),
            "url"
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

      if (nextVideoPayloads && nextVideoPayloads.length) {
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
          last_manual_fetch: new Date(),
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
                      (e) => e.quality_label
                    )
                  )
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
            "url"
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
                        url: thumbnail.url.split("?")[0],
                        width: thumbnail.width,
                        height: thumbnail.height,
                      })),
                      "url"
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
                          url: thumbnail.url.split("?")[0],
                          width: thumbnail.width,
                          height: thumbnail.height,
                        })),
                        "url"
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
