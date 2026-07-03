/** Build E.164 phone from country dial code + local digits. */
export function toE164(country, localPhone) {
  const dial = (country?.dial ?? '+221').replace(/\s/g, '');
  let digits = String(localPhone).replace(/\D/g, '');
  const dialDigits = dial.replace('+', '');
  if (digits.startsWith(dialDigits)) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return `${dial}${digits}`;
}

export function isValidLocalPhone(country, localPhone) {
  const digits = String(localPhone).replace(/\D/g, '');
  const min = country?.phoneMin ?? 8;
  const max = country?.phoneMax ?? 12;
  return digits.length >= min && digits.length <= max;
}
