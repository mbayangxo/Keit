import { prisma } from './prisma.js';
import { recipientLookupShape } from './shapes.js';

export class FriendError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.name = 'FriendError';
    this.status = status;
  }
}

function friendShape(friendUser) {
  return {
    id: friendUser.id,
    ...recipientLookupShape(friendUser),
    afriId: friendUser.afriId ?? null,
    since: friendUser.friendSince?.toISOString?.() ?? friendUser.since,
  };
}

export async function listFriends(userId) {
  const rows = await prisma.userFriend.findMany({
    where: { userId },
    include: {
      friend: {
        select: {
          id: true,
          name: true,
          handle: true,
          phone: true,
          avatarEmoji: true,
          avatarUrl: true,
          arrondissementKey: true,
          arrondissementIcon: true,
          arrondissementName: true,
          afriId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) =>
    friendShape({
      ...row.friend,
      friendSince: row.createdAt,
    }),
  );
}

async function ensureDirectMboloThread(db, userId, friendId) {
  const existing = await db.mboloThread.findFirst({
    where: {
      type: 'direct',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: friendId } } },
      ],
    },
  });
  if (existing) return existing;

  return db.mboloThread.create({
    data: {
      creatorId: userId,
      type: 'direct',
      members: {
        create: [{ userId }, { userId: friendId }],
      },
    },
  });
}

export async function addFriend(userId, handleOrId) {
  const handle = String(handleOrId ?? '').replace(/^@/, '').trim();
  if (!handle) throw new FriendError('friend_handle_required', 'Handle requis');

  const friend = await prisma.user.findFirst({
    where: {
      OR: [{ handle }, { id: handle }],
      NOT: { id: userId },
    },
  });
  if (!friend) throw new FriendError('friend_not_found', 'Personne introuvable', 404);

  const existing = await prisma.userFriend.findUnique({
    where: { userId_friendId: { userId, friendId: friend.id } },
  });
  if (existing) {
    return { friend: friendShape({ ...friend, friendSince: existing.createdAt }), alreadyFriends: true };
  }

  const result = await prisma.$transaction(async (db) => {
    const forward = await db.userFriend.create({
      data: { userId, friendId: friend.id },
    });
    await db.userFriend.upsert({
      where: { userId_friendId: { userId: friend.id, friendId: userId } },
      create: { userId: friend.id, friendId: userId },
      update: {},
    });
    const thread = await ensureDirectMboloThread(db, userId, friend.id);
    return { forward, thread };
  });

  return {
    friend: friendShape({ ...friend, friendSince: result.forward.createdAt }),
    mboloThreadId: result.thread.id,
    alreadyFriends: false,
  };
}

export async function removeFriend(userId, friendUserId) {
  await prisma.$transaction([
    prisma.userFriend.deleteMany({ where: { userId, friendId: friendUserId } }),
    prisma.userFriend.deleteMany({ where: { userId: friendUserId, friendId: userId } }),
  ]);
  return { ok: true };
}
