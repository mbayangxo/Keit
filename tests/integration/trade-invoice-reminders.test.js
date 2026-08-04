import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { runTradeInvoiceReminders } from '../../lib/cron/trade-invoice-reminders.js';
import { payTradeInvoice } from '../../lib/trade-service.js';
import { createUserWithWallet, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function makeInvoice({ supplier, buyer, dueAt }) {
  const brand = await prisma.business.create({
    data: { ownerId: supplier.id, name: `Marque Test ${Date.now()}`, type: 'brand', category: 'k21' },
  });
  return prisma.tradeInvoice.create({
    data: {
      supplierBusinessId: brand.id,
      buyerUserId: buyer.id,
      reference: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amountKori: 1000,
      status: 'open',
      dueAt,
    },
  });
}

test('trade invoice reminders: past-due invoices flip to overdue and notify both sides', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur' });
  const buyer = await createUserWithWallet({ name: 'Acheteur' });
  const pastDue = await makeInvoice({ supplier, buyer, dueAt: new Date(Date.now() - 24 * 3600 * 1000) });
  const notYetDue = await makeInvoice({ supplier, buyer, dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000) });

  const result = await runTradeInvoiceReminders(prisma);
  assert.equal(result.newlyOverdue, 1);
  assert.equal(result.remindersSent, 1);

  const updated = await prisma.tradeInvoice.findUnique({ where: { id: pastDue.id } });
  assert.equal(updated.status, 'overdue');
  assert.ok(updated.reminderSentAt);

  const untouched = await prisma.tradeInvoice.findUnique({ where: { id: notYetDue.id } });
  assert.equal(untouched.status, 'open');

  const supplierNotifs = await prisma.notification.findMany({ where: { userId: supplier.id } });
  assert.ok(supplierNotifs.some((n) => n.body.includes(pastDue.reference)), 'supplier notified of new overdue invoice');

  const buyerNotifs = await prisma.notification.findMany({ where: { userId: buyer.id } });
  assert.ok(buyerNotifs.some((n) => n.body.includes(pastDue.reference)), 'buyer reminded to pay');
});

test('trade invoice reminders: no duplicate reminder inside the cooldown, resumes after it', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur' });
  const buyer = await createUserWithWallet({ name: 'Acheteur' });
  const invoice = await makeInvoice({ supplier, buyer, dueAt: new Date(Date.now() - 24 * 3600 * 1000) });

  const first = await runTradeInvoiceReminders(prisma);
  assert.equal(first.remindersSent, 1);

  const second = await runTradeInvoiceReminders(prisma);
  assert.equal(second.remindersSent, 0, 'still inside the cooldown window');

  await prisma.tradeInvoice.update({
    where: { id: invoice.id },
    data: { reminderSentAt: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
  });
  const third = await runTradeInvoiceReminders(prisma);
  assert.equal(third.remindersSent, 1, 'cooldown elapsed, reminder resumes');
});

test('trade invoice reminders: an overdue invoice can still be paid', async () => {
  const supplier = await createUserWithWallet({ name: 'Fournisseur' });
  const buyer = await createUserWithWallet({ koriBalance: 5000, name: 'Acheteur' });
  const invoice = await makeInvoice({ supplier, buyer, dueAt: new Date(Date.now() - 24 * 3600 * 1000) });

  await runTradeInvoiceReminders(prisma);
  const overdue = await prisma.tradeInvoice.findUnique({ where: { id: invoice.id } });
  assert.equal(overdue.status, 'overdue');

  const paid = await payTradeInvoice(prisma, { invoiceId: invoice.id, payerUserId: buyer.id });
  assert.equal(paid.status, 'paid');
});
