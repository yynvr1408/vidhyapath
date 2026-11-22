import { Capacitor } from '@capacitor/core';

/**
 * Platform Detection Utility for Vidyapath
 * - Explicitly distinguishes between browser website (desktop/mobile web)
 *   and the native packaged Capacitor Android/iOS application.
 * - Never guesses native platform based on localhost port numbers!
 */

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Explicit override via query parameter (?platform=native or ?platform=web)
  if (typeof window.location.search === 'string') {
    if (window.location.search.includes('platform=native')) return true;
    if (window.location.search.includes('platform=web')) return false;
  }

  // 2. Official Capacitor Core Native Platform check
  try {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function') {
      if (Capacitor.isNativePlatform()) return true;
      const platform = Capacitor.getPlatform();
      if (platform === 'android' || platform === 'ios') return true;
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback check for window.Capacitor
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    if (cap.isNativePlatform()) return true;
  }
  if (cap && typeof cap.getPlatform === 'function') {
    const platform = cap.getPlatform();
    if (platform === 'android' || platform === 'ios') return true;
  }

  // 4. Capacitor WebView protocol schemes on device
  if (
    window.location.protocol === 'capacitor:' ||
    window.location.origin.includes('capacitor://')
  ) {
    return true;
  }

  return false;
}

