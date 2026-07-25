import { initiateCashIn, initiateCashOut, julayaMode } from './julaya.js';
import { RAIL_PROCESSING_MESSAGE } from './external-fetch.js';
import { mintKoriFromNationalDeposit, burnKoriForCashOut } from './kori-service.js';
import { nationalToKori } from './kori.js';
import { formatKori } from './kori-primary.js';
import {
  claimIdempotencyKey,
  findIdempotentResponse,
  generateIdempotencyKey,
  saveIdempotentResponse,
} from './idempotency.js';
import { runMoneyTransaction } from './wallet-atomic.js';

export async function completeCashIn(db, params) {
  const mint = await mintKoriFromNationalDeposit(db, {
    userId: params.userId,
    walletId: params.walletId,
    country: params.country,
    nationalAmount: params.amount,
    reference: params.reference,
    note: params.sourceNote,
  });

  const ledger = await db.ledgerEntry.create({
    data: {
      walletId: params.walletId,
      userId: params.userId,
      type: 'cash_in',
      amount: mint.koriMinted,
      note: `+${formatKori(mint.koriMinted)}`,
      reference: params.reference,
    },
  });

  return { mint, ledger };
}

export function railShape(rail, wallet, extra = {}) {
  return {
    id: rail.id,
    provider: rail.provider,
    direction: rail.direction,
    amount: rail.amount,
    operator: rail.operator,
    phone: rail.phone,
    status: rail.status,
    externalId: rail.externalId,
    reference: rail.reference,
    idempotencyKey: rail.idempotencyKey,
    walletDebited: rail.walletDebited,
    failureReason: rail.failureReason,
    mode: julayaMode(),
    completedAt: rail.completedAt?.toISOString() ?? null,
    createdAt: rail.createdAt.toISOString(),
    wallet: wallet
      ? { balance: wallet.balance, koriBalance: wallet.koriBalance, currency: wallet.currency }
      : undefined,
    ...extra,
  };
}

function buildRailResponse({ rail, wallet, mint, ledger, userMessage, cached }) {
  return {
    rail,
    wallet: wallet ?? null,
    mint: mint ?? null,
    ledger: ledger ?? null,
    userMessage: userMessage ?? null,
    cached: Boolean(cached),
  };
}

async function settleCashOutDebit(db, rail, params) {
  return runMoneyTransaction(db, async (tx) => {
    let ledger = null;
    if (!rail.walletDebited) {
      const koriAmount = nationalToKori(params.amount, params.country ?? 'SN');
      const burned = await burnKoriForCashOut(tx, {
        userId: params.userId,
        walletId: params.wallet.id,
        koriAmount,
        country: params.country ?? 'SN',
        reference: params.reference,
        note: params.operator ? `Retrait via ${params.operator}` : 'Retrait K21',
      });
      ledger = burned.ledger;
    }

    const updatedRail = await tx.railTransaction.update({
      where: { id: rail.id },
      data: {
        status: 'completed',
        walletDebited: true,
        completedAt: new Date(),
        externalId: rail.externalId,
      },
    });

    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: params.wallet.id } });
    return { rail: updatedRail, wallet };
  });
}

