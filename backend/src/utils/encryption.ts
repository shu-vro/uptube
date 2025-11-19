import nacl from "tweetnacl";
import * as b64 from "base64-js";
import ENV from "config/env";

// const keyPair = nacl.box.keyPair();
// const publicKey = b64.fromByteArray(keyPair.publicKey);
// const privateKey = b64.fromByteArray(keyPair.secretKey);

const publicKey = ENV.QUERY_PUBLIC_KEY;
const privateKey = ENV.QUERY_PRIVATE_KEY;

console.log(publicKey, privateKey);

const padB64 = (s: string) => s + "=".repeat((4 - (s.length % 4)) % 4);

const fromBase64Url = (b64u: string) =>
  (b64u.replace(/-/g, "+").replace(/_/g, "/") + "===").slice(
    0,
    Math.ceil(b64u.length / 4) * 4
  );

export function decryptHybrid(packedB64: string) {
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
