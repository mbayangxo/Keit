import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { approveAgentProfile, topUpAgentFloat, applyForAgentProfile } from '../../lib/agent-service.js';
import { createUserWithWallet, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

test('agent: top-up activates pending agent when float >= 500', async () => {
  const user = await createUserWithWallet({ balance: 0, koriBalance: 0 });

  const profile = await applyForAgentProfile({
    userId: user.id,
    displayName: 'Boutique Test',
    locationLabel: 'Médina',
  });
  assert.equal(profile.status, 'pending');

  const result = await topUpAgentFloat(profile.id, 500_000, 'admin-test', 'Initial float');
  assert.equal(result.status, 'active');
  assert.equal(result.floatBalance, 500_000);

  const role = await prisma.accountRole.findFirst({ where: { userId: user.id, role: 'agent' } });
  assert.equal(role?.status, 'active');
});

test('agent: approve activates without float', async () => {
  const user = await createUserWithWallet({ balance: 0, koriBalance: 0 });

  const profile = await applyForAgentProfile({
    userId: user.id,
    displayName: 'Kiosk Test',
  });

  const approved = await approveAgentProfile(profile.id, 'admin-test', 'Welcome');
  assert.equal(approved.status, 'active');
});
