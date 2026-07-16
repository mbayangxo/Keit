import { prisma } from './prisma.js';

/**
 * Community vouch (WeChat-style anti-spam): a member whose account is old
 * enough (6 months by default) scans your QR and confirms you're a real
 * person. One vouch grants the "confirmé" badge. Pure plumbing today — it
 * activates naturally once the first accounts reach 6 months.
 */

export class VouchError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.name = 'VouchError';
    this.status = status;
  }
}

const MIN_ACCOUNT_DAYS = () => Number(process.env.VOUCH_MIN_ACCOUNT_DAYS ?? 180);
const DAY_MS = 24 * 60 * 60 * 1000;

function eligibleAt(createdAt) {
  return new Date(createdAt.getTime() + MIN_ACCOUNT_DAYS() * DAY_MS);
}

function accountOldEnough(user, now = new Date()) {
  return eligibleAt(user.createdAt) <= now;
}

/** Has this user been confirmed by the community? (>= 1 vouch) */
export async function isConfirmed(userId) {
  const count = await prisma.userVouch.count({ where: { userId } });
  return count > 0;
}

/** My vouch status: am I confirmed, and can I confirm others yet? */
export async function vouchStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) throw new VouchError('user_not_found', 'Compte introuvable', 404);
  const [received, given] = await Promise.all([
    prisma.userVouch.count({ where: { userId } }),
    prisma.userVouch.count({ where: { voucherId: userId } }),
  ]);
  return {
    confirmed: received > 0,
    vouchCount: received,
    vouchesGiven: given,
    canVouch: accountOldEnough(user),
    eligibleAt: eligibleAt(user.createdAt).toISOString(),
  };
}

/**
 * Confirm another member (after scanning their QR). Requires MY account to
 * be 6+ months old and a complete profile (name + verified phone).
 */
export async function vouchForUser(voucherId, handleOrId) {
  const handle = String(handleOrId ?? '').replace(/^@+/, '').trim();
  if (!handle) throw new VouchError('vouch_handle_required', 'Handle requis');

  const voucher = await prisma.user.findUnique({
    where: { id: voucherId },
    select: { id: true, createdAt: true, name: true, otpVerifiedAt: true },
  });
  if (!voucher) throw new VouchError('user_not_found', 'Compte introuvable', 404);
  if (!voucher.name?.trim() || !voucher.otpVerifiedAt) {
    throw new VouchError(
      'verification_required',
      'Complète ton profil (nom + téléphone vérifié) pour confirmer quelqu’un.',
      403,
    );
  }
  if (!accountOldEnough(voucher)) {
    throw new VouchError(
      'voucher_too_new',
      `Ton compte doit avoir ${MIN_ACCOUNT_DAYS()} jours (≈ 6 mois) pour confirmer quelqu’un.`,
      403,
    );
  }

  const target = await prisma.user.findFirst({
    where: {
      OR: [{ handle }, { handle: `@${handle}` }, { id: handle }],
    },
    select: { id: true, name: true, handle: true },
  });
  if (!target) throw new VouchError('user_not_found', 'Personne introuvable', 404);
  if (target.id === voucherId) {
    throw new VouchError('self_vouch', 'Tu ne peux pas te confirmer toi-même.', 403);
  }

  const before = await prisma.userVouch.count({ where: { userId: target.id } });
  await prisma.userVouch.upsert({
    where: { userId_voucherId: { userId: target.id, voucherId } },
    create: { userId: target.id, voucherId },
    update: {},
  });

  return {
    vouched: true,
    target: { id: target.id, name: target.name, handle: target.handle },
    newlyConfirmed: before === 0,
  };
}
