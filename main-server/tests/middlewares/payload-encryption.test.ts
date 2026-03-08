import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import responseFormat from "../../src/middlewares/utilities/response-format";
import payloadEncryptionMiddleware from "../../src/middlewares/utilities/payload-encryption";
import globalErrorHandler from "../../src/middlewares/error/global";
import nacl from "tweetnacl";
import * as b64 from "base64-js";
import { publicKey } from "../../src/utils/encryption";

function encryptForServer(
  plaintext: string,
  serverPublicKeyB64: string
): string {
  const serverPK = b64.toByteArray(
    serverPublicKeyB64 + "=".repeat((4 - (serverPublicKeyB64.length % 4)) % 4)
  );
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const message = new TextEncoder().encode(plaintext);
  const boxed = nacl.box(message, nonce, serverPK, ephemeral.secretKey);
  const packed = new Uint8Array(32 + 24 + boxed.length);
  packed.set(ephemeral.publicKey, 0);
  packed.set(nonce, 32);
  packed.set(boxed, 56);
  return b64.fromByteArray(packed);
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    Object.defineProperty(req, "query", {
      value: req.query,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    req.requestSent = false;
    next();
  });
  app.use(responseFormat);
  app.use(payloadEncryptionMiddleware);

  // Test endpoint that echoes back the request data
  app.get("/echo", (req: Request) => {
    req._success({
      query: req.query,
      encrypted: req.encrypted,
    });
  });

  app.post("/echo", (req: Request) => {
    req._success({
      body: req.body,
      encrypted: req.encrypted,
    });
  });

  app.use(globalErrorHandler);
  return app;
}

describe("Payload Encryption Middleware", () => {
  const app = createApp();

  describe("unencrypted requests (passthrough)", () => {
    it("passes through GET requests without encrypted params", async () => {
      const res = await request(app).get("/echo?name=test&value=123");

      expect(res.status).toBe(200);
      expect(res.body.data.query.name).toBe("test");
      expect(res.body.data.query.value).toBe("123");
      expect(res.body.data.encrypted).toBe(false);
    });

    it("passes through POST requests without encrypted body", async () => {
      const res = await request(app)
        .post("/echo")
        .send({ name: "test", value: 123 });

      expect(res.status).toBe(200);
      expect(res.body.data.body.name).toBe("test");
      expect(res.body.data.encrypted).toBe(false);
    });

    it("handles empty query params", async () => {
      const res = await request(app).get("/echo");

      expect(res.status).toBe(200);
      expect(res.body.data.encrypted).toBe(false);
    });
  });

  describe("encrypted query parameters", () => {
    it("decrypts encrypted query params", async () => {
      const payload = JSON.stringify({ q: "search term", limit: 10 });
      const encrypted = encryptForServer(payload, publicKey);

      const res = await request(app).get(
        `/echo?encrypted=${encodeURIComponent(encrypted)}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.encrypted).toBe(true);
      expect(res.body.data.query.q).toBe("search term");
      expect(res.body.data.query.limit).toBe(10);
      // encrypted key should be removed
      expect(res.body.data.query.encrypted).toBeUndefined();
    });
  });

  describe("encrypted body", () => {
    it("decrypts encrypted body", async () => {
      const payload = JSON.stringify({ username: "john", age: 30 });
      const encrypted = encryptForServer(payload, publicKey);

      const res = await request(app).post("/echo").send({ encrypted });

      expect(res.status).toBe(200);
      expect(res.body.data.encrypted).toBe(true);
      expect(res.body.data.body.username).toBe("john");
      expect(res.body.data.body.age).toBe(30);
      expect(res.body.data.body.encrypted).toBeUndefined();
    });
  });
});
