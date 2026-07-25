import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken, getOrCreateDeviceId, getRefreshToken, saveSessionTokens, clearSession, touchActivity } from './secure-storage.js';
import { captureApiError } from './sentry.js';
import { loadPreferences } from './preferences-storage.js';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'https://keit-six.vercel.app';
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

// EXPO_PUBLIC_API_URL is often set to a bare host (e.g. "keit-six.vercel.app",
// copy-pasted from Vercel's dashboard without the scheme) — treat that as
// https rather than hard-failing with a cryptic "requires HTTPS" error.
function normalizeBase(base) {
  if (!base) return base;
  if (base.startsWith('http://') || base.startsWith('https://')) return base;
  return `https://${base}`;
}

function resolveUrl(path) {
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Web deploys ship frontend + /api on the same Vercel origin. Never call a
  // different host (e.g. EXPO_PUBLIC_API_URL=keit-six while on os-projects).
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (normalizedPath.startsWith('/api')) {
      return normalizedPath;
    }
    const base = normalizeBase(API_BASE);
    const origin = window.location.origin;
    if (!base || base.replace(/\/$/, '') === origin) {
      return normalizedPath;
    }
  }

  const base = normalizeBase(API_BASE) || (Platform.OS === 'web' ? '' : 'https://localhost');
  return `${base}${normalizedPath}`;
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

export async function apiFetch(path, { method = 'GET', body, stepUpToken, auth = true, skipCache = false, _retry401 = true, accessToken: accessTokenOverride } = {}) {
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
    const token = accessTokenOverride ?? (await getAccessToken());
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
        if (response.status === 401 && auth && _retry401 && path !== '/api/auth/refresh' && !accessTokenOverride) {
          const refreshToken = await getRefreshToken();
          if (refreshToken) {
            try {
              const refreshed = await authRefreshToken(refreshToken);
              await saveSessionTokens({
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
              });
              return apiFetch(path, { method, body, stepUpToken, auth, skipCache, _retry401: false, accessToken: accessTokenOverride });
            } catch {
              await clearSession();
            }
          }
        }
        const baseMsg =
          data.error ??
          (data.details ? 'Validation failed — check your input' : null) ??
          (response.status === 405 ? 'Server misconfigured — API route not found' : null) ??
          `Request failed (${response.status})`;
        // Beta only: the server tags 401s with a `debug` reason — show it
        // inline so a screenshot is enough to diagnose, no logs needed.
        const msg = data.debug ? `${baseMsg} [${data.debug}]` : baseMsg;
        const error = new Error(msg);
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
  const raw = lastError?.message ?? '';
  if (raw === 'Load failed' || raw.includes('Failed to fetch') || raw.includes('Network request failed')) {
    const network = new Error('Connexion impossible — vérifie ta connexion et réessaie');
    network.code = 'network';
    throw network;
  }
  throw lastError;
}

export function lookupUser(query) {
  const q = String(query).trim();
  if (q.length < 3) return Promise.reject(new Error('Query too short'));
  return apiFetch(`/api/users/lookup?q=${encodeURIComponent(q)}`, { skipCache: true });
}

export function transferUndo(reference) {
  return apiFetch(`/api/transfers/${encodeURIComponent(reference)}/undo`, { method: 'POST', skipCache: true });
}

export function getCultureFeed(country = 'SN', query = '') {
  const params = new URLSearchParams({ country });
  if (query) params.set('q', query);
  return apiFetch(`/api/culture/feed?${params.toString()}`, { skipCache: true });
}

export function getTrendingFeed(tab = 'all', query = '') {
  const params = new URLSearchParams({ tab });
  if (query) params.set('q', query);
  return apiFetch(`/api/trending/feed?${params.toString()}`, { skipCache: true });
}

export function getTrendingAlert(alertId) {
  return apiFetch(`/api/trending/alerts/${encodeURIComponent(alertId)}`, { skipCache: true });
}

export function markTrendingAlertRead(alertId) {
  return apiFetch(`/api/trending/alerts/${encodeURIComponent(alertId)}/read`, { method: 'POST', skipCache: true });
}

