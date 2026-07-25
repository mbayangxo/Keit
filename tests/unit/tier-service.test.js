import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  TierLimitError,
  assertCanCashOut,
  assertCanCreateBusiness,
  assertCanInternational,
  assertCanSend,
  assertWalletWithinCaps,
  recordDailySend,
} from '../../lib/tier-service.js';
import { createUserWithWallet, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

test('Tier 1 cannot send more than 10,000 XOF per day (cumulative)', async () => {
  const user = await createUserWithWallet({ tier: 1, balance: 50_000 });

  await assert.doesNotReject(assertCanSend(prisma, user, 6_000));
  await recordDailySend(prisma, user.id, 6_000);

  await assert.doesNotReject(assertCanSend(prisma, user, 4_000));
  await assert.rejects(assertCanSend(prisma, user, 4_001), TierLimitError);
});

test('Tier 1 cannot cash out at all', async () => {
  const user = await createUserWithWallet({ tier: 1, balance: 10_000 });
  await assert.rejects(assertCanCashOut(prisma, user, 1), (e) => e.code === 'tier_cash_out_blocked');
});

test('Tier 1 cannot use international transfers or create businesses', async () => {
  const user = await createUserWithWallet({ tier: 1 });
  await assert.rejects(assertCanInternational(user), TierLimitError);
  await assert.rejects(assertCanCreateBusiness(user), TierLimitError);
});

test('Tier 1 wallet cannot receive past 50,000 XOF / ₭5,000 caps', async () => {
  const underCap = await createUserWithWallet({ tier: 1, koriBalance: 4_500 });
  await assert.doesNotReject(assertWalletWithinCaps(underCap, underCap.wallet, { incomingNational: 5_000 }));

  const atEdge = await createUserWithWallet({ tier: 1, koriBalance: 4_501 });
  await assert.rejects(
    assertWalletWithinCaps(atEdge, atEdge.wallet, { incomingNational: 5_001 }),
    (e) => e.code === 'tier_balance_cap',
  );

  const nearCap = await createUserWithWallet({ tier: 1, koriBalance: 4_900 });
  await assert.rejects(
    assertWalletWithinCaps(nearCap, nearCap.wallet, { incomingKori: 101 }),
    (e) => e.code === 'tier_balance_cap',
  );
});

test('Tier 2 sends freely but cash-out stops at 500,000 XOF per day', async () => {
  const user = await createUserWithWallet({ tier: 2, balance: 1_500_000 });

  await assert.doesNotReject(assertCanSend(prisma, user, 800_000));
  await assert.doesNotReject(assertCanCashOut(prisma, user, 500_000));
  await assert.rejects(assertCanCashOut(prisma, user, 500_001), (e) => e.code === 'tier_cash_out_daily_limit');
  await assert.doesNotReject(assertCanInternational(user));
});

test('business accounts require Tier 3', async () => {
  const tier2 = await createUserWithWallet({ tier: 2 });
  await assert.rejects(assertCanCreateBusiness(tier2), TierLimitError);

  const tier3 = await createUserWithWallet({ tier: 3 });
  await assert.doesNotReject(assertCanCreateBusiness(tier3));
});

test('a user whose tier was raised without verification is limited as Tier 1', async () => {
  const user = await createUserWithWallet({ tier: 1 });
  // Simulate a compromised/inconsistent record: tier says 2, but CNI never verified.
  const fake = { ...user, verificationTier: 2, cniVerifiedAt: null };
  await assert.rejects(assertCanCashOut(prisma, fake, 1), (e) => e.code === 'tier_cash_out_blocked');
});
