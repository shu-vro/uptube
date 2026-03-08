import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

// Mock config/env and config/logger before importing asyncHandler
vi.mock("../../src/config/env/index", () => ({
  default: { NODE_ENV: "development" },
}));
vi.mock("../../src/config/logger/pino.logger", () => ({
  default: { error: vi.fn() },
}));

import { asyncHandler } from "../../src/utils/async-handler";

function createMocks() {
  const req = {
    _error: vi.fn(),
    _success: vi.fn(),
  } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("asyncHandler", () => {
  it("calls the wrapped function", async () => {
    const { req, res, next } = createMocks();
    const fn = vi.fn().mockResolvedValue(undefined);

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it("catches async errors and sends 500 response in development", async () => {
    const { req, res, next } = createMocks();
    const fn = vi.fn().mockRejectedValue(new Error("Async failure"));

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(req._error).toHaveBeenCalledWith("Async failure", 500);
  });

  it("handles errors without message property", async () => {
    const { req, res, next } = createMocks();
    const fn = vi.fn().mockRejectedValue({ code: "ECONNREFUSED" });

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    // When error has no message, it falls back to "Internal Server Error"
    expect(req._error).toHaveBeenCalledWith("Internal Server Error", 500);
  });

  it("does not call _error if the function succeeds", async () => {
    const { req, res, next } = createMocks();
    const fn = vi.fn().mockResolvedValue(undefined);

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(req._error).not.toHaveBeenCalled();
  });

  it("passes req, res, next correctly to the handler", async () => {
    const { req, res, next } = createMocks();
    let receivedArgs: any[] = [];
    const fn = vi.fn().mockImplementation((...args) => {
      receivedArgs = args;
      return Promise.resolve();
    });

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(receivedArgs[0]).toBe(req);
    expect(receivedArgs[1]).toBe(res);
    expect(receivedArgs[2]).toBe(next);
  });
});
