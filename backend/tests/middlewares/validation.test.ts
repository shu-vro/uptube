import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

// We need to mock express-validator since validateRequest uses it
vi.mock("express-validator", () => ({
  validationResult: vi.fn(),
}));

import { validateRequest } from "../../src/middlewares/error/validation";
import { validationResult } from "express-validator";

function createMocks() {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("validateRequest middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls next() when there are no validation errors", () => {
    const { req, res, next } = createMocks();
    (validationResult as any).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with errors when validation fails", () => {
    const { req, res, next } = createMocks();
    const mockErrors = [
      { msg: "Name is required", param: "name", location: "body" },
    ];
    (validationResult as any).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validateRequest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      errors: mockErrors,
    });
  });

  it("returns multiple validation errors", () => {
    const { req, res, next } = createMocks();
    const mockErrors = [
      { msg: "Email is required", param: "email", location: "body" },
      { msg: "Password too short", param: "password", location: "body" },
    ];
    (validationResult as any).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validateRequest(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      errors: mockErrors,
    });
  });
});
