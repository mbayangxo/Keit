import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { getUserIdFromRequest, signAccessToken } from '../../api/_lib/auth.js';
import { createUserWithWallet, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

function reqWithToken(token) {
  return { headers: { authorization: `Bearer ${token}` } };
}

test('auth check: fresh token resolves the user and refreshes activity', async () => {
  const user = await createUserWithWallet({ name: 'Actif' });
  const req = reqWithToken(signAccessToken(user.id));
  assert.equal(await getUserIdFromRequest(req), user.id);
  const after = await prisma.user.findUnique({ where: { id: user.id }, select: { lastActivityAt: true } });
  assert.ok(after.lastActivityAt, 'activity is touched on every authenticated call');
});

test('auth check: locked/garbage tokens fail with the real reason attached', async () => {
  // Garbage token → null, no crash.
  assert.equal(await getUserIdFromRequest(reqWithToken('not-a-jwt')), null);

  // Locked account → null + the specific error for the router to surface.
  const locked = await createUserWithWallet({ name: 'Bloquée' });
  await prisma.user.update({
    where: { id: locked.id },
    data: { accountLockedAt: new Date(), accountLockReason: 'pin_attempts' },
  });
  const req = reqWithToken(signAccessToken(locked.id));
  assert.equal(await getUserIdFromRequest(req), null);
  assert.equal(req._authError?.code, 'account_locked');
});
