import { getItemSecure, setItemSecure, removeItemSecure } from './async-storage';

type CookieMap = Record<string, string>;

export const parseCookies = (setCookieHeader: string[] | string | undefined): CookieMap => {
  if (!setCookieHeader) return {};

  const cookies: CookieMap = {};
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  for (const header of headers) {
    const firstPart = header.split(';', 1)[0];
    const idx = firstPart.indexOf('=');

    if (idx <= 0) continue;

    const key = firstPart.slice(0, idx).trim();
    const value = firstPart.slice(idx + 1).trim();

    cookies[key] = value;
  }

  return cookies;
};

export const updateStoredCookies = async (setCookieHeader: string[] | string | undefined) => {
  if (!setCookieHeader) return;

  const newCookies = parseCookies(setCookieHeader);

  // Instead of saving the entire cookie jar, specifically save tokens
  if (newCookies['accessToken']) {
    await setItemSecure('accessToken', newCookies['accessToken']);
  }
  if (newCookies['refreshToken']) {
    await setItemSecure('refreshToken', newCookies['refreshToken']);
  }
};

export const getCookieHeader = async (): Promise<string> => {
  const accessToken = await getItemSecure('accessToken');
  const refreshToken = await getItemSecure('refreshToken');

  const cookies: string[] = [];
  if (accessToken) cookies.push(`accessToken=${accessToken}`);
  if (refreshToken) cookies.push(`refreshToken=${refreshToken}`);

  return cookies.join('; ');
};

export const clearAuthCookies = async () => {
  await removeItemSecure('accessToken');
  await removeItemSecure('refreshToken');
};
