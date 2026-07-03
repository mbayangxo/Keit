import { prisma } from './prisma.js';

const MAX_REQUESTS_PER_MINUTE = 100;
const SUSPICIOUS_THRESHOLD = 80;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const WINDOW_MS = 60 * 1000;

export class RateLimitError extends Error {
  constructor(message = 'Too many requests') {
    super(message);
    this.code = 'rate_limited';
    this.status = 429;
    this.name = 'RateLimitError';
  }
}

export class SecurityBlockError extends Error {
  constructor(message = 'Account temporarily blocked due to suspicious activity') {
    super(message);
    this.code = 'security_block';
    this.status = 403;
    this.name = 'SecurityBlockError';
  }
}

export async function enforceRateLimit(userId) {
  const now = new Date();
  const state = await prisma.userRateLimit.findUnique({ where: { userId } });

  if (state?.blockedUntil && state.blockedUntil > now) {
    throw new SecurityBlockError();
  }

  const windowStart = state?.windowStart ?? now;
  const elapsed = now.getTime() - windowStart.getTime();
  let requestCount = state?.requestCount ?? 0;
  let flagCount = state?.flagCount ?? 0;
  let nextWindowStart = windowStart;

  if (elapsed >= WINDOW_MS) {
    requestCount = 0;
    nextWindowStart = now;
  }

  requestCount += 1;

  if (requestCount > MAX_REQUESTS_PER_MINUTE) {
    throw new RateLimitError();
  }

  if (requestCount >= SUSPICIOUS_THRESHOLD) {
    flagCount += 1;
    const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
    await prisma.userRateLimit.upsert({
      where: { userId },
      create: { userId, windowStart: nextWindowStart, requestCount, flagCount, blockedUntil },
      update: { windowStart: nextWindowStart, requestCount, flagCount, blockedUntil },
    });
    throw new SecurityBlockError();
  }

  await prisma.userRateLimit.upsert({
    where: { userId },
    create: { userId, windowStart: nextWindowStart, requestCount, flagCount },
    update: { windowStart: nextWindowStart, requestCount, flagCount },
  });
}
