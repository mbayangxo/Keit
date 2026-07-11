import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { meUpdate, publicProfileGet, products } from '../../lib/handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

test('profile customization: status, current song, pinned photos save and clear', async () => {
  const user = await createUserWithWallet();

  const r1 = await call(meUpdate, {
    userId: user.id,
    body: {
      statusText: 'En ataya au quartier',
      currentSong: 'Yëkël — Saliou K.',
      pinnedPhotos: ['data:image/png;base64,AAA', 'data:image/png;base64,BBB'],
    },
  });
  assert.equal(r1.statusCode, 200);
  assert.equal(r1.body.statusText, 'En ataya au quartier');
  assert.equal(r1.body.currentSong, 'Yëkël — Saliou K.');
  assert.equal(r1.body.pinnedPhotos.length, 2);

  // Clearing works (null wipes).
  const r2 = await call(meUpdate, { userId: user.id, body: { statusText: null, pinnedPhotos: null } });
  assert.equal(r2.body.statusText, null);
  assert.equal(r2.body.pinnedPhotos.length, 0);
  assert.equal(r2.body.currentSong, 'Yëkël — Saliou K.', 'untouched field survives');

  // More than 3 photos rejected.
  const r3 = await call(meUpdate, {
    userId: user.id,
    body: { pinnedPhotos: ['a', 'b', 'c', 'd'] },
  });
  assert.equal(r3.statusCode, 400);
});

test('public profile: shows chosen items, never phone/email/AFRI/balance', async () => {
  const owner = await createUserWithWallet();
  const viewer = await createUserWithWallet();
  await prisma.user.update({
    where: { id: owner.id },
    data: {
      handle: `pub${Date.now()}`,
      statusText: 'Au marché Sandaga',
      currentSong: 'Teranga — Dakar Crew',
      email: `secret-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`,
    },
  });
  const { handle } = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });

  const res = await call(publicProfileGet, { userId: viewer.id, query: { id: `@${handle}` }, method: 'GET' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.statusText, 'Au marché Sandaga');
  assert.equal(res.body.currentSong, 'Teranga — Dakar Crew');
  assert.equal(typeof res.body.ngor, 'number');
  assert.equal(res.body.phone, undefined, 'phone never exposed');
  assert.equal(res.body.email, undefined, 'email never exposed');
  assert.equal(res.body.afriId, undefined, 'AFRI ID never exposed');
  assert.equal(res.body.balance, undefined);

  const missing = await call(publicProfileGet, { userId: viewer.id, query: { id: '@nope-nobody' }, method: 'GET' });
  assert.equal(missing.statusCode, 404);
});

test('flash deals: need discount + deadline, expire for real', async () => {
  const owner = await createUserWithWallet();
  const business = await prisma.business.create({
    data: { ownerId: owner.id, name: `Dibiterie Test ${Date.now()}`, category: 'restaurant' },
  });

  // Flash price without duration → rejected; not a discount → rejected.
  const half = await call(products, {
    userId: owner.id,
    body: { title: 'Dibi', price: 2000, category: 'deal', flashPrice: 1400, businessId: business.id },
  });
  assert.equal(half.statusCode, 400);
  const notDiscount = await call(products, {
    userId: owner.id,
    body: { title: 'Dibi', price: 2000, category: 'deal', flashPrice: 2500, flashHours: 4, businessId: business.id },
  });
  assert.equal(notDiscount.statusCode, 400);

  // Valid deal created by the business owner.
  const ok = await call(products, {
    userId: owner.id,
    body: { title: `Dibi flash ${Date.now()}`, price: 2000, category: 'deal', flashPrice: 1400, flashHours: 4, businessId: business.id },
  });
  assert.equal(ok.statusCode, 201);
  assert.equal(ok.body.flashPrice, 1400);
  assert.ok(new Date(ok.body.flashExpiresAt) > new Date());

  // flash=1 returns it while live…
  const live = await call(products, { userId: owner.id, query: { flash: '1' }, method: 'GET' });
  assert.ok(live.body.some((p) => p.id === ok.body.id), 'live deal listed');

  // …and hides it once truly expired.
  await prisma.product.update({
    where: { id: ok.body.id },
    data: { flashExpiresAt: new Date(Date.now() - 60_000) },
  });
  const after1 = await call(products, { userId: owner.id, query: { flash: '1' }, method: 'GET' });
  assert.ok(!after1.body.some((p) => p.id === ok.body.id), 'expired deal gone');

  // Cannot post into someone else's business.
  const stranger = await createUserWithWallet();
  const forged = await call(products, {
    userId: stranger.id,
    body: { title: 'Fake', price: 1000, flashPrice: 500, flashHours: 2, businessId: business.id },
  });
  assert.equal(forged.statusCode, 403);
});
