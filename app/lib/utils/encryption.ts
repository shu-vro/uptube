import Crypto from 'expo-crypto';

export async function encryptHybrid(data: string, publicKeyPem: string) {
  const iv = Crypto.getRandomBytes(12);
  const aesKey = Crypto.getRandomBytes(32);

  const cipher = Crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const wrappedKey = Crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: Crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey
  );

  return {
    wrappedKey: Buffer.from(wrappedKey).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: tag.toString('base64'),
  };
}
