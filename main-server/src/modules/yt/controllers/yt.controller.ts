import logger from "config/logger/pino.logger";
import { Request, Response } from "express";
import { asyncHandler } from "utils/async-handler";
import { Innertube as asdf, UniversalCache, YTNodes } from "youtubei.js";
import {
  Platform,
  Types,
  Utils,
  YT,
  Constants,
  Innertube,
} from "youtubei.js/web";
import { sanitizeYtUrl } from "utils/yt";
import { Readable } from "stream";
import { searchYtVideosAndSaveToDB, updateVideo } from "./yt.search.controller";
import { differenceInDays } from "utils/time";
import _ from "lodash";
import {
  downloadVideoQualityOptionsSchema,
  downloadVideoSchema,
  idSchema,
  paginationSchema,
  searchQuerySchema,
  updateDislikesSchema,
} from "../validators/yt.validator";
import { Video } from "generated/prisma/client";

// Platform.shim.eval = async (
//   data: Types.BuildScriptResult,
//   env: Record<string, Types.VMPrimative>
// ) => {
//   const getExportedVars = new Function(
//     `${data.output}\nreturn typeof exportedVars === "object" && exportedVars !== null ? exportedVars : {};`
//   ) as () => Record<string, unknown>;

//   const exportedVars = getExportedVars();
//   const result: Record<string, string> = {};

//   console.log(
//     "Deciphering player script with exported variables",
//     exportedVars ?? "no",
//     env ?? "no"
//   );

//   if (typeof env.n === "string") {
//     const nFn = exportedVars.nFunction;
//     if (typeof nFn === "function") {
//       try {
//         result.n = nFn(env.n) as string;
//       } catch (error) {
//         logger.warn({ error }, "Failed to decipher n value, using original");
//         result.n = env.n;
//       }
//     } else {
//       logger.warn("Player script did not export nFunction, using original n");
//       result.n = env.n;
//     }
//   }

//   if (typeof env.sig === "string") {
//     const sigFn = exportedVars.sigFunction;
//     if (typeof sigFn === "function") {
//       try {
//         result.sig = sigFn(env.sig) as string;
//       } catch (error) {
//         logger.warn({ error }, "Failed to decipher signature, using original");
//         result.sig = env.sig;
//       }
//     } else {
//       logger.warn(
//         "Player script did not export sigFunction, using original signature"
//       );
//       result.sig = env.sig;
//     }
//   }

//   return result;
// };

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

  if (videoInfo) {
    updateVideo(videoInfo);
  }

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
  const parsed = updateDislikesSchema.parse({
    ...req.body,
    ...req.params,
  });

  const { video_id, dislike_count } = parsed;

  const video = await prisma.video.findUnique({
    where: { id: video_id },
    select: {
      dislike_count: true,
      extra: true,
    },
  });

  if (!video) {
    return req._error("Video not found");
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
    where: { id: video_id },
    data: {
      dislike_count: String(dislike_count),
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

export const downloadVideo = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = downloadVideoSchema.safeParse(req.params);
    if (!parsed.success) {
      return req._error({ message: parsed.error.issues[0].message });
    }

    const parsedBody = downloadVideoQualityOptionsSchema.safeParse(req.query);
    if (!parsedBody.success) {
      console.log(parsedBody.error);
      return req._error({ message: parsedBody.error.issues[0].message });
    }
    const { video_id } = parsed.data;
    let options = parsedBody.data ?? {};

    const streamingData = await yt.getStreamingData(video_id, {
      format: "any",
      type: "video+audio",
      quality: "bestefficiency",
      ...options,
    });
    const contentLength = streamingData?.content_length;

    // if (options.range) {
    //   options.range.start ??= 0;
    //   options.range.end ??= streamingData.approx_duration_ms / 1000;
    // }

    const downloadStream = await yt.download(video_id, options);
    res.setHeader("Content-Type", "video/mp4");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength.toString()); // in bytes
    } else {
      res.setHeader("Transfer-Encoding", "chunked");
    }
    Readable.fromWeb(downloadStream as ReadableStream<Uint8Array>).pipe(res);
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
  // const videoInfo = await yt.getInfo("m6qieXZsgwo", {});
  // Bun.write(Bun.file("yt-video-info.json"), JSON.stringify(videoInfo, null, 2));
  // const downloadData = await yt.getStreamingData("m6qieXZsgwo", {
  //   // quality: "best",
  //   itag: 303,
  // });

  // NOTE: Never run a synchronous blocking loop directly in a route handler.
  // It blocks Node's event loop and starves every other request.
  // For CPU-intensive / long-running work, offload to a Worker Thread:
  //
  // import { Worker, isMainThread, workerData, parentPort } from "worker_threads";
  //
  // await new Promise<void>((resolve, reject) => {
  //   const worker = new Worker(
  //     `
  //     const { parentPort } = require('worker_threads');
  //     while (1) {}          // runs on a separate thread — event loop stays free
  //     parentPort.postMessage('done');
  //     `,
  //     { eval: true }
  //   );
  //   worker.on("message", () => { worker.terminate(); resolve(); });
  //   worker.on("error", reject);
  // });

  const videoId = sanitizeYtUrl("IfrJfGowmj0");
  if (!videoId) {
    return req._error("Invalid video ID");
  }

  // const videos = await yt.search("Typescript", {
  //   type: "all",
  // });
  const videoInfo = await yt.getShortsVideoInfo(videoId);

  // const videoInfo = await yt.actions.execute("/player", {
  //   videoId,
  //   client: "YTMUSIC",
  //   parse: true,
  // });

  // const videoInfo = await yt.getInfo(videoId);
  // const videoInfo = await yt.search("typescript", {
  //   type: "all",
  // });

  Bun.write(Bun.file("yt-video-info.json"), JSON.stringify(videoInfo, null, 2));

  // const videoInfo = await yt.getHomeFeed();
  // const dld = await yt.download("m6qieXZsgwo", {
  //   // quality: "hd720",
  // });

  req._success(videoInfo);
});
