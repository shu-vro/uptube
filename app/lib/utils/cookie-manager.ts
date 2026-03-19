import { getItemSecure, setItemSecure } from './async-storage';

export const parseCookies = (
  cookieHeader: string[] | string | undefined
): Record<string, string> => {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const headers = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];

  headers.forEach((header) => {
    // Split by ';' to get parts, first part is name=value
    const parts = header.split(';');
    const [nameVal] = parts;
    if (nameVal) {
      const [key, value] = nameVal.split('=');
      if (key && value) {
        cookies[key.trim()] = value.trim();
      }
    }
  });
  return cookies;
};

export const updateStoredCookies = async (setCookieHeader: string[] | string | undefined) => {
  if (!setCookieHeader) return;

  const newCookies = parseCookies(setCookieHeader);
  const existingCookies = (await getItemSecure('auth_cookies')) || {};

  const updatedCookies = { ...existingCookies, ...newCookies };

  // Filter out any empty/expired if needed, typically we just overwrite
  await setItemSecure('auth_cookies', updatedCookies);
};

export const getCookieHeader = async (): Promise<string> => {
  const cookies = (await getItemSecure('auth_cookies')) || {};
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
};
