#!/usr/bin/env node
/**
 * One-time: set a login password for an existing user (email account).
 * Usage: node scripts/set-user-password.mjs user@email.com 'MyPassword123'
 * Requires DATABASE_URL (or DIRECT_DATABASE_URL) in the environment.
 */
import { prisma } from '../lib/prisma.js';
import { findUserByEmail, normalizeEmail } from '../lib/auth-otp.js';
import { setUserPassword } from '../lib/password-service.js';

const [rawEmail, rawPassword] = process.argv.slice(2);

if (!rawEmail || !rawPassword) {
  console.error('Usage: node scripts/set-user-password.mjs <email> <password>');
  process.exit(1);
}

const email = normalizeEmail(rawEmail);

async function main() {
  const user = await findUserByEmail(prisma, email);
  if (!user) {
    console.error(`No K21 user found for ${email}`);
    process.exit(1);
  }
  await setUserPassword(user.id, rawPassword);
  console.log(`Password set for ${email} (user ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
