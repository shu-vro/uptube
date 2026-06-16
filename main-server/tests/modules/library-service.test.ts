import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addVideoToBookmark,
  getOverview,
  getVideoStatus,
  recordHistory,
  toggleLike,
} from "../../src/modules/library/services/library.service";

type MockFn = ReturnType<typeof vi.fn>;

function createPrismaMock() {
  return {
    video: {
      findUnique: vi.fn(),
    },
    watchHistory: {
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    userLike: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    bookmark: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    bookmarkItem: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

describe("library.service", () => {
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    (global as any).prisma = prisma;
  });

  it("getOverview returns mapped overview payload", async () => {
    prisma.watchHistory.findMany.mockResolvedValue([
      {
        watchedAt: new Date("2026-01-01"),
        video: { id: "v1", title: "Video 1", thumbnails: [], duration: 1, type: "VIDEO" },
      },
    ]);
    prisma.userLike.count.mockResolvedValue(2);
    prisma.userLike.findMany.mockResolvedValue([
      {
        video: { id: "v2", title: "Video 2", thumbnails: [], duration: 2, type: "SHORT" },
      },
    ]);
    prisma.bookmark.findMany.mockResolvedValue([
      {
        id: "b1",
        name: "Work",
        _count: { items: 1 },
        items: [{ video: { id: "v3", title: "Video 3", thumbnails: [] } }],
      },
    ]);

    const result = await getOverview("u1");

    expect(result.history).toHaveLength(1);
    expect(result.history[0].id).toBe("v1");
    expect(result.likedVideos.count).toBe(2);
    expect(result.likedVideos.preview[0].id).toBe("v2");
    expect(result.bookmarks[0]).toMatchObject({
      id: "b1",
      name: "Work",
      count: 1,
    });
    expect(prisma.watchHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 12 }),
    );
    expect(prisma.userLike.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 4 }),
    );
  });

  it("recordHistory upserts when video exists", async () => {
    prisma.video.findUnique.mockResolvedValue({ id: "v1" });
    prisma.watchHistory.upsert.mockResolvedValue({ id: "h1" });

    const result = await recordHistory("u1", "v1");

    expect(result).toEqual({ id: "h1" });
    expect(prisma.watchHistory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_videoId: { userId: "u1", videoId: "v1" } },
      }),
    );
  });

  it("recordHistory throws when video is missing", async () => {
    prisma.video.findUnique.mockResolvedValue(null);

    await expect(recordHistory("u1", "missing")).rejects.toThrow("Video not found");
  });

  it("toggleLike creates new like when not existing", async () => {
    prisma.video.findUnique.mockResolvedValue({ id: "v1" });
    prisma.userLike.findUnique.mockResolvedValue(null);

    const result = await toggleLike("u1", "v1");

    expect(result).toEqual({ liked: true });
    expect(prisma.userLike.create).toHaveBeenCalledWith({
      data: { userId: "u1", videoId: "v1" },
    });
  });

  it("toggleLike removes existing like", async () => {
    prisma.video.findUnique.mockResolvedValue({ id: "v1" });
    prisma.userLike.findUnique.mockResolvedValue({ id: "like1" });

    const result = await toggleLike("u1", "v1");

    expect(result).toEqual({ liked: false });
    expect(prisma.userLike.delete).toHaveBeenCalledWith({
      where: { userId_videoId: { userId: "u1", videoId: "v1" } },
    });
  });

  it("getVideoStatus returns liked/bookmarked flags", async () => {
    prisma.userLike.findUnique.mockResolvedValue({ id: "like1" });
    prisma.bookmarkItem.findMany.mockResolvedValue([
      { bookmarkId: "b1" },
      { bookmarkId: "b2" },
    ]);

    const result = await getVideoStatus("u1", "v1");

    expect(result).toEqual({
      liked: true,
      bookmarked: true,
      bookmarkIds: ["b1", "b2"],
    });
  });

  it("addVideoToBookmark validates ownership and video existence", async () => {
    prisma.bookmark.findFirst.mockResolvedValue({ id: "b1" });
    prisma.video.findUnique.mockResolvedValue({ id: "v1" });

    await addVideoToBookmark("u1", "b1", "v1");

    expect(prisma.bookmarkItem.upsert).toHaveBeenCalledWith({
      where: { bookmarkId_videoId: { bookmarkId: "b1", videoId: "v1" } },
      create: { bookmarkId: "b1", videoId: "v1" },
      update: {},
    });
    expect(prisma.bookmark.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "b1" } }),
    );
  });
});
