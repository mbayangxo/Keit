import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { assertAccountAccessible, touchActivity } from '../../lib/session-security.js';

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.length < 16) {
    throw new Error(`Missing or invalid ${name}`);
  }
  return value;
}

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, requireEnv('JWT_ACCESS_SECRET'), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
  });
}

export function signRefreshToken(userId) {
  // jti makes every token byte-distinct even when issued for the same user in
  // the same second (JWT `iat` is second-granularity) — without it, two logins
  // within the same second produce an identical token, and storing its hash
  // in the unique RefreshToken.tokenHash column throws on the second insert.
  return jwt.sign(
    { sub: userId, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
    requireEnv('JWT_REFRESH_SECRET'),
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' },
  );
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiry() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export function reference(prefix) {
  return `${prefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

export function otp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** JWT validation only — no session/lock checks. */
export function verifyAccessToken(token) {
  const payload = jwt.verify(token, requireEnv('JWT_ACCESS_SECRET'));
  if (!payload.sub || payload.type !== 'access') return null;
  return payload.sub;
}

export async function getUserIdFromRequest(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;

  let userId;
  try {
    userId = verifyAccessToken(header.slice('Bearer '.length));
  } catch {
    return null;
  }
  if (!userId) return null;

  // Narrow select: only the fields the access check needs. A full-row read
  // here made EVERY authenticated call fail as a fake "invalid session"
  // whenever the production DB lagged one column behind the schema.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, frozenByAdminAt: true, accountLockedAt: true, lastActivityAt: true },
  });
  if (!user) return null;

  try {
    await assertAccountAccessible(user);
  } catch (error) {
    req._authError = error;
    return null;
  }

  // Real DB errors (missing table/column, connection loss) propagate to the
  // router's error handler, which reports them honestly — never as a 401.
  await touchActivity(userId);
  return userId;
}
