import * as b64 from 'base64-js';

const padB64 = (s: string) => s + '='.repeat((4 - (s.length % 4)) % 4);

const toBase64Url = (b64: string) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function encryptHybrid(
  plaintext: string,
  serverPublicKeyB64: string
): Promise<{ encrypted: string } | Record<string, any>> {
  try {
    // if (!serverPublicKeyB64) return JSON.parse(plaintext);

    const { default: nacl } = await import('tweetnacl');

    const pk = b64.toByteArray(padB64(serverPublicKeyB64));
    if (pk.length !== 32) throw new Error('Invalid server public key length');

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
    console.error('Error in encryptHybrid:', error);
    return JSON.parse(plaintext);
  }
}
