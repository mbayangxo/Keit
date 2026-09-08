/** Typing indicators + read receipts (Postgres-backed for serverless). */

import { prisma } from './prisma.js';

const TYPING_TTL_MS = 8000;

export async function markThreadRead(userId, threadId) {
  await prisma.mboloMember.update({
    where: { threadId_userId: { threadId, userId } },
    data: { lastReadAt: new Date() },
  });
  return { ok: true };
}

export async function markThreadTyping(userId, threadId) {
  await prisma.mboloMember.update({
    where: { threadId_userId: { threadId, userId } },
    data: { lastTypingAt: new Date() },
  });
  return { ok: true };
}

export async function getThreadPresence(threadId, viewerUserId) {
  const members = await prisma.mboloMember.findMany({
    where: { threadId },
    include: { user: { select: { id: true, name: true, handle: true, avatarEmoji: true } } },
  });
  const now = Date.now();
  const typing = members
    .filter((m) => m.userId !== viewerUserId && m.lastTypingAt && now - m.lastTypingAt.getTime() < TYPING_TTL_MS)
    .map((m) => ({
      userId: m.userId,
      name: m.user.name ?? m.user.handle,
      avatarEmoji: m.user.avatarEmoji,
    }));

  const readBy = members
    .filter((m) => m.userId !== viewerUserId && m.lastReadAt)
    .map((m) => ({ userId: m.userId, lastReadAt: m.lastReadAt.toISOString() }));

  return { typing, readBy };
}
