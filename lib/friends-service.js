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

/**
 * KYC gate for trust-sensitive friend actions (accepting a request, first
 * reply in a direct chat). Today: real name + verified phone. Later, flip
 * FRIEND_GATE_REQUIRES_CNI=true to also require CNI (Tier 2) — the WeChat
 * trust model, staged so launch users aren't locked out.
 */
export async function assertFriendGate(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, otpVerifiedAt: true, cniVerifiedAt: true },
  });
  if (!user?.name?.trim() || !user.otpVerifiedAt) {
    throw new FriendError(
      'verification_required',
      'Ajoute ton nom et vérifie ton téléphone pour accepter des demandes.',
      403,
    );
  }
  if (process.env.FRIEND_GATE_REQUIRES_CNI === 'true' && !user.cniVerifiedAt) {
    throw new FriendError(
      'verification_required',
      'Vérifie ta CNI (Tier 2) pour accepter des demandes.',
      403,
    );
  }
}

const requestCardSelect = {
  id: true,
  name: true,
  handle: true,
  avatarEmoji: true,
  avatarUrl: true,
};

function requestShape(row, direction) {
  const person = direction === 'incoming' ? row.from : row.to;
  return {
    id: row.id,
    direction,
    message: row.message ?? null,
    createdAt: row.createdAt,
    user: {
      id: person.id,
      name: person.name,
      handle: person.handle,
      avatarEmoji: person.avatarEmoji,
      avatarUrl: person.avatarUrl,
    },
  };
}

/** Make two users friends (both directions) + open their direct Mboolo thread. */
async function becomeFriends(db, aId, bId) {
  await db.userFriend.upsert({
    where: { userId_friendId: { userId: aId, friendId: bId } },
    create: { userId: aId, friendId: bId },
    update: {},
  });
  await db.userFriend.upsert({
    where: { userId_friendId: { userId: bId, friendId: aId } },
    create: { userId: bId, friendId: aId },
    update: {},
  });
  return ensureDirectMboloThread(db, aId, bId);
}

/**
 * Send a friend request (replaces the old instant add). If the other person
 * already asked YOU, this counts as accepting their request — which runs
 * through the same KYC gate as a normal accept.
 */
export async function sendFriendRequest(userId, handleOrId, message) {
  const handle = String(handleOrId ?? '').replace(/^@/, '').trim();
  if (!handle) throw new FriendError('friend_handle_required', 'Handle requis');

  const friend = await prisma.user.findFirst({
    where: {
      OR: [{ handle }, { handle: `@${handle}` }, { id: handle }],
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

  // They already requested me → sending back = accepting (KYC-gated).
  const reverse = await prisma.friendRequest.findUnique({
    where: { fromId_toId: { fromId: friend.id, toId: userId } },
  });
  if (reverse?.status === 'pending') {
    const accepted = await respondFriendRequest(userId, reverse.id, true);
    return { ...accepted, autoAccepted: true };
  }

  const note = message == null ? null : String(message).trim().slice(0, 200) || null;
  const request = await prisma.friendRequest.upsert({
    where: { fromId_toId: { fromId: userId, toId: friend.id } },
    create: { fromId: userId, toId: friend.id, message: note },
    // Re-sending after a decline (or an unfriend) re-opens the request.
    update: { status: 'pending', message: note, respondedAt: null, createdAt: new Date() },
  });

  return {
    requested: true,
    request: { id: request.id, to: { id: friend.id, name: friend.name, handle: friend.handle } },
  };
}

/** Pending requests: incoming (for me to answer) + outgoing (waiting on them). */
export async function listFriendRequests(userId) {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { toId: userId, status: 'pending' },
      include: { from: { select: requestCardSelect } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: { fromId: userId, status: 'pending' },
      include: { to: { select: requestCardSelect } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return {
    incoming: incoming.map((r) => requestShape(r, 'incoming')),
    outgoing: outgoing.map((r) => requestShape(r, 'outgoing')),
  };
}

/** Accept (KYC-gated) or decline a request addressed to me. */
export async function respondFriendRequest(userId, requestId, accept) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: String(requestId ?? '') },
    include: { from: { select: requestCardSelect } },
  });
  if (!request || request.toId !== userId || request.status !== 'pending') {
    throw new FriendError('request_not_found', 'Demande introuvable', 404);
  }

  if (!accept) {
    await prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: 'declined', respondedAt: new Date() },
    });
    return { declined: true };
  }

  await assertFriendGate(userId);

  const thread = await prisma.$transaction(async (db) => {
    await db.friendRequest.update({
      where: { id: request.id },
      data: { status: 'accepted', respondedAt: new Date() },
    });
    return becomeFriends(db, userId, request.fromId);
  });

  return {
    accepted: true,
    friend: friendShape({ ...request.from, friendSince: new Date() }),
    mboloThreadId: thread.id,
  };
}

/**
 * First-reply gate for direct Mboolo chats: before your first message in a
 * direct thread, the same verification gate applies (WeChat trust model).
 */
export async function assertCanMessageInThread(userId, thread) {
  if (thread.type !== 'direct') return;
  const priorMessage = await prisma.mboloMessage.findFirst({
    where: { threadId: thread.id, senderId: userId },
    select: { id: true },
  });
  if (priorMessage) return;
  await assertFriendGate(userId);
}

export async function removeFriend(userId, friendUserId) {
  await prisma.$transaction([
    prisma.userFriend.deleteMany({ where: { userId, friendId: friendUserId } }),
    prisma.userFriend.deleteMany({ where: { userId: friendUserId, friendId: userId } }),
  ]);
  return { ok: true };
}
