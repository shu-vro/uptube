import { describe, it, expect } from "vitest";
import { decryptHybrid, publicKey } from "../../src/utils/encryption";
import nacl from "tweetnacl";
import * as b64 from "base64-js";

// Helper: encrypt data exactly as the client would
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

  // Pack: ephPK (32) + nonce (24) + boxed (variable)
  const packed = new Uint8Array(32 + 24 + boxed.length);
  packed.set(ephemeral.publicKey, 0);
  packed.set(nonce, 32);
  packed.set(boxed, 56);

  return b64.fromByteArray(packed);
}

describe("encryption", () => {
  describe("publicKey", () => {
    it("is exported and is a non-empty string", () => {
      expect(publicKey).toBeDefined();
      expect(typeof publicKey).toBe("string");
      expect(publicKey.length).toBeGreaterThan(0);
    });
  });

  describe("decryptHybrid", () => {
    it("decrypts a properly encrypted message", () => {
      const message = "hello world";
      const encrypted = encryptForServer(message, publicKey);
      const decrypted = decryptHybrid(encrypted);
      expect(decrypted).toBe(message);
    });

    it("decrypts JSON payload", () => {
      const payload = JSON.stringify({ q: "test search", limit: 10 });
      const encrypted = encryptForServer(payload, publicKey);
      const decrypted = decryptHybrid(encrypted);
      const parsed = JSON.parse(decrypted);
      expect(parsed.q).toBe("test search");
      expect(parsed.limit).toBe(10);
    });

    it("decrypts unicode content", () => {
      const message = "こんにちは世界 🌍";
      const encrypted = encryptForServer(message, publicKey);
      const decrypted = decryptHybrid(encrypted);
      expect(decrypted).toBe(message);
    });

    it("decrypts empty string payload", () => {
      const encrypted = encryptForServer("", publicKey);
      const decrypted = decryptHybrid(encrypted);
      expect(decrypted).toBe("");
    });

    it("throws for ciphertext too short", () => {
      // Less than 56 bytes worth of base64
      expect(() => decryptHybrid("AAAA")).toThrow("Ciphertext too short");
    });

    it("throws for corrupted ciphertext", () => {
      const message = "test";
      const encrypted = encryptForServer(message, publicKey);
      // Corrupt the encrypted data by changing chars
      const corrupted = encrypted.slice(0, 10) + "XXXX" + encrypted.slice(14);
      expect(() => decryptHybrid(corrupted)).toThrow();
    });

    it("throws for data encrypted with wrong public key", () => {
      const wrongKeyPair = nacl.box.keyPair();
      const wrongPK = b64.fromByteArray(wrongKeyPair.publicKey);
      const encrypted = encryptForServer("secret", wrongPK);
      expect(() => decryptHybrid(encrypted)).toThrow("Decryption failed");
    });

    it("handles base64url encoding (- and _ chars)", () => {
      const message = "base64url test";
      const encrypted = encryptForServer(message, publicKey);
      // Convert standard base64 to base64url
      const base64url = encrypted
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const decrypted = decryptHybrid(base64url);
      expect(decrypted).toBe(message);
    });

    it("decrypts large payload", () => {
      const largePayload = "x".repeat(10000);
      const encrypted = encryptForServer(largePayload, publicKey);
      const decrypted = decryptHybrid(encrypted);
      expect(decrypted).toBe(largePayload);
    });

    it("each encryption produces different ciphertext (random nonce)", () => {
      const message = "same message";
      const enc1 = encryptForServer(message, publicKey);
      const enc2 = encryptForServer(message, publicKey);
      expect(enc1).not.toBe(enc2);

      // But both decrypt to the same value
      expect(decryptHybrid(enc1)).toBe(message);
      expect(decryptHybrid(enc2)).toBe(message);
    });
  });
});
