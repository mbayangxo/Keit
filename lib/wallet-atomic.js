/**
 * Atomic wallet operations — every balance change uses:
 * 1. BEGIN (via prisma.$transaction)
 * 2. SELECT … FOR UPDATE on affected wallet rows (consistent lock order)
 * 3. Balance check on locked rows
 * 4. Debit + credit + ledger in the same transaction
 * 5. COMMIT or full ROLLBACK on any failure
 */

export class InsufficientFundsError extends Error {
  constructor(message = 'Insufficient balance') {
    super(message);
    this.name = 'InsufficientFundsError';
    this.code = 'insufficient';
  }
}

export class WalletNotFoundError extends Error {
  constructor(message = 'Wallet not found') {
    super(message);
    this.name = 'WalletNotFoundError';
    this.code = 'wallet_missing';
  }
}

/** Lock wallet rows in sorted id order to prevent deadlocks. */
export async function lockWallets(tx, walletIds) {
  const unique = [...new Set(walletIds.filter(Boolean))].sort();
  for (const id of unique) {
    await tx.$executeRaw`SELECT id FROM "Wallet" WHERE id = ${id} FOR UPDATE`;
  }
}

/**
 * Transfer ₭ between two wallets atomically with ledger rows.
 * Amount is always in Kori units.
 */
export async function transferNational(tx, params) {
  const {
    amount,
    senderWalletId,
    recipientWalletId,
    senderUserId,
    recipientUserId,
    reference,
    senderLedger,
    recipientLedger,
  } = params;

  await lockWallets(tx, [senderWalletId, recipientWalletId]);

  const sender = await tx.wallet.findUnique({ where: { id: senderWalletId } });
  if (!sender) throw new WalletNotFoundError();
  if (sender.koriBalance < amount) throw new InsufficientFundsError();

  await tx.wallet.update({
    where: { id: senderWalletId },
    data: { koriBalance: { decrement: amount } },
  });
  await tx.wallet.update({
    where: { id: recipientWalletId },
    data: { koriBalance: { increment: amount } },
  });

  const outgoing = await tx.ledgerEntry.create({
    data: {
      walletId: senderWalletId,
      userId: senderUserId,
      type: senderLedger.type,
      amount: -amount,
      counterpartyName: senderLedger.counterpartyName ?? null,
      counterpartyHandle: senderLedger.counterpartyHandle ?? null,
      note: senderLedger.note ?? null,
      reference,
    },
  });

  await tx.ledgerEntry.create({
    data: {
      walletId: recipientWalletId,
      userId: recipientUserId,
      type: recipientLedger.type,
      amount,
      counterpartyName: recipientLedger.counterpartyName ?? null,
      counterpartyHandle: recipientLedger.counterpartyHandle ?? null,
      note: recipientLedger.note ?? null,
      reference: recipientLedger.reference ?? `${reference}-R`,
    },
  });

  return outgoing;
}

/**
 * Transfer Kori between two wallets atomically.
 */
export async function transferKori(tx, params) {
  const {
    amountKori,
    senderWalletId,
    recipientWalletId,
    senderId,
    recipientId,
    reference,
    note,
    transactionType = 'send',
  } = params;

  await lockWallets(tx, [senderWalletId, recipientWalletId]);

  const sender = await tx.wallet.findUnique({ where: { id: senderWalletId } });
  if (!sender) throw new WalletNotFoundError();
  if (sender.koriBalance < amountKori) throw new InsufficientFundsError('Insufficient Kori balance');

  await tx.wallet.update({
    where: { id: senderWalletId },
    data: { koriBalance: { decrement: amountKori } },
  });
  await tx.wallet.update({
    where: { id: recipientWalletId },
    data: { koriBalance: { increment: amountKori } },
  });

  await tx.koriTransaction.create({
    data: {
      senderId,
      recipientId,
      amountKori,
      transactionType,
      reference,
      note: note ?? null,
    },
  });
}

/**
 * Debit ₭ with ledger row — single wallet, locked.
 */
export async function debitNational(tx, params) {
  const { walletId, userId, amount, reference, ledger } = params;

  await lockWallets(tx, [walletId]);

  const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) throw new WalletNotFoundError();
  if (wallet.koriBalance < amount) throw new InsufficientFundsError();

  await tx.wallet.update({
    where: { id: walletId },
    data: { koriBalance: { decrement: amount } },
  });

  return tx.ledgerEntry.create({
    data: {
      walletId,
      userId,
      type: ledger.type,
      amount: -amount,
      counterpartyName: ledger.counterpartyName ?? null,
      counterpartyHandle: ledger.counterpartyHandle ?? null,
      note: ledger.note ?? null,
      reference,
    },
  });
}

/**
 * Credit ₭ with ledger row — single wallet, locked.
 * Idempotent when `reference` already exists (returns existing entry).
 */
export async function creditNational(tx, params) {
  const existing = await tx.ledgerEntry.findUnique({ where: { reference: params.reference } });
  if (existing) return existing;

  const { walletId, userId, amount, reference, ledger } = params;

  await lockWallets(tx, [walletId]);

  await tx.wallet.update({
    where: { id: walletId },
    data: { koriBalance: { increment: amount } },
  });

  return tx.ledgerEntry.create({
    data: {
      walletId,
      userId,
      type: ledger.type,
      amount,
      counterpartyName: ledger.counterpartyName ?? null,
      counterpartyHandle: ledger.counterpartyHandle ?? null,
      note: ledger.note ?? null,
      reference,
    },
  });
}

/**
 * Run a money-moving callback inside a database transaction.
 */
export async function runMoneyTransaction(db, fn) {
  return db.$transaction(fn, { maxWait: 5000, timeout: 15000 });
}

export function isMoneyError(error) {
  return error instanceof InsufficientFundsError || error instanceof WalletNotFoundError;
}

export function moneyErrorStatus(error) {
  if (error instanceof InsufficientFundsError) return 400;
  if (error instanceof WalletNotFoundError) return 400;
  return 500;
}