export function getTrendingAlertShareMessage(alertId) {
  return apiFetch(`/api/trending/alerts/${encodeURIComponent(alertId)}/share`, { method: 'POST', skipCache: true });
}

export function authRecover(phone, email) {
  return apiFetch('/api/auth/recover', { method: 'POST', body: { phone, email: email.trim().toLowerCase() }, auth: false, skipCache: true });
}

export function authEmail(email, intent = 'login') {
  return apiFetch('/api/auth/email', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), intent },
    auth: false,
    skipCache: true,
  });
}

export function authPhone(phone, intent = 'signup') {
  return apiFetch('/api/auth/phone', { method: 'POST', body: { phone, intent }, auth: false, skipCache: true });
}

export function authVerify(phoneOrOpts, otp, intent = 'signup') {
  const body =
    typeof phoneOrOpts === 'object' && phoneOrOpts !== null
      ? { ...phoneOrOpts, otp: String(phoneOrOpts.otp ?? '').trim() }
      : { phone: phoneOrOpts, otp: String(otp).trim(), intent };
  return apiFetch('/api/auth/verify', { method: 'POST', body, auth: false, skipCache: true });
}

export function authPasswordLogin(email, password) {
  return apiFetch('/api/auth/password/login', {
    method: 'POST',
    body: { email: String(email).trim().toLowerCase(), password },
    auth: false,
    skipCache: true,
  });
}

export function authPasswordSet(password) {
  return apiFetch('/api/auth/password/set', { method: 'POST', body: { password }, skipCache: true });
}

export function authPasswordSetWithOtp(email, password, otp) {
  return apiFetch('/api/auth/password/set-with-otp', {
    method: 'POST',
    body: { email: String(email).trim().toLowerCase(), password, otp: String(otp).trim() },
    auth: false,
    skipCache: true,
  });
}

export function authCompleteProfile(body) {
  return apiFetch('/api/auth/complete-profile', { method: 'POST', body, skipCache: true });
}

export function authRefreshToken(refreshToken) {
  return apiFetch('/api/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false, skipCache: true, _retry401: false });
}

export function getMe(accessToken) {
  return apiFetch('/api/me', { skipCache: true, accessToken, _retry401: !accessToken });
}

export function getMeSummary() {
  return apiFetch('/api/me/summary', { skipCache: true });
}

export function getStudentPass() {
  return apiFetch('/api/me/student-pass', { skipCache: true });
}

export function enrollStudentPass(schoolName) {
  return apiFetch('/api/me/student-pass', {
    method: 'POST',
    body: { schoolName },
    skipCache: true,
  });
}

export function patchMe(body) {
  return apiFetch('/api/me', { method: 'PATCH', body, skipCache: true });
}

export function mePhoneRequest(phone) {
  return apiFetch('/api/me/phone', { method: 'POST', body: { phone }, skipCache: true });
}

export function mePhoneConfirm(phone, otp) {
  return apiFetch('/api/me/phone/confirm', { method: 'POST', body: { phone, otp: String(otp).trim() }, skipCache: true });
}

export function getWallet(accessToken) {
  return apiFetch('/api/wallet', { skipCache: true, accessToken, _retry401: !accessToken });
}

export function getTransactions(limit = 20, accessToken) {
  return apiFetch(`/api/transactions?limit=${limit}`, { skipCache: true, accessToken, _retry401: !accessToken });
}

export function transferSend({ recipientHandle, amount, currency = 'kori', note, stepUpToken }) {
  const handle = String(recipientHandle).replace(/^@/, '');
  return apiFetch('/api/transfers/send', {
    method: 'POST',
    body: { recipientHandle: handle, amount, currency, note },
    stepUpToken,
    skipCache: true,
  });
}

export function merchantPay(businessId, { amount, currency = 'kori', stepUpToken }) {
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

/** Beta / diaspora test credits — requires ALLOW_BETA_DEPOSITS on the server. */
export function depositNational({ amount, source = 'beta' }) {
  return apiFetch('/api/deposits/national', {
    method: 'POST',
    body: { amount, source },
    skipCache: true,
  });
}

export function getMboloThreads() {
  return apiFetch('/api/mbolo/threads', { skipCache: true });
}

export function createMboloThread({ name, memberHandles = [] }) {
  return apiFetch('/api/mbolo/threads', {
    method: 'POST',
    body: { name, memberHandles },
    skipCache: true,
  });
}

export function getMboloMessages(threadId) {
  return apiFetch(`/api/mbolo/threads/${encodeURIComponent(threadId)}/messages`, { skipCache: true });
}

export function sendMboloMessage(threadId, payload) {
  return apiFetch(`/api/mbolo/threads/${encodeURIComponent(threadId)}/messages`, {
    method: 'POST',
    body: payload,
    skipCache: true,
  });
}

export function getEvents() {
  return apiFetch('/api/events', { skipCache: true });
}

export function purchaseEventTickets(eventId, quantity = 1) {
  return apiFetch(`/api/events/${encodeURIComponent(eventId)}/tickets`, {
    method: 'POST',
    body: { quantity },
    skipCache: true,
  });
}

export function getProducts(category) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch(`/api/products${q}`, { skipCache: true });
}

export function createProduct(body) {
  return apiFetch('/api/products', { method: 'POST', body, skipCache: true });
}

export function registerSellerProfile(body) {
  return apiFetch('/api/sellers/profile', { method: 'POST', body, skipCache: true });
}

export function getBusinesses(category) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch(`/api/businesses${q}`, { skipCache: true });
}

