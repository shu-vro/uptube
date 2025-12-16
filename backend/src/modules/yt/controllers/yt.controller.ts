import logger from "config/logger/pino.logger";
import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import { Innertube, UniversalCache, YTNodes } from "youtubei.js";
import { Platform, Types } from "youtubei.js/web";
import { sanitizeYtUrl } from "utils/yt";
import { searchYtVideosAndSaveToDB } from "./yt.search.controller";
import _ from "lodash";
import {
  idSchema,
  paginationSchema,
  searchQuerySchema,
} from "../validators/yt.validator";

Platform.shim.eval = async (
  data: Types.BuildScriptResult,
  env: Record<string, Types.VMPrimative>
) => {
  const properties: string[] = [];

  if (env.n) {
    properties.push(`n: exportedVars.nFunction("${env.n}")`);
  }

  if (env.sig) {
    properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  }

  const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

  return new Function(code)();
};

export const yt = await Innertube.create({
  cache: new UniversalCache(true, "./.cache"),
  generate_session_locally: true,
  // cookie:
  //   "",
});

// not used
export const getVideoDetailedInfo = asyncHandler(async (req: Request) => {
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

export const getVideoInfo = asyncHandler(async (req: Request) => {
  const videoId = sanitizeYtUrl(req.query.id as string);
  if (!videoId) {
    return req._error("Invalid video ID");
  }
  const videoInfo = await prisma.video.findFirst({
    where: {
      id: videoId,
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

  extraworks(videoId);

  req._success(videoInfo);
});

async function extraworks(videoId: string) {
  // crunch latest data about this under the hood.
  const info = await yt.actions.execute("/player", {
    videoId,
    client: "YTMUSIC", // InnerTube client to use. only get necessary info
    parse: true, // tells YouTube.js to parse the response (not sent to InnerTube).
  });

  console.log(info);
}

export const searchVideos = asyncHandler(async (req: Request) => {
  const parseResult = searchQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return req._error({ message: parseResult.error.issues[0].message });
  }
  const query = parseResult.data.q;
  const limit = parseResult.data.limit;

  const orderedResults = await searchYtVideosAndSaveToDB(yt, query, limit);

  req._success(orderedResults);
});

export const showSuggestions = asyncHandler(async (req: Request) => {
  const query = req.query.q as string;
  if (!query || query.length < 1) {
    return req._error("Query is required");
  }
  const suggestions = await yt.getSearchSuggestions(query);
  req._success(suggestions);
});

export const home = asyncHandler(async (req: Request) => {
  const parseResult = paginationSchema.safeParse(req.query);
  if (!parseResult.success) {
    return req._error({ message: parseResult.error.issues[0].message });
  }
  const page = parseResult.data.page;
  const limit = parseResult.data.limit;
  if (!global.videoIds || global.videoIds.length === 0) {
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
    return;
  }

  const vidIds = _.sampleSize(global.videoIds, limit);
  const videos = await prisma.video.findMany({
    where: {
      id: {
        in: vidIds,
      },
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

export const getDownloadData = asyncHandler(
  async (req: Request<{}, { id: string }, Types.FormatOptions>) => {
    const result = idSchema.safeParse(req.query.id);
    if (!result.success) {
      return req._error({ message: result.error.issues[0].message });
    }
    const id = result.data;
    let body = req.body;
    const videoInfo = await yt.getStreamingData(id, {
      format: "any",
      type: "video+audio",
      quality: "360p",
      ...body,
    });
    req._success({ message: "Fetched home feed", data: videoInfo });
  }
);

// const info = await yt.getSearchSuggestions("linear algebra");
// const info = await yt.getHashtag("game");
// const info = await yt.resolveURL(
//   "https://www.youtube.com/watch?v=m6qieXZsgwo&t=3s"
// );
// const info = await yt.getChannel("UC6ZVQBJ00cRkZSnbOZEmCkA");
// const info = await yt.search("what is binary search?");
// const info = await yt.getHomeFeed();
export const do_something = asyncHandler(async (req: Request) => {
  let body = req.body;
  const videoInfo = await yt.getStreamingData("m6qieXZsgwo", {
    format: "any",
    type: "video+audio",
    quality: "360p",
    ...body,
  });
  req._success({ message: "Fetched home feed", data: videoInfo });
});
