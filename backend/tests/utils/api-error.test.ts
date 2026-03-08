import { describe, it, expect } from "vitest";
import ApiError from "../../src/utils/error/ApiError";

describe("ApiError", () => {
  it("creates an error with message and default status 500", () => {
    const error = new ApiError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it("creates an error with custom status code", () => {
    const error = new ApiError("Not Found", 404);
    expect(error.message).toBe("Not Found");
    expect(error.statusCode).toBe(404);
  });

  it("creates a 400 Bad Request error", () => {
    const error = new ApiError("Bad Request", 400);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad Request");
  });

  it("creates a 401 Unauthorized error", () => {
    const error = new ApiError("Unauthorized", 401);
    expect(error.statusCode).toBe(401);
  });

  it("creates a 403 Forbidden error", () => {
    const error = new ApiError("Forbidden", 403);
    expect(error.statusCode).toBe(403);
  });

  it("creates a 429 Too Many Requests error", () => {
    const error = new ApiError("Too Many Requests", 429);
    expect(error.statusCode).toBe(429);
  });

  it("has a stack trace", () => {
    const error = new ApiError("Test error");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("Test error");
  });

  it("is properly caught as an Error", () => {
    try {
      throw new ApiError("thrown error", 422);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(422);
      expect((err as ApiError).message).toBe("thrown error");
    }
  });

  it("preserves prototype chain with instanceof", () => {
    const error = new ApiError("test");
    expect(Object.getPrototypeOf(error)).toBe(ApiError.prototype);
  });

  it("can be serialized to JSON with statusCode", () => {
    const error = new ApiError("Serializable", 502);
    const serialized = JSON.parse(JSON.stringify(error));
    expect(serialized.statusCode).toBe(502);
  });
});
