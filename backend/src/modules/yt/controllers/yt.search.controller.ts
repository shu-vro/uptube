import logger from "config/logger/pino.logger";
import { Innertube, YTNodes } from "youtubei.js";
import { sanitizeYtUrl } from "utils/yt";
import { parseDurationToSeconds } from "utils/yt/parseDurationToSeconds";
import { parseViewCount } from "utils/yt/parseViewCount";
import { differenceInDays } from "utils/time";
import { Video } from "generated/prisma/client";
import { yt } from "./yt.controller";
import _ from "lodash";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  attributeNamePrefix: "$_",
});
/**
 * ## Explanation of how this algo works:
 * first, it uses youtubei.js to search for videos matching the query, videos only
 *
 * then, it finds all of those videos and creators in the db. the reason, each search result has to be saved in db.
 *
 * if any creator or video is missing, it fetches them from yt api and upserts them in db.
 *
 * finally, it returns the videos in the same order as search results.
 */
export async function searchYtVideosAndSaveToDB(
  yt: Innertube,
  query: string,
  limit = 20
) {
  const videos = await yt.search(query, {
    type: "video",
  });

  // console.time("one");
  // const uploadableVideos = videos.videos.as(YTNodes.Video).splice(0, limit);

  const uploadableVideos: YTNodes.Video[] = videos.videos
    .filter((e) => e.type === "Video")
    .splice(0, limit) as YTNodes.Video[];

  // return uploadableVideos;
  const videoIds = uploadableVideos.map((v) => v.video_id);
  const creatorIds = Array.from(
    new Set(
      uploadableVideos.map((v) => v.author?.id).filter(Boolean) as string[]
    )
  );
  // console.timeEnd("one");

  // console.time("two");
  // Check what already exists in DB
  const [existingVideos, existingCreators] = await Promise.all([
    prisma.video.findMany({
      where: { id: { in: videoIds } },
      include: { creator: true, thumbnails: true },
    }),
    prisma.creator.findMany({
      where: { id: { in: creatorIds } },
      include: { avatars: true },
    }),
  ]);
  // console.timeEnd("two");

  const existingVideoMap = new Map(existingVideos.map((v) => [v.id, v]));
  const existingCreatorMap = new Map(existingCreators.map((c) => [c.id, c]));

  // Find missing creators and videos
  const missingCreatorIds = creatorIds.filter(
    (id) => !existingCreatorMap.has(id)
  );
  const missingVideoIds = videoIds.filter((id) => !existingVideoMap.has(id));

  let newCreators: any[] = [];
  let newVideos: any[] = [];

  // For creators
  if (missingCreatorIds.length > 0) {
    // console.time("three");
    const channelInfos = await Promise.allSettled(
      missingCreatorIds.map((id) => yt.getChannel(id))
    );
    // console.timeEnd("three");

    // console.time("four");
    // Upsert only missing creators
    const upsertOps = channelInfos.flatMap((info) => {
      if (info.status !== "fulfilled") return [];
      const md = info.value.metadata;
      return [
        prisma.creator.upsert({
          where: { id: md.external_id },
          update: {
            title: md.title,
            description: md.description,
            url: md.url,
            vanity_channel_url: md.vanity_channel_url,
          },
          create: {
            id: md.external_id,
            title: md.title || "Unknown Title",
            description: md.description || "No Description",
            url: md.url || `https://www.youtube.com/channel/${md.external_id}`,
            vanity_channel_url: md.vanity_channel_url || null,
          },
        }),
      ];
    });
    // console.timeEnd("four");

    // console.time("five");
    newCreators = await prisma.$transaction(upsertOps);
    // console.timeEnd("five");

    // console.time("six");
    // Handle avatars for new creators only
    const allAvatars = _.uniqBy(
      channelInfos.flatMap((info) => {
        if (info.status !== "fulfilled") return [];
        return (info.value.metadata.thumbnail || []).map((t) => ({
          url: t.url.split("?")[0],
          creator_id: info.value.metadata.external_id,
          width: parseInt(t.width?.toString() ?? "0", 10),
          height: parseInt(t.height?.toString() ?? "0", 10),
        }));
      }),
      "url"
    );

    if (allAvatars.length > 0) {
      await prisma.thumbnail.createMany({
        data: allAvatars,
        skipDuplicates: true,
      });
    }
    // console.timeEnd("six");
  }

  // Fetch missing videos
  if (missingVideoIds.length > 0) {
    // console.time("seven");
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

          // Look up creator from both existing and new creators
          const creator =
            existingCreatorMap.get(videoDetails.channel_id) ||
            newCreators.find((c) => c.id === videoDetails.channel_id);

          if (!creator) return null;

          return {
            where: { id: videoDetails.id },
            update: {
              title: videoDetails.title,
              short_description: videoDetails?.short_description,
              duration: videoDetails.duration,
              view_count: videoDetails.view_count,
            },
            create: {
              id: videoDetails.id,
              title: videoDetails.title || "Unknown Title",
              channel_id: creator ? creator.id : "unknown",
              short_description: videoDetails?.short_description,
              duration: videoDetails.duration || 0,
              view_count: videoDetails.view_count || 0,
              thumbnails: {
                create: _.uniqBy(
                  (videoDetails.thumbnail || []).map((t) => ({
                    url: t.url.split("?")[0],
                    width: t.width || 0,
                    height: t.height || 0,
                  })),
                  "url"
                ),
              },
            },
            include: { creator: true, thumbnails: true },
          };
        } catch (error: any) {
          logger.warn(`Failed to fetch video ${videoId}:`, error);
          return null;
        }
      })
    );
    // console.timeEnd("seven");

    // console.time("eight");
    // Upsert only new videos
    newVideos = await prisma.$transaction(
      videoInfos.flatMap((info) => {
        if (info && info.status === "fulfilled" && info.value !== null) {
          return [prisma.video.upsert(info.value)];
        }
        return [];
      })
    );
    // console.timeEnd("eight");
  }

  const allVideosMap = new Map([
    ...existingVideos.map((v) => [v.id, v] as const),
    ...newVideos.map((v) => [v.id, v] as const),
  ]);

  const orderedResults = videoIds
    .map((id) => allVideosMap.get(id))
    .filter((v): v is NonNullable<typeof v> => v !== undefined);

  return orderedResults;
}

