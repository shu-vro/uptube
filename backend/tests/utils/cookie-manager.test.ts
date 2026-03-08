import { describe, it, expect } from "vitest";
import { setCookie } from "../../src/utils/auth-utils/cookie-manager";
import { vi } from "vitest";

describe("setCookie", () => {
  function createMockResponse() {
    return {
      cookie: vi.fn(),
    } as any;
  }

  it("sets a cookie with default options", () => {
    const res = createMockResponse();
    setCookie(res, "session", "token-value");

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith("session", "token-value", {
      httpOnly: true,
      secure: false, // NODE_ENV is 'test', not 'production'
      sameSite: "strict",
    });
  });

  it("merges custom options with defaults", () => {
    const res = createMockResponse();
    setCookie(res, "auth", "value", { maxAge: 3600000, path: "/" });

    expect(res.cookie).toHaveBeenCalledWith("auth", "value", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 3600000,
      path: "/",
    });
  });

  it("allows overriding httpOnly", () => {
    const res = createMockResponse();
    setCookie(res, "token", "val", { httpOnly: false });

    expect(res.cookie).toHaveBeenCalledWith("token", "val", {
      httpOnly: false,
      secure: false,
      sameSite: "strict",
    });
  });

  it("allows overriding sameSite", () => {
    const res = createMockResponse();
    setCookie(res, "csrf", "val", { sameSite: "lax" });

    expect(res.cookie).toHaveBeenCalledWith("csrf", "val", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
  });

  it("handles empty value", () => {
    const res = createMockResponse();
    setCookie(res, "empty", "");

    expect(res.cookie).toHaveBeenCalledWith("empty", "", expect.any(Object));
  });
});
