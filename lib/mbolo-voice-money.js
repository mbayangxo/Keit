/**
 * Parse natural-language send commands in French / Wolof-ish chat text.
 * Examples: "Envoie 2000 à @amadou", "envoyer 5000 F à fatou", "paye @moussa 1000"
 */

const PATTERNS = [
  /(?:envoie|envoyer|donne|donner|paye|payer|transfer(?:e|er)?)\s+(\d[\d\s.,]*)\s*(?:f|fcfa|xof|₭|kori|c̶)?\s*(?:à|a|@)\s*@?([a-zA-Z0-9_]{3,32})/i,
  /(?:envoie|envoyer|donne|paye)\s+@?([a-zA-Z0-9_]{3,32})\s+(\d[\d\s.,]*)\s*(?:f|fcfa|xof|₭|kori|c̶)?/i,
  /(?:envoie|envoyer)\s+(\d[\d\s.,]*)\s*(?:f|fcfa|xof)?\s*(?:à|a)\s*@?([a-zA-Z0-9_]{3,32})/i,
];

function parseAmount(raw) {
  const digits = String(raw ?? '').replace(/[\s.,]/g, '');
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseMoneyCommand(text) {
  const input = String(text ?? '').trim();
  if (!input) return null;

  for (const pattern of PATTERNS) {
    const m = input.match(pattern);
    if (!m) continue;
    const amountRaw = m[1].match(/\d/) ? m[1] : m[2];
    const handleRaw = m[1].match(/\d/) ? m[2] : m[1];
    const amount = parseAmount(amountRaw);
    const handle = String(handleRaw ?? '').replace(/^@/, '').toLowerCase();
    if (!amount || !handle) continue;
    return { amount, handle, note: input };
  }
  return null;
}

export function isMoneyCommand(text) {
  return parseMoneyCommand(text) != null;
}
