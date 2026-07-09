import '../helpers/setup.js';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { authPhone, authEmail, authVerify, authCompleteProfile } from '../../lib/handlers.js';
import { mockReq, mockRes, prisma, resetReserveToWallets, uniquePhone } from '../helpers/db.js';

beforeEach(async () => {
  await resetReserveToWallets();
});

after(async () => {
  await prisma.$disconnect();
});

test('invalid OTP is rejected', async () => {
  const phone = uniquePhone();
  const sendRes = mockRes();
  await authPhone(mockReq({ body: { phone } }), sendRes);
  assert.equal(sendRes.statusCode, 200);
  assert.ok(sendRes.body.otp);

  const verifyRes = mockRes();
  await authVerify(mockReq({ body: { phone, otp: '000000' }, headers: { 'x-device-id': 'auth-test-device' } }), verifyRes);
  assert.equal(verifyRes.statusCode, 401);
});

test('phone → verify → complete-profile issues session and profile', async () => {
  const phone = uniquePhone();

  const sendRes = mockRes();
  await authPhone(mockReq({ body: { phone } }), sendRes);
  assert.equal(sendRes.statusCode, 200);
  const { otp } = sendRes.body;

  const verifyRes = mockRes();
  await authVerify(
    mockReq({ body: { phone, otp }, headers: { 'x-device-id': 'auth-test-device-2' } }),
    verifyRes,
  );
  assert.equal(verifyRes.statusCode, 200);
  assert.ok(verifyRes.body.accessToken);
  assert.ok(verifyRes.body.refreshToken);
  assert.equal(verifyRes.body.isNewUser, true);

  const user = await prisma.user.findUnique({ where: { phone } });
  assert.ok(user);
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  assert.ok(wallet);

  const profileRes = mockRes();
  await authCompleteProfile(
    mockReq({
      userId: user.id,
      body: {
        name: 'Awa Diop',
        handle: `awa${Date.now().toString(36)}`,
        arrondissement: { key: 'medina', icon: '🏘️', name: 'Médina' },
        fundAmount: 0,
        identityChoice: 'send_money',
        countryCode: 'SN',
      },
    }),
    profileRes,
  );
  assert.equal(profileRes.statusCode, 200);
  assert.equal(profileRes.body.profile.name, 'Awa Diop');
  assert.equal(profileRes.body.balance, 0);
});

test('complete-profile ignores fundAmount and never mints signup credit', async () => {
  const phone = uniquePhone();

  const sendRes = mockRes();
  await authPhone(mockReq({ body: { phone } }), sendRes);
  const verifyRes = mockRes();
  await authVerify(
    mockReq({ body: { phone, otp: sendRes.body.otp }, headers: { 'x-device-id': 'auth-test-fund' } }),
    verifyRes,
  );
  const user = await prisma.user.findUnique({ where: { phone } });

  const profileRes = mockRes();
  await authCompleteProfile(
    mockReq({
      userId: user.id,
      body: {
        name: 'Mint Test',
        handle: `mint${Date.now().toString(36)}`,
        arrondissement: { key: 'medina', icon: '🏘️', name: 'Médina' },
        fundAmount: 50000,
        countryCode: 'SN',
      },
    }),
    profileRes,
  );
  assert.equal(profileRes.statusCode, 200);
  assert.equal(profileRes.body.balance, 0);
  assert.equal(profileRes.body.koriMinted, 0);
  assert.equal(profileRes.body.transactions.length, 0);
});

test('returning user verify sets isNewUser false', async () => {
  const phone = uniquePhone();

  const send1 = mockRes();
  await authPhone(mockReq({ body: { phone } }), send1);
  const verify1 = mockRes();
  await authVerify(
    mockReq({ body: { phone, otp: send1.body.otp }, headers: { 'x-device-id': 'auth-test-device-3' } }),
    verify1,
  );
  assert.equal(verify1.body.isNewUser, true);

  const send2 = mockRes();
  await authPhone(mockReq({ body: { phone } }), send2);
  const verify2 = mockRes();
  await authVerify(
    mockReq({ body: { phone, otp: send2.body.otp }, headers: { 'x-device-id': 'auth-test-device-3' } }),
    verify2,
  );
  assert.equal(verify2.body.isNewUser, false);
});

test('email signup creates account without phone', async () => {
  const email = `signup${Date.now()}@k21.test`;

  const sendRes = mockRes();
  await authEmail(mockReq({ body: { email, intent: 'signup' } }), sendRes);
  assert.equal(sendRes.statusCode, 200);
  assert.ok(sendRes.body.otp);

  const verifyRes = mockRes();
  await authVerify(
    mockReq({ body: { email, otp: sendRes.body.otp, intent: 'signup' }, headers: { 'x-device-id': 'auth-email-signup' } }),
    verifyRes,
  );
  assert.equal(verifyRes.statusCode, 200);
  assert.equal(verifyRes.body.isNewUser, true);

  const user = await prisma.user.findUnique({ where: { email } });
  assert.ok(user);
  assert.ok(user.phone.startsWith('e:'));
});

test('email login for user with email on file', async () => {
  const phone = uniquePhone();
  const email = `test${Date.now()}@k21.test`;

  const sendRes = mockRes();
  await authPhone(mockReq({ body: { phone } }), sendRes);
  const verifyRes = mockRes();
  await authVerify(
    mockReq({ body: { phone, otp: sendRes.body.otp }, headers: { 'x-device-id': 'auth-email-setup' } }),
    verifyRes,
  );
  const user = await prisma.user.findUnique({ where: { phone } });
  await prisma.user.update({ where: { id: user.id }, data: { email, emailVerifiedAt: new Date() } });

  const emailSend = mockRes();
  await authEmail(mockReq({ body: { email } }), emailSend);
  assert.equal(emailSend.statusCode, 200);
  assert.ok(emailSend.body.otp);

  const emailVerify = mockRes();
  await authVerify(
    mockReq({ body: { email, otp: emailSend.body.otp, intent: 'login' }, headers: { 'x-device-id': 'auth-email-login' } }),
    emailVerify,
  );
  assert.equal(emailVerify.statusCode, 200);
  assert.ok(emailVerify.body.accessToken);
  assert.equal(emailVerify.body.isNewUser, false);
});
