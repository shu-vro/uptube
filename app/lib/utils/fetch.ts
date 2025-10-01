import axios from 'axios';
import { getItem, getItemSecure } from './async-storage';
import Constants from 'expo-constants';
import { encryptHybrid } from './encryption';

export const get = async (
  endpoint: string,
  params?: any,
  token?: string,
  full: boolean = false
) => {
  try {
    const FEATURES = await getItem('features');
    console.log(FEATURES, 'from get');

    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    const url = Constants.expoConfig?.extra?.UPTUBE_API + '/api/v1' + endpoint;
    // check if local storage has token
    const tokenFromStorage = await getItemSecure('token');

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token || tokenFromStorage}` }
      : {};
    if (FEATURES?.FEATURE_FLAGS?.ENCRYPT_REQUESTS) {
      headers['X-Encrypt'] = '1';
      if (params && Object.keys(params).length > 0) {
        const encryptedParams = await encryptHybrid(
          JSON.stringify(params || {}),
          FEATURES.encryption_public_key
        );
        console.log(encryptedParams, 'encrypted params');
      }
    }
    const response = await axios.get(url, { params, headers });
    if (response.data.success) {
      return full ? response : response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
