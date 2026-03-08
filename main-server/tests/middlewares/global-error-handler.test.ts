import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import globalErrorHandler from "../../src/middlewares/error/global";
import ApiError from "../../src/utils/error/ApiError";

function createMocks() {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("globalErrorHandler middleware", () => {
  it("handles ApiError with custom statusCode and message", () => {
    const { req, res, next } = createMocks();
    const err = new ApiError("Not Found", 404);

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 404,
      message: "Not Found",
    });
  });

  it("defaults to 500 when statusCode is missing", () => {
    const { req, res, next } = createMocks();
    const err = { message: "Unknown error" } as ApiError;

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 500,
      message: "Unknown error",
    });
  });

  it("defaults to 'Internal Server Error' when message is missing", () => {
    const { req, res, next } = createMocks();
    const err = { statusCode: 500 } as ApiError;

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    });
  });

  it("handles ApiError with 400 Bad Request", () => {
    const { req, res, next } = createMocks();
    const err = new ApiError("Bad Request", 400);

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: "Bad Request",
    });
  });

  it("handles ApiError with 401 Unauthorized", () => {
    const { req, res, next } = createMocks();
    const err = new ApiError("Unauthorized", 401);

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("handles ApiError with 429 Too Many Requests", () => {
    const { req, res, next } = createMocks();
    const err = new ApiError("Too many requests", 429);

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 429,
      message: "Too many requests",
    });
  });

  it("always sets success: false", () => {
    const { req, res, next } = createMocks();
    const err = new ApiError("Test", 200);

    globalErrorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
