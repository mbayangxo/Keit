import { prisma } from './prisma.js';
import { effectiveTier } from './tier-limits.js';

export const WORKER_MODES = ['delivery', 'seller', 'gigs'];

export class WorkerError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.name = 'WorkerError';
    this.status = status;
  }
}

function parseModes(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((m) => String(m).trim().toLowerCase()).filter((m) => WORKER_MODES.includes(m)))];
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [...new Set(raw.split(',').map((m) => m.trim().toLowerCase()).filter((m) => WORKER_MODES.includes(m)))];
  }
  return [];
}

function generateWorkerId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `WRK-${n}`;
}

async function uniqueWorkerId(db) {
  for (let i = 0; i < 8; i += 1) {
    const workerId = generateWorkerId();
    const exists = await db.workerProfile.findUnique({ where: { workerId } });
    if (!exists) return workerId;
  }
  throw new WorkerError('worker_id_failed', 'Impossible de générer un ID travailleur', 500);
}

/** Worker profiles are only for personal accounts — not standalone business signups. */
export async function assertPersonalAccountForWorker(userId) {
  const roles = await prisma.accountRole.findMany({ where: { userId, status: 'active' } });
  const hasPersonal = roles.some((r) => r.role === 'personal');
  const hasBusinessOwner = roles.some((r) => r.role === 'business_owner');
  if (!hasPersonal || hasBusinessOwner) {
    throw new WorkerError(
      'worker_personal_only',
      'Le profil travailleur s\'active depuis ton compte personnel K21 — pas depuis un compte business.',
      403,
    );
  }
}

export function computeCreditTier({ completedJobs, totalEarnedNational }) {
  if (completedJobs >= 20 && totalEarnedNational >= 100_000) return 'established';
  if (completedJobs >= 3 && totalEarnedNational >= 10_000) return 'building';
  return 'starter';
}

export function computeReputationScore({ completedJobs, totalEarnedNational, verificationTier }) {
  const tier = verificationTier ?? 1;
  return completedJobs * 10 + Math.floor(totalEarnedNational / 1000) + tier * 50;
}

export function workerProfileShape(profile, user) {
  const modes = parseModes(profile.modes);
  const creditTier = computeCreditTier(profile);
  const tier = effectiveTier(user ?? {});
  return {
    id: profile.id,
    workerId: profile.workerId,
    modes,
    status: profile.status,
    reputationScore: profile.reputationScore,
    totalEarnedNational: profile.totalEarnedNational,
    completedJobs: profile.completedJobs,
    creditTier,
    activatedAt: profile.activatedAt.toISOString(),
    verificationTier: tier,
  };
}

export function workerReceiptShape(receipt) {
  return {
    id: receipt.id,
    reference: receipt.reference,
    kind: receipt.kind,
    title: receipt.title,
    subtitle: receipt.subtitle ?? null,
    amountNational: receipt.amountNational,
    koriAmount: receipt.koriAmount,
    completedAt: receipt.completedAt.toISOString(),
  };
}

function isWorkerSchemaError(err) {
  return err?.code === 'P2021' || err?.code === 'P2022';
}

export async function getWorkerProfile(userId) {
  try {
    const profile = await prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) return null;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return workerProfileShape(profile, user);
  } catch (err) {
    if (isWorkerSchemaError(err)) {
      console.warn('[worker] WorkerProfile table not ready — skipping', err.message);
      return null;
    }
    throw err;
  }
}

