import crypto from 'node:crypto';
import { prisma } from './prisma.js';
import { getAppPublicOrigin } from './k21-qr.js';
import { normalizeHandle } from './k21-qr.js';

export function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function ensureUserInviteCode(db, userId) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (user.inviteCode) return user.inviteCode;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateInviteCode();
    try {
      const updated = await db.user.update({
        where: { id: userId },
        data: { inviteCode: code },
      });
      return updated.inviteCode;
    } catch (error) {
      if (error.code !== 'P2002') throw error;
    }
  }
  throw new Error('Could not generate invite code');
}

export function buildJoinUrl(inviteCode) {
  const origin = getAppPublicOrigin();
  return `${origin}/join?ref=${encodeURIComponent(inviteCode)}`;
}

export function buildInviteShareMessage({ name, handle, inviteCode }) {
  const h = normalizeHandle(handle);
  const displayName = String(name ?? h).trim() || h;
  const joinUrl = buildJoinUrl(inviteCode);
  const profileUrl = `${getAppPublicOrigin()}/u/${h}`;

  return {
    title: 'Rejoins K21',
    message: [
      `${displayName} t'invite sur K21 🇸🇳`,
      '',
      'Crée ton compte en 2 min — envoie de l\'argent, Mboolo, retraits chez un agent.',
      '',
      `Inscription : ${joinUrl}`,
      `Mon profil : ${profileUrl}`,
    ].join('\n'),
    joinUrl,
    profileUrl,
    inviteCode,
    whatsAppText: encodeURIComponent(
      [
        `${displayName} t'invite sur K21 🇸🇳`,
        `Inscris-toi : ${joinUrl}`,
      ].join('\n'),
    ),
    smsBody: `K21: ${displayName} t'invite. Crée ton compte: ${joinUrl}`,
  };
}

export async function getInviteShareForUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.handle) {
    return { ready: false, message: 'Complète ton profil (@handle) pour inviter des amis.' };
  }

  const inviteCode = await ensureUserInviteCode(prisma, userId);
  const share = buildInviteShareMessage({
    name: user.name,
    handle: user.handle,
    inviteCode,
  });

  return { ready: true, ...share };
}

export async function attachReferralOnSignup(db, userId, refCode) {
  const code = String(refCode ?? '').trim().toUpperCase();
  if (!code || code.length < 4) return null;

  const referrer = await db.user.findFirst({ where: { inviteCode: code } });
  if (!referrer || referrer.id === userId) return null;

  await db.user.update({
    where: { id: userId },
    data: { referredByUserId: referrer.id },
  });

  return referrer.id;
}
