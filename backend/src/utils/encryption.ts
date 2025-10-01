import logger from "config/logger/pino.logger";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { z } from "zod";

// Load RSA keys from PEM files
const loadKeys = () => {
  try {
    const keyFolder = path.join(process.cwd(), "keys");
    const publicKeyPath = path.join(keyFolder, "rsa_public.pem");
    const privateKeyPath = path.join(keyFolder, "rsa_private.pem");

    const publicKey = fs.readFileSync(publicKeyPath, "utf8");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    logger.info("RSA keys loaded successfully.");

    return { publicKey, privateKey };
  } catch (error: any) {
    throw new Error(`Failed to load RSA keys: ${error.message}`);
  }
};

const { publicKey, privateKey } = loadKeys();
export { publicKey };

export async function encryptHybrid(data: string, publicKeyPem: string) {
  const iv = crypto.randomBytes(12);
  const aesKey = crypto.randomBytes(32);

  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const wrappedKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  );

  return {
    wrappedKey: wrappedKey.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: tag.toString("base64"),
  };
}

const HybridPayloadSchema = z.object({
  wrappedKey: z.string(),
  iv: z.string(),
  ciphertext: z.string(),
  tag: z.string(),
});

export function decryptHybrid(payload: {
  wrappedKey: string;
  iv: string;
  ciphertext: string;
  tag: string;
}): string {
  // Validate payload with zod
  const validatedPayload = HybridPayloadSchema.parse(payload);

  const aesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(validatedPayload.wrappedKey, "base64")
  );

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    aesKey,
    Buffer.from(validatedPayload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(validatedPayload.tag, "base64"));

  const pt = Buffer.concat([
    decipher.update(Buffer.from(validatedPayload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return pt.toString("utf8");
}

// console.log(
//   decryptHybrid({
//     ciphertext: "0GpNNFknmcJC14oadVu4wBsFT7WFpmLOzMTyWYKpO2M=",
//     iv: "Xt8tDzIpLGUUxURj",
//     tag: "Xt8tDzIpLGU=",
//     wrappedKey: "rFUCRjegQleBUEENzB7b3KcSb8gTXxBP7z+3UfXmtv8=",
//   })
// );
const x = await encryptHybrid("Hello, World!", publicKey);
console.log(x);
console.log(decryptHybrid(x));