export function createBusiness({ name, type = 'merchant', category, arrondissement, description, address, lat, lng }) {
  return apiFetch('/api/businesses', {
    method: 'POST',
    body: { name, type, category, arrondissement, description, address, lat, lng },
    skipCache: true,
  });
}

export function getMyBusinesses() {
  return apiFetch('/api/businesses/mine', { skipCache: true });
}

export function getBusiness(id) {
  return apiFetch(`/api/businesses/${encodeURIComponent(id)}`, { skipCache: true });
}

export function getBusinessWallet(businessId, limit = 30) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/wallet?limit=${limit}`, { skipCache: true });
}

export function getBusinessCreditSummary(businessId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/credit-summary`, { skipCache: true });
}

export function transferBusinessFunds(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/transfer`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function getBusinessMembers(businessId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/members`, { skipCache: true });
}

export function inviteBusinessMember(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/members`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function getPayrollGroups(businessId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/payroll/groups`, { skipCache: true });
}

export function createPayrollGroup(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/payroll/groups`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function getPayrollEmployees(businessId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/payroll/employees`, { skipCache: true });
}

export function addPayrollEmployee(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/payroll/employees`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function payPayrollEmployee(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/payroll/pay`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function runPayrollBatch(businessId, body = {}) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/payroll/run`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function getSchoolStudents(businessId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/school/students`, { skipCache: true });
}

export function enrollSchoolStudent(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/school/students`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function getSchoolFeePeriods(businessId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/school/periods`, { skipCache: true });
}

export function createSchoolFeePeriod(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/school/periods`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function getSchoolPeriodStatus(businessId, periodId) {
  return apiFetch(
    `/api/businesses/${encodeURIComponent(businessId)}/school/periods/${encodeURIComponent(periodId)}/status`,
    { skipCache: true },
  );
}

export function paySchoolFee(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/school/pay`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function remindSchoolFees(businessId, periodId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/school/remind`, {
    method: 'POST',
    body: { periodId },
    skipCache: true,
  });
}

export function getCooperativeDeliveries(businessId, query = {}) {
  const params = new URLSearchParams(query);
  const q = params.toString() ? `?${params}` : '';
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/cooperative/deliveries${q}`, {
    skipCache: true,
  });
}

