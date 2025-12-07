import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

export const setItem = async (key: string, value: any) => {
  try {
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (e) {
    console.log('[ASYNC-STORAGE]: Error saving data', e);
    return null;
  }
};

export const getItem = async (key: string) => {
  try {
    const stringValue = await AsyncStorage.getItem(key);
    return stringValue ? JSON.parse(stringValue) : null;
  } catch (e) {
    console.log('[ASYNC-STORAGE]: Error reading data', e);
    return null;
  }
};

export function useAsyncItem(
  key: string,
  defaultValue?: any
): [any, (value: any) => Promise<void>] {
  const [data, setData] = useState(defaultValue ?? null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getItem(key);
      return data;
    };
    fetchData().then((data) => {
      if (data !== null) {
        setData(data);
      } else if (defaultValue !== undefined) {
        setData(defaultValue);
      }
    });
  }, [key, defaultValue]);

  const setAsyncData = async (value: any) => {
    await setItem(key, value);
    setData(value);
  };

  return [data, setAsyncData];
}

export const removeItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log('[ASYNC-STORAGE]: Error removing data', e);
  }
};

export async function setItemSecure(key: string, value: any) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function getItemSecure(key: string) {
  let result = await SecureStore.getItemAsync(key);
  return result ? JSON.parse(result) : null;
}

export async function removeItemSecure(key: string) {
  await SecureStore.deleteItemAsync(key);
}

export function useSecureItem(key: string): [any, (value: any) => Promise<void>] {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getItemSecure(key);
      return data;
    };
    fetchData().then((data) => setData(data));
  }, [key]);

  const setSecureData = async (value: any) => {
    await setItemSecure(key, value);
    setData(value);
  };

  return [data, setSecureData];
}
