// Plain "C" only — the stylized shell glyph lives in the UI as an SVG
// (CaurisSymbol.js / KoriAmount.js), not as a Unicode combining character in
// plain text. A combining stroke here also silently broke formatAmount()
// below, which slices off a fixed-width prefix.
export const CAURIS_SYMBOL = 'C';
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
