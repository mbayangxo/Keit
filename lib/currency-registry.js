/**
 * K21 currency & country registry — single place to add/remove markets.
 *
 * Architecture:
 * - **CAURIS** — one closed-loop unit across the network (display: C̶)
 * - **National fiat** — per-country wallet leg via licensed rails
 * - **Rails** — pluggable adapters (Julaya, Stripe, future bank APIs)
 *
 * To add a country: append to COUNTRY_MARKETS and register rails in open-rails.js.
 * To disable a market: set `active: false` (soft off — no code deletion).
 */

/** Reserve peg: 1 Cauris = 10 XOF (WAEMU anchor) */
export const RESERVE_XOF_PER_CAURIS = 10;

/**
 * @typedef {Object} CountryMarket
 * @property {boolean} active
 * @property {string} currency ISO-like code for national leg
 * @property {number} nationalPerCauris national minor units per 1 Cauris
 * @property {number} rolloutPhase 1 | 2 | 3
 * @property {string} [regulatorHint] for audit exports
 * @property {string[]} [defaultRails] provider keys from open-rails
 */

/** Add or remove countries here — kori.js reads nationalPerCauris via countryConfig() */
export const COUNTRY_MARKETS = Object.freeze({
  SN: {
    active: true,
    currency: 'XOF',
    nationalPerCauris: 10,
    rolloutPhase: 1,
    regulatorHint: 'BCEAO / CENTIF',
    defaultRails: ['julaya', 'pawapay'],
  },
  BJ: { active: true, currency: 'XOF', nationalPerCauris: 10, rolloutPhase: 2, regulatorHint: 'BCEAO', defaultRails: ['julaya'] },
  BF: { active: true, currency: 'XOF', nationalPerCauris: 10, rolloutPhase: 2, regulatorHint: 'BCEAO', defaultRails: ['julaya'] },
  CI: { active: true, currency: 'XOF', nationalPerCauris: 10, rolloutPhase: 2, regulatorHint: 'BCEAO', defaultRails: ['julaya'] },
  GW: { active: true, currency: 'XOF', nationalPerCauris: 10, rolloutPhase: 2, regulatorHint: 'BCEAO', defaultRails: [] },
  ML: { active: true, currency: 'XOF', nationalPerCauris: 10, rolloutPhase: 2, regulatorHint: 'BCEAO', defaultRails: ['julaya'] },
  NE: { active: true, currency: 'XOF', nationalPerCauris: 10, rolloutPhase: 2, regulatorHint: 'BCEAO', defaultRails: [] },
  TG: { active: true, currency: 'XOF', nationalPerCauris: 10, rolloutPhase: 2, regulatorHint: 'BCEAO', defaultRails: [] },
  NG: {
    active: true,
    currency: 'NGN',
    nationalPerCauris: 10,
    rolloutPhase: 3,
    regulatorHint: 'CBN',
    defaultRails: ['flutterwave', 'paystack'],
  },
  GH: { active: true, currency: 'GHS', nationalPerCauris: 1, rolloutPhase: 3, regulatorHint: 'BoG', defaultRails: ['mtn_momo'] },
  GM: { active: false, currency: 'GMD', nationalPerCauris: 10, rolloutPhase: 3, regulatorHint: 'CBG', defaultRails: [] },
});

export function listActiveMarkets() {
  return Object.entries(COUNTRY_MARKETS)
    .filter(([, m]) => m.active)
    .map(([code, m]) => ({ country: code, ...m }));
}

export function marketForCountry(country) {
  const code = country ?? 'SN';
  const m = COUNTRY_MARKETS[code];
  if (!m || !m.active) return COUNTRY_MARKETS.SN;
  return m;
}

/** Back-compat shape for kori.js */
export function countryConfig(country) {
  const m = marketForCountry(country);
  return { currency: m.currency, nationalPerKori: m.nationalPerCauris };
}

export function isMarketActive(country) {
  const m = COUNTRY_MARKETS[country];
  return Boolean(m?.active);
}

export function nationalToCauris(nationalAmount, country) {
  const { nationalPerCauris } = marketForCountry(country);
  return Math.floor(nationalAmount / nationalPerCauris);
}

export function caurisToNational(caurisAmount, country) {
  const { nationalPerCauris } = marketForCountry(country);
  return caurisAmount * nationalPerCauris;
}
