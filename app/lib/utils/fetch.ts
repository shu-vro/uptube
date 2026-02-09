import axios from 'axios';
import { getItem, getItemSecure } from './async-storage';
import Constants from 'expo-constants';
import { encryptHybrid } from './encryption';

type RequestOptions = {
  endpoint: string;
  payload?: any;
  token?: string;
  full?: boolean;
  throwable?: boolean;
};

const request = async (
  method: 'get' | 'put' | 'post' | 'delete' = 'get',
  { endpoint = '', payload = {}, token = '', full = false, throwable = false }: RequestOptions
) => {
  const url = Constants.expoConfig?.extra?.UPTUBE_API + '/api/v1' + endpoint;
  const FEATURES = await getItem('features');
  let response = null;
  try {
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    // check if local storage has token
    const tokenFromStorage = await getItemSecure('token');
    token = token || tokenFromStorage;

    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    if (FEATURES?.FEATURE_FLAGS?.ENCRYPT_REQUESTS) {
      headers['X-Encrypt'] = '1';
      if (payload && Object.keys(payload).length > 0) {
        const encryptedParams = await encryptHybrid(
          JSON.stringify(payload || {}),
          FEATURES.encryption_public_key
        );

        // console.log(url + '?encrypted=' + encryptedParams.encrypted, 'fetching url');
        payload = encryptedParams;
      }
    }
    response = await axios({
      method,
      headers,
      url,
      data: method !== 'get' ? payload : undefined,
      params: method === 'get' ? payload : undefined,
    });
    if (response.data.success) {
      const data = response.data.data;
      response.data.data = data;
      return full ? response : data;
    }
    // API returned but success is false
    if (throwable) {
      throw new Error(response.data?.message || 'API request failed');
    }
    return null;
  } catch (error: any) {
    console[throwable ? 'log' : 'error']('Error fetching data:', error.message, error);
    if (throwable) {
      throw error;
    }
    return null;
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
}: Partial<Exclude<RequestOptions, 'payload'>> & { params?: {} }) => {
  return await request('get', { endpoint, payload: params, token, full, throwable });
};

export const post = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
  throwable = false,
}: Partial<{
  endpoint: string;
  params?: any;
  token?: string;
  full: boolean;
  throwable?: boolean;
}>) => {
  return await request('post', { endpoint, payload: params, token, full, throwable });
};

export const put = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
  throwable = false,
}: Partial<{
  endpoint: string;
  params?: any;
  token?: string;
  full: boolean;
  throwable?: boolean;
}>) => {
  return await request('put', { endpoint, payload: params, token, full, throwable });
};

export const del = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
  throwable = false,
}: Partial<{
  endpoint: string;
  params?: any;
  token?: string;
  full: boolean;
  throwable?: boolean;
}>) => {
  return await request('delete', { endpoint, payload: params, token, full, throwable });
};
