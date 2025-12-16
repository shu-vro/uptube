import axios from 'axios';
import { getItem, getItemSecure } from './async-storage';
import Constants from 'expo-constants';
import { encryptHybrid } from './encryption';

const request = async (
  method: 'get' | 'put' | 'post' | 'delete' = 'get',
  {
    endpoint = '',
    payload = {},
    token = '',
    full = false,
  }: { endpoint: string; payload?: any; token?: string; full?: boolean }
) => {
  try {
    const FEATURES = await getItem('features');
    // console.log(FEATURES, 'from get');

    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    const url = Constants.expoConfig?.extra?.UPTUBE_API + '/api/v1' + endpoint;
    console.log(url);
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
    const response = await axios[method](url, {
      [method === 'get' ? 'params' : 'data']: payload,
      headers,
    });
    if (response.data.success) {
      return full ? response : response.data?.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
export const get = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
}: Partial<{
  endpoint: string;
  params?: any;
  token?: string;
  full: boolean;
}>) => {
  return await request('get', { endpoint, payload: params, token, full });
};

export const post = async ({
  endpoint = '',
  params = {},
  token = '',
  full = false,
}: Partial<{
  endpoint: string;
  params?: any;
  token?: string;
  full: boolean;
}>) => {
  return await request('post', { endpoint, payload: params, token, full });
};
