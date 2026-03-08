import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import isEncrypted from "../../src/middlewares/auth/is_encrypted/index";

function createMocks(headers: Record<string, string> = {}, encrypted = false) {
  const req = {
    headers,
    encrypted,
    _error: vi.fn(),
  } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("isEncrypted middleware", () => {
  it("calls next() when x-encrypt header is '1' and req.encrypted is true", () => {
    const { req, res, next } = createMocks({ "x-encrypt": "1" }, true);
    isEncrypted(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req._error).not.toHaveBeenCalled();
  });

  it("returns error when x-encrypt header is missing", () => {
    const { req, res, next } = createMocks({}, true);
    isEncrypted(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(req._error).toHaveBeenCalledWith("ACCESS RESTRICTED", 400);
  });

  it("returns error when x-encrypt is '0'", () => {
    const { req, res, next } = createMocks({ "x-encrypt": "0" }, true);
    isEncrypted(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(req._error).toHaveBeenCalledWith("ACCESS RESTRICTED", 400);
  });

  it("returns error when req.encrypted is false", () => {
    const { req, res, next } = createMocks({ "x-encrypt": "1" }, false);
    isEncrypted(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(req._error).toHaveBeenCalledWith("ACCESS RESTRICTED", 400);
  });

  it("returns error when both conditions are false", () => {
    const { req, res, next } = createMocks({}, false);
    isEncrypted(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(req._error).toHaveBeenCalledWith("ACCESS RESTRICTED", 400);
  });

  it("returns error when x-encrypt is some random value", () => {
    const { req, res, next } = createMocks({ "x-encrypt": "true" }, true);
    isEncrypted(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(req._error).toHaveBeenCalledWith("ACCESS RESTRICTED", 400);
  });
});
