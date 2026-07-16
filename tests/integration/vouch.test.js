import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { vouchHandler, publicProfileGet } from '../../lib/handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

const SIX_MONTHS_AGO = () => new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);

test('vouch: only 6-month+ members can confirm, one vouch = confirmed badge', async () => {
  const elder = await createUserWithWallet({ name: 'Doyen Diallo' });
  const newbie = await createUserWithWallet({ name: 'Nouveau Ndiaye' });
  const newbieHandle = `vouchee${Date.now()}`;
  await prisma.user.update({ where: { id: newbie.id }, data: { handle: newbieHandle } });
  newbie.handle = newbieHandle;

  // Fresh account cannot vouch yet…
  const tooNew = await call(vouchHandler, { userId: elder.id, body: { handle: newbie.handle } });
  assert.equal(tooNew.statusCode, 403);
  assert.equal(tooNew.body.code, 'voucher_too_new');

  // …status says so, with the date it unlocks.
  const status = await call(vouchHandler, { userId: elder.id, method: 'GET' });
  assert.equal(status.body.canVouch, false);
  assert.ok(status.body.eligibleAt);

  // Backdate the elder's account past 6 months → vouch lands.
  await prisma.user.update({ where: { id: elder.id }, data: { createdAt: SIX_MONTHS_AGO() } });
  const vouched = await call(vouchHandler, { userId: elder.id, body: { handle: newbie.handle } });
  assert.equal(vouched.statusCode, 201);
  assert.equal(vouched.body.newlyConfirmed, true);

  // Newbie is now confirmed; vouching again is idempotent.
  const newbieStatus = await call(vouchHandler, { userId: newbie.id, method: 'GET' });
  assert.equal(newbieStatus.body.confirmed, true);
  assert.equal(newbieStatus.body.vouchCount, 1);
  const again = await call(vouchHandler, { userId: elder.id, body: { handle: newbie.handle } });
  assert.equal(again.body.newlyConfirmed, false);
  assert.equal(await prisma.userVouch.count({ where: { userId: newbie.id } }), 1);

  // The badge shows on the public profile.
  const profile = await call(publicProfileGet, {
    userId: elder.id,
    method: 'GET',
    query: { id: newbie.handle },
  });
  assert.equal(profile.body.communityConfirmed, true);
});

test('vouch: no self-vouch, no anonymous voucher', async () => {
  const elder = await createUserWithWallet({ name: 'Ancienne' });
  await prisma.user.update({ where: { id: elder.id }, data: { createdAt: SIX_MONTHS_AGO() } });

  const self = await call(vouchHandler, { userId: elder.id, body: { handle: elder.handle } });
  assert.equal(self.statusCode, 403);
  assert.equal(self.body.code, 'self_vouch');

  // A 6-month account with no name still can't vouch (gate applies to vouchers too).
  const ghost = await createUserWithWallet();
  await prisma.user.update({
    where: { id: ghost.id },
    data: { createdAt: SIX_MONTHS_AGO(), name: null },
  });
  const target = await createUserWithWallet({ name: 'Cible' });
  const blocked = await call(vouchHandler, { userId: ghost.id, body: { handle: target.handle } });
  assert.equal(blocked.statusCode, 403);
  assert.equal(blocked.body.code, 'verification_required');
});
