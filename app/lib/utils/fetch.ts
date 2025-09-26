import axios from 'axios';
import { getItemSecure } from './async-storage';

export const get = async (url: string, params?: any, token?: string) => {
  try {
    // check if local storage has token
    const tokenFromStorage = await getItemSecure('token');

    const headers = token ? { Authorization: `Bearer ${token || tokenFromStorage}` } : {};
    const response = await axios.get(url, { params, headers });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Error fetching data');
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
