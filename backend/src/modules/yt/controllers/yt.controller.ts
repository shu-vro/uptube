import logger from "config/logger/pino.logger";
import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import { Innertube, UniversalCache, YTNodes } from "youtubei.js";
import { sanitizeYtUrl } from "utils/yt";

export const yt = await Innertube.create({
  cache: new UniversalCache(true, "./.cache"),
});

export const getVideoInfo = asyncHandler(async (req: Request) => {
  const videoId = sanitizeYtUrl(req.query.id as string);
  if (!videoId) {
    return req._error("Invalid video ID");
  }
  const videoInfo = await yt.actions.execute("/player", {
    videoId,
    client: "YTMUSIC", // InnerTube client to use. only get necessary info
    parse: true, // tells YouTube.js to parse the response (not sent to InnerTube).
  });

  req._success(videoInfo);
});

export const searchVideos = asyncHandler(async (req: Request) => {
  const query = req.query.q as string;
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const videos = await yt.search(query, {
    type: "video",
  });

  const uploadableVideos = videos.videos
    .as(YTNodes.Video)
    .filter((video) => video.type === "Video")
    .splice(0, limit);

  // CREATE CREATOR IF NOT EXISTS
  const creatorIds = Array.from(
    new Set(
      uploadableVideos.map((v) => v.author?.id).filter(Boolean) as string[]
    )
  );

  const channelInfos = await Promise.all(
    creatorIds.map((id) => yt.getChannel(id))
  );

  // upsert creators (no nested avatars)
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

  const creators = await prisma.$transaction(upsertOps);

  // collect avatars and insert in bulk
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

  // UPLOAD ALL VIDEOS WITH THUMBNAIL

  const videoIds = uploadableVideos.map((v) => v.video_id);

  const videoInfos = await Promise.all(
    videoIds.map(async (id) => {
      const videoId = sanitizeYtUrl(id);
      if (!videoId) {
        return req._error("Invalid video ID");
      }
      const videoInfo = await yt.actions.execute("/player", {
        videoId,
        client: "YTMUSIC",
        parse: true,
      });
      const videoDetails = videoInfo.video_details;
      if (!videoDetails) {
        return null;
      }

      const creator = creators.find((c) => c.id === videoDetails.channel_id);
      if (!creator) {
        logger.warn(
          `Creator not found for video ${videoDetails.id} with author id ${videoDetails.author}`
        );
      }
      // prisma upsertable payload
      const payload = {
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
      return payload;
    })
  );

  // upload all payloads
  const createdVideos = await prisma.$transaction(
    videoInfos
      .filter(
        (v): v is Exclude<typeof v, void | null | undefined> =>
          v !== null && v !== undefined
      )
      .map((v) => prisma.video.upsert(v))
  );

  req._success(createdVideos);
});

// const info = await yt.getSearchSuggestions("linear algebra");
// const info = await yt.getHashtag("game");
// const info = await yt.resolveURL(
//   "https://www.youtube.com/watch?v=m6qieXZsgwo&t=3s"
// );
// const info = await yt.getChannel("UC6ZVQBJ00cRkZSnbOZEmCkA");
// const info = await yt.search("what is binary search?");
// const info = await yt.getHomeFeed();
export const doSomething = asyncHandler(async (req: Request) => {
  await global.prisma.thumbnail.deleteMany({});
  await global.prisma.video.deleteMany({});
  await global.prisma.creator.deleteMany({});
  req._success({ message: "Deleted all videos and creators" });
});
