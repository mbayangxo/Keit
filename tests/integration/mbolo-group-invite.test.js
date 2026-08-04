import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { mboloThreads, mboloThreadInvite, mboloJoinByInvite } from '../../lib/handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

test('mbolo group invite: a member can mint a join code + link, is stable across calls', async () => {
  const creator = await createUserWithWallet({ name: 'Creator' });
  const created = await call(mboloThreads, { userId: creator.id, body: { name: 'Amis', memberHandles: [] } });

  const first = await call(mboloThreadInvite, { userId: creator.id, query: { id: created.body.id } });
  assert.equal(first.statusCode, 200);
  assert.ok(first.body.inviteCode);
  assert.match(first.body.joinUrl, /^k21:\/\/group-join\//);
  assert.match(first.body.webUrl, /\/group-join\//);

  const second = await call(mboloThreadInvite, { userId: creator.id, query: { id: created.body.id } });
  assert.equal(second.body.inviteCode, first.body.inviteCode, 'invite code is stable, not regenerated each time');
});

test('mbolo group invite: redeeming a code adds the user to the thread', async () => {
  const creator = await createUserWithWallet({ name: 'Creator2' });
  const joiner = await createUserWithWallet({ name: 'Joiner2' });
  const created = await call(mboloThreads, { userId: creator.id, body: { name: 'Groupe', memberHandles: [] } });
  const invite = await call(mboloThreadInvite, { userId: creator.id, query: { id: created.body.id } });

  const res = await call(mboloJoinByInvite, { userId: joiner.id, body: { code: invite.body.inviteCode } });
  assert.equal(res.statusCode, 201);
  assert.ok(res.body.members.some((m) => m.userId === joiner.id));

  // Redeeming again is idempotent, not an error.
  const again = await call(mboloJoinByInvite, { userId: joiner.id, body: { code: invite.body.inviteCode } });
  assert.equal(again.statusCode, 200);
  const memberRows = await prisma.mboloMember.findMany({ where: { threadId: created.body.id, userId: joiner.id } });
  assert.equal(memberRows.length, 1);
});

test('mbolo group invite: an unknown code is rejected', async () => {
  const someone = await createUserWithWallet({ name: 'Someone3' });
  const res = await call(mboloJoinByInvite, { userId: someone.id, body: { code: 'NOTREAL1' } });
  assert.equal(res.statusCode, 404);
});

test('mbolo group invite: a non-member cannot mint an invite for a thread', async () => {
  const creator = await createUserWithWallet({ name: 'Creator4' });
  const outsider = await createUserWithWallet({ name: 'Outsider4' });
  const created = await call(mboloThreads, { userId: creator.id, body: { memberHandles: [] } });

  const res = await call(mboloThreadInvite, { userId: outsider.id, query: { id: created.body.id } });
  assert.equal(res.statusCode, 403);
});
