// src/bootstrap.ts
import * as ExpoCrypto from 'expo-crypto';
import 'fast-text-encoding'; // TextEncoder/TextDecoder polyfill
import 'react-native-get-random-values';

// Make RN’s global look like a browser-ish global for libs that sniff "self" or "window"
if (typeof global.self === 'undefined') (global as any).self = global;
if (typeof global.window === 'undefined') (global as any).window = global;

// Secure RNG via ExpoCrypto -> exposes crypto.getRandomValues()
if (typeof (global as any).crypto === 'undefined') (global as any).crypto = {};
if (typeof (global as any).crypto.getRandomValues !== 'function') {
  (global as any).crypto.getRandomValues = (arr: Uint8Array) => {
    const bytes = ExpoCrypto.getRandomBytes(arr.length);
    arr.set(bytes);
    return arr;
  };
}
