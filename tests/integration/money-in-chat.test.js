import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  transfersSend,
  mboloThreadMessages,
  friendsHandler,
  friendRequestsList,
  friendRequestRespond,
} from '../../lib/handlers.js';
import { createUserWithWallet, createVerifiedDevice, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST', deviceId } = {}) {
  const req = mockReq({
    userId,
    body,
    query,
    method,
    headers: { 'x-device-id': deviceId ?? 'test-device', 'x-vercel-ip-country': 'SN' },
  });
  const res = mockRes();
  await handler(req, res);
  return res;
}

async function makeDirectThread(aId, bHandle) {
  await call(friendsHandler, { userId: aId, body: { handle: bHandle } });
  const inboxOwner = await prisma.user.findFirst({ where: { handle: bHandle } });
  const inbox = await call(friendRequestsList, { userId: inboxOwner.id, method: 'GET' });
  const accepted = await call(friendRequestRespond, {
    userId: inboxOwner.id,
    query: { id: inbox.body.incoming[0].id },
    body: { accept: true },
  });
  return accepted.body.mboloThreadId;
}

test('money-in-chat: a send with threadId posts a payment card into that thread', async () => {
  const sender = await createUserWithWallet({ koriBalance: 50_000, name: 'Awa' });
  const recipient = await createUserWithWallet({ koriBalance: 0, name: 'Ibou' });
  const deviceId = await createVerifiedDevice(sender.id);
  const threadId = await makeDirectThread(sender.id, recipient.handle);

  const res = await call(transfersSend, {
    userId: sender.id,
    deviceId,
    body: { recipientHandle: recipient.handle, amount: 2_000, note: 'Pour le taxi', threadId },
  });

  assert.equal(res.statusCode, 201);
  assert.ok(res.body.mboloMessage, 'response includes the posted chat message');
  assert.equal(res.body.mboloMessage.kind, 'payment');
  assert.match(res.body.mboloMessage.body, /2.?000/);

  const stored = await prisma.mboloMessage.findUnique({ where: { id: res.body.mboloMessage.id } });
  assert.equal(stored.senderId, sender.id);
  const payload = JSON.parse(stored.mediaUrl);
  assert.equal(payload.amountKori, 2_000);
  assert.equal(payload.note, 'Pour le taxi');

  const recipientWallet = await prisma.wallet.findUnique({ where: { id: recipient.wallet.id } });
  assert.equal(recipientWallet.koriBalance, 2_000);
});

test('money-in-chat: threadId the recipient is not a member of is rejected before money moves', async () => {
  const sender = await createUserWithWallet({ koriBalance: 50_000, name: 'Awa2' });
  const recipient = await createUserWithWallet({ koriBalance: 0, name: 'Ibou2' });
  const bystander = await createUserWithWallet({ koriBalance: 0, name: 'Fatou2' });
  const deviceId = await createVerifiedDevice(sender.id);
  const foreignThreadId = await makeDirectThread(sender.id, bystander.handle);

  const res = await call(transfersSend, {
    userId: sender.id,
    deviceId,
    body: { recipientHandle: recipient.handle, amount: 2_000, threadId: foreignThreadId },
  });

  assert.equal(res.statusCode, 403);
  const senderWallet = await prisma.wallet.findUnique({ where: { id: sender.wallet.id } });
  assert.equal(senderWallet.koriBalance, 50_000, 'nothing moved');
});

test('money-in-chat: the generic message endpoint cannot forge a payment card', async () => {
  const a = await createUserWithWallet({ name: 'Awa3' });
  const b = await createUserWithWallet({ name: 'Ibou3' });
  const threadId = await makeDirectThread(a.id, b.handle);

  const res = await call(mboloThreadMessages, {
    userId: a.id,
    query: { id: threadId },
    body: { kind: 'payment', body: '💸 ₭999,999 envoyé', mediaUrl: JSON.stringify({ amountKori: 999_999 }) },
  });

  assert.equal(res.statusCode, 400, 'kind:"payment" is not an accepted client-supplied kind');
});
