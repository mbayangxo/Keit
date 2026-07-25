/**
 * One-time migration: consolidate legacy XOF balances into ₭.
 * Run: npm run kori:migrate-primary
 */
import { PrismaClient } from '@prisma/client';
import { nationalToKori } from '../lib/kori.js';
import { applyCirculationIncrease } from '../lib/kori-reserve.js';

const prisma = new PrismaClient();

async function migratePersonalWallets() {
  const wallets = await prisma.wallet.findMany({
    where: { balance: { gt: 0 } },
    include: { user: { select: { country: true } } },
  });

  let migrated = 0;
  for (const wallet of wallets) {
    const extraKori = nationalToKori(wallet.balance, wallet.user?.country ?? 'SN');
    if (extraKori <= 0) {
      await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: 0 } });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          koriBalance: { increment: extraKori },
          balance: 0,
        },
      });
      await tx.koriTransaction.create({
        data: {
          recipientId: wallet.userId,
          amountKori: extraKori,
          transactionType: 'migrate',
          reference: `MIG-${wallet.id}`,
          note: 'Legacy XOF balance consolidated to Kori',
        },
      });
      await applyCirculationIncrease(tx, extraKori);
    });
    migrated += 1;
  }
  return migrated;
}

async function migrateBusinessWallets() {
  const wallets = await prisma.businessWallet.findMany({ where: { balance: { gt: 0 } } });
  let migrated = 0;
  for (const wallet of wallets) {
    const koriBalance = nationalToKori(wallet.balance, 'SN');
    if (koriBalance === wallet.balance) continue;
    await prisma.businessWallet.update({
      where: { id: wallet.id },
      data: { balance: koriBalance, currency: 'KORI' },
    });
    migrated += 1;
  }
  return migrated;
}

async function migrateLedgerAmounts() {
  const entries = await prisma.ledgerEntry.findMany({
    where: { amount: { not: 0 } },
    orderBy: { createdAt: 'asc' },
  });
  let migrated = 0;
  for (const entry of entries) {
    const abs = Math.abs(entry.amount);
    if (abs < 100 || abs % 10 !== 0) continue;
    const koriAmount = Math.trunc(entry.amount / 10);
    if (koriAmount === entry.amount) continue;
    await prisma.ledgerEntry.update({
      where: { id: entry.id },
      data: { amount: koriAmount },
    });
    migrated += 1;
  }
  return migrated;
}

async function main() {
  const personal = await migratePersonalWallets();
  const business = await migrateBusinessWallets();
  const ledger = await migrateLedgerAmounts();
  console.log(`Kori-primary migration complete: ${personal} personal wallets, ${business} business wallets, ${ledger} ledger rows`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