export async function activateWorkerProfile(userId, { modes }) {
  await assertPersonalAccountForWorker(userId);
  const parsedModes = parseModes(modes);
  if (!parsedModes.length) {
    throw new WorkerError('worker_modes_required', 'Choisis au moins un mode : livraison, vente ou gigs.');
  }

  const existing = await prisma.workerProfile.findUnique({ where: { userId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (existing) {
    const merged = [...new Set([...parseModes(existing.modes), ...parsedModes])];
    const reputationScore = computeReputationScore({
      completedJobs: existing.completedJobs,
      totalEarnedNational: existing.totalEarnedNational,
      verificationTier: user.verificationTier,
    });
    const updated = await prisma.workerProfile.update({
      where: { id: existing.id },
      data: {
        modes: merged.join(','),
        status: 'active',
        reputationScore,
      },
    });
    await prisma.accountRole.upsert({
      where: { userId_role: { userId, role: 'worker' } },
      update: { status: 'active' },
      create: { userId, role: 'worker' },
    });
    return workerProfileShape(updated, user);
  }

  const workerId = await uniqueWorkerId(prisma);
  const created = await prisma.workerProfile.create({
    data: {
      userId,
      workerId,
      modes: parsedModes.join(','),
      reputationScore: computeReputationScore({
        completedJobs: 0,
        totalEarnedNational: 0,
        verificationTier: user.verificationTier,
      }),
    },
  });
  await prisma.accountRole.upsert({
    where: { userId_role: { userId, role: 'worker' } },
    update: { status: 'active' },
    create: { userId, role: 'worker' },
  });
  return workerProfileShape(created, user);
}

export async function requireWorkerMode(userId, mode) {
  const profile = await prisma.workerProfile.findUnique({ where: { userId } });
  if (!profile || profile.status !== 'active') {
    throw new WorkerError(
      'worker_profile_required',
      'Active d\'abord ton profil travailleur depuis Moi ou Mouvement.',
      403,
    );
  }
  const modes = parseModes(profile.modes);
  if (!modes.includes(mode)) {
    throw new WorkerError(
      'worker_mode_missing',
      `Active le mode « ${mode} » sur ton profil travailleur.`,
      403,
    );
  }
  return profile;
}

export async function listWorkerReceipts(userId, { limit = 50 } = {}) {
  const profile = await prisma.workerProfile.findUnique({ where: { userId } });
  if (!profile) return [];
  const rows = await prisma.workerReceipt.findMany({
    where: { workerProfileId: profile.id },
    orderBy: { completedAt: 'desc' },
    take: Math.min(limit, 100),
  });
  return rows.map(workerReceiptShape);
}

export async function getWorkerCreditSummary(userId) {
  const profile = await prisma.workerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new WorkerError('worker_not_found', 'Aucun profil travailleur', 404);
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      handle: true,
      phone: true,
      afriId: true,
      verificationTier: true,
      verificationStatus: true,
      createdAt: true,
    },
  });

  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recent = await prisma.workerReceipt.findMany({
    where: { workerProfileId: profile.id, completedAt: { gte: since90 } },
    orderBy: { completedAt: 'desc' },
  });

  const earned90 = recent.reduce((sum, r) => sum + r.amountNational, 0);
  const jobs90 = recent.length;

  const allReceipts = await prisma.workerReceipt.findMany({
    where: { workerProfileId: profile.id },
    orderBy: { completedAt: 'desc' },
    take: 100,
  });

  return {
    worker: workerProfileShape(profile, user),
    identity: {
      name: user.name ?? '',
      handle: user.handle ?? '',
      phone: user.phone ?? '',
      afriId: user.afriId ?? null,
      verificationTier: user.verificationTier,
      verificationStatus: user.verificationStatus,
      memberSince: user.createdAt.toISOString(),
    },
    period90Days: {
      earnedNational: earned90,
      completedJobs: jobs90,
    },
    lifetime: {
      earnedNational: profile.totalEarnedNational,
      completedJobs: profile.completedJobs,
      reputationScore: profile.reputationScore,
      creditTier: computeCreditTier(profile),
    },
    receipts: allReceipts.map(workerReceiptShape),
    loanNote:
      'Document généré par K21 — historique vérifiable de revenus sur la plateforme. Les prêteurs peuvent contacter support@k21.app pour vérifier une référence.',
  };
}

/** Record completed work inside an open money transaction when possible. */
export async function recordWorkerReceiptInTx(tx, {
  userId,
  kind,
  sourceId,
  amountNational,
  koriAmount = 0,
  title,
  subtitle,
  reference,
}) {
  const profile = await tx.workerProfile.findUnique({ where: { userId } });
  if (!profile || profile.status !== 'active') return null;

  const ref = reference ?? `WR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const existing = await tx.workerReceipt.findUnique({ where: { reference: ref } });
  if (existing) return existing;

  const user = await tx.user.findUnique({ where: { id: userId } });
  const completedJobs = profile.completedJobs + 1;
  const totalEarnedNational = profile.totalEarnedNational + amountNational;
  const reputationScore = computeReputationScore({
    completedJobs,
    totalEarnedNational,
    verificationTier: user?.verificationTier ?? 1,
  });

  const receipt = await tx.workerReceipt.create({
    data: {
      workerProfileId: profile.id,
      userId,
      reference: ref,
      kind,
      sourceId: sourceId ?? null,
      title,
      subtitle: subtitle ?? null,
      amountNational,
      koriAmount,
    },
  });

  await tx.workerProfile.update({
    where: { id: profile.id },
    data: { completedJobs, totalEarnedNational, reputationScore },
  });

  return receipt;
}

export async function recordWorkerReceipt(args) {
  return prisma.$transaction((tx) => recordWorkerReceiptInTx(tx, args));
}
