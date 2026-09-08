import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { mboloThreadMessages, friendsHandler, friendRequestsList, friendRequestRespond } from '../../lib/handlers.js';
import { mboloStorageStatus, mboloGifsList } from '../../lib/mbolo-handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
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

test('mbolo storage status returns legacy when Supabase unset', async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  const user = await createUserWithWallet();
  const res = await call(mboloStorageStatus, { userId: user.id, method: 'GET' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.storage, 'legacy');
  assert.equal(res.body.configured, false);
  assert.ok(res.body.vaultQuotaMb >= 50);
});

test('mbolo gifs list returns Teranga pack without Supabase', async () => {
  const user = await createUserWithWallet();
  const res = await call(mboloGifsList, { userId: user.id, method: 'GET' });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 4);
  assert.ok(res.body.every((g) => g.url && g.label));
});

test('mbolo messages GET returns paginated shape', async () => {
  const a = await createUserWithWallet();
  const b = await createUserWithWallet();
  const threadId = await makeDirectThread(a.id, b.handle);

  await call(mboloThreadMessages, {
    userId: a.id,
    query: { id: threadId },
    body: { body: 'Salut Teranga', kind: 'text' },
  });

  const res = await call(mboloThreadMessages, {
    userId: a.id,
    query: { id: threadId, q: 'Teranga' },
    method: 'GET',
  });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.messages));
  assert.equal(res.body.messages.length, 1);
  assert.match(res.body.messages[0].body, /Teranga/);
  assert.equal(res.body.storage, 'legacy');
});

test('mbolo gif message accepts gifId for seeded pack', async () => {
  const a = await createUserWithWallet();
  const b = await createUserWithWallet();
  const threadId = await makeDirectThread(a.id, b.handle);

  const gifs = await call(mboloGifsList, { userId: a.id, method: 'GET' });
  const gif = gifs.body.find((g) => g.url?.startsWith('http'));
  assert.ok(gif?.id);

  const sent = await call(mboloThreadMessages, {
    userId: a.id,
    query: { id: threadId },
    body: { kind: 'gif', gifId: gif.id, body: 'GIF test' },
  });

  assert.equal(sent.statusCode, 201);
  assert.equal(sent.body.kind, 'gif');
  assert.ok(sent.body.mediaUrl?.startsWith('https://'));
});
