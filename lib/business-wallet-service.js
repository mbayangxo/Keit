/**
 * Atomic KEBU (business) wallet operations — same rules as lib/wallet-atomic.js.
 */
import { prisma } from './prisma.js';
import { InsufficientFundsError, WalletNotFoundError, runMoneyTransaction, isMoneyError, moneyErrorStatus } from './wallet-atomic.js';

export { InsufficientFundsError, WalletNotFoundError, runMoneyTransaction, isMoneyError, moneyErrorStatus };

export async function lockBusinessWallets(tx, walletIds) {
  const unique = [...new Set(walletIds.filter(Boolean))].sort();
  for (const id of unique) {
    await tx.$executeRaw`SELECT id FROM "BusinessWallet" WHERE id = ${id} FOR UPDATE`;
  }
}

export async function lockMixedWallets(tx, { userWalletIds = [], businessWalletIds = [] }) {
  const userIds = [...new Set(userWalletIds.filter(Boolean))].sort();
  const bizIds = [...new Set(businessWalletIds.filter(Boolean))].sort();
  for (const id of userIds) {
    await tx.$executeRaw`SELECT id FROM "Wallet" WHERE id = ${id} FOR UPDATE`;
  }
  for (const id of bizIds) {
    await tx.$executeRaw`SELECT id FROM "BusinessWallet" WHERE id = ${id} FOR UPDATE`;
  }
}

export async function ensureBusinessWallet(businessId, db) {
  const existing = await db.businessWallet.findUnique({ where: { businessId } });
  if (existing) return existing;
  return db.businessWallet.create({
    data: { businessId, balance: 0, currency: 'KORI' },
  });
}

async function debitBusinessWallet(tx, { businessWalletId, businessId, amount, reference, ledger }) {
  await lockBusinessWallets(tx, [businessWalletId]);
  const wallet = await tx.businessWallet.findUnique({ where: { id: businessWalletId } });
  if (!wallet) throw new WalletNotFoundError('Business wallet not found');
  if (wallet.balance < amount) throw new InsufficientFundsError('Insufficient KEBU balance');

  await tx.businessWallet.update({
    where: { id: businessWalletId },
    data: { balance: { decrement: amount } },
  });

  return tx.businessLedgerEntry.create({
    data: {
      businessWalletId,
      businessId,
      type: ledger.type,
      amount: -amount,
      counterpartyBusinessId: ledger.counterpartyBusinessId ?? null,
      counterpartyUserId: ledger.counterpartyUserId ?? null,
      counterpartyName: ledger.counterpartyName ?? null,
      counterpartyKebuId: ledger.counterpartyKebuId ?? null,
      note: ledger.note ?? null,
      reference,
    },
  });
}

async function creditBusinessWallet(tx, { businessWalletId, businessId, amount, reference, ledger }) {
  const existing = await tx.businessLedgerEntry.findUnique({ where: { reference } });
  if (existing) return existing;

  await lockBusinessWallets(tx, [businessWalletId]);

  await tx.businessWallet.update({
    where: { id: businessWalletId },
    data: { balance: { increment: amount } },
  });

  return tx.businessLedgerEntry.create({
    data: {
      businessWalletId,
      businessId,
      type: ledger.type,
      amount,
      counterpartyBusinessId: ledger.counterpartyBusinessId ?? null,
      counterpartyUserId: ledger.counterpartyUserId ?? null,
      counterpartyName: ledger.counterpartyName ?? null,
      counterpartyKebuId: ledger.counterpartyKebuId ?? null,
      note: ledger.note ?? null,
      reference,
    },
  });
}

/** Owner capital: personal AFRI wallet → KEBU wallet. */
export async function transferPersonalToBusiness(tx, params) {
  const {
    amount,
    userWalletId,
    userId,
    businessWalletId,
    businessId,
    reference,
    businessName,
    note,
  } = params;

  await lockMixedWallets(tx, {
    userWalletIds: [userWalletId],
    businessWalletIds: [businessWalletId],
  });

  const userWallet = await tx.wallet.findUnique({ where: { id: userWalletId } });
  if (!userWallet) throw new WalletNotFoundError();
  if (userWallet.koriBalance < amount) throw new InsufficientFundsError();

  await tx.wallet.update({
    where: { id: userWalletId },
    data: { koriBalance: { decrement: amount } },
  });
  await tx.businessWallet.update({
    where: { id: businessWalletId },
    data: { balance: { increment: amount } },
  });

  await tx.ledgerEntry.create({
    data: {
      walletId: userWalletId,
      userId,
      type: 'kebu_capital_in',
      amount: -amount,
      counterpartyName: businessName ?? 'KEBU',
      note: note ?? null,
      reference,
    },
  });

  return tx.businessLedgerEntry.create({
    data: {
      businessWalletId,
      businessId,
      type: 'capital_in',
      amount,
      counterpartyUserId: userId,
      counterpartyName: businessName ?? null,
      note: note ?? null,
      reference: `${reference}-B`,
    },
  });
}

