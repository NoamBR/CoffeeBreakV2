import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

/**
 * On web, require() for images returns a numeric asset ID that expo-image
 * cannot resolve (calls .startsWith on a number). This helper converts
 * the numeric ID to a { uri } object on web so expo-image works correctly.
 */
export function resolveImageSource(source: number | string | { uri: string }) {
  if (Platform.OS !== 'web' || typeof source !== 'number') {
    return source;
  }
  const asset = Asset.fromModule(source);
  return { uri: asset.uri ?? asset.localUri ?? '' };
}
