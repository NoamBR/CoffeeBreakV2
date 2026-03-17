/**
 * Device Fingerprinting for Voucher Security
 *
 * Generates a persistent, cryptographically random device ID stored in
 * iOS Keychain / Android Keystore via expo-secure-store.
 *
 * This ID is included in HMAC token generation so that QR codes are
 * cryptographically bound to the device that generated them.
 * Screenshots shared to other devices become invalid.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'coffeebreak_device_fingerprint';

/** In-memory cache to avoid repeated SecureStore reads */
let cachedDeviceId: string | null = null;

/**
 * Get or create a persistent device fingerprint.
 * - First call: generates 32 random bytes (hex), stores in SecureStore
 * - Subsequent calls: returns cached value
 * - Reinstalling the app generates a new ID (user re-authenticates anyway)
 */
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    // Try to read existing fingerprint
    if (Platform.OS !== 'web') {
      const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (existing) {
        cachedDeviceId = existing;
        return existing;
      }
    }
  } catch {
    // SecureStore unavailable (e.g., Expo Go web) — generate ephemeral ID
  }

  // Generate new fingerprint: 32 bytes = 256 bits of entropy
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const deviceId = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }
  } catch {
    // If we can't persist, the ID will be regenerated next session
    // This is acceptable — it just means the user needs a fresh QR token
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
