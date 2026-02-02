// Cross-platform storage utility
// Uses localStorage on web, SecureStore on native (iOS/Android)
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Check if we're on web
const isWeb = Platform.OS === 'web';

/**
 * Store a value securely (native) or in localStorage (web)
 */
export async function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage setItem error:', error);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

/**
 * Retrieve a stored value
 */
export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage getItem error:', error);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

/**
 * Delete a stored value
 */
export async function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage removeItem error:', error);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// Export as a namespace-like object for drop-in replacement
export const Storage = {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
};

export default Storage;