/** Owner draw: KEBU wallet → personal AFRI wallet. */
export async function transferBusinessToPersonal(tx, params) {
  const {
    amount,
    businessWalletId,
    businessId,
    userWalletId,
    userId,
    reference,
    businessName,
    note,
  } = params;

  await lockMixedWallets(tx, {
    userWalletIds: [userWalletId],
    businessWalletIds: [businessWalletId],
  });

  const bizWallet = await tx.businessWallet.findUnique({ where: { id: businessWalletId } });
  if (!bizWallet) throw new WalletNotFoundError('Business wallet not found');
  if (bizWallet.balance < amount) throw new InsufficientFundsError('Insufficient KEBU balance');

  await tx.businessWallet.update({
    where: { id: businessWalletId },
    data: { balance: { decrement: amount } },
  });
  await tx.wallet.update({
    where: { id: userWalletId },
    data: { koriBalance: { increment: amount } },
  });

  const bizEntry = await tx.businessLedgerEntry.create({
    data: {
      businessWalletId,
      businessId,
      type: 'owner_draw',
      amount: -amount,
      counterpartyUserId: userId,
      note: note ?? null,
      reference,
    },
  });

  await tx.ledgerEntry.create({
    data: {
      walletId: userWalletId,
      userId,
      type: 'kebu_owner_draw',
      amount,
      counterpartyName: businessName ?? 'KEBU',
      note: note ?? null,
      reference: `${reference}-P`,
    },
  });

  return bizEntry;
}

/** B2B: one KEBU wallet → another KEBU wallet. */
export async function transferBusinessToBusiness(tx, params) {
  const {
    amount,
    senderWalletId,
    senderBusinessId,
    recipientWalletId,
    recipientBusinessId,
    reference,
    senderLedger,
    recipientLedger,
  } = params;

  await lockBusinessWallets(tx, [senderWalletId, recipientWalletId]);

  const sender = await tx.businessWallet.findUnique({ where: { id: senderWalletId } });
  if (!sender) throw new WalletNotFoundError('Sender business wallet not found');
  if (sender.balance < amount) throw new InsufficientFundsError('Insufficient KEBU balance');

  await tx.businessWallet.update({
    where: { id: senderWalletId },
    data: { balance: { decrement: amount } },
  });
  await tx.businessWallet.update({
    where: { id: recipientWalletId },
    data: { balance: { increment: amount } },
  });

  const outgoing = await tx.businessLedgerEntry.create({
    data: {
      businessWalletId: senderWalletId,
      businessId: senderBusinessId,
      type: senderLedger.type ?? 'b2b_out',
      amount: -amount,
      counterpartyBusinessId: recipientBusinessId,
      counterpartyName: senderLedger.counterpartyName ?? null,
      counterpartyKebuId: senderLedger.counterpartyKebuId ?? null,
      note: senderLedger.note ?? null,
      reference,
    },
  });

  await tx.businessLedgerEntry.create({
    data: {
      businessWalletId: recipientWalletId,
      businessId: recipientBusinessId,
      type: recipientLedger.type ?? 'b2b_in',
      amount,
      counterpartyBusinessId: senderBusinessId,
      counterpartyName: recipientLedger.counterpartyName ?? null,
      counterpartyKebuId: recipientLedger.counterpartyKebuId ?? null,
      note: recipientLedger.note ?? null,
      reference: `${reference}-IN`,
    },
  });

  return outgoing;
}

