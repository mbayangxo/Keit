import { canonicalPhone, phoneVariants as buildPhoneVariants } from './phone-normalize.js';

export function normalizeEmail(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

/** OTP rows store email destinations in the `phone` column with this prefix. */
export function otpKeyForEmail(email) {
  return `e:${normalizeEmail(email)}`;
}

export function otpKeysForPhone(rawPhone) {
  const normalized = canonicalPhone(rawPhone) ?? rawPhone;
  return buildPhoneVariants(normalized);
}

export async function findUserByEmail(prisma, email) {
  const e = normalizeEmail(email);
  if (!e || !e.includes('@')) return null;
  return prisma.user.findUnique({ where: { email: e } });
}
