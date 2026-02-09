import logger from "config/logger/pino.logger";
import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import { Innertube, UniversalCache, YTNodes } from "youtubei.js";
import { Platform, Types, Utils, YT, Constants } from "youtubei.js/web";
import { sanitizeYtUrl } from "utils/yt";
import { searchYtVideosAndSaveToDB, updateVideo } from "./yt.search.controller";
import { differenceInDays } from "utils/time";
import _ from "lodash";
import {
  idSchema,
  paginationSchema,
  searchQuerySchema,
} from "../validators/yt.validator";
import { Video } from "generated/prisma/client";

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
  cookie: ``,
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
      creator: true,
      captions: true,
      chapters: true,
      nextEdges: {
        orderBy: {
          position: "asc",
        },
        take: 10,
        skip: 0,
        include: {
          to: {
            include: {
              creator: true,
            },
          },
        },
      },
    },
  });

  updateVideo(videoInfo as Video);

  req._success(videoInfo);
});

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

import util from "util";

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
        creator: true,
      },
    });
    req._success(videos);
    return;
  }

  const vidIds = _.sampleSize(global.videoIds, limit);
  console.log(vidIds);
  const videos = await prisma.video.findMany({
    where: {
      id: {
        in: vidIds,
      },
    },
    include: {
      creator: true,
    },
  });
  req._success(videos);
});

export const getDownloadData = asyncHandler(
  async (req: Request<any, any, Types.FormatOptions>) => {
    const result = idSchema.safeParse(req.params.id);
    if (!result.success) {
      return req._error({ message: result.error.issues[0].message });
    }
    const id = result.data;
    let body = req.body;
    const quality = (body.quality as string) || "bestefficiency";
    const videoInfo = await yt.getStreamingData(id, {
      format: "any",
      type: "video+audio",
      quality,
      ...body,
    });
    req._success({ message: "Fetched home feed", data: videoInfo });
  }
);

export const updateDislikes = asyncHandler(async (req: Request) => {
  const videoId = req.params.video_id;
  const dislikeCount = req.body.dislike_count;
  if (!videoId) {
    return req._error("Video ID is required");
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    // only select 2 fields: dislike_count and extra
    select: {
      dislike_count: true,
      extra: true,
    },
  });

  if (!video) {
    return req._error("Video not found");
  }
  if (dislikeCount === undefined || typeof dislikeCount !== "number") {
    return req._error("Dislike count is required and must be a number");
  }

  if (!video.extra) {
    video.extra = {};
  }

  const days = 3;

  if (
    typeof video.extra === "object" &&
    video.extra !== null &&
    differenceInDays(
      new Date().toISOString(),
      (video.extra as any).last_disliked_at || new Date(0).toISOString()
    ) < days
  ) {
    return req._error(
      `You can only dislike a video once every ${days} days`,
      429
    );
  }

  await prisma.video.update({
    where: { id: videoId },
    data: {
      dislike_count: String(dislikeCount),
      extra: {
        ...(typeof video.extra === "object" && video.extra !== null
          ? video.extra
          : {}),
        last_disliked_at: new Date().toISOString(),
      },
    },
  });

  req._success("ok");
});

import { SabrStream } from "googlevideo/sabr-stream";
import { buildSabrFormat, EnabledTrackTypes } from "googlevideo/utils";
import type { SabrFormat } from "googlevideo/shared-types";

// const info = await yt.getSearchSuggestions("linear algebra");
// const info = await yt.getHashtag("game");
// const info = await yt.resolveURL(
//   "https://www.youtube.com/watch?v=m6qieXZsgwo&t=3s"
// );
// const info = await yt.getChannel("UC6ZVQBJ00cRkZSnbOZEmCkA");
// const info = await yt.search("what is binary search?");
// const info = await yt.getHomeFeed();

export const do_something = asyncHandler(async (req: Request) => {
  // const videoInfo = await yt.getInfo("m6qieXZsgwo", {});
  // Bun.write(Bun.file("yt-video-info.json"), JSON.stringify(videoInfo, null, 2));
  // const downloadData = await yt.getStreamingData("m6qieXZsgwo", {
  //   // quality: "best",
  //   itag: 303,
  // });

  const videoId = sanitizeYtUrl("PG5sv20Jiic");
  if (!videoId) {
    return req._error("Invalid video ID");
  }

  // const videoInfo = await yt.actions.execute("/player", {
  //   videoId,
  //   contentCheckOk: true,
  //   racyCheckOk: true,
  //   playbackContext: {
  //     adPlaybackContext: {
  //       pyv: true,
  //     },
  //     contentPlaybackContext: {
  //       signatureTimestamp: yt.session.player?.signature_timestamp,
  //     },
  //   },
  // });

  const videoInfo = await yt.getInfo(videoId);

  // Bun.write(Bun.file("yt-video-info.json"), JSON.stringify(videoInfo, null, 2));

  // const videoInfo = await yt.getHomeFeed();
  // const dld = await yt.download("m6qieXZsgwo", {
  //   // quality: "hd720",
  // });

  req._success(videoInfo);
});
