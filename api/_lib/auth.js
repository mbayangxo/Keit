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

  try {
    const token = header.slice('Bearer '.length);
    const userId = verifyAccessToken(token);
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    await assertAccountAccessible(user);
    await touchActivity(userId);
    return userId;
  } catch (error) {
    if (error.code === 'account_locked' || error.code === 'session_inactive' || error.code === 'account_frozen') {
      req._authError = error;
    }
    return null;
  }
}

export async function getAuthContext(req) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? { userId, user } : null;
}
