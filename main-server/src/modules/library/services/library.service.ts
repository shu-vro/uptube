import { libraryVideoSelect } from "utils/safe_fields/library";

const HISTORY_PREVIEW_LIMIT = 12;
const LIKED_PREVIEW_LIMIT = 4;

async function assertVideoExists(videoId: string) {
  const video = await global.prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true },
  });
  if (!video) {
    throw new Error("Video not found");
  }
}

async function assertBookmarkOwnership(bookmarkId: string, userId: string) {
  const bookmark = await global.prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId },
    select: { id: true },
  });
  if (!bookmark) {
    throw new Error("Bookmark not found");
  }
}

export async function getOverview(userId: string) {
  const [historyEntries, likedCount, recentLikes, bookmarks] =
    await Promise.all([
      global.prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: "desc" },
        take: HISTORY_PREVIEW_LIMIT,
        select: {
          watchedAt: true,
          video: { select: libraryVideoSelect },
        },
      }),
      global.prisma.userLike.count({ where: { userId } }),
      global.prisma.userLike.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: LIKED_PREVIEW_LIMIT,
        select: {
          video: { select: libraryVideoSelect },
        },
      }),
      global.prisma.bookmark.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          _count: { select: { items: true } },
          items: {
            orderBy: { addedAt: "desc" },
            take: 1,
            select: {
              video: { select: libraryVideoSelect },
            },
          },
        },
      }),
    ]);

  return {
    history: historyEntries.map((entry) => ({
      ...entry.video,
      watchedAt: entry.watchedAt,
    })),
    likedVideos: {
      count: likedCount,
      preview: recentLikes.map((like) => like.video),
    },
    bookmarks: bookmarks.map((bookmark) => ({
      id: bookmark.id,
      name: bookmark.name,
      count: bookmark._count.items,
      preview: bookmark.items[0]?.video ?? null,
    })),
  };
}

export async function getHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    global.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      skip,
      take: limit,
      select: {
        watchedAt: true,
        video: { select: libraryVideoSelect },
      },
    }),
    global.prisma.watchHistory.count({ where: { userId } }),
  ]);

  return {
    items: entries.map((entry) => ({
      ...entry.video,
      watchedAt: entry.watchedAt,
    })),
    page,
    limit,
    total,
    hasMore: skip + entries.length < total,
  };
}

export async function recordHistory(userId: string, videoId: string) {
  await assertVideoExists(videoId);

  return global.prisma.watchHistory.upsert({
    where: { userId_videoId: { userId, videoId } },
    create: { userId, videoId },
    update: { watchedAt: new Date() },
  });
}

export async function getLikes(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [likes, total] = await Promise.all([
    global.prisma.userLike.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        createdAt: true,
        video: { select: libraryVideoSelect },
      },
    }),
    global.prisma.userLike.count({ where: { userId } }),
  ]);

  return {
    items: likes.map((like) => ({
      ...like.video,
      likedAt: like.createdAt,
    })),
    page,
    limit,
    total,
    hasMore: skip + likes.length < total,
  };
}

export async function toggleLike(userId: string, videoId: string) {
  await assertVideoExists(videoId);

  const existing = await global.prisma.userLike.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  if (existing) {
    await global.prisma.userLike.delete({
      where: { userId_videoId: { userId, videoId } },
    });
    return { liked: false };
  }

  await global.prisma.userLike.create({
    data: { userId, videoId },
  });
  return { liked: true };
}

export async function getVideoStatus(userId: string, videoId: string) {
  const [like, bookmarkItems] = await Promise.all([
    global.prisma.userLike.findUnique({
      where: { userId_videoId: { userId, videoId } },
      select: { id: true },
    }),
    global.prisma.bookmarkItem.findMany({
      where: {
        videoId,
        bookmark: { userId },
      },
      select: { bookmarkId: true },
    }),
  ]);

  const bookmarkIds = bookmarkItems.map((item) => item.bookmarkId);

  return {
    liked: !!like,
    bookmarked: bookmarkIds.length > 0,
    bookmarkIds,
  };
}

export async function listBookmarks(userId: string) {
  const bookmarks = await global.prisma.bookmark.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  return bookmarks.map((bookmark) => ({
    id: bookmark.id,
    name: bookmark.name,
    count: bookmark._count.items,
    createdAt: bookmark.createdAt,
    updatedAt: bookmark.updatedAt,
  }));
}

export async function createBookmark(userId: string, name: string) {
  return global.prisma.bookmark.create({
    data: { userId, name },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });
}

export async function renameBookmark(
  userId: string,
  bookmarkId: string,
  name: string,
) {
  await assertBookmarkOwnership(bookmarkId, userId);

  return global.prisma.bookmark.update({
    where: { id: bookmarkId },
    data: { name },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });
}

export async function deleteBookmark(userId: string, bookmarkId: string) {
  await assertBookmarkOwnership(bookmarkId, userId);

  await global.prisma.bookmark.delete({
    where: { id: bookmarkId },
  });
}

export async function getBookmarkVideos(
  userId: string,
  bookmarkId: string,
  page: number,
  limit: number,
) {
  await assertBookmarkOwnership(bookmarkId, userId);

  const skip = (page - 1) * limit;

  const [items, total, bookmark] = await Promise.all([
    global.prisma.bookmarkItem.findMany({
      where: { bookmarkId },
      orderBy: { addedAt: "desc" },
      skip,
      take: limit,
      select: {
        addedAt: true,
        video: { select: libraryVideoSelect },
      },
    }),
    global.prisma.bookmarkItem.count({ where: { bookmarkId } }),
    global.prisma.bookmark.findUnique({
      where: { id: bookmarkId },
      select: { id: true, name: true },
    }),
  ]);

  return {
    bookmark,
    items: items.map((item) => ({
      ...item.video,
      addedAt: item.addedAt,
    })),
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  };
}

export async function addVideoToBookmark(
  userId: string,
  bookmarkId: string,
  videoId: string,
) {
  await assertBookmarkOwnership(bookmarkId, userId);
  await assertVideoExists(videoId);

  await global.prisma.bookmarkItem.upsert({
    where: { bookmarkId_videoId: { bookmarkId, videoId } },
    create: { bookmarkId, videoId },
    update: {},
  });

  await global.prisma.bookmark.update({
    where: { id: bookmarkId },
    data: { updatedAt: new Date() },
  });
}

export async function removeVideoFromBookmark(
  userId: string,
  bookmarkId: string,
  videoId: string,
) {
  await assertBookmarkOwnership(bookmarkId, userId);

  await global.prisma.bookmarkItem.deleteMany({
    where: { bookmarkId, videoId },
  });

  await global.prisma.bookmark.update({
    where: { id: bookmarkId },
    data: { updatedAt: new Date() },
  });
}
