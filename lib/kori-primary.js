/**
 * Kori-primary money model — all spendable balances are ₭ inside K21.
 * National currency only appears at cash-in / cash-out rails (Julaya).
 */
import { nationalToKori, koriToNational, formatKori } from './kori.js';

export const PRIMARY_CURRENCY = 'kori';
export const LEGACY_CURRENCY = 'national';

/** Normalize API currency; default is Kori. */
export function normalizeCurrency(currency) {
  if (!currency || currency === LEGACY_CURRENCY) return PRIMARY_CURRENCY;
  return currency;
}

/** Convert any API amount to ₭ for ledger operations. */
export function normalizeAmountToKori(amount, currency, country) {
  const c = currency ?? PRIMARY_CURRENCY;
  if (c === LEGACY_CURRENCY || c === 'national') {
    return nationalToKori(amount, country ?? 'SN');
  }
  return amount;
}

/** XOF equivalent for tier limits, step-up, and cash rails. */
export function koriAmountToNational(amountKori, country) {
  return koriToNational(amountKori, country ?? 'SN');
}

export function amountToNationalXof(amount, currency, country) {
  return koriAmountToNational(normalizeAmountToKori(amount, currency, country), country);
}

/** Legacy DB/UI amounts stored in XOF → ₭ for wallet ops. */
export function legacyNationalToKori(amountNational, country = 'SN') {
  return nationalToKori(amountNational, country);
}

export { formatKori };
