import '../helpers/setup.js';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { businessesCreate, products } from '../../lib/handlers.js';
import {
  businessesMine,
  businessStatusUpdate,
  businessTransferHandler,
  businessWalletHandler,
  payrollEmployeesHandler,
  payrollPayHandler,
  businessMembersHandler,
  cooperativeDeliveriesHandler,
  cooperativeVerifyHandler,
} from '../../lib/org-handlers.js';
import { ensureAfriId } from '../../lib/afri-id.js';
import {
  createUserWithWallet,
  mockReq,
  mockRes,
  prisma,
  resetReserveToWallets,
  createVerifiedDevice,
} from '../helpers/db.js';

beforeEach(async () => {
  await resetReserveToWallets();
});

after(async () => {
  await prisma.$disconnect();
});

async function call(handler, { userId, body, query, method = 'POST', deviceId } = {}) {
  const headers = deviceId ? { 'x-device-id': deviceId } : {};
  const req = mockReq({ userId, body, query, method, headers });
  const res = mockRes();
  await handler(req, res);
  return res;
}

async function createOwnerWithAfri({ koriBalance = 50_000, handle } = {}) {
  const user = await createUserWithWallet({ koriBalance, tier: 3, handle });
  await ensureAfriId(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { stepUpVerifiedAt: new Date() },
  });
  return prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { wallet: true } });
}

test('business hub: create business, fund KEBU wallet, publish status + flash deal', async () => {
  const owner = await createOwnerWithAfri({ koriBalance: 20_000 });

  const createRes = await call(businessesCreate, {
    userId: owner.id,
    body: { name: 'Dibiterie Hub', type: 'merchant', category: 'restaurant' },
  });
  assert.equal(createRes.statusCode, 201, JSON.stringify(createRes.body));
  const businessId = createRes.body.id;
  assert.ok(createRes.body.kebuId);

  const mineRes = await call(businessesMine, { userId: owner.id, method: 'GET' });
  assert.equal(mineRes.statusCode, 200);
  assert.equal(mineRes.body.owned.length, 1);

  const fundRes = await call(businessTransferHandler, {
    userId: owner.id,
    query: { id: businessId },
    body: { kind: 'capital_in', amount: 5000, note: 'Apport initial' },
  });
  assert.equal(fundRes.statusCode, 201, JSON.stringify(fundRes.body));
  assert.equal(fundRes.body.wallet.balance, 5000);

  const walletRes = await call(businessWalletHandler, {
    userId: owner.id,
    query: { id: businessId },
    method: 'GET',
  });
  assert.equal(walletRes.statusCode, 200);
  assert.equal(walletRes.body.wallet.balance, 5000);
  assert.ok(walletRes.body.ledger.some((e) => e.type === 'capital_in'));

  const statusRes = await call(businessStatusUpdate, {
    userId: owner.id,
    query: { id: businessId },
    body: { statusText: 'Promo week-end' },
  });
  assert.equal(statusRes.statusCode, 200);

  const flashRes = await call(products, {
    userId: owner.id,
    body: {
      businessId,
      title: 'Dibi flash',
      price: 3000,
      flashPrice: 2000,
      flashHours: 4,
      inventory: 10,
    },
  });
  assert.equal(flashRes.statusCode, 201, JSON.stringify(flashRes.body));
  assert.equal(flashRes.body.flashPrice, 2000);
  assert.ok(flashRes.body.flashExpiresAt);

  const ownerWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: owner.id } });
  assert.equal(ownerWallet.koriBalance, 15_000);
});

test('business hub: B2B transfer between KEBU wallets', async () => {
  const sender = await createOwnerWithAfri({ koriBalance: 10_000 });
  const recipient = await createOwnerWithAfri({ koriBalance: 0, handle: `recv${Date.now()}` });

  const senderBizRes = await call(businessesCreate, {
    userId: sender.id,
    body: { name: 'Sender Co', type: 'merchant', category: 'services' },
  });
  const recipientBizRes = await call(businessesCreate, {
    userId: recipient.id,
    body: { name: 'Recipient Co', type: 'merchant', category: 'services' },
  });
  const senderBizId = senderBizRes.body.id;
  const recipientKebuId = recipientBizRes.body.kebuId;

  await call(businessTransferHandler, {
    userId: sender.id,
    query: { id: senderBizId },
    body: { kind: 'capital_in', amount: 8000 },
  });

  const b2bRes = await call(businessTransferHandler, {
    userId: sender.id,
    query: { id: senderBizId },
    body: { kind: 'b2b', amount: 2500, recipientKebuId, note: 'Fourniture' },
  });
  assert.equal(b2bRes.statusCode, 201, JSON.stringify(b2bRes.body));
  assert.equal(b2bRes.body.wallet.balance, 5500);

  const recipientWalletRes = await call(businessWalletHandler, {
    userId: recipient.id,
    query: { id: recipientBizRes.body.id },
    method: 'GET',
  });
  assert.equal(recipientWalletRes.body.wallet.balance, 2500);
});

test('business hub: payroll + team member + cooperative delivery by handle', async () => {
  const owner = await createOwnerWithAfri({ koriBalance: 30_000 });
  const ownerDevice = await createVerifiedDevice(owner.id);
  const employee = await createUserWithWallet({ koriBalance: 0, tier: 2, handle: `emp${Date.now()}` });
  const farmer = await createUserWithWallet({ koriBalance: 0, tier: 2, handle: `farmer${Date.now()}` });

  const bizRes = await call(businessesCreate, {
    userId: owner.id,
    deviceId: ownerDevice,
    body: { name: 'Coop Test', type: 'cooperative', category: 'agriculture' },
  });
  const businessId = bizRes.body.id;

  await call(businessTransferHandler, {
    userId: owner.id,
    deviceId: ownerDevice,
    query: { id: businessId },
    body: { kind: 'capital_in', amount: 10_000 },
  });

  const memberRes = await call(businessMembersHandler, {
    userId: owner.id,
    deviceId: ownerDevice,
    query: { id: businessId },
    body: { userHandle: employee.handle, role: 'staff' },
  });
  assert.equal(memberRes.statusCode, 201, JSON.stringify(memberRes.body));

  const empRes = await call(payrollEmployeesHandler, {
    userId: owner.id,
    deviceId: ownerDevice,
    query: { id: businessId },
    body: { userHandle: employee.handle, jobTitle: 'staff', payAmount: 3000 },
  });
  assert.equal(empRes.statusCode, 201, JSON.stringify(empRes.body));

  const payRes = await call(payrollPayHandler, {
    userId: owner.id,
    deviceId: ownerDevice,
    query: { id: businessId },
    body: { employeeId: empRes.body.id },
  });
  assert.equal(payRes.statusCode, 201, JSON.stringify(payRes.body));

  const employeeWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: employee.id } });
  assert.equal(employeeWallet.koriBalance, 3000);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const logRes = await call(cooperativeDeliveriesHandler, {
    userId: owner.id,
    query: { id: businessId },
    body: {
      farmerHandle: farmer.handle,
      quantityTons: 2,
      periodStart: weekAgo.toISOString(),
      periodEnd: now.toISOString(),
      note: 'Log terrain',
    },
  });
  assert.equal(logRes.statusCode, 201, JSON.stringify(logRes.body));
  assert.equal(logRes.body.farmer.id, farmer.id);

  const verifyRes = await call(cooperativeVerifyHandler, {
    userId: owner.id,
    query: { id: businessId, subId: logRes.body.id },
    body: { approved: true },
  });
  assert.equal(verifyRes.statusCode, 200);
  assert.equal(verifyRes.body.status, 'verified');
});
