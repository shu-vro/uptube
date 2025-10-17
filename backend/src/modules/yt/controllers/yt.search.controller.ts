import logger from "config/logger/pino.logger";
import { Innertube, YTNodes } from "youtubei.js";
import { sanitizeYtUrl } from "utils/yt";

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
    const channelInfos = await Promise.all(
      missingCreatorIds.map((id) => yt.getChannel(id))
    );
    // console.timeEnd("three");

    // console.time("four");
    // Upsert only missing creators
    const upsertOps = channelInfos.map((info) => {
      const md = info.metadata;
      return prisma.creator.upsert({
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
      });
    });
    // console.timeEnd("four");

    // console.time("five");
    newCreators = await prisma.$transaction(upsertOps);
    // console.timeEnd("five");

    // console.time("six");
    // Handle avatars for new creators only
    const allAvatars = channelInfos.flatMap((info) =>
      (info.metadata.thumbnail || []).map((t) => ({
        id: t.url,
        creator_id: info.metadata.external_id,
        width: parseInt(t.width?.toString() ?? "0", 10),
        height: parseInt(t.height?.toString() ?? "0", 10),
      }))
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
    const videoInfos = await Promise.all(
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
                create: (videoDetails.thumbnail || []).map((t) => ({
                  id: t.url,
                  width: t.width || 0,
                  height: t.height || 0,
                })),
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
      videoInfos
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .map((v) => prisma.video.upsert(v))
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
