import { prisma } from './prisma.js';

const BUSINESS_TYPES = ['merchant', 'employer', 'school', 'cooperative'];

export { BUSINESS_TYPES };

export function generateKebuId() {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `KEBU-${suffix}${rand}`;
}

export async function assignKebuId(db = prisma) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const kebuId = generateKebuId();
    const existing = await db.business.findUnique({ where: { kebuId } });
    if (!existing) return kebuId;
  }
  throw new Error('Could not allocate KEBU ID');
}
