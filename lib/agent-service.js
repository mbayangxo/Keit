import crypto from 'node:crypto';
import { prisma } from './prisma.js';
import { reference } from '../api/_lib/auth.js';
import { completeCashIn } from './rail-service.js';
import { lockWallets, runMoneyTransaction } from './wallet-atomic.js';
import { buildAgentDepositUrl } from './k21-qr.js';

export class AgentError extends Error {
  constructor(message, code = 'agent_error') {
    super(message);
    this.name = 'AgentError';
    this.code = code;
  }
}

export function agentErrorStatus(error) {
  if (!(error instanceof AgentError)) return 500;
  if (error.code === 'not_agent' || error.code === 'agent_inactive') return 403;
  if (error.code === 'not_found' || error.code === 'invalid_deposit') return 404;
  if (error.code === 'expired' || error.code === 'already_processed') return 409;
  if (error.code === 'insufficient_float' || error.code === 'amount_too_low' || error.code === 'amount_too_high') {
    return 400;
  }
  return 400;
}

export function agentShape(agent, extras = {}) {
  return {
    id: agent.id,
    userId: agent.userId,
    agentCode: agent.agentCode,
    displayName: agent.displayName,
    locationLabel: agent.locationLabel ?? null,
    floatBalance: agent.floatBalance,
    floatLimit: agent.floatLimit,
    commissionBps: agent.commissionBps,
    status: agent.status,
    user: agent.user
      ? {
          id: agent.user.id,
          name: agent.user.name ?? '',
          phone: agent.user.phone ?? '',
          handle: agent.user.handle ?? '',
        }
      : undefined,
    ...extras,
  };
}

export function agentDepositShape(deposit, user) {
  return {
    id: deposit.id,
    reference: deposit.reference,
    token: deposit.token,
    amountXof: deposit.amountXof,
    status: deposit.status,
    expiresAt: deposit.expiresAt.toISOString(),
    confirmedAt: deposit.confirmedAt?.toISOString() ?? null,
    createdAt: deposit.createdAt.toISOString(),
    user: user
      ? {
          id: user.id,
          name: user.name ?? '',
          phone: user.phone ?? '',
          handle: user.handle ?? '',
          verified: (user.verificationTier ?? 1) >= 2,
        }
      : undefined,
  };
}

function depositToken() {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16);
}

export async function getAgentByUserId(userId, db = prisma) {
  return db.agentProfile.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, phone: true, handle: true } } },
  });
}

export async function requireActiveAgent(userId, db = prisma) {
  const role = await db.accountRole.findFirst({
    where: { userId, role: 'agent', status: 'active' },
  });
  if (!role) throw new AgentError('Rôle agent requis', 'not_agent');

  const agent = await getAgentByUserId(userId, db);
  if (!agent || agent.status !== 'active') {
    throw new AgentError('Profil agent inactif', 'agent_inactive');
  }
  return agent;
}

export async function createAgentDepositSession(userId, amountXof) {
  if (amountXof < 500) throw new AgentError('Minimum 500 FCFA', 'amount_too_low');
  if (amountXof > 500_000) throw new AgentError('Maximum 500 000 FCFA par session', 'amount_too_high');

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { wallet: true },
  });
  if (!user.wallet) throw new AgentError('Wallet introuvable', 'wallet_missing');

  const token = depositToken();
  const ref = reference('AGD');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const deposit = await prisma.agentDeposit.create({
    data: {
      reference: ref,
      token,
      userId,
      amountXof,
      status: 'pending',
      expiresAt,
    },
  });

  return {
    ...agentDepositShape(deposit, user),
    qrUrl: buildAgentDepositUrl(token),
  };
}

export async function getAgentDepositByReference(reference, userId) {
  const deposit = await prisma.agentDeposit.findUnique({
    where: { reference },
    include: { user: { select: { id: true, name: true, phone: true, handle: true, verificationTier: true } } },
  });
  if (!deposit || deposit.userId !== userId) return null;
  return agentDepositShape(deposit, deposit.user);
}

