import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { mboloShare, friendsHandler, friendRequestsList, friendRequestRespond } from '../../lib/handlers.js';
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

test('mbolo share: sharing a business posts a card with server-verified data', async () => {
  const owner = await createUserWithWallet({ name: 'Owner' });
  const other = await createUserWithWallet({ name: 'Friend' });
  const threadId = await makeDirectThread(owner.id, other.handle);

  const business = await prisma.business.create({
    data: { ownerId: owner.id, name: 'Chez Awa', category: 'restaurant', imageUrl: 'https://example.com/a.jpg' },
  });

  const res = await call(mboloShare, {
    userId: owner.id,
    body: { threadId, refType: 'business', refId: business.id },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.kind, 'share');
  const payload = JSON.parse(res.body.mediaUrl);
  assert.equal(payload.title, 'Chez Awa');
  assert.equal(payload.refType, 'business');
  assert.equal(payload.refId, business.id);
});

test('mbolo share: sharing a product ignores any client-supplied price and uses the real one', async () => {
  const owner = await createUserWithWallet({ name: 'Owner2' });
  const other = await createUserWithWallet({ name: 'Friend2' });
  const threadId = await makeDirectThread(owner.id, other.handle);

  const business = await prisma.business.create({ data: { ownerId: owner.id, name: 'Boutique B' } });
  const product = await prisma.product.create({
    data: { businessId: business.id, title: 'Sac à main', price: 15_000 },
  });

  const res = await call(mboloShare, {
    userId: owner.id,
    body: {
      threadId,
      refType: 'product',
      refId: product.id,
      // a malicious client trying to spoof a lower price / different title —
      // these fields aren't even part of the accepted schema, but this
      // asserts the server never derives payload data from the request body.
      title: 'FAKE FREE ITEM',
      price: 1,
    },
  });

  assert.equal(res.statusCode, 201);
  const payload = JSON.parse(res.body.mediaUrl);
  assert.equal(payload.title, 'Sac à main');
  assert.equal(payload.price, 15_000);
});

test('mbolo share: refuses to post into a thread the sender is not a member of', async () => {
  const owner = await createUserWithWallet({ name: 'Owner3' });
  const outsider = await createUserWithWallet({ name: 'Outsider3' });
  const other = await createUserWithWallet({ name: 'Friend3' });
  const threadId = await makeDirectThread(owner.id, other.handle);
  const business = await prisma.business.create({ data: { ownerId: owner.id, name: 'Shop C' } });

  const res = await call(mboloShare, {
    userId: outsider.id,
    body: { threadId, refType: 'business', refId: business.id },
  });

  assert.equal(res.statusCode, 403);
});

test('mbolo share: unknown refId returns 404, nothing is posted', async () => {
  const owner = await createUserWithWallet({ name: 'Owner4' });
  const other = await createUserWithWallet({ name: 'Friend4' });
  const threadId = await makeDirectThread(owner.id, other.handle);

  const res = await call(mboloShare, {
    userId: owner.id,
    body: { threadId, refType: 'business', refId: 'does-not-exist' },
  });

  assert.equal(res.statusCode, 404);
});
