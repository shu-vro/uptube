import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import {
  bookmarkIdSchema,
  bookmarkIdVideoIdSchema,
  createBookmarkSchema,
  paginationSchema,
  recordHistorySchema,
  renameBookmarkSchema,
  videoIdSchema,
} from "../validators/library.validator";
import * as libraryService from "../services/library.service";

function getUserId(req: Request) {
  if (!req.user?.id) {
    throw new Error("Unauthorized");
  }
  return req.user.id;
}

function handleServiceError(req: Request, error: unknown): void {
  if (error instanceof Error) {
    if (error.message === "Video not found") {
      req._error(error.message, 404);
      return;
    }
    if (error.message === "Bookmark not found") {
      req._error(error.message, 404);
      return;
    }
    if (error.message === "Unauthorized") {
      req._error(error.message, 401);
      return;
    }
  }
  throw error;
}

export const getOverview = asyncHandler(async (req: Request) => {
  try {
    const data = await libraryService.getOverview(getUserId(req));
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const getHistory = asyncHandler(async (req: Request) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const data = await libraryService.getHistory(getUserId(req), page, limit);
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const recordHistory = asyncHandler(async (req: Request) => {
  try {
    const { videoId } = recordHistorySchema.parse(req.body);
    await libraryService.recordHistory(getUserId(req), videoId);
    req._success({ recorded: true });
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const getLikes = asyncHandler(async (req: Request) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const data = await libraryService.getLikes(getUserId(req), page, limit);
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const toggleLike = asyncHandler(async (req: Request) => {
  try {
    const { videoId } = videoIdSchema.parse(req.params);
    const data = await libraryService.toggleLike(getUserId(req), videoId);
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const getVideoStatus = asyncHandler(async (req: Request) => {
  try {
    const { videoId } = videoIdSchema.parse(req.params);
    const data = await libraryService.getVideoStatus(getUserId(req), videoId);
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const listBookmarks = asyncHandler(async (req: Request) => {
  try {
    const data = await libraryService.listBookmarks(getUserId(req));
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const createBookmark = asyncHandler(async (req: Request) => {
  try {
    const { name } = createBookmarkSchema.parse(req.body);
    const data = await libraryService.createBookmark(getUserId(req), name);
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const renameBookmark = asyncHandler(async (req: Request) => {
  try {
    const { id } = bookmarkIdSchema.parse(req.params);
    const { name } = renameBookmarkSchema.parse(req.body);
    const data = await libraryService.renameBookmark(getUserId(req), id, name);
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const deleteBookmark = asyncHandler(async (req: Request) => {
  try {
    const { id } = bookmarkIdSchema.parse(req.params);
    await libraryService.deleteBookmark(getUserId(req), id);
    req._success({ deleted: true });
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const getBookmarkVideos = asyncHandler(async (req: Request) => {
  try {
    const { id } = bookmarkIdSchema.parse(req.params);
    const { page, limit } = paginationSchema.parse(req.query);
    const data = await libraryService.getBookmarkVideos(
      getUserId(req),
      id,
      page,
      limit,
    );
    req._success(data);
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const addVideoToBookmark = asyncHandler(async (req: Request) => {
  try {
    const { id, videoId } = bookmarkIdVideoIdSchema.parse(req.params);
    await libraryService.addVideoToBookmark(getUserId(req), id, videoId);
    req._success({ added: true });
  } catch (error) {
    handleServiceError(req, error);
  }
});

export const removeVideoFromBookmark = asyncHandler(async (req: Request) => {
  try {
    const { id, videoId } = bookmarkIdVideoIdSchema.parse(req.params);
    await libraryService.removeVideoFromBookmark(getUserId(req), id, videoId);
    req._success({ removed: true });
  } catch (error) {
    handleServiceError(req, error);
  }
});
