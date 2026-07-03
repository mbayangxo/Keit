import crypto from 'crypto';

function pepper() {
  const secret = process.env.CNI_HASH_SECRET ?? process.env.DATA_ENCRYPTION_KEY;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('CNI_HASH_SECRET or DATA_ENCRYPTION_KEY required');
  }
  return secret ?? 'dev-cni-hash-pepper';
}

export function normalizeCniNumber(value) {
  return value.replace(/\s/g, '').toUpperCase();
}

/** One-way hash for CNI — never store raw document number in plaintext. */
export function hashCni(cniNumber) {
  const normalized = normalizeCniNumber(cniNumber);
  return crypto.createHmac('sha256', pepper()).update(normalized).digest('hex');
}

export function cniMatchesHash(cniNumber, storedHash) {
  if (!cniNumber || !storedHash) return false;
  const computed = hashCni(cniNumber);
  const a = Buffer.from(computed);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
