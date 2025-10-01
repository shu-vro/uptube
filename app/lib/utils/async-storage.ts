import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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