export async function scanAgentDeposit(token, agentUserId) {
  await requireActiveAgent(agentUserId);

  const deposit = await prisma.agentDeposit.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true, phone: true, handle: true, verificationTier: true } } },
  });
  if (!deposit) throw new AgentError('QR invalide', 'not_found');
  if (deposit.status !== 'pending') throw new AgentError('Dépôt déjà traité', 'already_processed');
  if (deposit.expiresAt < new Date()) throw new AgentError('QR expiré — demande un nouveau code', 'expired');

  return agentDepositShape(deposit, deposit.user);
}

export async function confirmAgentDeposit(depositId, agentUserId) {
  const agent = await requireActiveAgent(agentUserId);

  return runMoneyTransaction(prisma, async (tx) => {
    await tx.$executeRaw`SELECT id FROM "AgentProfile" WHERE id = ${agent.id} FOR UPDATE`;

    const deposit = await tx.agentDeposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.status !== 'pending') {
      throw new AgentError('Dépôt invalide', 'invalid_deposit');
    }
    if (deposit.expiresAt < new Date()) {
      throw new AgentError('QR expiré', 'expired');
    }

    const agentRow = await tx.agentProfile.findUniqueOrThrow({ where: { id: agent.id } });
    if (agentRow.floatBalance < deposit.amountXof) {
      throw new AgentError('Float insuffisant — contacte K21 pour recharger', 'insufficient_float');
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: deposit.userId },
      include: { wallet: true },
    });
    if (!user.wallet) throw new AgentError('Wallet introuvable', 'wallet_missing');

    await lockWallets(tx, [user.wallet.id]);

    const settled = await completeCashIn(tx, {
      userId: user.id,
      walletId: user.wallet.id,
      country: user.country ?? 'SN',
      amount: deposit.amountXof,
      reference: deposit.reference,
      sourceNote: `Agent ${agentRow.agentCode}`,
    });

    const newFloat = agentRow.floatBalance - deposit.amountXof;
    await tx.agentProfile.update({
      where: { id: agent.id },
      data: { floatBalance: newFloat },
    });

    await tx.agentFloatEntry.create({
      data: {
        agentId: agent.id,
        type: 'deposit_payout',
        amountXof: -deposit.amountXof,
        balanceAfter: newFloat,
        reference: `${deposit.reference}-FLOAT`,
        depositId: deposit.id,
        note: `Cash-in ${user.name ?? user.phone}`,
      },
    });

    await tx.agentDeposit.update({
      where: { id: deposit.id },
      data: {
        status: 'confirmed',
        agentId: agent.id,
        confirmedAt: new Date(),
      },
    });

    const wallet = await tx.wallet.findUnique({ where: { id: user.wallet.id } });
    return {
      deposit: agentDepositShape(deposit, user),
      mint: settled.mint,
      wallet: wallet
        ? { balance: wallet.balance, koriBalance: wallet.koriBalance, currency: wallet.currency }
        : null,
      agentFloatBalance: newFloat,
    };
  });
}

