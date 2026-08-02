import { formatKori } from './kori.js';
import { InsufficientFundsError, lockWallets, runMoneyTransaction } from './wallet-atomic.js';

export const PURPOSE_LABELS = {
  general: 'Usage libre',
  food: 'Nourriture',
  grocery: 'Courses',
  school: 'École',
  transport: 'Transport',
  rent: 'Loyer',
  health: 'Santé',
  other: 'Autre',
};

export function merchantVoucherShape(row) {
  return {
    id: row.id,
    businessId: row.businessId,
    balanceKori: row.balanceKori,
    balanceFormatted: formatKori(row.balanceKori),
    business: row.business
      ? {
          id: row.business.id,
          name: row.business.name,
          category: row.business.category,
          arrondissement: row.business.arrondissement,
        }
      : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMerchantVouchers(db, userId) {
  const rows = await db.merchantVoucher.findMany({
    where: { userId, balanceKori: { gt: 0 } },
    include: { business: { select: { id: true, name: true, category: true, arrondissement: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(merchantVoucherShape);
}

export async function getMerchantVoucherBalance(db, userId, businessId) {
  const row = await db.merchantVoucher.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  return row?.balanceKori ?? 0;
}

export async function creditMerchantVoucher(
  db,
  { userId, businessId, amountKori, reference, counterpartyName, purposeNote },
) {
  if (amountKori <= 0) throw new Error('Invalid voucher amount');

  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true, name: true } });
  if (!business) throw new Error('Marchand introuvable');

  const existing = await db.merchantVoucher.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  if (existing) {
    await db.$executeRaw`SELECT id FROM "MerchantVoucher" WHERE id = ${existing.id} FOR UPDATE`;
  }

  const voucher = await db.merchantVoucher.upsert({
    where: { userId_businessId: { userId, businessId } },
    create: { userId, businessId, balanceKori: amountKori },
    update: { balanceKori: { increment: amountKori } },
    include: { business: { select: { id: true, name: true, category: true, arrondissement: true } } },
  });

  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (wallet) {
    const prior = await db.ledgerEntry.findUnique({ where: { reference } });
    if (!prior) {
      await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'voucher_receive',
          amount: amountKori,
          counterpartyName: counterpartyName ?? business.name,
          note: purposeNote ?? `Bon verrouillé · ${business.name}`,
          reference,
        },
      });
    }
  }

  return merchantVoucherShape(voucher);
}

export async function spendMerchantVoucher(db, params) {
  const {
    userId,
    businessId,
    amountKori,
    merchantUserId,
    merchantWalletId,
    merchantName,
    payerName,
    reference,
  } = params;

  return runMoneyTransaction(db, async (tx) => {
    const voucher = await tx.merchantVoucher.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    if (!voucher) throw new InsufficientFundsError('Bon marchand insuffisant');

    await tx.$executeRaw`SELECT id FROM "MerchantVoucher" WHERE id = ${voucher.id} FOR UPDATE`;
    const lockedVoucher = await tx.merchantVoucher.findUniqueOrThrow({ where: { id: voucher.id } });
    if (lockedVoucher.balanceKori < amountKori) {
      throw new InsufficientFundsError('Bon marchand insuffisant');
    }

    await lockWallets(tx, [merchantWalletId]);
    await tx.merchantVoucher.update({
      where: { id: voucher.id },
      data: { balanceKori: { decrement: amountKori } },
    });
    await tx.wallet.update({
      where: { id: merchantWalletId },
      data: { koriBalance: { increment: amountKori } },
    });

    await tx.koriTransaction.create({
      data: {
        senderId: userId,
        recipientId: merchantUserId,
        amountKori,
        transactionType: 'voucher_spend',
        reference,
        note: merchantName,
      },
    });

    const payerWallet = await tx.wallet.findUnique({ where: { userId } });
    if (payerWallet) {
      await tx.ledgerEntry.create({
        data: {
          walletId: payerWallet.id,
          userId,
          type: 'voucher_spend',
          amount: -amountKori,
          counterpartyName: merchantName,
          note: `Bon · ${merchantName}`,
          reference,
        },
      });
    }

    await tx.ledgerEntry.create({
      data: {
        walletId: merchantWalletId,
        userId: merchantUserId,
        type: 'marketplace_sale',
        amount: amountKori,
        counterpartyName: payerName ?? null,
        note: `${merchantName} · bon verrouillé`,
        reference: `${reference}-M`,
      },
    });

    return { amountKori, merchantName, reference };
  });
}