export function logCooperativeDelivery(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/cooperative/deliveries`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function verifyCooperativeDelivery(businessId, deliveryId, body) {
  return apiFetch(
    `/api/businesses/${encodeURIComponent(businessId)}/cooperative/deliveries/${encodeURIComponent(deliveryId)}/verify`,
    { method: 'POST', body, skipCache: true },
  );
}

export function payoutCooperativeFarmer(businessId, body) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/cooperative/payout`, {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function syncOfflineQueue(items) {
  return apiFetch('/api/offline/sync', { method: 'POST', body: { items }, skipCache: true });
}

export function getBlocks() {
  return apiFetch('/api/trust/blocks', { skipCache: true });
}

export function blockTarget(body) {
  return apiFetch('/api/trust/block', { method: 'POST', body, skipCache: true });
}

export function unblockTarget(blockId) {
  return apiFetch(`/api/trust/block/${encodeURIComponent(blockId)}`, { method: 'DELETE', skipCache: true });
}

export function submitReport(body) {
  return apiFetch('/api/trust/report', { method: 'POST', body, skipCache: true });
}

export function getTontineGroups() {
  return apiFetch('/api/tontine/groups', { skipCache: true });
}

export function createTontineGroup(body) {
  return apiFetch('/api/tontine/groups', { method: 'POST', body, skipCache: true });
}

export function releaseTontinePot(groupId) {
  return apiFetch(`/api/tontine/groups/${encodeURIComponent(groupId)}/release`, {
    method: 'POST',
    skipCache: true,
  });
}

export function getFriends() {
  return apiFetch('/api/friends', { skipCache: true });
}

/** Sends a friend REQUEST (the other person must accept) — WeChat model. */
export function addFriend(handle, message) {
  return apiFetch('/api/friends', {
    method: 'POST',
    body: { handle: String(handle).replace(/^@/, ''), ...(message ? { message } : {}) },
    skipCache: true,
  });
}

export function getFriendRequests() {
  return apiFetch('/api/friends/requests', { skipCache: true });
}

export function respondFriendRequest(requestId, accept) {
  return apiFetch(`/api/friends/requests/${encodeURIComponent(requestId)}/respond`, {
    method: 'POST',
    body: { accept: accept !== false },
    skipCache: true,
  });
}

export function getVouchStatus() {
  return apiFetch('/api/trust/vouch', { skipCache: true });
}

/** LiveKit room token for a Mboolo call. ring=true announces the call. */
export function getCallToken({ threadId, video = false, ring = false }) {
  return apiFetch('/api/calls/token', {
    method: 'POST',
    body: { threadId, video, ring },
    skipCache: true,
  });
}

/** Confirm another member after scanning their QR (6-month+ accounts only). */
export function vouchForUser(handle) {
  return apiFetch('/api/trust/vouch', {
    method: 'POST',
    body: { handle: String(handle).replace(/^@/, '') },
    skipCache: true,
  });
}

export function removeFriend(friendUserId) {
  return apiFetch(`/api/friends/${encodeURIComponent(friendUserId)}`, { method: 'DELETE', skipCache: true });
}

export function getNotifications() {
  return apiFetch('/api/notifications', { skipCache: true });
}

export function markNotificationRead(id) {
  return apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', skipCache: true });
}

export function transferRequest({ recipientHandle, amount, note }) {
  const handle = String(recipientHandle).replace(/^@/, '');
  return apiFetch('/api/transfers/request', {
    method: 'POST',
    body: { recipientHandle: handle, amount, currency: 'kori', note },
    skipCache: true,
  });
}

export function getTransferRequests(role = 'all') {
  return apiFetch(`/api/transfers/requests?role=${encodeURIComponent(role)}`, { skipCache: true });
}

export function acceptTransferRequest(id) {
  return apiFetch(`/api/transfers/requests/${encodeURIComponent(id)}/accept`, { method: 'POST', skipCache: true });
}

export function denyTransferRequest(id) {
  return apiFetch(`/api/transfers/requests/${encodeURIComponent(id)}/deny`, { method: 'POST', skipCache: true });
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

export function getNearbyDeliveries(query = {}) {
  const params = new URLSearchParams(query);
  const q = params.toString() ? `?${params}` : '';
  return apiFetch(`/api/deliveries/nearby${q}`, { skipCache: true });
}

export function acceptDelivery(deliveryId) {
  return apiFetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/accept`, {
    method: 'POST',
    skipCache: true,
  });
}

export function registerDriverProfile(body = {}) {
  return apiFetch('/api/drivers/profile', {
    method: 'POST',
    body,
    skipCache: true,
  });
}

export function getWorkerProfile() {
  return apiFetch('/api/workers/profile', { skipCache: true });
}

export function activateWorkerProfile(modes) {
  return apiFetch('/api/workers/profile', {
    method: 'POST',
    body: { modes },
    skipCache: true,
  });
}

export function getWorkerReceipts(limit = 50) {
  return apiFetch(`/api/workers/receipts?limit=${limit}`, { skipCache: true });
}

export function getWorkerCreditSummary() {
  return apiFetch('/api/workers/credit-summary', { skipCache: true });
}

export function requestDelivery(body) {
  return apiFetch('/api/deliveries', {
    method: 'POST',
    body,
    skipCache: true,
  });
}

// ── K21 Charts — community song poll + YouTube SN trending ──

export function getWeeklyChart() {
  return apiFetch('/api/charts', { skipCache: true });
}

export function submitChartSong({ title, artist, videoId }) {
  return apiFetch('/api/charts/submit', { method: 'POST', body: { title, artist, videoId }, skipCache: true });
}

export function searchChartSongs(q) {
  return apiFetch(`/api/charts/search?q=${encodeURIComponent(q)}`, { skipCache: true });
}

export function voteChartSong(songId) {
  return apiFetch('/api/charts/vote', { method: 'POST', body: { songId }, skipCache: true });
}

// ── OpenStreetMap address search (server-side Nominatim proxy) ──

export function geoSearchAddress(q) {
  return apiFetch(`/api/geo/search?q=${encodeURIComponent(q)}`, { skipCache: true });
}

// ── Real merchant reviews ──

export function getBusinessReviews(businessId) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/reviews`, { skipCache: true });
}

export function submitBusinessReview(businessId, { rating, text }) {
  return apiFetch(`/api/businesses/${encodeURIComponent(businessId)}/reviews`, {
    method: 'POST',
    body: { rating, text },
    skipCache: true,
  });
}

// ── Public profiles + flash deals ──

export function getPublicProfile(handle) {
  return apiFetch(`/api/profiles/${encodeURIComponent(String(handle).replace(/^@+/, ''))}`, { skipCache: true });
}

export function getFlashDeals() {
  return apiFetch('/api/products?flash=1', { skipCache: true });
}

export function createFlashDeal({ businessId, title, price, flashPrice, flashHours, category = 'deal' }) {
  return apiFetch('/api/products', {
    method: 'POST',
    body: { businessId, title, price, flashPrice, flashHours, category },
    skipCache: true,
  });
}


// ── Profile polls ──

export function askProfilePoll({ question, options }) {
  return apiFetch('/api/polls', { method: 'POST', body: { question, options }, skipCache: true });
}

export function closeProfilePoll() {
  return apiFetch('/api/polls', { method: 'POST', body: { close: true }, skipCache: true });
}

export function voteProfilePoll(pollId, optionIx) {
  return apiFetch(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
    method: 'POST',
    body: { optionIx },
    skipCache: true,
  });
}


// ── Channels ──

export function getMyChannel() {
  return apiFetch('/api/channels/mine', { skipCache: true });
}

export function saveMyChannel({ name, bio }) {
  return apiFetch('/api/channels/mine', { method: 'POST', body: { name, bio }, skipCache: true });
}

export function publishChannelPost({ body, imageUrl }) {
  return apiFetch('/api/channels/posts', { method: 'POST', body: { body, imageUrl }, skipCache: true });
}

export function deleteChannelPost(postId) {
  return apiFetch(`/api/channels/posts/${encodeURIComponent(postId)}/delete`, { method: 'POST', skipCache: true });
}

export function browseChannelsList() {
  return apiFetch('/api/channels', { skipCache: true });
}

export function getChannelFeed() {
  return apiFetch('/api/channels/feed', { skipCache: true });
}

export function getChannel(channelId) {
  return apiFetch(`/api/channels/${encodeURIComponent(channelId)}`, { skipCache: true });
}

export function followChannel(channelId, follow = true) {
  return apiFetch(`/api/channels/${encodeURIComponent(channelId)}/follow`, {
    method: 'POST',
    body: { follow },
    skipCache: true,
  });
}