/** Payroll / farmer payout: KEBU wallet → employee personal wallet. */
export async function transferBusinessToPersonalPayroll(tx, params) {
  const {
    amount,
    businessWalletId,
    businessId,
    userWalletId,
    userId,
    reference,
    businessName,
    employeeName,
    employeeHandle,
    note,
  } = params;

  await lockMixedWallets(tx, {
    userWalletIds: [userWalletId],
    businessWalletIds: [businessWalletId],
  });

  const bizWallet = await tx.businessWallet.findUnique({ where: { id: businessWalletId } });
  if (!bizWallet) throw new WalletNotFoundError('Business wallet not found');
  if (bizWallet.balance < amount) throw new InsufficientFundsError('Insufficient KEBU balance');

  await tx.businessWallet.update({
    where: { id: businessWalletId },
    data: { balance: { decrement: amount } },
  });
  await tx.wallet.update({
    where: { id: userWalletId },
    data: { koriBalance: { increment: amount } },
  });

  const bizEntry = await tx.businessLedgerEntry.create({
    data: {
      businessWalletId,
      businessId,
      type: 'payroll_out',
      amount: -amount,
      counterpartyUserId: userId,
      counterpartyName: employeeName ?? null,
      note: note ?? null,
      reference,
    },
  });

  await tx.ledgerEntry.create({
    data: {
      walletId: userWalletId,
      userId,
      type: 'payroll',
      amount,
      counterpartyName: businessName ?? 'KEBU',
      counterpartyHandle: employeeHandle ?? null,
      note: note ?? null,
      reference: `${reference}-E`,
    },
  });

  return bizEntry;
}

export function businessLedgerShape(entry) {
  return {
    id: entry.id,
    type: entry.type,
    amount: entry.amount,
    counterpartyName: entry.counterpartyName ?? null,
    counterpartyKebuId: entry.counterpartyKebuId ?? null,
    note: entry.note ?? null,
    reference: entry.reference,
    createdAt: entry.createdAt.toISOString(),
  };
}

export function businessWalletShape(wallet, business) {
  return {
    businessId: wallet.businessId,
    balance: wallet.balance,
    koriBalance: wallet.balance,
    currency: 'KORI',
    unit: 'C',
    kebuId: business?.kebuId ?? null,
    businessName: business?.name ?? null,
    businessType: business?.type ?? null,
  };
}

function kebuCreditTier({ payrollVolume90, b2bVolume90, balance, verified }) {
  const volume = payrollVolume90 + b2bVolume90;
  if (verified && volume >= 500_000 && balance >= 50_000) return 'established';
  if (volume >= 50_000 || balance >= 10_000) return 'building';
  return 'starter';
}

export async function getBusinessCreditSummary(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { wallet: true, owner: { select: { id: true, name: true, afriId: true } } },
  });
  if (!business) throw new Error('Business not found');

  const wallet = business.wallet ?? (await ensureBusinessWallet(businessId, prisma));
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const recentLedger = await prisma.businessLedgerEntry.findMany({
    where: { businessId, createdAt: { gte: since90 } },
    orderBy: { createdAt: 'desc' },
  });

  const payrollOut90 = recentLedger
    .filter((e) => e.type === 'payroll_out')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const b2bOut90 = recentLedger
    .filter((e) => e.type === 'b2b_out')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const b2bIn90 = recentLedger
    .filter((e) => e.type === 'b2b_in')
    .reduce((sum, e) => sum + e.amount, 0);

  const payrollRuns = await prisma.payrollRun.count({
    where: { businessId, status: 'completed', createdAt: { gte: since90 } },
  });

  const allTime = await prisma.businessLedgerEntry.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return {
    business: {
      id: business.id,
      name: business.name,
      type: business.type,
      kebuId: business.kebuId,
      verified: business.verified,
      ownerAfriId: business.owner?.afriId ?? null,
    },
    wallet: businessWalletShape(wallet, business),
    period90Days: {
      payrollOutKori: payrollOut90,
      b2bOutKori: b2bOut90,
      b2bInKori: b2bIn90,
      payrollOutNational: payrollOut90 * 10,
      b2bOutNational: b2bOut90 * 10,
      b2bInNational: b2bIn90 * 10,
      payrollRuns,
      transactionCount: recentLedger.length,
    },
    lifetime: {
      creditTier: kebuCreditTier({
        payrollVolume90: payrollOut90,
        b2bVolume90: b2bOut90 + b2bIn90,
        balance: wallet.balance,
        verified: business.verified,
      }),
    },
    ledger: allTime.map(businessLedgerShape),
    loanNote:
      'Document généré par K21 — historique KEBU vérifiable pour financement commercial. Contact support@k21.app pour vérifier une référence.',
  };
}
