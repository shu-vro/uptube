import type { Video } from "@/types/prisma";

export type LibraryVideo = Video & {
  watchedAt?: string;
  likedAt?: string;
  addedAt?: string;
};

export type LibraryOverview = {
  history: LibraryVideo[];
  likedVideos: {
    count: number;
    preview: LibraryVideo[];
  };
  bookmarks: BookmarkCollectionSummary[];
};

export type BookmarkCollectionSummary = {
  id: string;
  name: string;
  count: number;
  preview: LibraryVideo | null;
};

export type BookmarkCollection = {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  updatedAt: string;
};

export type VideoLibraryStatus = {
  liked: boolean;
  bookmarked: boolean;
  bookmarkIds: string[];
};

export type PaginatedLibraryVideos = {
  items: LibraryVideo[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type BookmarkVideosResponse = PaginatedLibraryVideos & {
  bookmark: {
    id: string;
    name: string;
  } | null;
};
