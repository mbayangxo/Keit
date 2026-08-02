/** Cauris — C with horizontal stroke (matches lib/kori.js). */
export const CAURIS_SYMBOL = 'C\u0336';
/** @deprecated use CAURIS_SYMBOL */
export const KORI_SYMBOL = CAURIS_SYMBOL;
export const KORI_COLOR = '#1af060';

export function formatKori(amount) {
  const n = Number(amount) || 0;
  const formatted = n.toLocaleString('fr-FR').replace(/\s/g, ' ');
  return `${CAURIS_SYMBOL} ${formatted}`;
}

export const formatCauris = formatKori;

/** Show XOF equivalent as subtitle at cash-in/out boundaries only. */
export function formatNationalEquivalent(koriAmount, nationalPerKori = 10) {
  const xof = koriAmount * nationalPerKori;
  return `${xof.toLocaleString('fr-FR').replace(/\s/g, ' ')} F`;
}

/** @deprecated use formatKori */
export function formatAmount(n) {
  return formatKori(n).slice(2);
}
