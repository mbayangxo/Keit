import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { computeKebuScore } from '../../lib/kebu-score-service.js';
import { createUserWithWallet, prisma, uniqueRef } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function makeBusiness({ ownerTier = 2, createdAt } = {}) {
  const owner = await createUserWithWallet({ tier: ownerTier });
  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: `Test Biz ${crypto.randomBytes(3).toString('hex')}`,
      kebuId: `KB${crypto.randomBytes(4).toString('hex')}`,
      ...(createdAt ? { createdAt } : {}),
    },
  });
  return { owner, business };
}

async function makeInvoice({ owner, business }, { status, dueAt, paidAt, amountKori = 10_000 }) {
  const supplier = await makeBusiness();
  return prisma.tradeInvoice.create({
    data: {
      supplierBusinessId: supplier.business.id,
      buyerUserId: owner.id,
      buyerBusinessId: business.id,
      reference: uniqueRef('INV'),
      amountKori,
      amountPaid: status === 'paid' ? amountKori : 0,
      status,
      dueAt,
      paidAt: paidAt ?? null,
    },
  });
}

test('kebu score: brand-new business gets a neutral, non-zero, non-max score', async () => {
  const pair = await makeBusiness();
  const result = await computeKebuScore(pair.business.id, prisma);

  assert.ok(result);
  assert.equal(result.businessId, pair.business.id);
  assert.ok(result.score > 0, 'new business should not score zero');
  assert.ok(result.score < result.maxScore, 'new business should not max out');
  assert.equal(result.breakdown.paymentHistory.onTimeRate, null);
  assert.equal(result.breakdown.paymentHistory.points, 300);
});

test('kebu score: on-time payment history raises the score above the neutral default', async () => {
  const pair = await makeBusiness();
  const neutral = await computeKebuScore(pair.business.id, prisma);

  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const dueAt = new Date(now.getTime() + 5 * 24 * 3600 * 1000);
    await makeInvoice(pair, { status: 'paid', dueAt, paidAt: new Date(now.getTime() - 1000) });
  }

  const after5 = await computeKebuScore(pair.business.id, prisma);
  assert.equal(after5.breakdown.paymentHistory.onTimeRate, 1);
  assert.ok(after5.breakdown.paymentHistory.points > neutral.breakdown.paymentHistory.points);
  assert.ok(after5.score > neutral.score);
});

test('kebu score: overdue invoices penalize payment history points', async () => {
  const pair = await makeBusiness();
  const past = new Date(Date.now() - 10 * 24 * 3600 * 1000);
  await makeInvoice(pair, { status: 'overdue', dueAt: past });
  await makeInvoice(pair, { status: 'overdue', dueAt: past });

  const result = await computeKebuScore(pair.business.id, prisma);
  assert.equal(result.breakdown.paymentHistory.overdueCount, 2);
  assert.ok(result.breakdown.paymentHistory.points < 300);
});

test('kebu score: owner verification tier contributes verification points', async () => {
  const tier1 = await makeBusiness({ ownerTier: 1 });
  const tier3 = await makeBusiness({ ownerTier: 3 });

  const scoreTier1 = await computeKebuScore(tier1.business.id, prisma);
  const scoreTier3 = await computeKebuScore(tier3.business.id, prisma);

  assert.ok(scoreTier3.breakdown.verification.points > scoreTier1.breakdown.verification.points);
  assert.equal(scoreTier3.breakdown.verification.points, scoreTier3.breakdown.verification.max);
});

test('kebu score: older businesses earn more tenure points, capped at the max', async () => {
  const fifteenMonthsAgo = new Date(Date.now() - 15 * 30 * 24 * 3600 * 1000 - 1000);
  const brandNew = await makeBusiness();
  const old = await makeBusiness({ createdAt: fifteenMonthsAgo });

  const scoreNew = await computeKebuScore(brandNew.business.id, prisma);
  const scoreOld = await computeKebuScore(old.business.id, prisma);

  assert.equal(scoreNew.breakdown.tenure.points, 0);
  assert.equal(scoreOld.breakdown.tenure.points, scoreOld.breakdown.tenure.max);
});

test('kebu score: KEBU wallet ledger activity contributes activity points', async () => {
  const { business } = await makeBusiness();
  const wallet = await prisma.businessWallet.create({ data: { businessId: business.id } });

  for (let i = 0; i < 12; i++) {
    await prisma.businessLedgerEntry.create({
      data: {
        businessWalletId: wallet.id,
        businessId: business.id,
        type: 'sale',
        amount: 1000,
        reference: uniqueRef('LEDG'),
      },
    });
  }

  const result = await computeKebuScore(business.id, prisma);
  assert.equal(result.breakdown.activity.transactionCount, 12);
  assert.ok(result.breakdown.activity.points > 0);
  assert.ok(result.breakdown.activity.points < result.breakdown.activity.max);
});

test('kebu score: reviews contribute reputation points, neutral when no reviews exist', async () => {
  const { business } = await makeBusiness();
  const noReviews = await computeKebuScore(business.id, prisma);
  assert.equal(noReviews.breakdown.reputation.points, Math.round(noReviews.breakdown.reputation.max * 0.5));

  const reviewer = await createUserWithWallet();
  await prisma.review.create({
    data: { businessId: business.id, userId: reviewer.id, rating: 5 },
  });

  const withReview = await computeKebuScore(business.id, prisma);
  assert.equal(withReview.breakdown.reputation.points, withReview.breakdown.reputation.max);
});

test('kebu score: returns null for a business that does not exist', async () => {
  const result = await computeKebuScore('does-not-exist', prisma);
  assert.equal(result, null);
});
