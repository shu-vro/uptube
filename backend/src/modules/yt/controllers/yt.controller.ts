import logger from "config/logger/pino.logger";
import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import { Innertube, UniversalCache, YTNodes } from "youtubei.js";
import { sanitizeYtUrl } from "utils/yt";
import { searchYtVideosAndSaveToDB } from "./yt.search.controller";

export const yt = await Innertube.create({
  cache: new UniversalCache(true, "./.cache"),
  generate_session_locally: true,
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

  const orderedResults = await searchYtVideosAndSaveToDB(yt, query, limit);

  req._success(orderedResults);
});

export const home = asyncHandler(async (req: Request) => {
  const page = req.query?.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query?.limit ? parseInt(req.query.limit as string, 10) : 20;
  const videos = await prisma.video.findMany({
    take: limit,
    skip: (page - 1) * limit,
    orderBy: {
      view_count: "desc",
    },
    include: {
      creator: {
        include: {
          avatars: true,
        },
      },
      thumbnails: true,
    },
  });
  req._success(videos);
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
  const info = await yt.getHomeFeed();
  req._success({ message: "Fetched home feed", data: info });
});
