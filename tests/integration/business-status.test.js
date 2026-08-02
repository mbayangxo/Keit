import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { businessStatusUpdate } from '../../lib/org-handlers.js';
import { getShopCatalog } from '../../lib/marketplace-service.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

test('business status: owner can publish and clear, shows on the public shop view', async () => {
  const owner = await createUserWithWallet({ name: 'Awa Diop' });
  const business = await prisma.business.create({
    data: { ownerId: owner.id, name: `Dibiterie Test ${Date.now()}`, category: 'restaurant' },
  });

  // No status yet — the public catalog shows null, not a placeholder.
  const before = await getShopCatalog(prisma, business.id, {});
  assert.equal(before.shop.statusText, null);

  const published = await call(businessStatusUpdate, {
    userId: owner.id,
    query: { id: business.id },
    body: { statusText: '  Inscriptions ouvertes — places limitées  ' },
  });
  assert.equal(published.statusCode, 200);
  assert.equal(published.body.statusText, 'Inscriptions ouvertes — places limitées');

  const after1 = await getShopCatalog(prisma, business.id, {});
  assert.equal(after1.shop.statusText, 'Inscriptions ouvertes — places limitées');

  const cleared = await call(businessStatusUpdate, {
    userId: owner.id,
    query: { id: business.id },
    body: { statusText: null },
  });
  assert.equal(cleared.statusCode, 200);
  assert.equal(cleared.body.statusText, null);
});

test('business status: only the owner/admin can publish, and it is capped at 80 chars', async () => {
  const owner = await createUserWithWallet({ name: 'Ibou Fall' });
  const stranger = await createUserWithWallet({ name: 'Autre' });
  const business = await prisma.business.create({
    data: { ownerId: owner.id, name: `Boutique Test ${Date.now()}`, category: 'boutique' },
  });

  const forged = await call(businessStatusUpdate, {
    userId: stranger.id,
    query: { id: business.id },
    body: { statusText: 'Je ne suis pas le propriétaire' },
  });
  assert.equal(forged.statusCode, 403);

  const tooLong = await call(businessStatusUpdate, {
    userId: owner.id,
    query: { id: business.id },
    body: { statusText: 'x'.repeat(81) },
  });
  assert.equal(tooLong.statusCode, 400);
});
