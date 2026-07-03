import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';
import { profileShape, txShape } from './shapes.js';
import {
  hashToken,
  otp,
  reference,
  refreshExpiry,
  signAccessToken,
  signRefreshToken,
} from '../api/_lib/auth.js';
import { walletShape, formatKori, countryFromPhone, countryConfig, nationalToKori } from './kori.js';
import { tierShape } from './tier-limits.js';
import {
  mintKoriFromNationalDeposit,
  creditKoriEarn,
  sendKoriTransfer,
  convertKoriToNational,
  spendKoriAtMerchant,
  ensureReserve,
} from './kori-service.js';
import { reserveShape } from './kori-reserve.js';
import {
  assertCanCashOut,
  assertCanCreateBusiness,
  assertCanInternational,
  assertCanReceive,
  assertCanSend,
  assertWalletWithinCaps,
  recordDailyCashOut,
  recordDailySend,
  TierLimitError,
  tierErrorStatus,
} from './tier-service.js';
import {
  getKycStatus,
  handleKycWebhook,
  KycError,
  purgeExpiredKycImageMetadata,
  submitAddressVerification,
  submitCniVerification,
} from './kyc-service.js';
import { JULAYA_OPERATORS, julayaMode, parseWebhookPayload, verifyWebhookSignature } from './julaya.js';
import {
  acceptMoneyRequest,
  cancelMoneyRequest,
  denyMoneyRequest,
  moneyRequestShape,
  RequestError,
  requestErrorStatus,
} from './money-request-service.js';
import { completeCashIn, railShape, RailError, settleRailFromWebhook, startCashIn, startCashOut } from './rail-service.js';
import { validationError } from './validation.js';
import {
  PinError,
  pinErrorStatus,
  setBiometricEnabled,
  setUserPin,
  storeCniNumber,
  unlockAccountWithCni,
  verifyUserPin,
} from './pin-service.js';
import { touchActivity } from './session-security.js';
import { assertStepUpForAmount, amountToNationalXof, StepUpRequiredError } from './step-up.js';
import {
  acceptDelivery,
  confirmDelivery,
  DeliveryError,
  deliveryErrorStatus,
  getDeliveryDetail,
  listNearbyDeliveries,
  markDelivered,
  markPickedUp,
  openDispute,
  resolveDispute,
  submitDisputeEvidence,
} from './delivery-service.js';
import {
  InsufficientFundsError,
  isMoneyError,
  moneyErrorStatus,
  runMoneyTransaction,
  transferNational,
} from './wallet-atomic.js';
import { gateOrExecute } from './risk-gate.js';
import { registerDeviceLogin, verifyDeviceWithOtp } from './device-session.js';
import { deviceIdFromRequest } from './geo-ip.js';
import {
  approveHeldTransaction,
  HeldTransactionError,
  listFraudAlerts,
  listHeldTransactions,
  rejectHeldTransaction,
} from './held-transaction-service.js';
import { notifyDepositReceived, notifyMoneyReceived } from './notify-service.js';
import { handleInboundSms, sendOtpSms, smsConfigured, verifySmsWebhook } from './sms-service.js';

const bootedAt = Date.now();
import { smsConfig } from './sms-config.js';
import { createTransferUndoInTx, handleTransferUndoError, undoShape, undoTransfer } from './transfer-undo-service.js';

async function requireWallet(userId) {
  return prisma.wallet.findUniqueOrThrow({ where: { userId } });
}

async function ensureRole(userId, role) {
  return prisma.accountRole.upsert({
    where: { userId_role: { userId, role } },
    update: { status: 'active' },
    create: { userId, role },
  });
}

const phoneBody = z.object({ phone: z.string().min(8).max(24) });
const verifyBody = z.object({ phone: z.string().min(8).max(24), otp: z.string().length(6) });
const arrondissementBody = z.object({ key: z.string(), icon: z.string().optional(), name: z.string() });
const completeProfileBody = z.object({
  name: z.string().min(2),
  handle: z.string().min(3).regex(/^[a-z0-9_]+$/),
  arrondissement: arrondissementBody,
  fundAmount: z.number().int().min(0).default(0),
  identityChoice: z.string().optional(),
  avatarEmoji: z.string().optional(),
  cniNumber: z.string().min(6).max(24).optional(),
  isDiaspora: z.boolean().optional(),
  countryCode: z.string().length(2).optional(),
});
const refreshBody = z.object({ refreshToken: z.string().min(1) });
const cashBody = z.object({
  amount: z.number().int().positive(),
  operator: z.enum(JULAYA_OPERATORS),
  phone: z.string().min(8).max(24).optional(),
});

async function checkOtpRateLimit(phone) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.otpCode.count({ where: { phone, createdAt: { gt: oneHourAgo } } });
  return count < 5;
}

export async function health(req, res) {
  const deep = req.query?.deep === '1';
  const checkedAt = new Date().toISOString();
  const base = {
    status: 'ok',
    service: 'keit-api',
    checkedAt,
    uptimeSeconds: Math.floor((Date.now() - bootedAt) / 1000),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    const payload = { ...base, db: 'ok' };

    if (deep) {
      const [pendingRails, openFraud, reserve] = await Promise.all([
        prisma.railTransaction.count({ where: { status: 'pending' } }),
        prisma.fraudAlert.count({ where: { acknowledgedAt: null } }),
        prisma.koriReserve.findUnique({ where: { id: 'global' } }),
      ]);
      payload.ops = {
        pendingRails,
        openFraudAlerts: openFraud,
        koriReserveXof: reserve?.totalReserveHeldXof ?? null,
      };
    }

    res.json(payload);
  } catch (error) {
    console.error('[health] db check failed', error);
    res.status(503).json({
      ...base,
      status: 'degraded',
      db: 'error',
    });
  }
}

