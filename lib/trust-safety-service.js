import { prisma } from './prisma.js';

export async function blockUser(blockerId, { blockedUserId, blockedBusinessId }) {
  if (!blockedUserId && !blockedBusinessId) throw new Error('Specify user or business to block');
  if (blockedUserId === blockerId) throw new Error('Cannot block yourself');

  if (blockedUserId) {
    return prisma.userBlock.upsert({
      where: { blockerId_blockedUserId: { blockerId, blockedUserId } },
      update: {},
      create: { blockerId, blockedUserId },
    });
  }

  return prisma.userBlock.upsert({
    where: { blockerId_blockedBusinessId: { blockerId, blockedBusinessId } },
    update: {},
    create: { blockerId, blockedBusinessId },
  });
}

export async function unblockUser(blockerId, blockId) {
  const row = await prisma.userBlock.findFirst({ where: { id: blockId, blockerId } });
  if (!row) throw new Error('Block not found');
  await prisma.userBlock.delete({ where: { id: blockId } });
  return { removed: true };
}

export async function listBlocks(blockerId) {
  return prisma.userBlock.findMany({
    where: { blockerId },
    orderBy: { createdAt: 'desc' },
    include: {
      blockedUser: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
      blockedBusiness: { select: { id: true, name: true, kebuId: true, type: true } },
    },
  });
}

export async function isBlocked(blockerId, { userId, businessId }) {
  if (userId) {
    const hit = await prisma.userBlock.findFirst({
      where: { blockerId, blockedUserId: userId },
    });
    if (hit) return true;
  }
  if (businessId) {
    const hit = await prisma.userBlock.findFirst({
      where: { blockerId, blockedBusinessId: businessId },
    });
    if (hit) return true;
  }
  return false;
}

export async function submitReport(reporterId, { targetUserId, targetBusinessId, category, reason }) {
  if (!targetUserId && !targetBusinessId) throw new Error('Specify user or business to report');
  if (targetUserId === reporterId) throw new Error('Cannot report yourself');

  const report = await prisma.contentReport.create({
    data: {
      reporterId,
      targetUserId: targetUserId ?? null,
      targetBusinessId: targetBusinessId ?? null,
      category,
      reason,
      status: 'open',
    },
  });

  await prisma.secureLog.create({
    data: {
      category: 'user_report',
      severity: 'warning',
      title: `Report: ${category}`,
      payloadJson: JSON.stringify({
        reportId: report.id,
        reporterId,
        targetUserId,
        targetBusinessId,
        category,
        reason,
      }),
    },
  });

  return report;
}

export async function listOpenReports(limit = 50) {
  return prisma.contentReport.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      reporter: { select: { id: true, name: true, handle: true } },
      targetUser: { select: { id: true, name: true, handle: true } },
      targetBusiness: { select: { id: true, name: true, kebuId: true, type: true } },
    },
  });
}
