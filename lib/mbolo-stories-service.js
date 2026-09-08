/** 24h status / stories (Phase 3 social layer). */

import { prisma } from './prisma.js';
import { MboloMediaError } from './mbolo-media-storage-service.js';

const STORY_TTL_MS = 24 * 3600 * 1000;

export async function listActiveStories(userId) {
  const now = new Date();
  const friends = await prisma.userFriend.findMany({
    where: { userId },
    select: { friendId: true },
  });
  const userIds = [userId, ...friends.map((f) => f.friendId)];

  const rows = await prisma.userStory.findMany({
    where: {
      expiresAt: { gt: now },
      userId: { in: userIds },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { id: true, name: true, handle: true, avatarEmoji: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    user: row.user,
    body: row.body,
    mediaUrl: row.mediaUrl,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createUserStory(userId, { body, mediaUrl, mediaAssetId }) {
  if (!body?.trim() && !mediaUrl && !mediaAssetId) {
    throw new MboloMediaError('invalid_story', 'Story needs text or media');
  }
  const story = await prisma.userStory.create({
    data: {
      userId,
      body: body?.trim() ?? '',
      mediaUrl: mediaUrl ?? null,
      mediaAssetId: mediaAssetId ?? null,
      expiresAt: new Date(Date.now() + STORY_TTL_MS),
    },
  });
  return story;
}

export async function purgeExpiredStories(db = prisma) {
  const result = await db.userStory.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return { deleted: result.count };
}

export async function purgeExpiredMessages(db = prisma) {
  const expired = await db.mboloMessage.findMany({
    where: { expiresAt: { lt: new Date() } },
    select: { id: true, mediaAssetId: true },
    take: 500,
  });
  if (expired.length === 0) return { deleted: 0 };

  await db.mboloMessage.deleteMany({
    where: { id: { in: expired.map((m) => m.id) } },
  });
  return { deleted: expired.length };
}
