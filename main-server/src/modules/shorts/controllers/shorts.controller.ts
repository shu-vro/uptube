import { updateVideo } from "modules/yt/services/yt.service";
import { asyncHandler } from "utils/async-handler";

export const shortsRandom = asyncHandler(async (req, res) => {
  const randomShortId =
    global.shortIds[Math.floor(Math.random() * global.shortIds.length)];
  if (!randomShortId) {
    return req._success({ shorts: [] });
  }
  const short = await prisma.video.findFirst({
    where: {
      id: randomShortId,
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
  if (!short) {
    return req._success({ shorts: [] });
  }
  updateVideo(short);
  return req._success({ shorts: [short] });
});
