import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { mboloBroadcast, friendsHandler, friendRequestsList, friendRequestRespond } from '../../lib/handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

async function befriend(aId, bHandle) {
  await call(friendsHandler, { userId: aId, body: { handle: bHandle } });
  const inboxOwner = await prisma.user.findFirst({ where: { handle: bHandle } });
  const inbox = await call(friendRequestsList, { userId: inboxOwner.id, method: 'GET' });
  await call(friendRequestRespond, {
    userId: inboxOwner.id,
    query: { id: inbox.body.incoming[0].id },
    body: { accept: true },
  });
}

test('mbolo broadcast: sends the same message as separate DMs, recipients each get their own thread', async () => {
  const sender = await createUserWithWallet({ name: 'Sender' });
  const a = await createUserWithWallet({ name: 'FriendA' });
  const b = await createUserWithWallet({ name: 'FriendB' });
  await befriend(sender.id, a.handle);
  await befriend(sender.id, b.handle);

  const res = await call(mboloBroadcast, {
    userId: sender.id,
    body: { recipientHandles: [a.handle, b.handle], body: 'Promo ce weekend !' },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.sentCount, 2);

  const threadIds = res.body.recipients.map((r) => r.threadId);
  assert.equal(new Set(threadIds).size, 2, 'each recipient gets a separate thread');

  for (const threadId of threadIds) {
    const members = await prisma.mboloMember.findMany({ where: { threadId } });
    assert.equal(members.length, 2, 'a broadcast DM thread has exactly sender + one recipient — never both recipients together');
  }

  const msgA = await prisma.mboloMessage.findFirst({ where: { threadId: res.body.recipients[0].threadId } });
  assert.equal(msgA.body, 'Promo ce weekend !');
});

test('mbolo broadcast: refuses to message someone who is not yet a friend', async () => {
  const sender = await createUserWithWallet({ name: 'Sender2' });
  const stranger = await createUserWithWallet({ name: 'Stranger2' });

  const res = await call(mboloBroadcast, {
    userId: sender.id,
    body: { recipientHandles: [stranger.handle], body: 'Salut' },
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'not_friends');
});

test('mbolo broadcast: text messages require a non-empty body', async () => {
  const sender = await createUserWithWallet({ name: 'Sender3' });
  const a = await createUserWithWallet({ name: 'FriendC' });
  await befriend(sender.id, a.handle);

  const res = await call(mboloBroadcast, {
    userId: sender.id,
    body: { recipientHandles: [a.handle], body: '   ' },
  });

  assert.equal(res.statusCode, 400);
});

test('mbolo broadcast: caps the recipient list', async () => {
  const sender = await createUserWithWallet({ name: 'Sender4' });
  const tooMany = Array.from({ length: 51 }, (_, i) => `nobody${i}`);

  const res = await call(mboloBroadcast, {
    userId: sender.id,
    body: { recipientHandles: tooMany, body: 'x' },
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'too_many');
});
