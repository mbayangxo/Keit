import { prisma } from './prisma.js';

export async function logAdminAction(adminUserId, action, { targetType, targetId, detail } = {}) {
  return prisma.adminAuditLog.create({
    data: {
      adminUserId,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      detailJson: detail ? JSON.stringify(detail) : null,
    },
  });
}