async function executeRailOperation(db, params, direction, initiateFn) {
  const idempotencyKey =
    params.idempotencyKey ?? generateIdempotencyKey(params.userId, params.amount, params.reference);

  const cached = await findIdempotentResponse(db, idempotencyKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const claim = await claimIdempotencyKey(db, {
    key: idempotencyKey,
    provider: 'julaya',
    userId: params.userId,
    operation: direction === 'in' ? 'cash_in' : 'cash_out',
    reference: params.reference,
  });

  if (claim.duplicate) {
    if (claim.cached) return { ...claim.cached, cached: true };
    const wallet = await db.wallet.findUniqueOrThrow({ where: { id: params.wallet.id } });
    const pendingRail = claim.row?.reference
      ? await db.railTransaction.findUnique({ where: { reference: claim.row.reference } })
      : null;
    return buildRailResponse({
      rail: pendingRail ?? { status: 'pending', reference: params.reference },
      wallet,
      userMessage: RAIL_PROCESSING_MESSAGE,
      cached: true,
    });
  }

  let rail = await db.railTransaction.create({
    data: {
      userId: params.userId,
      provider: 'julaya',
      direction,
      amount: params.amount,
      operator: params.operator,
      phone: params.phone,
      status: 'pending',
      reference: params.reference,
      idempotencyKey,
    },
  });

  const partner = await initiateFn({
    reference: params.reference,
    amount: params.amount,
    phone: params.phone,
    operator: params.operator,
    callbackUrl: params.callbackUrl,
    idempotencyKey,
  });

  rail = await db.railTransaction.update({
    where: { id: rail.id },
    data: {
      status: partner.status === 'processing' ? 'pending' : partner.status,
      externalId: partner.externalId,
      failureReason: partner.status === 'failed' ? partner.message : null,
    },
  });

  if (partner.status === 'completed') {
    if (direction === 'in') {
      const settled = await runMoneyTransaction(db, async (tx) => {
        const { mint, ledger } = await completeCashIn(tx, {
          userId: params.userId,
          walletId: params.wallet.id,
          country: params.country,
          amount: params.amount,
          reference: params.reference,
          sourceNote: `Deposit via Julaya (${params.operator})`,
        });
        const updatedRail = await tx.railTransaction.update({
          where: { id: rail.id },
          data: { status: 'completed', completedAt: new Date(), externalId: partner.externalId },
        });
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: params.wallet.id } });
        return buildRailResponse({ rail: updatedRail, wallet, mint, ledger });
      });
      await saveIdempotentResponse(db, idempotencyKey, settled);
      return settled;
    }

    const settled = await settleCashOutDebit(db, { ...rail, externalId: partner.externalId }, params);
    const response = buildRailResponse({
      rail: settled.rail,
      wallet: settled.wallet,
    });
    await saveIdempotentResponse(db, idempotencyKey, response);
    return response;
  }

  if (partner.status === 'failed') {
    const wallet = await db.wallet.findUniqueOrThrow({ where: { id: params.wallet.id } });
    const response = buildRailResponse({ rail, wallet });
    await saveIdempotentResponse(db, idempotencyKey, response);
    return response;
  }

  // pending / ambiguous — never debit on cash-out, never credit on cash-in
  const wallet = await db.wallet.findUniqueOrThrow({ where: { id: params.wallet.id } });
  const response = buildRailResponse({
    rail,
    wallet,
    userMessage: RAIL_PROCESSING_MESSAGE,
  });
  await saveIdempotentResponse(db, idempotencyKey, response);
  return response;
}

export async function startCashIn(db, params) {
  return executeRailOperation(db, params, 'in', initiateCashIn);
}

export async function startCashOut(db, params) {
  return executeRailOperation(db, params, 'out', initiateCashOut);
}

export async function settleRailFromWebhook(db, params) {
  const rail = await db.railTransaction.findUnique({ where: { reference: params.reference } });
  if (!rail || rail.status === 'completed' || rail.status === 'failed') return rail;

  const user = await db.user.findUniqueOrThrow({
    where: { id: rail.userId },
    include: { wallet: true },
  });
  if (!user.wallet) throw new RailError('wallet_missing', 'Wallet not found');

  const normalized = params.status.toLowerCase();
  const failed = ['failed', 'error', 'rejected', 'cancelled'].includes(normalized);
  const completed = ['completed', 'success', 'succeeded', 'paid'].includes(normalized);

  if (failed) {
    return runMoneyTransaction(db, async (tx) => {
      if (rail.direction === 'out' && rail.walletDebited) {
        const koriRefund = nationalToKori(rail.amount, user.country ?? 'SN');
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { koriBalance: { increment: koriRefund } },
        });
      }
      return tx.railTransaction.update({
        where: { id: rail.id },
        data: {
          status: 'failed',
          externalId: params.externalId ?? rail.externalId,
          failureReason: params.failureReason ?? 'Partner reported failure',
        },
      });
    });
  }

  if (!completed) {
    return db.railTransaction.update({
      where: { id: rail.id },
      data: {
        status: 'pending',
        externalId: params.externalId ?? rail.externalId,
      },
    });
  }

  return runMoneyTransaction(db, async (tx) => {
    if (rail.direction === 'in') {
      await completeCashIn(tx, {
        userId: user.id,
        walletId: user.wallet.id,
        country: user.country,
        amount: rail.amount,
        reference: rail.reference,
        sourceNote: `Deposit via Julaya (${rail.operator ?? 'mobile money'})`,
      });
    } else if (!rail.walletDebited) {
      const koriAmount = nationalToKori(rail.amount, user.country ?? 'SN');
      await burnKoriForCashOut(tx, {
        userId: user.id,
        walletId: user.wallet.id,
        koriAmount,
        country: user.country ?? 'SN',
        reference: rail.reference,
        note: rail.operator ? `Retrait via ${rail.operator}` : 'Retrait K21',
      });
    }

    return tx.railTransaction.update({
      where: { id: rail.id },
      data: {
        status: 'completed',
        walletDebited: rail.direction === 'out' ? true : rail.walletDebited,
        externalId: params.externalId ?? rail.externalId,
        completedAt: new Date(),
      },
    });
  });
}

export class RailError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'RailError';
  }
}
