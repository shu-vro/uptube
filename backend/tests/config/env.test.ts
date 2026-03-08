import { describe, it, expect } from "vitest";
import ENV from "../../src/config/env/index";

describe("ENV configuration", () => {
  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(ENV)).toBe(true);
  });

  it("has PORT", () => {
    expect(ENV.PORT).toBeDefined();
  });

  it("has NODE_ENV", () => {
    expect(ENV.NODE_ENV).toBeDefined();
    expect(typeof ENV.NODE_ENV).toBe("string");
  });

  it("has DATABASE_URL", () => {
    expect(ENV.DATABASE_URL).toBeDefined();
  });

  it("has JWT_SECRET", () => {
    expect(ENV.JWT_SECRET).toBeDefined();
    expect(typeof ENV.JWT_SECRET).toBe("string");
  });

  it("has JWT_ADMIN_SECRET", () => {
    expect(ENV.JWT_ADMIN_SECRET).toBeDefined();
    expect(typeof ENV.JWT_ADMIN_SECRET).toBe("string");
  });

  it("has JWT_ENCRYPTION_KEY", () => {
    expect(ENV.JWT_ENCRYPTION_KEY).toBeDefined();
    expect(typeof ENV.JWT_ENCRYPTION_KEY).toBe("string");
  });

  it("has QUERY_PUBLIC_KEY", () => {
    expect(ENV.QUERY_PUBLIC_KEY).toBeDefined();
    expect(typeof ENV.QUERY_PUBLIC_KEY).toBe("string");
  });

  it("has QUERY_PRIVATE_KEY", () => {
    expect(ENV.QUERY_PRIVATE_KEY).toBeDefined();
    expect(typeof ENV.QUERY_PRIVATE_KEY).toBe("string");
  });

  it("has CORS_ORIGIN", () => {
    expect(ENV.CORS_ORIGIN).toBeDefined();
  });

  it("has LOG_LEVEL", () => {
    expect(ENV.LOG_LEVEL).toBeDefined();
  });

  it("cannot be modified", () => {
    expect(() => {
      (ENV as any).PORT = 9999;
    }).toThrow();
  });

  it("cannot add new properties", () => {
    expect(() => {
      (ENV as any).NEW_KEY = "value";
    }).toThrow();
  });

  it("JWT_SECRET and JWT_ADMIN_SECRET are different", () => {
    // They should be distinct secrets even in defaults
    expect(ENV.JWT_SECRET).not.toBe(ENV.JWT_ADMIN_SECRET);
  });
});
