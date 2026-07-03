import { prisma } from './prisma.js';

export async function writeSecureLog({ category, severity = 'info', title, payload }) {
  return prisma.secureLog.create({
    data: {
      category,
      severity,
      title,
      payloadJson: JSON.stringify(payload),
    },
  });
}