export async function updateVideo(videoInfo: Video) {
  if (
    differenceInDays(
      videoInfo?.last_manual_fetch.toString() || Date.now().toString(),
      Date.now().toString()
    ) > 7 ||
    Math.abs(videoInfo.updatedAt.getTime() - videoInfo.createdAt.getTime()) <
      1000
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

    const nextVideos =
      info.player_overlays?.end_screen?.results
        .as(YTNodes.EndScreenVideo)
        ?.filter((v) => v.is(YTNodes.EndScreenVideo))
        .map((v) => v.as(YTNodes.EndScreenVideo))
        .splice(0, 6) || [];

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
          view_count: Number(info.basic_info.view_count) || 0,
          duration: Number(info.basic_info.duration) || 0,
          like_count: Number(info.basic_info.like_count) || 0,
          keywords: info.basic_info.keywords || [],
          last_manual_fetch: new Date(),
          available_qualities: info.streaming_data
            ? (Array.from(
                new Set(
                  info.streaming_data.adaptive_formats.map(
                    (e) => e.quality_label
                  )
                )
              ).filter((e) => !!e) as string[]).concat(["best", "bestefficiency"])
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
          thumbnails: {
            upsert:
              _.uniqBy(
                info.basic_info.thumbnail?.map((thumbnail) => ({
                  url: thumbnail.url.split("?")[0],
                  width: thumbnail.width,
                  height: thumbnail.height,
                })) || [],
                "url"
              ).map((thumbnail) => ({
                where: {
                  url: thumbnail.url,
                },
                create: {
                  url: thumbnail.url,
                  width: thumbnail.width,
                  height: thumbnail.height,
                },
                update: {
                  width: thumbnail.width,
                  height: thumbnail.height,
                },
              })) || [],
          },
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
                    duration: video.duration.seconds,
                    view_count:
                      parseViewCount(
                        video.short_view_count.text?.toString() || "0"
                      ) || 0,
                    thumbnails: {
                      upsert: _.uniqBy(
                        video.thumbnails.map((thumbnail) => ({
                          url: thumbnail.url.split("?")[0],
                          width: thumbnail.width,
                          height: thumbnail.height,
                        })),
                        "url"
                      ).map((thumbnail) => ({
                        where: {
                          url: thumbnail.url,
                        },
                        create: {
                          url: thumbnail.url,
                          width: thumbnail.width,
                          height: thumbnail.height,
                        },
                        update: {
                          width: thumbnail.width,
                          height: thumbnail.height,
                        },
                      })),
                    },
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
                      duration: video.duration.seconds,
                      view_count:
                        parseViewCount(
                          video.short_view_count.text?.toString() || "0"
                        ) || 0,
                      thumbnails: {
                        create: _.uniqBy(
                          video.thumbnails.map((thumbnail) => ({
                            url: thumbnail.url.split("?")[0],
                            width: thumbnail.width,
                            height: thumbnail.height,
                          })),
                          "url"
                        ),
                      },
                      creator: {
                        connectOrCreate: {
                          where: {
                            id: video.author.id,
                          },
                          create: {
                            id: video.author.id,
                            title: video.author.name,
                            url: video.author.url,
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
