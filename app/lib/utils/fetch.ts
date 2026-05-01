import axios from 'axios';
import { getItem, getItemSecure, mmkvStorage, setItemSecure } from './async-storage';
import Constants from 'expo-constants';
import { createNaClKeyPair, decryptHybrid, encryptHybrid } from './encryption';
import { Platform } from 'react-native';
import { parseJSON } from './parser';
import {
  clearAuthCookies,
  getCookieHeader,
  parseCookies,
  updateStoredCookies,
} from './cookie-manager';

type RequestOptions = {
  endpoint: string;
  params?: any;
  token?: string;
  full?: boolean;
  throwable?: boolean;
  version?: string;
  baseUrl?: string;
  overrideEncryptedResponsesOnly?: boolean;
};

const request = async (
  method: 'get' | 'put' | 'post' | 'delete' = 'get',
  {
    endpoint = '',
    params = {},
    token = '',
    full = false,
    throwable = false,
    version = 'v1',
    baseUrl = Constants.expoConfig?.extra?.UPTUBE_API,
    overrideEncryptedResponsesOnly = false,
  }: RequestOptions
) => {
  clearAuthCookies();
  const url = baseUrl + '/api/' + version + endpoint;
  const FEATURES = await getItem('features');
  const needsResponseEncryption =
    false &&
    !FEATURES?.FEATURE_FLAGS?.DOES_NOT_NEED_RESPONSE_ENCRYPTION &&
    !overrideEncryptedResponsesOnly;
  let response = null,
    keyPair: Awaited<ReturnType<typeof createNaClKeyPair>> | null = null;
  try {
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

    const cookieHeader = await getCookieHeader();

    const headers: Record<string, string> = {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      'X-App-Version': Constants.expoConfig?.version ?? 'unknown',
      'X-Build-Version': Constants.nativeBuildVersion ?? 'unknown',
      'X-Platform': Platform.OS,
      'X-Platform-Version': String(Platform.Version),
    };

    if (needsResponseEncryption) {
      keyPair = await createNaClKeyPair();
      if (!keyPair || !keyPair?.publicKey || !keyPair?.secretKey) {
        throw new Error('Failed to create encryption key pair');
      }
      params.client_public_key = keyPair.publicKey;
      headers['X-Encrypted-Responses'] = 'true';
    }

    if (FEATURES?.FEATURE_FLAGS?.ENCRYPT_REQUESTS) {
      headers['X-Encrypt'] = '1';
      if (params && Object.keys(params).length > 0) {
        const encryptedParams = await encryptHybrid(
          JSON.stringify(params || {}),
          FEATURES.encryption_public_key
        );

        // console.log(url + '?encrypted=' + encryptedParams.encrypted, 'fetching url');
        params = encryptedParams;
      }
    }
    response = await axios({
      method,
      headers,
      url,
      data: method !== 'get' ? params : undefined,
      params: method === 'get' ? params : undefined,
      withCredentials: true,
    });

    if (response.headers['set-cookie']) {
      console.log('changing cookie', response.headers['set-cookie']);
      await updateStoredCookies(response.headers['set-cookie']);
    }

    if (response.data.success) {
      let data = response.data.data;
      if (needsResponseEncryption && keyPair) {
        data = await decryptHybrid(data?.encrypted || '', keyPair.secretKey);
        data = parseJSON(data);
      }
      response.data.data = data;
      return full ? response : data;
    }

    // if (response.)
    // API returned but success is false
    if (throwable) {
      throw new Error(response.data?.message || 'API request failed');
    }
    return null;
  } catch (error: any) {
    if (error.response?.headers['set-cookie']) {
      await updateStoredCookies(error.response.headers['set-cookie']);
    }
    console[throwable ? 'log' : 'error']('Error fetching data:', error.message, error);
    if (throwable) {
      throw error;
    }
    return error?.response?.data || null;
  } finally {
    console.log(method, url, response?.status);
  }
};
export const get = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
  throwable = false,
  version = 'v1',
  baseUrl,
  overrideEncryptedResponsesOnly = false,
}: Partial<RequestOptions>) => {
  return await request('get', {
    endpoint,
    params,
    token,
    full,
    throwable,
    version,
    baseUrl,
    overrideEncryptedResponsesOnly,
  });
};

export const post = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
  throwable = false,
  version = 'v1',
  baseUrl,
  overrideEncryptedResponsesOnly = false,
}: Partial<RequestOptions>) => {
  return await request('post', {
    endpoint,
    params,
    token,
    full,
    throwable,
    version,
    baseUrl,
    overrideEncryptedResponsesOnly,
  });
};

export const put = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
  throwable = false,
  version = 'v1',
  baseUrl,
  overrideEncryptedResponsesOnly = false,
}: Partial<RequestOptions>) => {
  return await request('put', {
    endpoint,
    params,
    token,
    full,
    throwable,
    version,
    baseUrl,
    overrideEncryptedResponsesOnly,
  });
};

export const del = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
  throwable = false,
  version = 'v1',
  baseUrl,
  overrideEncryptedResponsesOnly = false,
}: Partial<RequestOptions>) => {
  return await request('delete', {
    endpoint,
    params,
    token,
    full,
    throwable,
    version,
    baseUrl,
    overrideEncryptedResponsesOnly,
  });
};
