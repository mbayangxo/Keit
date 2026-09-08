/**
 * Community commerce cards in Mboolo (tontine escrow, group buys).
 */

import { postCommerceCard } from './mbolo-receipt-service.js';

export async function ensureTontineThread(db, { groupId, creatorId, memberIds, name }) {
  const existing = await db.mboloThread.findFirst({
    where: { commerceType: 'tontine', commerceRefId: groupId },
  });
  if (existing) return existing;

  const uniqueMembers = Array.from(new Set(memberIds));
  return db.mboloThread.create({
    data: {
      creatorId,
      name: name ?? 'Tontine',
      type: 'group',
      commerceType: 'tontine',
      commerceRefId: groupId,
      members: {
        create: uniqueMembers.map((userId) => ({ userId })),
      },
    },
  });
}

export async function postTontineEscrowCard(db, { threadId, senderId, group, amountKori, reference, action }) {
  return postCommerceCard(db, {
    threadId,
    senderId,
    body: `🤝 Tontine · ${group.name}`,
    payload: {
      type: 'tontine_escrow',
      groupId: group.id,
      potBalance: group.potBalance,
      amountPerMember: group.amountPerMember,
      amountKori,
      reference,
      action: action ?? 'contribution',
      rotationIndex: group.rotationIndex,
      verified: true,
    },
  });
}

export async function getThreadCommerceContext(db, threadId) {
  const thread = await db.mboloThread.findUnique({
    where: { id: threadId },
    select: { commerceType: true, commerceRefId: true, name: true },
  });
  if (!thread?.commerceRefId) return null;

  if (thread.commerceType === 'tontine') {
    const group = await db.tontineGroup.findUnique({
      where: { id: thread.commerceRefId },
      select: {
        id: true,
        name: true,
        potBalance: true,
        amountPerMember: true,
        rotationIndex: true,
        active: true,
      },
    });
    if (!group) return null;
    return { type: 'tontine', group };
  }

  return { type: thread.commerceType, refId: thread.commerceRefId };
}
