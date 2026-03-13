import nacl from "tweetnacl";
import * as b64 from "base64-js";
import ENV from "config/env";

// const keyPair = nacl.box.keyPair();
// const publicKey = b64.fromByteArray(keyPair.publicKey);
// const privateKey = b64.fromByteArray(keyPair.secretKey);

const publicKey = ENV.QUERY_PUBLIC_KEY;
const privateKey = ENV.QUERY_PRIVATE_KEY;

const padB64 = (s: string) => s + "=".repeat((4 - (s.length % 4)) % 4);
const toBase64Url = (b64: string) =>
  b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (b64u: string) =>
  (b64u.replace(/-/g, "+").replace(/_/g, "/") + "===").slice(
    0,
    Math.ceil(b64u.length / 4) * 4
  );

export async function encryptHybrid(
  plaintext: string,
  serverPublicKeyB64: string
): Promise<{ encrypted: string } | Record<string, any>> {
  try {
    // if (!serverPublicKeyB64) return JSON.parse(plaintext);

    const pk = b64.toByteArray(padB64(serverPublicKeyB64));
    if (pk.length !== 32) throw new Error("Invalid server public key length");

    const eph = nacl.box.keyPair();
    const nonce = nacl.randomBytes(24);

    const msg = new TextEncoder().encode(plaintext);
    const boxed = nacl.box(msg, nonce, pk, eph.secretKey);

    const out = new Uint8Array(32 + 24 + boxed.length);
    out.set(eph.publicKey, 0);
    out.set(nonce, 32);
    out.set(boxed, 56);

    const encrypted = b64.fromByteArray(out);
    const encryptedUrl = toBase64Url(encrypted);

    return { encrypted: encryptedUrl };
  } catch (error) {
    console.error("Error in encryptHybrid:", error);
    return JSON.parse(plaintext);
  }
}

export function decryptHybrid(
  packedB64: string,
  privateKey: string = ENV.QUERY_PRIVATE_KEY
) {
  const b64u = String(packedB64 || "");
  packedB64 = fromBase64Url(b64u);
  const packed = b64.toByteArray(padB64(packedB64));
  if (packed.length < 56) throw new Error("Ciphertext too short");

  const ephPK = packed.slice(0, 32);
  const nonce = packed.slice(32, 56);
  const boxed = packed.slice(56);

  const sk = b64.toByteArray(padB64(privateKey));
  if (sk.length !== 32) throw new Error("Invalid server secret key length");

  const msg = nacl.box.open(boxed, nonce, ephPK, sk);
  if (!msg) throw new Error("Decryption failed: " + packedB64);

  return new TextDecoder().decode(msg);
}

// const encdata = await encryptHybrid("rea", publicKey);
// console.log(encdata);

// console.log(
//   decryptHybrid(
//     (
//       {
//         encrypted:
//           "r9G3kDUUOeQ+mSkV5IIYhjNk2a0vOjUJU6BqumPSsWGukB8GEyDRVd6GqUVl2m2g1S+xqDzDjxGcyaTHYhQaDOUU46kNSDcp7tt5bHg3BRxt7WM=",
//       } as { encrypted: string }
//     ).encrypted
//   )
// );

export { publicKey };
