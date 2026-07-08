import { prisma } from './prisma.js';

export function generateAfriId() {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `AFRI-${suffix}${rand}`;
}

export async function assignAfriId(db = prisma) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const afriId = generateAfriId();
    const existing = await db.user.findUnique({ where: { afriId } });
    if (!existing) return afriId;
  }
  throw new Error('Could not allocate AFRI ID');
}

/** Ensure user has a persisted AFRI ID (personal African identity). */
export async function ensureAfriId(userId, db = prisma) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.afriId) return user;
  const afriId = await assignAfriId(db);
  return db.user.update({ where: { id: userId }, data: { afriId } });
}
