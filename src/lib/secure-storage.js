import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'k21_access_token',
  REFRESH_TOKEN: 'k21_refresh_token',
  BIOMETRIC_ENABLED: 'k21_biometric_enabled',
  LAST_ACTIVITY: 'k21_last_activity',
  PIN_CONFIGURED: 'k21_pin_configured',
};

/** Immediate read-after-write cache — iOS SecureStore can lag one tick after login. */
let memoryAccessToken = null;
let memoryRefreshToken = null;

async function setItem(key, value) {
  if (Platform.OS === 'web') {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* web dev fallback */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key) {
  if (Platform.OS === 'web') {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key) {
  if (Platform.OS === 'web') {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getOrCreateDeviceId() {
  const KEY = 'k21_device_id';
  let id = await getItem(KEY);
  if (!id) {
    id = `k21-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    await setItem(KEY, id);
  }
  return id;
}

export async function saveSessionTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    memoryAccessToken = accessToken;
    await setItem(KEYS.ACCESS_TOKEN, accessToken);
  }
  if (refreshToken) {
    memoryRefreshToken = refreshToken;
    await setItem(KEYS.REFRESH_TOKEN, refreshToken);
  }
  await touchActivity();
}

export async function getAccessToken() {
  if (memoryAccessToken) return memoryAccessToken;
  const stored = await getItem(KEYS.ACCESS_TOKEN);
  if (stored) memoryAccessToken = stored;
  return stored;
}

export async function getRefreshToken() {
  if (memoryRefreshToken) return memoryRefreshToken;
  const stored = await getItem(KEYS.REFRESH_TOKEN);
  if (stored) memoryRefreshToken = stored;
  return stored;
}

export async function clearSession() {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  await deleteItem(KEYS.ACCESS_TOKEN);
  await deleteItem(KEYS.REFRESH_TOKEN);
  await deleteItem(KEYS.LAST_ACTIVITY);
}

export async function setBiometricEnabled(enabled) {
  await setItem(KEYS.BIOMETRIC_ENABLED, enabled ? '1' : '0');
}

export async function isBiometricEnabled() {
  return (await getItem(KEYS.BIOMETRIC_ENABLED)) === '1';
}

export async function setPinConfigured(configured) {
  await setItem(KEYS.PIN_CONFIGURED, configured ? '1' : '0');
}

export async function isPinConfigured() {
  return (await getItem(KEYS.PIN_CONFIGURED)) === '1';
}

export const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

export async function touchActivity() {
  await setItem(KEYS.LAST_ACTIVITY, String(Date.now()));
}

export async function isSessionInactive() {
  const raw = await getItem(KEYS.LAST_ACTIVITY);
  if (!raw) return false;
  return Date.now() - Number(raw) > SESSION_INACTIVITY_MS;
}
