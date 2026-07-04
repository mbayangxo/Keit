import { Platform } from 'react-native';
import { getAccessToken, getOrCreateDeviceId, getRefreshToken, saveSessionTokens, clearSession, touchActivity } from './secure-storage.js';
import { captureApiError } from './sentry.js';
import { loadPreferences } from './preferences-storage.js';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const GET_CACHE = new Map();
const CACHE_TTL_MS = 45_000;

let prefsCache = null;
async function getNetworkPrefs() {
  if (!prefsCache) prefsCache = await loadPreferences();
  return prefsCache;
}

export function clearApiCache() {
  GET_CACHE.clear();
  prefsCache = null;
}

function resolveUrl(path) {
  if (path.startsWith('http')) return path;
  const base = API_BASE || (Platform.OS === 'web' ? '' : 'https://localhost');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function assertHttps(url) {
  if (__DEV__ && (url.includes('localhost') || url.includes('127.0.0.1'))) return;
  // Same-origin relative paths (/api/*) inherit HTTPS from the page on web.
  if (url.startsWith('/')) return;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.protocol === 'https:') {
    if (url.startsWith('https://') || url.startsWith(window.location.origin)) return;
  }
  if (!url.startsWith('https://')) {
    throw new Error('K21 requires HTTPS — connection refused');
  }
}

export function getSslPinConfig() {
  return process.env.EXPO_PUBLIC_SSL_PIN_SHA256 ?? null;
}

function cacheKey(method, url) {
  return `${method}:${url}`;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch(path, { method = 'GET', body, stepUpToken, auth = true, skipCache = false, _retry401 = true } = {}) {
  const url = resolveUrl(path);
  assertHttps(url);
  const prefs = await getNetworkPrefs();
  const timeoutMs = prefs.lowDataMode ? 45_000 : 25_000;

  if (method === 'GET' && prefs.lowDataMode && !skipCache) {
    const key = cacheKey(method, url);
    const hit = GET_CACHE.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  }

  const headers = { 'Content-Type': 'application/json' };
  const deviceId = await getOrCreateDeviceId();
  headers['X-Device-Id'] = deviceId;
  if (prefs.lowDataMode) headers['X-Low-Data'] = '1';
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (stepUpToken) headers['X-Step-Up-Token'] = stepUpToken;

  const pin = getSslPinConfig();
  if (pin && Platform.OS !== 'web') {
    headers['X-K21-Pin-Expected'] = pin.slice(0, 8);
  }

  const options = {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  };

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      if (auth && response.ok) await touchActivity();

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 && auth && _retry401 && path !== '/api/auth/refresh') {
          const refreshToken = await getRefreshToken();
          if (refreshToken) {
            try {
              const refreshed = await authRefreshToken(refreshToken);
              await saveSessionTokens({
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
              });
              return apiFetch(path, { method, body, stepUpToken, auth, skipCache, _retry401: false });
            } catch {
              await clearSession();
            }
          }
        }
        const error = new Error(data.error ?? 'Request failed');
        error.status = response.status;
        error.code = data.code;
        error.data = data;
        if (response.status >= 500) {
          captureApiError(error, { path, status: response.status, code: data.code });
        }
        throw error;
      }

      if (method === 'GET' && prefs.lowDataMode) {
        GET_CACHE.set(cacheKey(method, url), { at: Date.now(), data });
      }
      return data;
    } catch (error) {
      lastError = error;
      const retryable =
        error.name === 'AbortError' ||
        error.message?.includes('Network') ||
        error.message?.includes('fetch');
      if (!retryable || attempt === 1) break;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  if (lastError?.name === 'AbortError') {
    const slow = new Error('Connexion lente — réessaie dans un instant');
    slow.code = 'timeout';
    throw slow;
  }
  throw lastError;
}

export function transferUndo(reference) {
  return apiFetch(`/api/transfers/${encodeURIComponent(reference)}/undo`, { method: 'POST', skipCache: true });
}

export function authPhone(phone) {
  return apiFetch('/api/auth/phone', { method: 'POST', body: { phone }, auth: false, skipCache: true });
}

export function authVerify(phone, otp) {
  return apiFetch('/api/auth/verify', { method: 'POST', body: { phone, otp }, auth: false, skipCache: true });
}

export function authCompleteProfile(body) {
  return apiFetch('/api/auth/complete-profile', { method: 'POST', body, skipCache: true });
}

export function authRefreshToken(refreshToken) {
  return apiFetch('/api/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false, skipCache: true, _retry401: false });
}

export function getMe() {
  return apiFetch('/api/me', { skipCache: true });
}

export function getWallet() {
  return apiFetch('/api/wallet', { skipCache: true });
}

export function getTransactions(limit = 20) {
  return apiFetch(`/api/transactions?limit=${limit}`, { skipCache: true });
}

export function transferSend({ recipientHandle, amount, currency = 'national', note, stepUpToken }) {
  const handle = String(recipientHandle).replace(/^@/, '');
  return apiFetch('/api/transfers/send', {
    method: 'POST',
    body: { recipientHandle: handle, amount, currency, note },
    stepUpToken,
    skipCache: true,
  });
}

export function merchantPay(businessId, { amount, currency = 'national', stepUpToken }) {
  return apiFetch(`/api/merchants/${encodeURIComponent(businessId)}/pay`, {
    method: 'POST',
    body: { amount, currency },
    stepUpToken,
    skipCache: true,
  });
}

export function cashIn({ amount, operator = 'orange_money', phone }) {
  return apiFetch('/api/cash/in', {
    method: 'POST',
    body: { amount, operator, phone },
    skipCache: true,
  });
}

export function cashOut({ amount, operator = 'orange_money', phone, stepUpToken }) {
  return apiFetch('/api/cash/out', {
    method: 'POST',
    body: { amount, operator, phone },
    stepUpToken,
    skipCache: true,
  });
}

export function authPinSet(pin) {
  return apiFetch('/api/auth/pin/set', { method: 'POST', body: { pin } });
}

export function authPinVerify(pin, forStepUp = true) {
  return apiFetch('/api/auth/pin/verify', { method: 'POST', body: { pin, forStepUp } });
}

export function authPinUnlock(cniNumber) {
  return apiFetch('/api/auth/pin/unlock', { method: 'POST', body: { cniNumber } });
}

export function authBiometricEnable(enabled) {
  return apiFetch('/api/auth/biometric', { method: 'POST', body: { enabled } });
}

export function kycStatus() {
  return apiFetch('/api/kyc/status');
}

export function kycSubmitCni({ frontImage, backImage, selfieImage }) {
  return apiFetch('/api/kyc/cni/submit', {
    method: 'POST',
    body: { frontImage, backImage, selfieImage },
  });
}

export function kycSubmitAddress({ addressLine, city, region }) {
  return apiFetch('/api/kyc/address/submit', {
    method: 'POST',
    body: { addressLine, city, region },
  });
}
