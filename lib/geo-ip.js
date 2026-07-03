import { clientIp } from './api-audit.js';
import { WAEMU_COUNTRY_CODES } from './risk-constants.js';

/** Country from Vercel / Cloudflare edge headers. */
export function clientCountryCode(req) {
  const headers = req.headers ?? {};
  const raw =
    headers['cf-ipcountry'] ??
    headers['x-vercel-ip-country'] ??
    headers['x-country-code'] ??
    null;
  if (!raw || typeof raw !== 'string') return null;
  return raw.toUpperCase();
}

export function deviceIdFromRequest(req) {
  const raw = req.headers['x-device-id'];
  if (!raw || typeof raw !== 'string' || raw.length < 8) return null;
  return raw.slice(0, 128);
}

export function deviceNameFromRequest(req) {
  const raw = req.headers['x-device-name'];
  return typeof raw === 'string' ? raw.slice(0, 120) : null;
}

export function isWaemuCountry(code) {
  return code != null && WAEMU_COUNTRY_CODES.has(code);
}

export function requestGeo(req) {
  return {
    ip: clientIp(req),
    countryCode: clientCountryCode(req),
    deviceId: deviceIdFromRequest(req),
    deviceName: deviceNameFromRequest(req),
  };
}

/** Hour in Africa/Dakar (0–23). */
export function dakarHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Dakar',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value;
  return Number(hour ?? 0);
}

export function isDakarNightWindow(date = new Date()) {
  const h = dakarHour(date);
  return h >= 2 && h < 4;
}
