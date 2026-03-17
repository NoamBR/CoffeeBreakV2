/**
 * Device Fingerprinting for Voucher Security
 *
 * Generates a persistent, cryptographically random device ID.
 * Uses expo-secure-store if available, falls back to AsyncStorage.
 *
 * This ID is included in HMAC token generation so that QR codes are
 * cryptographically bound to the device that generated them.
 * Screenshots shared to other devices become invalid.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'coffeebreak_device_fingerprint';

// Safe dynamic import — expo-secure-store may not be installed
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // Not available — will use AsyncStorage fallback
}

/** In-memory cache to avoid repeated storage reads */
let cachedDeviceId: string | null = null;

/**
 * Get or create a persistent device fingerprint.
 * - First call: generates 32 random bytes (hex), stores persistently
 * - Subsequent calls: returns cached value
 * - Reinstalling the app generates a new ID (user re-authenticates anyway)
 */
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  // Try to read existing fingerprint
  try {
    let existing: string | null = null;
    if (SecureStore && Platform.OS !== 'web') {
      existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    } else {
      existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    }
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
  } catch {
    // Storage read failed — generate new ID below
  }

  // Generate new fingerprint: 32 bytes = 256 bits of entropy
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const deviceId = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Persist
  try {
    if (SecureStore && Platform.OS !== 'web') {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    } else {
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
  } catch {
    // If we can't persist, the ID will be regenerated next session
  }

  cachedDeviceId = deviceId;
  return deviceId;
}

/**
 * Compute SHA-256 hash of the device fingerprint.
 * Used server-side for storage (we never store the raw fingerprint in DB).
 */
export async function getDeviceIdHash(): Promise<string> {
  const deviceId = await getOrCreateDeviceId();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(deviceId));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
