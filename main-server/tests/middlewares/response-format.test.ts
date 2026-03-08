import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import responseFormat from "../../src/middlewares/utilities/response-format";

function createMocks() {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("responseFormat middleware", () => {
  it("attaches _success and _error methods to req", () => {
    const { req, res, next } = createMocks();
    responseFormat(req, res, next);

    expect(typeof req._success).toBe("function");
    expect(typeof req._error).toBe("function");
    expect(next).toHaveBeenCalledTimes(1);
  });

  describe("req._success", () => {
    it("sends a 200 success response by default", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._success({ message: "hello" });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        data: { message: "hello" },
      });
    });

    it("sends a custom status code (201)", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._success({ id: "new-item" }, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 201,
        data: { id: "new-item" },
      });
    });

    it("sets requestSent to true", () => {
      const { req, res, next } = createMocks();
      req.requestSent = false;
      responseFormat(req, res, next);

      req._success("ok");
      expect(req.requestSent).toBe(true);
    });

    it("sends null data without error", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._success(null);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        data: null,
      });
    });

    it("sends array data", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._success([1, 2, 3]);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        data: [1, 2, 3],
      });
    });
  });

  describe("req._error", () => {
    it("sends a 400 error response by default", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._error("Bad request");

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        error: "Bad request",
      });
    });

    it("sends a custom status code (404)", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._error("Not found", 404);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 404,
        error: "Not found",
      });
    });

    it("sends 500 error", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._error("Internal Server Error", 500);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("sends object as error", () => {
      const { req, res, next } = createMocks();
      responseFormat(req, res, next);

      req._error({ field: "email", message: "invalid" }, 422);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 422,
        error: { field: "email", message: "invalid" },
      });
    });

    it("sets requestSent to true", () => {
      const { req, res, next } = createMocks();
      req.requestSent = false;
      responseFormat(req, res, next);

      req._error("fail");
      expect(req.requestSent).toBe(true);
    });
  });
});
