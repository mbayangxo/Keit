import { prisma } from './prisma.js';

export async function ensureRole(userId, role) {
  return prisma.accountRole.upsert({
    where: { userId_role: { userId, role } },
    update: { status: 'active' },
    create: { userId, role },
  });
}
