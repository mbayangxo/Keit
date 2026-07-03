import { prisma } from './prisma.js';
import { createHeldTransaction } from './held-transaction-service.js';
import { reference } from '../api/_lib/auth.js';

/**
 * Detect Kori mints without a matching national deposit ledger entry.
 * Creates admin fraud alerts (does not auto-hold historical rows).
 */
export async function auditUnbackedKoriMints(db = prisma) {
  const mints = await db.koriTransaction.findMany({
    where: { transactionType: 'mint', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    take: 100,
  });

  const findings = [];
  for (const mint of mints) {
    const baseRef = mint.reference.replace(/-KORI$/, '');
    const deposit = await db.ledgerEntry.findFirst({
      where: {
        reference: baseRef,
        amount: { gt: 0 },
      },
    });
    const rail = await db.railTransaction.findFirst({
      where: { reference: baseRef, status: 'completed' },
    });

    if (!deposit && !rail) {
      findings.push(mint);
      await db.fraudAlert.create({
        data: {
          userId: mint.recipientId ?? 'unknown',
          code: 'kori_unbacked_increase',
          message: `Kori mint ${mint.reference} without verified national deposit`,
          severity: 'critical',
        },
      });
    }
  }
  return { scanned: mints.length, unbacked: findings.length, findings };
}

export async function holdKoriMintIfUnbacked(db, { userId, nationalAmount, reference, hasProof }) {
  if (hasProof) return { held: false };
  const held = await createHeldTransaction(db, {
    userId,
    operationType: 'kori_mint',
    amountNational: nationalAmount,
    payload: { userId, nationalAmount, reference, operationType: 'kori_mint' },
    flags: ['kori_unbacked_increase'],
    reasons: ['Kori increase without verified national deposit'],
    ref: reference('KMINT'),
  });
  return { held: true, held };
}
