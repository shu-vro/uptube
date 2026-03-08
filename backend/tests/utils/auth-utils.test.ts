import { describe, it, expect } from "vitest";
import {
  getBearerToken,
  passwordHash,
  passwordCompare,
} from "../../src/utils/auth-utils/index";

describe("getBearerToken", () => {
  it("returns null for undefined header", () => {
    expect(getBearerToken(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getBearerToken("")).toBeNull();
  });

  it("returns null when header doesn't start with 'Bearer '", () => {
    expect(getBearerToken("Token abc123")).toBeNull();
  });

  it("returns null for 'Basic' auth header", () => {
    expect(getBearerToken("Basic dXNlcjpwYXNz")).toBeNull();
  });

  it("extracts token from valid Bearer header", () => {
    expect(getBearerToken("Bearer my-jwt-token-here")).toBe(
      "my-jwt-token-here"
    );
  });

  it("extracts token with dots (JWT format)", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJkYXRhIjoiZm9vIn0.sig";
    expect(getBearerToken(`Bearer ${jwt}`)).toBe(jwt);
  });

  it("returns empty string for 'Bearer ' with nothing after", () => {
    expect(getBearerToken("Bearer ")).toBe("");
  });

  it("returns token with spaces preserved after 'Bearer '", () => {
    expect(getBearerToken("Bearer token with spaces")).toBe(
      "token with spaces"
    );
  });

  it("is case-sensitive: 'bearer' (lowercase) returns null", () => {
    expect(getBearerToken("bearer my-token")).toBeNull();
  });
});

describe("passwordHash + passwordCompare", () => {
  it("hashes a password and verifies it", async () => {
    const raw = "MySuperSecretPassword123!";
    const hashed = await passwordHash(raw);

    expect(hashed).toBeDefined();
    expect(typeof hashed).toBe("string");
    expect(hashed).not.toBe(raw);
    expect(hashed.length).toBeGreaterThan(0);

    const isMatch = await passwordCompare(raw, hashed);
    expect(isMatch).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hashed = await passwordHash("correct-password");
    const isMatch = await passwordCompare("wrong-password", hashed);
    expect(isMatch).toBe(false);
  });

  it("produces different hashes for same password (due to salt)", async () => {
    const password = "same-password";
    const hash1 = await passwordHash(password);
    const hash2 = await passwordHash(password);
    expect(hash1).not.toBe(hash2);

    // But both should validate
    expect(await passwordCompare(password, hash1)).toBe(true);
    expect(await passwordCompare(password, hash2)).toBe(true);
  });

  it("handles empty password", async () => {
    const hashed = await passwordHash("");
    expect(hashed).toBeDefined();
    const result = await passwordCompare("", hashed);
    expect(result).toBe(true);
    const wrongResult = await passwordCompare("not-empty", hashed);
    expect(wrongResult).toBe(false);
  });

  it("handles unicode passwords", async () => {
    const password = "пароль_密码_🔐";
    const hashed = await passwordHash(password);
    expect(await passwordCompare(password, hashed)).toBe(true);
    expect(await passwordCompare("wrong", hashed)).toBe(false);
  });

  it("handles very long passwords", async () => {
    // bcrypt truncates at 72 bytes, but the function should still work
    const longPassword = "a".repeat(200);
    const hashed = await passwordHash(longPassword);
    expect(await passwordCompare(longPassword, hashed)).toBe(true);
  });
});
