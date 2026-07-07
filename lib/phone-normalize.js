/**
 * Canonical E.164 normalization — shared logic for OTP send/verify.
 * Handles NANP (+1), Senegal local 0-prefix, and carrier format variants.
 */

export function digitsOnly(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

/** Normalize any phone string to E.164 (+…). Returns null if too short. */
export function canonicalPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let phone = raw.replace(/[\s().-]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  else if (!phone.startsWith('+')) phone = `+${phone.replace(/^\+/, '')}`;

  const d = digitsOnly(phone);
  if (d.length < 8) return null;

  // NANP: +1 + 10 digits (US/CA/Caribbean sharing +1)
  if (d.startsWith('1') && d.length === 11) {
    return `+${d}`;
  }

  // Senegal local 077… → +22177…
  if (d.startsWith('0') && d.length >= 9 && d.length <= 10) {
    return `+221${d.slice(1)}`;
  }

  return `+${d}`;
}

/** Build E.164 from country dial + local input (signup UI). */
export function phoneFromCountry(country, localPhone) {
  const dial = (country?.dial ?? '+221').replace(/\s/g, '');
  const dialDigits = dial.replace('+', '');
  let digits = digitsOnly(localPhone);

  // US/Canada: accept 11-digit 1XXXXXXXXXX pasted in the field
  if (dialDigits === '1' && digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 4) {
    return canonicalPhone(`+${digits}`);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return canonicalPhone(`${dial}${digits}`);
}

/** All DB lookup keys for OTP / user phone match. */
export function phoneVariants(normalized) {
  if (!normalized) return [];
  const canonical = canonicalPhone(normalized);
  if (!canonical) return [normalized];

  const bare = canonical.replace(/^\+/, '');
  const variants = new Set([canonical, bare, `+${bare}`]);

  if (canonical.startsWith('+221') && canonical.length >= 12) {
    variants.add(`0${canonical.slice(4)}`);
    variants.add(canonical.slice(4));
  }

  if (canonical.startsWith('+1') && canonical.length === 12) {
    const local = canonical.slice(2);
    variants.add(local);
    variants.add(`1${local}`);
  }

  return [...variants];
}

export function isValidLocalPhone(country, localPhone) {
  let digits = digitsOnly(localPhone);
  const dialDigits = (country?.dial ?? '+221').replace('+', '');

  if (dialDigits === '1' && digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  const min = country?.phoneMin ?? 8;
  const max = country?.phoneMax ?? 12;
  return digits.length >= min && digits.length <= max;
}
