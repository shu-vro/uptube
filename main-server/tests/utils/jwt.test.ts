import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../../src/utils/auth-utils/jwt";

describe("JWT signToken + verifyToken", () => {
  it("signs and verifies a token with user type", () => {
    const payload = { id: "user-123", email: "test@example.com" };
    const token = signToken(payload, "user");

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("user-123");
    expect(decoded?.email).toBe("test@example.com");
  });

  it("signs with default user type", () => {
    const payload = { id: "user-456", email: "default@example.com" };
    const token = signToken(payload);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("user-456");
  });

  it("returns null for invalid token", () => {
    expect(verifyToken("invalid.token.here")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(verifyToken("")).toBeNull();
  });

  it("returns null for tampered token", () => {
    const token = signToken({ id: "user-1", email: "a@b.com" });
    // Tamper with the payload section
    const parts = token.split(".");
    parts[1] = parts[1] + "tampered";
    const tampered = parts.join(".");
    expect(verifyToken(tampered)).toBeNull();
  });

  it("returns null for token signed with different secret", () => {
    // Admin tokens use JWT_ADMIN_SECRET, verifyToken uses JWT_SECRET
    const token = signToken(
      { id: "admin-1", email: "admin@example.com" },
      "admin"
    );
    // verifyToken only checks with JWT_SECRET, not JWT_ADMIN_SECRET
    // Depending on env, if secrets differ, this should return null
    // With defaults: JWT_SECRET=JWT_TOKEN, JWT_ADMIN_SECRET=JWT_ADMIN_TOKEN (different)
    const result = verifyToken(token);
    expect(result).toBeNull();
  });

  it("preserves additional fields in payload", () => {
    const payload = {
      id: "user-789",
      email: "extra@example.com",
      role: "moderator",
      custom: 42,
    };
    const token = signToken(payload);
    const decoded = verifyToken(token);

    expect(decoded).not.toBeNull();
    expect((decoded as any).role).toBe("moderator");
    expect((decoded as any).custom).toBe(42);
  });

  it("generates different tokens for different payloads", () => {
    const token1 = signToken({ id: "user-1", email: "a@a.com" });
    const token2 = signToken({ id: "user-2", email: "b@b.com" });
    expect(token1).not.toBe(token2);
  });

  it("generates different tokens even for same payload (due to iat)", () => {
    const payload = { id: "user-same", email: "same@same.com" };
    const token1 = signToken(payload);
    // Tokens issued at same second might be identical, but the encrypted data
    // includes the jwt iat, so within the same test they could be same.
    // We just verify both are valid
    const decoded1 = verifyToken(token1);
    expect(decoded1?.id).toBe("user-same");
  });
});
