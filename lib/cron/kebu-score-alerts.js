import { prisma } from '../prisma.js';
import { computeKebuScore } from '../kebu-score-service.js';
import { createInAppNotification } from '../notify-service.js';

/**
 * Suppliers extend B2B credit based on a buyer's KEBU score at the time they
 * add them as a trade account, but nothing re-checks it afterward — a buyer
 * who was "solide" when onboarded can quietly slide toward "basique" (new
 * overdue invoices elsewhere, etc.) with the supplier none the wiser. This
 * daily job recomputes every active credit account's buyer score and alerts
 * the supplier when it drops meaningfully or crosses down a tier.
 */

const SCORE_DROP_THRESHOLD = 100; // out of 1000
const TIER_RANK = { nouveau: 0, basique: 1, fiable: 2, solide: 3, excellent: 4 };

export async function runKebuScoreAlerts(db = prisma) {
  const accounts = await db.tradeAccount.findMany({
    where: { active: true, buyerBusinessId: { not: null }, creditLimitKori: { gt: 0 } },
    include: {
      supplier: { select: { id: true, ownerId: true } },
      buyerBusiness: { select: { id: true, name: true } },
    },
  });

  let alerted = 0;
  for (const account of accounts) {
    if (!account.buyerBusiness) continue;
    const score = await computeKebuScore(account.buyerBusinessId, db);
    if (!score) continue;

    const prevScore = account.lastKnownBuyerScore;
    const prevTier = account.lastKnownBuyerTier;
    const droppedEnough = prevScore != null && prevScore - score.score >= SCORE_DROP_THRESHOLD;
    const tierDown = prevTier != null && (TIER_RANK[score.tier] ?? 0) < (TIER_RANK[prevTier] ?? 0);

    if (droppedEnough || tierDown) {
      await createInAppNotification(
        account.supplier.ownerId,
        'Score KEBU en baisse',
        `${account.buyerBusiness.name} — score passé de ${prevScore} à ${score.score} (${score.tierLabel}). Vérifie sa limite de crédit.`,
        { kind: 'kebu_score_drop', refId: account.id },
      );
      alerted += 1;
    }

    await db.tradeAccount.update({
      where: { id: account.id },
      data: { lastKnownBuyerScore: score.score, lastKnownBuyerTier: score.tier, lastScoreCheckAt: new Date() },
    });
  }

  return { checked: accounts.length, alerted };
}
