/**
 * Open payments platform — adapter contract for banks, telcos, and gov rails.
 *
 * New providers implement `OpenRailAdapter` and register with `registerRail()`.
 * Handlers call `getRail(provider)` — never hard-code Julaya/Stripe inside wallet logic.
 *
 * Compliance: every settlement must emit ApiAuditLog + LedgerEntry; webhooks are idempotent.
 */

/** @typedef {'cash_in'|'cash_out'|'remittance'|'card_deposit'|'bank_transfer'} RailOperation */

/**
 * @typedef {Object} OpenRailAdapter
 * @property {string} id
 * @property {string} displayName
 * @property {string[]} countries ISO country codes served
 * @property {RailOperation[]} operations
 * @property {boolean} requiresLicense
 * @property {(params: object) => Promise<object>} [startCashIn]
 * @property {(params: object) => Promise<object>} [startCashOut]
 * @property {(params: object) => Promise<object>} [startRemittance]
 * @property {(webhookBody: object) => Promise<object>} [handleWebhook]
 */

/** @type {Map<string, OpenRailAdapter>} */
const registry = new Map();

/** Built-in registry — wire real SDK calls in rail-service.js per adapter */
const BUILTIN_RAILS = [
  {
    id: 'julaya',
    displayName: 'Julaya (WAEMU mobile money)',
    countries: ['SN', 'CI', 'BF', 'ML', 'BJ', 'NE', 'TG', 'GW'],
    operations: ['cash_in', 'cash_out'],
    requiresLicense: true,
  },
  {
    id: 'pawapay',
    displayName: 'PawaPay',
    countries: ['SN', 'CI', 'GH', 'NG'],
    operations: ['cash_in', 'cash_out'],
    requiresLicense: true,
  },
  {
    id: 'lemfi',
    displayName: 'LemFi (diaspora remittance)',
    countries: ['SN', 'NG', 'GH', 'GM'],
    operations: ['remittance'],
    requiresLicense: true,
  },
  {
    id: 'stripe',
    displayName: 'Stripe (card / diaspora deposit)',
    countries: ['SN', 'US', 'FR'],
    operations: ['card_deposit'],
    requiresLicense: true,
  },
  {
    id: 'flutterwave',
    displayName: 'Flutterwave',
    countries: ['NG', 'GH', 'CI'],
    operations: ['cash_in', 'cash_out', 'bank_transfer'],
    requiresLicense: true,
  },
  {
    id: 'paystack',
    displayName: 'Paystack',
    countries: ['NG'],
    operations: ['cash_in', 'bank_transfer'],
    requiresLicense: true,
  },
  {
    id: 'mtn_momo',
    displayName: 'MTN MoMo API',
    countries: ['GH'],
    operations: ['cash_in', 'cash_out'],
    requiresLicense: true,
  },
];

for (const rail of BUILTIN_RAILS) {
  registry.set(rail.id, rail);
}

export function registerRail(adapter) {
  if (!adapter?.id) throw new Error('Rail adapter must have id');
  registry.set(adapter.id, adapter);
  return adapter;
}

export function getRail(id) {
  return registry.get(id) ?? null;
}

export function listRails({ country, operation } = {}) {
  return [...registry.values()].filter((r) => {
    if (country && !r.countries.includes(country)) return false;
    if (operation && !r.operations.includes(operation)) return false;
    return true;
  });
}

import { marketForCountry } from './currency-registry.js';

export function defaultRailForCountry(country, operation) {
  const market = marketForCountry(country);
  for (const id of market.defaultRails ?? []) {
    const rail = getRail(id);
    if (rail?.operations.includes(operation)) return rail;
  }
  return listRails({ country, operation })[0] ?? null;
}
