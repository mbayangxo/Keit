/** Kori (₭) display helpers — matches lib/kori.js on the backend. */
export const KORI_SYMBOL = '₭';
export const KORI_COLOR = '#1af060';

export function formatKori(amount) {
  const n = Number(amount) || 0;
  const formatted = n.toLocaleString('fr-FR').replace(/\s/g, ' ');
  return `${KORI_SYMBOL}${formatted}`;
}

/** Show XOF equivalent as subtitle at cash-in/out boundaries only. */
export function formatNationalEquivalent(koriAmount, nationalPerKori = 10) {
  const xof = koriAmount * nationalPerKori;
  return `${xof.toLocaleString('fr-FR').replace(/\s/g, ' ')} F`;
}

/** @deprecated use formatKori — kept for gradual screen migration */
export function formatAmount(n) {
  return formatKori(n).slice(1);
}
