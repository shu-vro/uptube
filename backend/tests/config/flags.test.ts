import { describe, it, expect } from "vitest";
import FLAGS, { CLIENT_FLAGS } from "../../src/config/FLAGS/index";

describe("FLAGS", () => {
  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(FLAGS)).toBe(true);
  });

  it("has FEATURE_X property", () => {
    expect(FLAGS.FEATURE_X).toBeDefined();
    expect(typeof FLAGS.FEATURE_X).toBe("boolean");
  });

  it("has FEATURE_Y property", () => {
    expect(FLAGS.FEATURE_Y).toBeDefined();
    expect(typeof FLAGS.FEATURE_Y).toBe("boolean");
  });

  it("has STOP_CONSOLE_AT_PROD property", () => {
    expect(FLAGS.STOP_CONSOLE_AT_PROD).toBeDefined();
    expect(typeof FLAGS.STOP_CONSOLE_AT_PROD).toBe("boolean");
  });

  it("has STOP_PINO_AT_PROD property", () => {
    expect(FLAGS.STOP_PINO_AT_PROD).toBeDefined();
    expect(typeof FLAGS.STOP_PINO_AT_PROD).toBe("boolean");
  });

  it("has ALLOW_UNENCRYPTED_REQUESTS property", () => {
    expect(FLAGS.ALLOW_UNENCRYPTED_REQUESTS).toBeDefined();
    expect(typeof FLAGS.ALLOW_UNENCRYPTED_REQUESTS).toBe("boolean");
  });

  it("cannot be modified", () => {
    expect(() => {
      (FLAGS as any).FEATURE_X = false;
    }).toThrow();
  });

  it("cannot add new properties", () => {
    expect(() => {
      (FLAGS as any).NEW_FLAG = true;
    }).toThrow();
  });
});

describe("CLIENT_FLAGS", () => {
  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(CLIENT_FLAGS)).toBe(true);
  });

  it("has ENCRYPT_REQUESTS property", () => {
    expect(CLIENT_FLAGS.ENCRYPT_REQUESTS).toBeDefined();
    expect(typeof CLIENT_FLAGS.ENCRYPT_REQUESTS).toBe("boolean");
  });

  it("cannot be modified", () => {
    expect(() => {
      (CLIENT_FLAGS as any).ENCRYPT_REQUESTS = false;
    }).toThrow();
  });
});
