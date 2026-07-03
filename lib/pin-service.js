import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
import { cniMatchesHash } from './cni-hash.js';
import { decryptAtRest, encryptAtRest, secretsEqual } from './field-crypto.js';
import { markStepUpVerified } from './session-security.js';

const BCRYPT_ROUNDS = 12;
const MAX_PIN_ATTEMPTS = 5;
const MIN_PIN_LENGTH = 6;

export class PinError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'PinError';
  }
}

export function pinErrorStatus(code) {
  switch (code) {
    case 'locked':
      return 423;
    case 'invalid_pin':
      return 401;
    case 'pin_not_set':
      return 400;
    case 'invalid_cni':
      return 401;
    default:
      return 400;
  }
}

function validatePinFormat(pin) {
  if (!/^\d{6,}$/.test(pin)) {
    throw new PinError('invalid_format', 'PIN must be at least 6 digits');
  }
}

export async function setUserPin(userId, pin) {
  validatePinFormat(pin);
  const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { pinHash, pinFailedAttempts: 0, accountLockedAt: null, accountLockReason: null },
  });
}

export async function storeCniNumber(userId, cniNumber) {
  const normalized = cniNumber.replace(/\s/g, '').toUpperCase();
  if (normalized.length < 6) {
    throw new PinError('invalid_cni', 'Invalid CNI number');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { cniNumberEnc: encryptAtRest(normalized) },
  });
}

async function lockAccount(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountLockedAt: new Date(),
      accountLockReason: 'pin',
      pinFailedAttempts: MAX_PIN_ATTEMPTS,
    },
  });
}

export async function verifyUserPin(userId, pin, { grantStepUp = false } = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new PinError('not_found', 'User not found');
  if (user.accountLockedAt) {
    throw new PinError('locked', 'Account locked — CNI verification required');
  }
  if (!user.pinHash) {
    throw new PinError('pin_not_set', 'PIN not configured');
  }

  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) {
    const attempts = user.pinFailedAttempts + 1;
    if (attempts >= MAX_PIN_ATTEMPTS) {
      await lockAccount(userId);
      throw new PinError('locked', 'Too many wrong PIN attempts — account locked');
    }
    await prisma.user.update({
      where: { id: userId },
      data: { pinFailedAttempts: attempts },
    });
    throw new PinError('invalid_pin', `Wrong PIN (${MAX_PIN_ATTEMPTS - attempts} attempts left)`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { pinFailedAttempts: 0 },
  });

  let stepUpToken = null;
  if (grantStepUp) {
    stepUpToken = await markStepUpVerified(userId);
  }

  return { verified: true, stepUpToken };
}

export async function unlockAccountWithCni(userId, cniNumber) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.cniHash && !user?.cniNumberEnc) {
    throw new PinError('invalid_cni', 'CNI not on file — contact K21 support');
  }
  if (!user.accountLockedAt) {
    return { unlocked: true, alreadyUnlocked: true };
  }

  const provided = cniNumber.replace(/\s/g, '').toUpperCase();
  const matches = user.cniHash
    ? cniMatchesHash(provided, user.cniHash)
    : secretsEqual(decryptAtRest(user.cniNumberEnc), provided);

  if (!matches) {
    throw new PinError('invalid_cni', 'CNI does not match our records');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      accountLockedAt: null,
      accountLockReason: null,
      pinFailedAttempts: 0,
    },
  });

  return { unlocked: true };
}

export async function setBiometricEnabled(userId, enabled) {
  await prisma.user.update({
    where: { id: userId },
    data: { biometricEnabled: enabled },
  });
}
