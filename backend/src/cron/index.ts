import logger from "config/logger/pino.logger";
import { Cron } from "croner";
import { VideoType } from "generated/prisma/enums";

// TODO: ERROR: until this is done, user will not receieve any video
const videoIdCacheing = async () => {
  const interval = setInterval(async () => {
    if (!global.prisma) return;
    clearInterval(interval);
    logger.info("CRON JOB: Cache Video Ids");
    let vidIds = await global.prisma.video.findMany({
      select: {
        id: true,
        type: true,
      },
    });
    const videoIds = vidIds
      .filter((v) => v.id && v.type === VideoType.VIDEO)
      .map((e) => e.id);
    const shortIds = vidIds
      .filter((v) => v.id && v.type === VideoType.SHORT)
      .map((e) => e.id);
    global.videoIds = videoIds;
    global.shortIds = shortIds;
    //   vidIds.then((ids) => {
    //     const videoIds = ids.map((v) => v.id);
    //     global.redisClient.set("video_ids", JSON.stringify(videoIds));
    //   });
  }, 2000);
};

videoIdCacheing();

const cron = new Cron("*/5 * * * *", videoIdCacheing);
