import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

const BCRYPT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 8;

export class PasswordError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'PasswordError';
  }
}

export function passwordErrorStatus(code) {
  switch (code) {
    case 'invalid_credentials':
      return 401;
    case 'password_not_set':
      return 401;
    case 'invalid_format':
      return 400;
    default:
      return 400;
  }
}

export function validatePasswordFormat(password) {
  if (String(password ?? '').length < MIN_PASSWORD_LENGTH) {
    throw new PasswordError('invalid_format', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

export async function hashPassword(password) {
  validatePasswordFormat(password);
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function setUserPassword(userId, password) {
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