export async function authPhone(req, res) {
  const parsed = phoneBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const normalized = parsed.data.phone.replace(/\s/g, '');
  if (!(await checkOtpRateLimit(normalized))) {
    res.status(429).json({ error: 'Too many OTP requests. Try again later.' });
    return;
  }

  const code = otp();
  await prisma.otpCode.create({
    data: { phone: normalized, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  await sendOtpSms(normalized, code);

  if (process.env.NODE_ENV === 'production' && smsConfigured()) {
    res.json({ sent: true, message: 'Code envoyé par SMS' });
  } else {
    res.json({ otp: code, sms: smsConfigured() ? 'sent' : 'mock' });
  }
}

export async function authVerify(req, res) {
  const parsed = verifyBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { phone, otp: code } = parsed.data;
  const normalized = phone.replace(/\s/g, '');

  const stored = await prisma.otpCode.findFirst({
    where: { phone: normalized, code, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!stored) {
    res.status(401).json({ error: 'Invalid or expired OTP' });
    return;
  }

  let isNewUser = false;
  let user = await prisma.user.findUnique({ where: { phone: normalized } });

  if (!user) {
    isNewUser = true;
    const country = countryFromPhone(normalized);
    const { currency } = countryConfig(country);
    user = await prisma.user.create({
      data: {
        phone: normalized,
        country,
        otpVerifiedAt: new Date(),
        wallet: { create: { currency } },
        roles: { create: { role: 'personal' } },
      },
    });
    await ensureReserve(prisma);
  } else {
    user = await prisma.user.update({ where: { id: user.id }, data: { otpVerifiedAt: new Date() } });
  }

  await prisma.otpCode.deleteMany({ where: { phone: normalized } });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiry() },
  });

  await touchActivity(user.id);

  const device = await registerDeviceLogin(user.id, req);

  res.json({
    accessToken,
    refreshToken,
    isNewUser,
    deviceVerificationRequired: device.requiresVerification,
    device: {
      isNew: device.isNewDevice,
      requiresVerification: device.requiresVerification,
      devicesLast24h: device.devicesLast24h,
      flags: device.flags,
    },
  });
}

export async function authRefresh(req, res) {
  const parsed = refreshBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const { refreshToken } = parsed.data;
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!payload.sub || payload.type !== 'refresh') throw new Error('Invalid refresh token');

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or revoked refresh token' });
      return;
    }

    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const nextRefreshToken = signRefreshToken(payload.sub);
    await prisma.refreshToken.create({
      data: { userId: payload.sub, tokenHash: hashToken(nextRefreshToken), expiresAt: refreshExpiry() },
    });

    res.json({ accessToken: signAccessToken(payload.sub), refreshToken: nextRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export async function authCompleteProfile(req, res) {
  const parsed = completeProfileBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const body = parsed.data;

  const existingHandle = await prisma.user.findFirst({
    where: { handle: body.handle, NOT: { id: req.userId } },
  });
  if (existingHandle) {
    res.status(409).json({ error: 'Handle already taken' });
    return;
  }

  const result = await prisma.$transaction(async (db) => {
    const countryUpdate = body.countryCode
      ? { country: body.countryCode, isDiaspora: body.isDiaspora ?? body.countryCode !== 'SN' }
      : { isDiaspora: body.isDiaspora ?? false };

    const user = await db.user.update({
      where: { id: req.userId },
      data: {
        name: body.name,
        handle: body.handle,
        arrondissementKey: body.arrondissement.key,
        arrondissementIcon: body.arrondissement.icon ?? '📍',
        arrondissementName: body.arrondissement.name,
        avatarEmoji: body.avatarEmoji ?? '👤',
        identityChoice: body.identityChoice,
        ...countryUpdate,
      },
    });

    if (body.countryCode) {
      const { currency } = countryConfig(body.countryCode);
      await db.wallet.update({
        where: { userId: user.id },
        data: { currency },
      });
    }

    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    let tx = null;
    let koriMinted = 0;

    if (body.fundAmount > 0) {
      const ref = reference('TOPUP');
      const mint = await mintKoriFromNationalDeposit(db, {
        userId: user.id,
        walletId: wallet.id,
        country: user.country,
        nationalAmount: body.fundAmount,
        reference: ref,
        note: 'Dépôt initial — conversion nationale → Kori',
      });
      koriMinted = mint.koriMinted;
      tx = await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: 'external_topup',
          amount: body.fundAmount,
          note: `Dépôt initial · +${formatKori(koriMinted)} Kori`,
          reference: ref,
        },
      });
    }

    const updatedWallet = await db.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
    return { user, wallet: updatedWallet, tx, koriMinted };
  });

  if (body.cniNumber) {
    // Legacy path — prefer POST /api/kyc/cni/submit for Tier 2 upgrade
    await storeCniNumber(req.userId, body.cniNumber);
  }

  res.json({
    profile: profileShape(result.user),
    ...walletShape(result.wallet),
    koriMinted: result.koriMinted,
    transactions: result.tx ? [txShape(result.tx)] : [],
  });
}

function handlePinError(res, error) {
  if (error instanceof PinError) {
    res.status(pinErrorStatus(error.code)).json({ error: error.message, code: error.code });
    return true;
  }
  return false;
}

function handleStepUpError(res, error) {
  if (error instanceof StepUpRequiredError) {
    res.status(403).json({
      error: error.message,
      code: error.code,
      thresholdXOF: 50_000,
    });
    return true;
  }
  return false;
}

