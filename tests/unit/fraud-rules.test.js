import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { assessTransactionRisk } from '../../lib/risk-engine.js';
import { registerDeviceLogin } from '../../lib/device-session.js';
import { RISK_LIMITS } from '../../lib/risk-constants.js';
import { dakarHour, isDakarNightWindow } from '../../lib/geo-ip.js';
import {
  createUserWithWallet,
  createVerifiedDevice,
  mockReq,
  prisma,
  uniqueRef,
} from '../helpers/db.js';

after(() => prisma.$disconnect());

function reqForDevice(deviceId, extraHeaders = {}) {
  return mockReq({
    headers: { 'x-device-id': deviceId, 'x-vercel-ip-country': 'SN', ...extraHeaders },
  });
}

async function seedOutboundLedger(user, { count, amount, type = 'send', counterpartyHandle = null }) {
  for (let i = 0; i < count; i++) {
    await prisma.ledgerEntry.create({
      data: {
        walletId: user.wallet.id,
        userId: user.id,
        type,
        amount: -amount,
        counterpartyHandle,
        reference: uniqueRef('SEED'),
      },
    });
  }
}

test('clean transaction from verified device is not held', async () => {
  const user = await createUserWithWallet({ balance: 100_000 });
  const deviceId = await createVerifiedDevice(user.id);

  const risk = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'transfer_send',
    amountNational: 5_000,
  });

  assert.equal(risk.hold, false, `unexpected flags: ${risk.flags.join(', ')}`);
});

test('missing / unknown / unverified device each hold the transaction', async () => {
  const user = await createUserWithWallet({ balance: 100_000 });

  const noDevice = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: mockReq(),
    operationType: 'transfer_send',
    amountNational: 1_000,
  });
  assert.equal(noDevice.hold, true);
  assert.ok(noDevice.flags.includes('device_id_required'));

  const unknown = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice('never-seen-device-xyz'),
    operationType: 'transfer_send',
    amountNational: 1_000,
  });
  assert.ok(unknown.flags.includes('device_unknown'));

  await prisma.userDevice.create({
    data: { userId: user.id, deviceId: 'unverified-device-123', verifiedAt: null },
  });
  const unverified = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice('unverified-device-123'),
    operationType: 'transfer_send',
    amountNational: 1_000,
  });
  assert.ok(unverified.flags.includes('device_verification_required'));
});

test(`velocity: more than ${RISK_LIMITS.TX_PER_HOUR} transactions in 1 hour holds`, async () => {
  const user = await createUserWithWallet({ balance: 1_000_000 });
  const deviceId = await createVerifiedDevice(user.id);
  await seedOutboundLedger(user, { count: RISK_LIMITS.TX_PER_HOUR, amount: 100 });

  const risk = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'transfer_send',
    amountNational: 100,
  });
  assert.equal(risk.hold, true);
  assert.ok(risk.flags.includes('velocity_tx_hour'));
});

test('velocity: crossing 500,000 XOF sent in 24h holds', async () => {
  const user = await createUserWithWallet({ balance: 2_000_000 });
  const deviceId = await createVerifiedDevice(user.id);
  await seedOutboundLedger(user, { count: 1, amount: 450_000 });

  const over = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'transfer_send',
    amountNational: 100_000,
  });
  assert.ok(over.flags.includes('velocity_daily_outbound'));

  const under = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'transfer_send',
    amountNational: 40_000,
  });
  assert.ok(!under.flags.includes('velocity_daily_outbound'));
});

test('velocity: same amount to same recipient 3+ times in an hour holds', async () => {
  const user = await createUserWithWallet({ balance: 1_000_000 });
  const deviceId = await createVerifiedDevice(user.id);
  await seedOutboundLedger(user, {
    count: RISK_LIMITS.REPEAT_SAME_RECIPIENT_HOUR - 1,
    amount: 5_000,
    counterpartyHandle: '@repeat-target',
  });

  const risk = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'transfer_send',
    amountNational: 5_000,
    recipientHandle: '@repeat-target',
  });
  assert.ok(risk.flags.includes('velocity_repeat_recipient'));

  const differentAmount = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'transfer_send',
    amountNational: 7_500,
    recipientHandle: '@repeat-target',
  });
  assert.ok(!differentAmount.flags.includes('velocity_repeat_recipient'));
});

test('night window rule: 2am–4am Dakar detection and threshold', () => {
  assert.equal(isDakarNightWindow(new Date('2026-01-15T02:30:00Z')), true);
  assert.equal(isDakarNightWindow(new Date('2026-01-15T03:59:00Z')), true);
  assert.equal(isDakarNightWindow(new Date('2026-01-15T04:00:00Z')), false);
  assert.equal(isDakarNightWindow(new Date('2026-01-15T14:00:00Z')), false);
  assert.equal(dakarHour(new Date('2026-01-15T02:30:00Z')), 2);
  assert.equal(RISK_LIMITS.NIGHT_LARGE_XOF, 100_000);
});

test('Kori conversion at or above 50,000 XOF equivalent requires manual review', async () => {
  const user = await createUserWithWallet({ koriBalance: 10_000 });
  const deviceId = await createVerifiedDevice(user.id);

  const large = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'kori_convert',
    amountNational: 50_000,
  });
  assert.equal(large.hold, true);
  assert.ok(large.flags.includes('kori_convert_review'));

  const small = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'kori_convert',
    amountNational: 49_999,
  });
  assert.ok(!small.flags.includes('kori_convert_review'));
});

test('Kori mint without a verified national deposit is held', async () => {
  const user = await createUserWithWallet();
  const deviceId = await createVerifiedDevice(user.id);

  const unbacked = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'kori_mint',
    amountNational: 1_000,
    hasNationalDepositProof: false,
  });
  assert.ok(unbacked.flags.includes('kori_unbacked_increase'));

  const backed = await assessTransactionRisk(prisma, {
    userId: user.id,
    req: reqForDevice(deviceId),
    operationType: 'kori_mint',
    amountNational: 1_000,
    hasNationalDepositProof: true,
  });
  assert.ok(!backed.flags.includes('kori_unbacked_increase'));
});

test('login from outside WAEMU requires verification unless diaspora-flagged', async () => {
  const local = await createUserWithWallet();
  const fromFrance = await registerDeviceLogin(
    local.id,
    mockReq({ headers: { 'x-device-id': `device-${local.id}`, 'x-vercel-ip-country': 'FR' } }),
  );
  assert.ok(fromFrance.flags.includes('device_foreign_ip'));
  assert.equal(fromFrance.requiresVerification, true);

  const diaspora = await createUserWithWallet({ isDiaspora: true });
  const diasporaLogin = await registerDeviceLogin(
    diaspora.id,
    mockReq({ headers: { 'x-device-id': `device-${diaspora.id}`, 'x-vercel-ip-country': 'FR' } }),
  );
  assert.ok(!diasporaLogin.flags.includes('device_foreign_ip'));
});

test(`${RISK_LIMITS.DEVICES_24H}+ devices in 24 hours flags multi-device`, async () => {
  const user = await createUserWithWallet();
  const results = [];
  for (let i = 0; i < RISK_LIMITS.DEVICES_24H; i++) {
    results.push(
      await registerDeviceLogin(
        user.id,
        mockReq({ headers: { 'x-device-id': `multi-device-${user.id}-${i}`, 'x-vercel-ip-country': 'SN' } }),
      ),
    );
  }
  const last = results.at(-1);
  assert.ok(last.flags.includes('device_multi_24h'));
  assert.equal(last.requiresVerification, true);
});
