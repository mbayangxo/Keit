import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import { runKebuScoreAlerts } from '../../lib/cron/kebu-score-alerts.js';
import { createUserWithWallet, prisma, uniqueRef } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function makeBusiness(owner) {
  return prisma.business.create({
    data: { ownerId: owner.id, name: `Biz ${crypto.randomBytes(3).toString('hex')}`, kebuId: `KB${crypto.randomBytes(4).toString('hex')}` },
  });
}

async function makeTradeAccount({ supplierOwner, buyerOwner, buyerBusiness, extra = {} }) {
  const supplierBiz = await makeBusiness(supplierOwner);
  return prisma.tradeAccount.create({
    data: {
      supplierBusinessId: supplierBiz.id,
      buyerUserId: buyerOwner.id,
      buyerBusinessId: buyerBusiness.id,
      creditLimitKori: 500_000,
      active: true,
      ...extra,
    },
  });
}

test('kebu score alerts: first run just records a baseline, no alert yet', async () => {
  const supplierOwner = await createUserWithWallet({ name: 'Fournisseur' });
  const buyerOwner = await createUserWithWallet({ name: 'Acheteur' });
  const buyerBiz = await makeBusiness(buyerOwner);
  const account = await makeTradeAccount({ supplierOwner, buyerOwner, buyerBusiness: buyerBiz });

  const result = await runKebuScoreAlerts(prisma);
  assert.ok(result.checked >= 1);
  assert.equal(result.alerted, 0);

  const updated = await prisma.tradeAccount.findUnique({ where: { id: account.id } });
  assert.ok(updated.lastKnownBuyerScore != null);
  assert.ok(updated.lastKnownBuyerTier);
  assert.ok(updated.lastScoreCheckAt);
});

test('kebu score alerts: a big score drop between runs notifies the supplier', async () => {
  const supplierOwner = await createUserWithWallet({ name: 'Fournisseur2' });
  const buyerOwner = await createUserWithWallet({ name: 'Acheteur2' });
  const buyerBiz = await makeBusiness(buyerOwner);
  const account = await makeTradeAccount({
    supplierOwner,
    buyerOwner,
    buyerBusiness: buyerBiz,
    extra: { lastKnownBuyerScore: 900, lastKnownBuyerTier: 'excellent', lastScoreCheckAt: new Date() },
  });

  // Give the buyer business two overdue invoices to actually pull its
  // score down for this second run.
  for (let i = 0; i < 2; i++) {
    const someSupplierBiz = await makeBusiness(supplierOwner);
    await prisma.tradeInvoice.create({
      data: {
        supplierBusinessId: someSupplierBiz.id,
        buyerUserId: buyerOwner.id,
        buyerBusinessId: buyerBiz.id,
        reference: uniqueRef('INV'),
        amountKori: 10_000,
        status: 'overdue',
        dueAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      },
    });
  }

  const result = await runKebuScoreAlerts(prisma);
  assert.equal(result.alerted, 1);

  const notif = await prisma.notification.findFirst({ where: { userId: supplierOwner.id, title: 'Score KEBU en baisse' } });
  assert.ok(notif, 'supplier gets an alert notification');
  assert.match(notif.body, /900/);

  const updated = await prisma.tradeAccount.findUnique({ where: { id: account.id } });
  assert.ok(updated.lastKnownBuyerScore < 900, 'baseline is refreshed to the new lower score');
});

test('kebu score alerts: a small, stable score does not trigger an alert', async () => {
  const supplierOwner = await createUserWithWallet({ name: 'Fournisseur3' });
  const buyerOwner = await createUserWithWallet({ name: 'Acheteur3' });
  const buyerBiz = await makeBusiness(buyerOwner);
  await makeTradeAccount({
    supplierOwner,
    buyerOwner,
    buyerBusiness: buyerBiz,
    extra: { lastKnownBuyerScore: 415, lastKnownBuyerTier: 'basique', lastScoreCheckAt: new Date() },
  });

  const result = await runKebuScoreAlerts(prisma);
  assert.equal(result.alerted, 0);

  const notif = await prisma.notification.findFirst({ where: { userId: supplierOwner.id, title: 'Score KEBU en baisse' } });
  assert.equal(notif, null);
});

test('kebu score alerts: accounts with no credit extended are skipped', async () => {
  const supplierOwner = await createUserWithWallet({ name: 'Fournisseur4' });
  const buyerOwner = await createUserWithWallet({ name: 'Acheteur4' });
  const buyerBiz = await makeBusiness(buyerOwner);
  const account = await makeTradeAccount({
    supplierOwner,
    buyerOwner,
    buyerBusiness: buyerBiz,
    extra: { creditLimitKori: 0 },
  });

  await runKebuScoreAlerts(prisma);
  const updated = await prisma.tradeAccount.findUnique({ where: { id: account.id } });
  assert.equal(updated.lastKnownBuyerScore, null, 'no credit extended — never checked');
});