export async function authPinSet(req, res) {
  const schema = z.object({ pin: z.string().regex(/^\d{6,}$/) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    await setUserPin(req.userId, parsed.data.pin);
    res.json({ ok: true, message: 'PIN configured' });
  } catch (error) {
    if (handlePinError(res, error)) return;
    throw error;
  }
}

export async function authPinVerify(req, res) {
  const schema = z.object({
    pin: z.string().regex(/^\d{6,}$/),
    forStepUp: z.boolean().optional().default(true),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await verifyUserPin(req.userId, parsed.data.pin, { grantStepUp: parsed.data.forStepUp });
    res.json({ verified: true, stepUpToken: result.stepUpToken });
  } catch (error) {
    if (handlePinError(res, error)) return;
    throw error;
  }
}

export async function authPinUnlock(req, res) {
  const schema = z.object({ cniNumber: z.string().min(6).max(24) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await unlockAccountWithCni(req.userId, parsed.data.cniNumber);
    res.json(result);
  } catch (error) {
    if (handlePinError(res, error)) return;
    throw error;
  }
}

export async function authBiometric(req, res) {
  const schema = z.object({ enabled: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (!user.pinHash) {
    res.status(400).json({ error: 'Set a PIN before enabling biometrics' });
    return;
  }

  await setBiometricEnabled(req.userId, parsed.data.enabled);
  res.json({ biometricEnabled: parsed.data.enabled });
}

export async function authDeviceVerify(req, res) {
  const schema = z.object({
    phone: z.string().min(8).max(24),
    otp: z.string().length(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const normalized = parsed.data.phone.replace(/\s/g, '');
  const stored = await prisma.otpCode.findFirst({
    where: { phone: normalized, code: parsed.data.otp, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!stored) {
    res.status(401).json({ error: 'Invalid or expired OTP' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone: normalized } });
  if (!user || user.id !== req.userId) {
    res.status(403).json({ error: 'Phone does not match signed-in account' });
    return;
  }

  const deviceId = deviceIdFromRequest(req);
  if (!deviceId) {
    res.status(400).json({ error: 'X-Device-Id header required' });
    return;
  }

  await verifyDeviceWithOtp(user.id, deviceId);
  await prisma.otpCode.deleteMany({ where: { phone: normalized } });

  res.json({ verified: true, message: 'Device verified' });
}

function requireAdmin(req, res) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && req.headers['x-admin-key'] !== adminKey) {
    res.status(401).json({ error: 'Admin authorization required' });
    return false;
  }
  return true;
}

export async function adminHeldTransactionsList(req, res) {
  if (!requireAdmin(req, res)) return;
  const status = req.query.status ?? 'pending_review';
  const items = await listHeldTransactions({ status: String(status) });
  res.json(
    items.map((h) => ({
      id: h.id,
      userId: h.userId,
      operationType: h.operationType,
      status: h.status,
      amountNational: h.amountNational,
      flags: JSON.parse(h.flagsJson),
      reference: h.reference,
      expiresAt: h.expiresAt.toISOString(),
      createdAt: h.createdAt.toISOString(),
      alerts: h.fraudAlerts,
    })),
  );
}

export async function adminHeldTransactionApprove(req, res) {
  if (!requireAdmin(req, res)) return;
  const schema = z.object({ note: z.string().optional() });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await approveHeldTransaction(req.query.id, req.userId ?? 'admin', parsed.data.note);
    res.json(result);
  } catch (error) {
    if (error instanceof HeldTransactionError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }
    throw error;
  }
}

export async function adminHeldTransactionReject(req, res) {
  if (!requireAdmin(req, res)) return;
  const schema = z.object({ reason: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const held = await rejectHeldTransaction(req.query.id, req.userId ?? 'admin', parsed.data.reason);
    res.json(held);
  } catch (error) {
    if (error instanceof HeldTransactionError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }
    throw error;
  }
}

export async function adminFraudAlerts(req, res) {
  if (!requireAdmin(req, res)) return;
  const alerts = await listFraudAlerts({ unacknowledgedOnly: true });
  res.json(alerts);
}

function handleTierError(res, error) {
  if (error instanceof TierLimitError) {
    res.status(tierErrorStatus(error.code)).json({ error: error.message, code: error.code });
    return true;
  }
  return false;
}

function handleKycError(res, error) {
  if (error instanceof KycError) {
    res.status(400).json({ error: error.message, code: error.code });
    return true;
  }
  return false;
}

export async function kycStatus(req, res) {
  const status = await getKycStatus(req.userId);
  res.json(status);
}

export async function kycCniSubmit(req, res) {
  const schema = z.object({
    frontImage: z.string().min(100),
    backImage: z.string().min(100),
    selfieImage: z.string().min(100).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await submitCniVerification(req.userId, parsed.data);
    res.status(202).json(result);
  } catch (error) {
    if (handleKycError(res, error)) return;
    throw error;
  }
}

export async function kycAddressSubmit(req, res) {
  const schema = z.object({
    addressLine: z.string().min(5),
    city: z.string().min(2),
    region: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await submitAddressVerification(req.userId, parsed.data);
    res.json(result);
  } catch (error) {
    if (handleKycError(res, error)) return;
    throw error;
  }
}

export async function webhooksKycSmile(req, res) {
  if (process.env.KYC_WEBHOOK_SECRET) {
    const sig = req.headers['x-smile-signature'] ?? req.headers['x-kyc-signature'];
    if (sig !== process.env.KYC_WEBHOOK_SECRET) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
  }
  const result = await handleKycWebhook('smile_id', req.body ?? {});
  res.json(result);
}

export async function webhooksKycSumsub(req, res) {
  if (process.env.KYC_WEBHOOK_SECRET) {
    const sig = req.headers['x-sumsub-signature'] ?? req.headers['x-kyc-signature'];
    if (sig !== process.env.KYC_WEBHOOK_SECRET) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
  }
  const result = await handleKycWebhook('sumsub', req.body ?? {});
  res.json(result);
}

export async function kycPurgeCron(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const purged = await purgeExpiredKycImageMetadata();
  res.json(purged);
}

export async function getMe(req, res) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json(profileShape(user));
}

export async function getWallet(req, res) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const wallet = await requireWallet(req.userId);
  res.json({ ...walletShape(wallet), verification: tierShape(user) });
}

export async function getTransactions(req, res) {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const wallet = await requireWallet(req.userId);
  const transactions = await prisma.ledgerEntry.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(transactions.map(txShape));
}

export async function transfersSend(req, res) {
  const schema = z.object({
    recipientHandle: z.string().min(3),
    amount: z.number().int().positive(),
    currency: z.enum(['national', 'kori']).default('national'),
    note: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { recipientHandle, amount, currency, note } = parsed.data;
  const sender = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, include: { wallet: true } });

  try {
    await assertStepUpForAmount(req, amountToNationalXof(amount, currency, sender.country));
  } catch (error) {
    if (handleStepUpError(res, error)) return;
    throw error;
  }

  const recipient = await prisma.user.findUnique({ where: { handle: recipientHandle }, include: { wallet: true } });

  if (!recipient?.wallet) {
    res.status(404).json({ error: 'Recipient not found' });
    return;
  }

  const amountNational = amountToNationalXof(amount, currency, sender.country);

  try {
    await assertCanSend(prisma, sender, amountNational);
    await assertCanReceive(
      prisma,
      recipient,
      recipient.wallet,
      currency === 'national' ? amount : 0,
      currency === 'kori' ? amount : 0,
    );
  } catch (error) {
    if (handleTierError(res, error)) return;
    throw error;
  }

  if (currency === 'kori') {
    try {
      const gate = await gateOrExecute(
        req,
        res,
        {
          operationType: 'send_kori',
          amountNational,
          recipientHandle,
          recipientId: recipient.id,
          payload: {
            senderId: sender.id,
            senderWalletId: sender.wallet.id,
            recipientId: recipient.id,
            recipientWalletId: recipient.wallet.id,
            amountKori: amount,
            note,
          },
        },
        async (ref) => {
          await runMoneyTransaction(prisma, async (db) => {
            await sendKoriTransfer(db, {
              senderId: sender.id,
              senderWalletId: sender.wallet.id,
              recipientId: recipient.id,
              recipientWalletId: recipient.wallet.id,
              amountKori: amount,
              reference: ref,
              note,
            });
            await creditKoriEarn(db, sender.id, sender.wallet.id, 'send', `${ref}-EARN`);
          });
          return { currency: 'kori', amount, formatted: formatKori(amount), reference: ref, recipientHandle };
        },
      );
      if (gate.held) return;
      await recordDailySend(prisma, sender.id, amountNational);
      await notifyMoneyReceived(recipient.id, {
        amount,
        currency: 'kori',
        senderLabel: sender.name ?? sender.handle,
      });
      res.status(201).json(gate.result);
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
    return;
  }

  if (!sender.wallet) {
    res.status(400).json({ error: 'Wallet not found' });
    return;
  }

  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'send_national',
        amountNational,
        recipientHandle,
        recipientId: recipient.id,
        payload: {
          amount,
          senderUserId: sender.id,
          recipientUserId: recipient.id,
          senderWalletId: sender.wallet.id,
          recipientWalletId: recipient.wallet.id,
          senderLedger: {
            type: 'send',
            counterpartyName: recipient.name,
            counterpartyHandle: recipient.handle,
            note,
          },
          recipientLedger: {
            type: 'receive',
            counterpartyName: sender.name,
            counterpartyHandle: sender.handle,
            note,
          },
        },
      },
      async (ref) => {
        let undoRow;
        const entry = await runMoneyTransaction(prisma, async (db) => {
          const outgoing = await transferNational(db, {
            amount,
            senderWalletId: sender.wallet.id,
            recipientWalletId: recipient.wallet.id,
            senderUserId: sender.id,
            recipientUserId: recipient.id,
            reference: ref,
            senderLedger: {
              type: 'send',
              counterpartyName: recipient.name,
              counterpartyHandle: recipient.handle,
              note,
            },
            recipientLedger: {
              type: 'receive',
              counterpartyName: sender.name,
              counterpartyHandle: sender.handle,
              note,
            },
          });
          undoRow = await createTransferUndoInTx(db, {
            senderUserId: sender.id,
            recipientUserId: recipient.id,
            amount,
            originalReference: ref,
            recipientReference: `${ref}-R`,
            operationType: 'send',
          });
          await creditKoriEarn(db, sender.id, sender.wallet.id, 'send', `${ref}-EARN`);
          return outgoing;
        });
        return { ...txShape(entry), undo: undoShape(undoRow) };
      },
    );
    if (gate.held) return;
    await recordDailySend(prisma, sender.id, amountNational);
    await notifyMoneyReceived(recipient.id, {
      amount,
      currency: 'national',
      senderLabel: sender.name ?? sender.handle,
    });
    res.status(201).json(gate.result);
  } catch (error) {
    if (isMoneyError(error)) {
      res.status(moneyErrorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function transferUndo(req, res) {
  const ref = req.query.reference ?? req.query.id;
  if (!ref) {
    res.status(400).json({ error: 'reference required' });
    return;
  }

  try {
    const result = await undoTransfer(prisma, { reference: String(ref), userId: req.userId });
    res.json({
      undone: true,
      message: 'Paiement annulé — l\'argent est revenu sur ton compte',
      ...result,
    });
  } catch (error) {
    if (handleTransferUndoError(res, error)) return;
    throw error;
  }
}

export async function transfersRequest(req, res) {
  const schema = z.object({
    recipientHandle: z.string().min(3),
    amount: z.number().int().positive(),
    currency: z.enum(['national', 'kori']).default('national'),
    note: z.string().optional(),
    voiceNoteUrl: z.string().url().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { recipientHandle, amount, currency, note, voiceNoteUrl } = parsed.data;
  const requester = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const payer = await prisma.user.findUnique({ where: { handle: recipientHandle } });

  if (!payer) {
    res.status(404).json({ error: 'Recipient not found' });
    return;
  }
  if (payer.id === requester.id) {
    res.status(400).json({ error: 'Cannot request money from yourself' });
    return;
  }

  const ref = reference('REQ');
  const moneyRequest = await prisma.$transaction(async (db) => {
    const created = await db.moneyRequest.create({
      data: { requesterId: requester.id, payerId: payer.id, amount, currency, note, voiceNoteUrl, reference: ref },
      include: {
        requester: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
        payer: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
      },
    });

    const amountLabel = currency === 'kori' ? formatKori(amount) : `${amount.toLocaleString('fr-FR')} F`;
    const context = note ? ` · ${note}` : voiceNoteUrl ? ' · note vocale' : '';

    await db.notification.create({
      data: {
        userId: payer.id,
        title: "Demande d'argent",
        body: `${requester.name ?? requester.handle} demande ${amountLabel}${context}`,
      },
    });

    return created;
  });

  res.status(201).json(moneyRequestShape(moneyRequest));
}

export async function transfersRequestsList(req, res) {
  const role = String(req.query.role ?? 'all');
  const status = req.query.status ? String(req.query.status) : undefined;

  const where =
    role === 'incoming'
      ? { payerId: req.userId, ...(status ? { status } : {}) }
      : role === 'outgoing'
        ? { requesterId: req.userId, ...(status ? { status } : {}) }
        : { OR: [{ payerId: req.userId }, { requesterId: req.userId }], ...(status ? { status } : {}) };

  const requests = await prisma.moneyRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      requester: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
      payer: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
    },
  });

  res.json(requests.map(moneyRequestShape));
}

export async function transfersRequestById(req, res) {
  const id = req.query.id;
  const request = await prisma.moneyRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
      payer: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
    },
  });

  if (!request || (request.requesterId !== req.userId && request.payerId !== req.userId)) {
    res.status(404).json({ error: 'Money request not found' });
    return;
  }

  res.json(moneyRequestShape(request));
}

async function moneyRequestAction(req, res, action) {
  try {
    const updated = await action(req.query.id, req.userId);
    res.json(moneyRequestShape(updated));
  } catch (error) {
    if (error instanceof RequestError) {
      res.status(requestErrorStatus(error.code)).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function transfersRequestAccept(req, res) {
  const request = await prisma.moneyRequest.findUnique({
    where: { id: req.query.id },
    include: { requester: true },
  });
  if (!request || request.payerId !== req.userId) {
    res.status(404).json({ error: 'Money request not found' });
    return;
  }

  const payer = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  try {
    await assertStepUpForAmount(req, amountToNationalXof(request.amount, request.currency, payer.country));
  } catch (error) {
    if (error instanceof StepUpRequiredError) return handleStepUpError(res, error);
    throw error;
  }

  const amountNational = amountToNationalXof(request.amount, request.currency, payer.country);
  try {
    await assertCanSend(prisma, payer, amountNational);
  } catch (error) {
    if (handleTierError(res, error)) return;
    throw error;
  }

  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'money_request_accept',
        amountNational,
        recipientHandle: request.requester.handle ?? undefined,
        recipientId: request.requesterId,
        payload: { requestId: request.id, payerUserId: req.userId },
      },
      async () => {
        const updated = await acceptMoneyRequest(prisma, {
          requestId: request.id,
          payerUserId: req.userId,
        });
        return moneyRequestShape(updated);
      },
    );
    if (gate.held) return;
    await recordDailySend(prisma, payer.id, amountNational);
    res.json(gate.result);
  } catch (error) {
    if (error instanceof RequestError) {
      res.status(requestErrorStatus(error.code)).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function transfersRequestDeny(req, res) {
  return moneyRequestAction(req, res, (id, userId) =>
    denyMoneyRequest(prisma, { requestId: id, payerUserId: userId }),
  );
}

export async function transfersRequestCancel(req, res) {
  return moneyRequestAction(req, res, (id, userId) =>
    cancelMoneyRequest(prisma, { requestId: id, requesterUserId: userId }),
  );
}

export async function cashIn(req, res) {
  const parsed = cashBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { amount, operator, phone } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, include: { wallet: true } });
  if (!user.wallet) {
    res.status(400).json({ error: 'Wallet not found' });
    return;
  }

  try {
    const koriMint = nationalToKori(amount, user.country);
    await assertWalletWithinCaps(user, user.wallet, {
      incomingNational: amount,
      incomingKori: koriMint,
    });
  } catch (error) {
    if (handleTierError(res, error)) return;
    throw error;
  }

  const ref = reference('CIN');
  try {
    const result = await startCashIn(prisma, {
      userId: user.id,
      wallet: user.wallet,
      country: user.country,
      amount,
      phone: (phone ?? user.phone).replace(/\s/g, ''),
      operator,
      reference: ref,
      callbackUrl: process.env.JULAYA_CALLBACK_URL,
    });

    if (result.rail.status === 'completed' && result.wallet) {
      await notifyDepositReceived(user.id, { amount });
    }

    res.status(result.rail.status === 'completed' ? 201 : 202).json({
      rail: railShape(result.rail, result.wallet, { cached: result.cached }),
      koriMinted: result.mint?.koriMinted ?? null,
      reserveXofAdded: result.mint?.reserveXof ?? null,
      transaction: result.ledger ? txShape(result.ledger) : null,
      mode: julayaMode(),
      message: result.userMessage ?? null,
    });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Cash-in failed' });
  }
}

export async function cashOut(req, res) {
  const parsed = cashBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { amount, operator, phone } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, include: { wallet: true } });
  if (!user.wallet) {
    res.status(400).json({ error: 'Wallet not found' });
    return;
  }

  try {
    await assertStepUpForAmount(req, amount);
  } catch (error) {
    if (handleStepUpError(res, error)) return;
    throw error;
  }

  try {
    await assertCanCashOut(prisma, user, amount);
  } catch (error) {
    if (handleTierError(res, error)) return;
    throw error;
  }

  const ref = reference('COUT');
  const phoneNorm = (phone ?? user.phone).replace(/\s/g, '');
  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'cash_out',
        amountNational: amount,
        payload: {
          userId: user.id,
          amount,
          phone: phoneNorm,
          operator,
          callbackUrl: process.env.JULAYA_CALLBACK_URL,
        },
      },
      async (txRef) => {
        const result = await startCashOut(prisma, {
          userId: user.id,
          wallet: user.wallet,
          amount,
          phone: phoneNorm,
          operator,
          reference: txRef,
          callbackUrl: process.env.JULAYA_CALLBACK_URL,
        });
        return {
          status: result.rail.status === 'completed' ? 201 : 202,
          body: {
            rail: railShape(result.rail, result.wallet, { cached: result.cached }),
            transaction: result.ledger ? txShape(result.ledger) : null,
            mode: julayaMode(),
            message: result.userMessage ?? null,
          },
        };
      },
    );
    if (gate.held) return;
    await recordDailyCashOut(prisma, user.id, amount);
    res.status(gate.result.status).json(gate.result.body);
  } catch (error) {
    if (error instanceof RailError && error.code === 'insufficient') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(502).json({ error: error instanceof Error ? error.message : 'Cash-out failed' });
  }
}

export async function cashTransactions(req, res) {
  const rails = await prisma.railTransaction.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(rails.map((rail) => railShape(rail)));
}

export async function depositsNational(req, res) {
  const schema = z.object({ amount: z.number().int().positive(), source: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { amount, source } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, include: { wallet: true } });
  if (!user.wallet) {
    res.status(400).json({ error: 'Wallet not found' });
    return;
  }

  try {
    await assertStepUpForAmount(req, amount);
  } catch (error) {
    if (handleStepUpError(res, error)) return;
    throw error;
  }

  const ref = reference('DEP');
  const result = await prisma.$transaction(async (db) => {
    const settled = await completeCashIn(db, {
      userId: user.id,
      walletId: user.wallet.id,
      country: user.country,
      amount,
      reference: ref,
      sourceNote: source ? `Deposit via ${source}` : 'National currency deposit (dev)',
    });
    const wallet = await db.wallet.findUniqueOrThrow({ where: { id: user.wallet.id } });
    return { ...settled, wallet };
  });

  await notifyDepositReceived(user.id, { amount });

  res.status(201).json({
    ...walletShape(result.wallet),
    koriMinted: result.mint.koriMinted,
    reserveXofAdded: result.mint.reserveXof,
    transaction: txShape(result.ledger),
  });
}

export async function koriConvert(req, res) {
  const schema = z.object({ amountKori: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { amountKori } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, include: { wallet: true } });
  if (!user.wallet) {
    res.status(400).json({ error: 'Wallet not found' });
    return;
  }

  try {
    await assertStepUpForAmount(req, amountToNationalXof(amountKori, 'kori', user.country));
  } catch (error) {
    if (handleStepUpError(res, error)) return;
    throw error;
  }

  const amountNational = amountToNationalXof(amountKori, 'kori', user.country);

  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'kori_convert',
        amountNational,
        payload: {
          userId: user.id,
          walletId: user.wallet.id,
          country: user.country,
          amountKori,
          ledgerNote: `Conversion ${formatKori(amountKori)} → ${user.wallet.currency}`,
        },
      },
      async (ref) => {
        const result = await runMoneyTransaction(prisma, async (db) => {
          const conversion = await convertKoriToNational(db, {
            userId: user.id,
            walletId: user.wallet.id,
            country: user.country,
            koriAmount: amountKori,
            reference: ref,
          });

          const ledger = await db.ledgerEntry.create({
            data: {
              walletId: user.wallet.id,
              userId: user.id,
              type: 'cash_in',
              amount: conversion.netNational,
              note: `Conversion ${formatKori(amountKori)} → ${user.wallet.currency} (fee ${conversion.feeNational})`,
              reference: `${ref}-NAT`,
            },
          });

          const wallet = await db.wallet.findUniqueOrThrow({ where: { id: user.wallet.id } });
          return { conversion, ledger, wallet };
        });

        return {
          ...walletShape(result.wallet),
          convertedKori: amountKori,
          formattedKori: formatKori(amountKori),
          feeNational: result.conversion.feeNational,
          netNational: result.conversion.netNational,
          transaction: txShape(result.ledger),
        };
      },
    );
    if (gate.held) return;
    res.status(201).json(gate.result);
  } catch (error) {
    if (error instanceof ConversionsFrozenError) {
      res.status(503).json({ error: error.message, code: 'conversions_frozen' });
      return;
    }
    if (error instanceof InsufficientFundsError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function koriTransactions(req, res) {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const rows = await prisma.koriTransaction.findMany({
    where: { OR: [{ senderId: req.userId }, { recipientId: req.userId }] },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(rows);
}

export async function koriReserve(_req, res) {
  const reserve = await ensureReserve(prisma);
  res.json(reserveShape(reserve));
}

export async function koriReconcileCron(req, res) {
  const { cronKoriReconcile } = await import('./cron/http-handlers.js');
  return cronKoriReconcile(req, res);
}

export async function merchantPay(req, res) {
  const businessId = req.query.id;
  const schema = z.object({
    amount: z.number().int().positive(),
    currency: z.enum(['national', 'kori']).default('national'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { amount, currency } = parsed.data;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: { include: { wallet: true } } },
  });
  const payer = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, include: { wallet: true } });

  try {
    await assertStepUpForAmount(req, amountToNationalXof(amount, currency, payer.country));
  } catch (error) {
    if (handleStepUpError(res, error)) return;
    throw error;
  }

  if (!business?.owner.wallet) {
    res.status(404).json({ error: 'Merchant not found' });
    return;
  }

  const amountNational = amountToNationalXof(amount, currency, payer.country);

  if (currency === 'kori') {
    try {
      const gate = await gateOrExecute(
        req,
        res,
        {
          operationType: 'merchant_pay_kori',
          amountNational,
          recipientId: business.ownerId,
          payload: {
            payerId: payer.id,
            payerWalletId: payer.wallet.id,
            merchantUserId: business.ownerId,
            merchantWalletId: business.owner.wallet.id,
            amountKori: amount,
            merchantName: business.name,
          },
        },
        async (ref) => {
          await runMoneyTransaction(prisma, async (db) => {
            await spendKoriAtMerchant(db, {
              payerId: payer.id,
              payerWalletId: payer.wallet.id,
              merchantUserId: business.ownerId,
              merchantWalletId: business.owner.wallet.id,
              amountKori: amount,
              merchantName: business.name,
              reference: ref,
            });
            await creditKoriEarn(db, payer.id, payer.wallet.id, 'pay_merchant', `${ref}-EARN`);
          });
          return {
            currency: 'kori',
            amount,
            formatted: formatKori(amount),
            merchant: business.name,
            reference: ref,
          };
        },
      );
      if (gate.held) return;
      await recordDailySend(prisma, payer.id, amountNational);
      await notifyMoneyReceived(business.ownerId, {
        amount,
        currency: 'kori',
        senderLabel: payer.name ?? payer.handle,
      });
      res.status(201).json(gate.result);
    } catch (error) {
      if (isMoneyError(error)) {
        res.status(moneyErrorStatus(error)).json({ error: error.message });
        return;
      }
      throw error;
    }
    return;
  }

  if (!payer.wallet) {
    res.status(400).json({ error: 'Wallet not found' });
    return;
  }

  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'merchant_pay_national',
        amountNational,
        recipientId: business.ownerId,
        payload: {
          amount,
          senderUserId: payer.id,
          recipientUserId: business.ownerId,
          senderWalletId: payer.wallet.id,
          recipientWalletId: business.owner.wallet.id,
          senderLedger: { type: 'pay_merchant', counterpartyName: business.name },
          recipientLedger: {
            type: 'marketplace_sale',
            counterpartyName: business.name,
          },
        },
      },
      async (ref) => {
        let undoRow;
        const entry = await runMoneyTransaction(prisma, async (db) => {
          const tx = await transferNational(db, {
            amount,
            senderWalletId: payer.wallet.id,
            recipientWalletId: business.owner.wallet.id,
            senderUserId: payer.id,
            recipientUserId: business.ownerId,
            reference: ref,
            senderLedger: { type: 'pay_merchant', counterpartyName: business.name },
            recipientLedger: {
              type: 'marketplace_sale',
              counterpartyName: business.name,
              reference: `${ref}-M`,
            },
          });
          undoRow = await createTransferUndoInTx(db, {
            senderUserId: payer.id,
            recipientUserId: business.ownerId,
            amount,
            originalReference: ref,
            recipientReference: `${ref}-M`,
            operationType: 'merchant_pay',
          });
          await creditKoriEarn(db, payer.id, payer.wallet.id, 'pay_merchant', `${ref}-EARN`);
          return tx;
        });
        return { ...txShape(entry), undo: undoShape(undoRow) };
      },
    );
    if (gate.held) return;
    await recordDailySend(prisma, payer.id, amountNational);
    await notifyMoneyReceived(business.ownerId, {
      amount,
      currency: 'national',
      senderLabel: payer.name ?? payer.handle,
    });
    res.status(201).json(gate.result);
  } catch (error) {
    if (isMoneyError(error)) {
      res.status(moneyErrorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function rolesAssign(req, res) {
  const requestedRole = req.query.role;
  const allowed = ['personal', 'business_owner', 'seller', 'driver', 'promoter', 'cooperative'];
  if (!allowed.includes(requestedRole)) {
    res.status(400).json({ error: 'Unsupported role' });
    return;
  }
  const role = await ensureRole(req.userId, requestedRole);
  res.status(201).json(role);
}

export async function businessesCreate(req, res) {
  const schema = z.object({ name: z.string().min(2), category: z.string().optional(), arrondissement: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  await ensureRole(req.userId, 'business_owner');
  const owner = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  try {
    await assertCanCreateBusiness(owner);
  } catch (error) {
    if (handleTierError(res, error)) return;
    throw error;
  }

  const business = await prisma.business.create({
    data: {
      ownerId: req.userId,
      ...parsed.data,
      members: { create: { userId: req.userId, role: 'owner' } },
    },
  });
  res.status(201).json(business);
}

export async function businessesPayroll(req, res) {
  const businessId = req.query.id;
  const schema = z.object({
    employeeHandle: z.string().min(3),
    amount: z.number().int().positive(),
    note: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { employeeHandle, amount, note } = parsed.data;
  const business = await prisma.business.findFirst({ where: { id: businessId, ownerId: req.userId } });
  const ownerWallet = await requireWallet(req.userId);
  const employee = await prisma.user.findUnique({ where: { handle: employeeHandle }, include: { wallet: true } });

  if (!business) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }
  if (!employee?.wallet) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }

  try {
    await assertStepUpForAmount(req, amount);
  } catch (error) {
    if (handleStepUpError(res, error)) return;
    throw error;
  }

  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'payroll',
        amountNational: amount,
        recipientHandle: employeeHandle,
        recipientId: employee.id,
        payload: {
          amount,
          senderUserId: req.userId,
          recipientUserId: employee.id,
          senderWalletId: ownerWallet.id,
          recipientWalletId: employee.wallet.id,
          senderLedger: {
            type: 'payroll',
            counterpartyName: employee.name,
            counterpartyHandle: employee.handle,
            note,
          },
          recipientLedger: {
            type: 'payroll',
            counterpartyName: business.name,
            note,
          },
        },
      },
      async (txRef) => {
        const entry = await runMoneyTransaction(prisma, async (db) =>
          transferNational(db, {
            amount,
            senderWalletId: ownerWallet.id,
            recipientWalletId: employee.wallet.id,
            senderUserId: req.userId,
            recipientUserId: employee.id,
            reference: txRef,
            senderLedger: {
              type: 'payroll',
              counterpartyName: employee.name,
              counterpartyHandle: employee.handle,
              note,
            },
            recipientLedger: {
              type: 'payroll',
              counterpartyName: business.name,
              note,
              reference: `${txRef}-E`,
            },
          }),
        );
        return txShape(entry);
      },
    );
    if (gate.held) return;
    res.status(201).json(gate.result);
  } catch (error) {
    if (isMoneyError(error)) {
      res.status(moneyErrorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function sellersProfile(req, res) {
  const schema = z.object({ shopName: z.string().min(2), category: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  await ensureRole(req.userId, 'seller');
  const profile = await prisma.sellerProfile.upsert({
    where: { userId: req.userId },
    update: parsed.data,
    create: { userId: req.userId, ...parsed.data },
  });
  res.status(201).json(profile);
}

export async function products(req, res) {
  if (req.method === 'GET') {
    const items = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
    res.json(items);
    return;
  }

  const schema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    price: z.number().int().positive(),
    category: z.string().optional(),
    inventory: z.number().int().min(0).default(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: req.userId } });
  if (!seller) {
    res.status(403).json({ error: 'Create a seller profile first' });
    return;
  }
  const product = await prisma.product.create({ data: { ...parsed.data, sellerId: seller.id } });
  res.status(201).json(product);
}

export async function driversProfile(req, res) {
  const schema = z.object({ vehicle: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  await ensureRole(req.userId, 'driver');
  const driver = await prisma.driverProfile.upsert({
    where: { userId: req.userId },
    update: { vehicle: parsed.data.vehicle, status: 'available' },
    create: { userId: req.userId, vehicle: parsed.data.vehicle },
  });
  res.status(201).json(driver);
}

export async function deliveriesNearby(req, res) {
  const riderLat = req.query.lat != null ? Number(req.query.lat) : null;
  const riderLng = req.query.lng != null ? Number(req.query.lng) : null;
  const list = await listNearbyDeliveries(prisma, {
    riderLat: Number.isFinite(riderLat) ? riderLat : null,
    riderLng: Number.isFinite(riderLng) ? riderLng : null,
    viewerId: req.userId,
  });
  res.json(list);
}

export async function deliveryDetail(req, res) {
  try {
    const detail = await getDeliveryDetail(prisma, req.query.id, req.userId);
    res.json(detail);
  } catch (error) {
    if (error instanceof DeliveryError) {
      res.status(deliveryErrorStatus(error.code)).json({ error: error.message });
      return;
    }
    throw error;
  }
}

async function handleDeliveryError(res, error) {
  if (error instanceof DeliveryError) {
    res.status(deliveryErrorStatus(error.code)).json({ error: error.message });
    return true;
  }
  if (isMoneyError(error)) {
    res.status(moneyErrorStatus(error)).json({ error: error.message });
    return true;
  }
  return false;
}

export async function deliveriesAccept(req, res) {
  await ensureRole(req.userId, 'driver');
  const ref = reference('DACC');
  try {
    const task = await acceptDelivery(prisma, { taskId: req.query.id, riderId: req.userId, reference: ref });
    const detail = await getDeliveryDetail(prisma, task.id, req.userId);
    res.status(201).json(detail);
  } catch (error) {
    if (await handleDeliveryError(res, error)) return;
    throw error;
  }
}

export async function deliveriesClaim(req, res) {
  return deliveriesAccept(req, res);
}

export async function deliveriesPickup(req, res) {
  try {
    const task = await markPickedUp(prisma, { taskId: req.query.id, riderId: req.userId });
    res.json(task);
  } catch (error) {
    if (await handleDeliveryError(res, error)) return;
    throw error;
  }
}

export async function deliveriesDeliver(req, res) {
  try {
    const task = await markDelivered(prisma, { taskId: req.query.id, riderId: req.userId });
    res.json({
      ...task,
      autoReleaseAt: task.autoReleaseAt?.toISOString(),
      message: 'En attente de confirmation client (libération auto dans 30 min)',
    });
  } catch (error) {
    if (await handleDeliveryError(res, error)) return;
    throw error;
  }
}

export async function deliveriesConfirm(req, res) {
  try {
    const result = await confirmDelivery(prisma, { taskId: req.query.id, buyerId: req.userId });
    res.json({
      task: result.task,
      koriCredited: result.koriCredited,
      wallet: walletShape(result.wallet),
      animation: 'kori_balance_increase',
    });
  } catch (error) {
    if (await handleDeliveryError(res, error)) return;
    throw error;
  }
}

export async function deliveriesDispute(req, res) {
  const note = req.body?.note;
  try {
    const result = await openDispute(prisma, { taskId: req.query.id, buyerId: req.userId, note });
    res.status(201).json({
      task: result.task,
      dispute: {
        id: result.dispute.id,
        status: result.dispute.status,
        holdUntil: result.dispute.holdUntil.toISOString(),
        message: 'Paiement retenu 24h le temps de l’examen',
      },
    });
  } catch (error) {
    if (await handleDeliveryError(res, error)) return;
    throw error;
  }
}

export async function deliveriesDisputeEvidence(req, res) {
  const schema = z.object({
    type: z.enum(['photo_url', 'location', 'note']),
    content: z.string().min(1),
    lat: z.number().optional(),
    lng: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const evidence = await submitDisputeEvidence(prisma, {
      taskId: req.query.id,
      userId: req.userId,
      ...parsed.data,
    });
    res.status(201).json(evidence);
  } catch (error) {
    if (await handleDeliveryError(res, error)) return;
    throw error;
  }
}

export async function deliveriesDisputeResolve(req, res) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && req.headers['x-admin-key'] !== adminKey) {
    res.status(401).json({ error: 'Admin authorization required' });
    return;
  }

  const schema = z.object({
    outcome: z.enum(['rider', 'customer']),
    resolutionNote: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await resolveDispute(prisma, {
      taskId: req.query.id,
      outcome: parsed.data.outcome,
      resolutionNote: parsed.data.resolutionNote,
    });
    res.json(result);
  } catch (error) {
    if (await handleDeliveryError(res, error)) return;
    throw error;
  }
}

export async function deliveriesAutoReleaseCron(req, res) {
  const { cronDeliveriesAutoRelease } = await import('./cron/http-handlers.js');
  return cronDeliveriesAutoRelease(req, res);
}

export async function events(req, res) {
  if (req.method === 'GET') {
    const items = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
    res.json(items);
    return;
  }

  const schema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    venue: z.string().optional(),
    startsAt: z.string().datetime(),
    ticketPrice: z.number().int().min(0),
    capacity: z.number().int().positive().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  await ensureRole(req.userId, 'promoter');
  const event = await prisma.event.create({
    data: { promoterId: req.userId, ...parsed.data, startsAt: new Date(parsed.data.startsAt) },
  });
  res.status(201).json(event);
}

export async function eventsTickets(req, res) {
  const eventId = req.query.id;
  const schema = z.object({ quantity: z.number().int().positive().default(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { quantity } = parsed.data;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { promoter: { include: { wallet: true } } },
  });
  const buyerWallet = await requireWallet(req.userId);

  if (!event?.promoter.wallet) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  const amount = event.ticketPrice * quantity;

  try {
    await assertStepUpForAmount(req, amount);
  } catch (error) {
    if (handleStepUpError(res, error)) return;
    throw error;
  }

  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'ticket_purchase',
        amountNational: amount,
        recipientId: event.promoterId,
        payload: {
          amount,
          buyerId: req.userId,
          eventId: event.id,
          quantity,
          senderUserId: req.userId,
          recipientUserId: event.promoterId,
          senderWalletId: buyerWallet.id,
          recipientWalletId: event.promoter.wallet.id,
          senderLedger: { type: 'ticket_purchase', counterpartyName: event.title },
          recipientLedger: { type: 'ticket_sale', counterpartyName: event.title },
        },
      },
      async (ref) => {
        const ticket = await runMoneyTransaction(prisma, async (db) => {
          await transferNational(db, {
            amount,
            senderWalletId: buyerWallet.id,
            recipientWalletId: event.promoter.wallet.id,
            senderUserId: req.userId,
            recipientUserId: event.promoterId,
            reference: ref,
            senderLedger: { type: 'ticket_purchase', counterpartyName: event.title },
            recipientLedger: {
              type: 'ticket_sale',
              counterpartyName: event.title,
              reference: `${ref}-P`,
            },
          });
          return db.ticket.create({
            data: { eventId: event.id, buyerId: req.userId, quantity, amount },
          });
        });
        return ticket;
      },
    );
    if (gate.held) return;
    res.status(201).json(gate.result);
  } catch (error) {
    if (isMoneyError(error)) {
      res.status(moneyErrorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function mboloThreads(req, res) {
  if (req.method === 'GET') {
    const threads = await prisma.mboloThread.findMany({
      where: { members: { some: { userId: req.userId } } },
      include: { members: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(threads);
    return;
  }

  const schema = z.object({ name: z.string().optional(), memberHandles: z.array(z.string()).default([]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const { name, memberHandles } = parsed.data;
  const members = await prisma.user.findMany({ where: { handle: { in: memberHandles } } });
  const memberIds = Array.from(new Set([req.userId, ...members.map((m) => m.id)]));

  const thread = await prisma.mboloThread.create({
    data: {
      creatorId: req.userId,
      name,
      type: memberIds.length > 2 ? 'group' : 'direct',
      members: { create: memberIds.map((userId) => ({ userId })) },
    },
    include: { members: { include: { user: true } } },
  });
  res.status(201).json(thread);
}

export async function mboloThreadMessages(req, res) {
  const threadId = req.query.id;
  const schema = z.object({ body: z.string().min(1).max(2000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const member = await prisma.mboloMember.findUnique({
    where: { threadId_userId: { threadId, userId: req.userId } },
  });
  if (!member) {
    res.status(403).json({ error: 'Not a member of this MBLOL thread' });
    return;
  }

  const message = await prisma.mboloMessage.create({
    data: { threadId, senderId: req.userId, body: parsed.data.body },
  });
  await prisma.mboloThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  res.status(201).json(message);
}

export async function notificationsList(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
}

export async function notificationsRead(req, res) {
  const notificationId = req.query.id;
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId: req.userId } });
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json(await prisma.notification.update({ where: { id: notification.id }, data: { read: true } }));
}

export async function webhooksJulaya(req, res) {
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  if (!verifyWebhookSignature(req.headers, rawBody)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  const payload = parseWebhookPayload(JSON.parse(rawBody || '{}'));
  if (!payload.reference) {
    res.status(400).json({ error: 'Missing reference' });
    return;
  }

  const rail = await settleRailFromWebhook(prisma, {
    reference: payload.reference,
    status: payload.status ?? 'pending',
    externalId: payload.id,
    failureReason: payload.failure_reason,
  });

  if (!rail) {
    res.status(404).json({ error: 'Rail transaction not found' });
    return;
  }

  res.json({ ok: true, rail: railShape(rail) });
}

export async function smsPreferencesGet(req, res) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    smsAlertsEnabled: user.smsAlertsEnabled,
    smsBalanceQueryEnabled: user.smsBalanceQueryEnabled,
    smsProviderConfigured: smsConfigured(),
    helpText: 'Envoie SOLDE par SMS pour consulter ton solde sans smartphone.',
  });
}

export async function smsPreferencesUpdate(req, res) {
  const schema = z.object({
    smsAlertsEnabled: z.boolean().optional(),
    smsBalanceQueryEnabled: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: parsed.data,
  });

  res.json({
    smsAlertsEnabled: user.smsAlertsEnabled,
    smsBalanceQueryEnabled: user.smsBalanceQueryEnabled,
  });
}

function parseSmsWebhookBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }
}

/** Inbound SMS — balance query (SOLDE) and help. Works on feature phones, no app required. */
export async function webhooksSmsInbound(req, res) {
  if (!verifySmsWebhook(req)) {
    res.status(401).json({ error: 'Invalid webhook secret' });
    return;
  }

  const body = parseSmsWebhookBody(req);
  const from = body.from ?? body.From;
  const text = body.text ?? body.Body ?? body.message;
  const externalId = body.id ?? body.MessageSid ?? body.smsId;

  const { reply } = await handleInboundSms({
    from,
    text,
    externalId,
    provider: smsConfig().provider,
  });

  const cfg = smsConfig();
  if (cfg.provider === 'twilio') {
    const escaped = String(reply ?? 'OK')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    );
    return;
  }

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(reply ?? 'OK');
}
