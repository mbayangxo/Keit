/**
 * OpenStreetMap Nominatim geocoding proxy — free, no API key.
 * Usage policy requires a descriptive User-Agent and max 1 req/s, so the
 * client always goes through this server-side proxy (auth required) instead
 * of hitting Nominatim directly from phones.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'K21-Wallet/1.0 (support@k21.app)';

// Coarse in-memory throttle per serverless instance — Nominatim asks for 1 req/s.
let lastRequestAt = 0;

export async function geocodeSearch(query, { countryCodes = 'sn', limit = 5 } = {}) {
  const q = String(query ?? '').trim();
  if (q.length < 3) return { ok: false, code: 'query_too_short' };
  if (q.length > 120) return { ok: false, code: 'query_too_long' };

  const wait = 1100 - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=${encodeURIComponent(
    countryCodes,
  )}&q=${encodeURIComponent(q)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (!res.ok) return { ok: false, code: `http_${res.status}` };
    const body = await res.json();
    return {
      ok: true,
      results: (Array.isArray(body) ? body : []).slice(0, limit).map((r) => ({
        label: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
        type: r.type,
      })),
    };
  } catch (err) {
    return { ok: false, code: err.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
