#!/usr/bin/env node
/** Backfill BusinessWallet for every Business row missing one. */
import { prisma } from '../lib/prisma.js';
import { ensureBusinessWallet } from '../lib/business-wallet-service.js';

const businesses = await prisma.business.findMany({ select: { id: true, name: true, kebuId: true } });
let created = 0;
for (const b of businesses) {
  const before = await prisma.businessWallet.findUnique({ where: { businessId: b.id } });
  if (!before) {
    await ensureBusinessWallet(b.id, prisma);
    created += 1;
    console.log(`wallet created: ${b.name} (${b.kebuId ?? b.id})`);
  }
}
console.log(`Done — ${created} new wallets, ${businesses.length} businesses total`);
await prisma.$disconnect();
