import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  disputeTradeInvoice,
  resolveTradeInvoiceDispute,
  payTradeInvoice,
} from '../../lib/trade-service.js';
import { MarketplaceError } from '../../lib/marketplace-service.js';
import { createUserWithWallet, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function makeInvoice({ supplier, buyer, amountKori = 10_000, dueAt = new Date(Date.now() + 30 * 24 * 3600 * 1000) }) {
  const brand = await prisma.business.create({
    data: { ownerId: supplier.id, name: `Marque Test ${Date.now()}${Math.random()}`, type: 'brand', category: 'k21' },
  });
  const invoice = await prisma.tradeInvoice.create({
    data: {
      supplierBusinessId: brand.id,
      buyerUserId: buyer.id,
      reference: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amountKori,
      status: 'open',
      dueAt,
    },
  });
  return { invoice, brand };
}

test('trade invoice dispute: buyer disputes, invoice freezes, cannot be paid', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur' });
  const buyer = await createUserWithWallet({ koriBalance: 20_000, name: 'Acheteur' });
  const { invoice } = await makeInvoice({ supplier, buyer });

  const disputed = await disputeTradeInvoice(prisma, { invoiceId: invoice.id, buyerUserId: buyer.id, reason: 'Mauvais montant facturé' });
  assert.equal(disputed.status, 'disputed');

  const supplierNotifs = await prisma.notification.findMany({ where: { userId: supplier.id } });
  assert.ok(supplierNotifs.some((n) => n.body.includes('Mauvais montant')), 'supplier notified of dispute');

  await assert.rejects(
    () => payTradeInvoice(prisma, { invoiceId: invoice.id, payerUserId: buyer.id }),
    (err) => err instanceof MarketplaceError && err.code === 'invalid_state',
  );
});

test('trade invoice dispute: supplier rejects — invoice reverts to open and can be paid', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur2' });
  const buyer = await createUserWithWallet({ koriBalance: 20_000, name: 'Acheteur2' });
  const { invoice } = await makeInvoice({ supplier, buyer });

  await disputeTradeInvoice(prisma, { invoiceId: invoice.id, buyerUserId: buyer.id, reason: 'Pas d’accord' });
  const rejected = await resolveTradeInvoiceDispute(prisma, {
    invoiceId: invoice.id,
    supplierOwnerId: supplier.id,
    action: 'reject',
    note: 'Facture correcte',
  });
  assert.equal(rejected.status, 'open');

  const buyerNotifs = await prisma.notification.findMany({ where: { userId: buyer.id } });
  assert.ok(buyerNotifs.some((n) => n.body.includes('Facture correcte')));

  const paid = await payTradeInvoice(prisma, { invoiceId: invoice.id, payerUserId: buyer.id });
  assert.equal(paid.status, 'paid');
});

test('trade invoice dispute: supplier waives — remaining balance forgiven, nothing owed', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur3' });
  const buyer = await createUserWithWallet({ koriBalance: 20_000, name: 'Acheteur3' });
  const { invoice } = await makeInvoice({ supplier, buyer, amountKori: 10_000 });

  await disputeTradeInvoice(prisma, { invoiceId: invoice.id, buyerUserId: buyer.id, reason: 'Jamais reçu la commande' });
  const waived = await resolveTradeInvoiceDispute(prisma, {
    invoiceId: invoice.id,
    supplierOwnerId: supplier.id,
    action: 'waive',
    note: 'Confirmé — annulée',
  });

  assert.equal(waived.amountKori, 0);
  assert.equal(waived.status, 'paid');
  assert.equal(waived.amountDue, 0);

  const senderWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  assert.equal(senderWallet.koriBalance, 20_000, 'no money moved for a pre-payment waive');
});

test('trade invoice dispute: supplier adjusts amount down, invoice becomes payable at the new total', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur4' });
  const buyer = await createUserWithWallet({ koriBalance: 20_000, name: 'Acheteur4' });
  const { invoice } = await makeInvoice({ supplier, buyer, amountKori: 10_000 });

  await disputeTradeInvoice(prisma, { invoiceId: invoice.id, buyerUserId: buyer.id, reason: 'Quantité livrée en moins' });
  const adjusted = await resolveTradeInvoiceDispute(prisma, {
    invoiceId: invoice.id,
    supplierOwnerId: supplier.id,
    action: 'adjust',
    newAmountKori: 6_000,
    note: 'Corrigé à 6000',
  });

  assert.equal(adjusted.amountKori, 6_000);
  assert.equal(adjusted.status, 'open');

  const paid = await payTradeInvoice(prisma, { invoiceId: invoice.id, payerUserId: buyer.id });
  assert.equal(paid.amountPaid, 6_000);
});

test('trade invoice dispute: only the actual buyer can dispute, only the actual supplier owner can resolve', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur5' });
  const buyer = await createUserWithWallet({ name: 'Acheteur5' });
  const stranger = await createUserWithWallet({ name: 'Etranger5' });
  const { invoice } = await makeInvoice({ supplier, buyer });

  await assert.rejects(
    () => disputeTradeInvoice(prisma, { invoiceId: invoice.id, buyerUserId: stranger.id, reason: 'x' }),
    (err) => err instanceof MarketplaceError && err.code === 'not_found',
  );

  await disputeTradeInvoice(prisma, { invoiceId: invoice.id, buyerUserId: buyer.id, reason: 'x' });

  await assert.rejects(
    () => resolveTradeInvoiceDispute(prisma, { invoiceId: invoice.id, supplierOwnerId: stranger.id, action: 'reject' }),
    (err) => err instanceof MarketplaceError && err.code === 'forbidden',
  );
});

test('trade invoice dispute: cannot dispute an already-paid invoice', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur6' });
  const buyer = await createUserWithWallet({ koriBalance: 20_000, name: 'Acheteur6' });
  const { invoice } = await makeInvoice({ supplier, buyer, amountKori: 5_000 });
  await payTradeInvoice(prisma, { invoiceId: invoice.id, payerUserId: buyer.id });

  await assert.rejects(
    () => disputeTradeInvoice(prisma, { invoiceId: invoice.id, buyerUserId: buyer.id, reason: 'trop tard' }),
    (err) => err instanceof MarketplaceError && err.code === 'invalid_state',
  );
});
