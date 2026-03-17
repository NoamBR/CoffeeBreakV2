/**
 * Secure Storage adapter for Zustand persistence.
 *
 * Uses expo-secure-store on native (iOS Keychain / Android Keystore)
 * and falls back to AsyncStorage on web (where SecureStore is unavailable).
 *
 * Use this for stores that contain sensitive data:
 * - Staff credentials / session tokens
 * - User PII (phone numbers, birthdays)
 * - Voucher barcodes
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // expo-secure-store not available (Expo Go / web)
}

/**
 * Zustand-compatible storage using expo-secure-store on native.
 * Falls back to AsyncStorage on web or when SecureStore is unavailable.
 */
export const secureStorage: StateStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (SecureStore && Platform.OS !== 'web') {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (SecureStore && Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch {
        // Fall through to AsyncStorage
      }
    }
    await AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (SecureStore && Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(key);
        return;
      } catch {
        // Fall through
      }
    }
    await AsyncStorage.removeItem(key);
  },
};
