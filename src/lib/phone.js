/** Build E.164 phone from country dial code + local digits. */
export function toE164(country, localPhone) {
  const dial = (country?.dial ?? '+221').replace(/\s/g, '');
  const dialDigits = dial.replace('+', '');
  let digits = String(localPhone).replace(/\D/g, '');

  if (dialDigits === '1' && digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 4) {
    const e164 = `+${digits}`;
    return e164;
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return `${dial}${digits}`;
}

export function isValidLocalPhone(country, localPhone) {
  let digits = String(localPhone).replace(/\D/g, '');
  const dialDigits = (country?.dial ?? '+221').replace('+', '');

  if (dialDigits === '1' && digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  const min = country?.phoneMin ?? 8;
  const max = country?.phoneMax ?? 12;
  return digits.length >= min && digits.length <= max;
}
