import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

function webStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

export async function getTokenValue(key: string) {
  if (Platform.OS === 'web') {
    return webStorage()?.getItem(key) ?? memoryStore.get(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

export async function setTokenValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    const storage = webStorage();
    if (storage) {
      storage.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteTokenValue(key: string) {
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(key);
    memoryStore.delete(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