export async function listAgentFloatEntries(agentId, limit = 50) {
  return prisma.agentFloatEntry.findMany({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function createAgentProfile({ userId, displayName, locationLabel, floatLimit, initialFloat, adminId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AgentError('Utilisateur introuvable', 'user_not_found');

  const existing = await prisma.agentProfile.findUnique({ where: { userId } });
  if (existing) throw new AgentError('Déjà agent K21', 'already_agent');

  const count = await prisma.agentProfile.count();
  const agentCode = `AGT-${String(count + 1).padStart(4, '0')}`;
  const startFloat = Math.max(0, Number(initialFloat ?? 0));
  const limit = Math.max(startFloat, Number(floatLimit ?? 500_000));

  return prisma.$transaction(async (tx) => {
    await tx.accountRole.upsert({
      where: { userId_role: { userId, role: 'agent' } },
      create: { userId, role: 'agent', status: 'active' },
      update: { status: 'active' },
    });

    const profile = await tx.agentProfile.create({
      data: {
        userId,
        agentCode,
        displayName: displayName || user.name || user.phone,
        locationLabel: locationLabel ?? null,
        floatLimit: limit,
        floatBalance: startFloat,
      },
      include: { user: { select: { id: true, name: true, phone: true, handle: true } } },
    });

    if (startFloat > 0) {
      await tx.agentFloatEntry.create({
        data: {
          agentId: profile.id,
          type: 'top_up',
          amountXof: startFloat,
          balanceAfter: startFloat,
          reference: reference('AFT'),
          note: 'Float initial',
          adminId: adminId ?? null,
        },
      });
    }

    return agentShape(profile);
  });
}

export async function topUpAgentFloat(agentId, amountXof, adminId, note) {
  if (amountXof <= 0) throw new AgentError('Montant invalide', 'amount_too_low');

  return runMoneyTransaction(prisma, async (tx) => {
    await tx.$executeRaw`SELECT id FROM "AgentProfile" WHERE id = ${agentId} FOR UPDATE`;
    const agent = await tx.agentProfile.findUniqueOrThrow({ where: { id: agentId } });
    const newFloat = agent.floatBalance + amountXof;
    if (newFloat > agent.floatLimit) {
      throw new AgentError('Dépasse la limite de float', 'float_limit');
    }

    await tx.agentProfile.update({ where: { id: agentId }, data: { floatBalance: newFloat } });
    await tx.agentFloatEntry.create({
      data: {
        agentId,
        type: 'top_up',
        amountXof,
        balanceAfter: newFloat,
        reference: reference('AFT'),
        note: note ?? 'Recharge admin',
        adminId: adminId ?? null,
      },
    });

    return { floatBalance: newFloat, floatLimit: agent.floatLimit };
  });
}

export async function listAgents(db = prisma) {
  const agents = await db.agentProfile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, phone: true, handle: true } },
      _count: { select: { deposits: true } },
    },
  });
  return agents.map((a) => agentShape(a, { depositCount: a._count.deposits }));
}

export async function getAgentReconciliation(db = prisma) {
  const [agents, floatAgg, depositAgg, ledgerGroups, pendingDeposits] = await Promise.all([
    db.agentProfile.findMany({
      orderBy: { agentCode: 'asc' },
      include: {
        user: { select: { name: true, phone: true, handle: true } },
        _count: { select: { deposits: { where: { status: 'confirmed' } } } },
      },
    }),
    db.agentProfile.aggregate({ _sum: { floatBalance: true, floatLimit: true } }),
    db.agentDeposit.aggregate({
      where: { status: 'confirmed' },
      _sum: { amountXof: true },
      _count: true,
    }),
    db.agentFloatEntry.groupBy({
      by: ['type'],
      _sum: { amountXof: true },
      _count: true,
    }),
    db.agentDeposit.count({ where: { status: 'pending', expiresAt: { gt: new Date() } } }),
  ]);

  const topUps = ledgerGroups.find((g) => g.type === 'top_up')?._sum.amountXof ?? 0;
  const payouts = ledgerGroups.find((g) => g.type === 'deposit_payout')?._sum.amountXof ?? 0;
  const totalFloat = floatAgg._sum.floatBalance ?? 0;
  const totalPaidOut = Math.abs(payouts);

  return {
    agents: agents.map((a) =>
      agentShape(a, {
        confirmedDeposits: a._count.deposits,
      }),
    ),
    summary: {
      agentCount: agents.length,
      totalFloatBalanceXof: totalFloat,
      totalFloatLimitXof: floatAgg._sum.floatLimit ?? 0,
      totalConfirmedDepositsXof: depositAgg._sum.amountXof ?? 0,
      confirmedDepositCount: depositAgg._count ?? 0,
      pendingDepositSessions: pendingDeposits,
      ledgerTopUpsXof: topUps,
      ledgerPayoutsXof: payouts,
      /** Cash agents should hold ≈ top-ups − float remaining */
      impliedCashHeldXof: topUps + payouts - totalFloat,
      floatLedgerByType: ledgerGroups.map((g) => ({
        type: g.type,
        totalXof: g._sum.amountXof ?? 0,
        count: g._count,
      })),
    },
  };
}
