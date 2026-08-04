/**
 * KEBU score — a business creditworthiness score built entirely from real,
 * already-tracked activity (no self-reported fields, no vanity metrics):
 * on-time B2B invoice payment, how much is currently overdue, the owner's
 * KYC tier, how long the business has existed, real KEBU transaction
 * volume, and marketplace review reputation. Same philosophy as the
 * personal Ngor score (lib/moi-service.js) — honest signal only, applied
 * to businesses instead of people.
 *
 * Most Senegalese SMEs have no formal credit history a bank would
 * recognize; this is meant to stand in for one using the transaction
 * trail K21 already has, so suppliers extending B2B credit terms have
 * something real to base a decision on instead of a guess.
 */

import { prisma } from './prisma.js';
import { effectiveTier } from './tier-limits.js';

const MAX_PAYMENT_HISTORY_POINTS = 500;
const MAX_VERIFICATION_POINTS = 150;
const MAX_TENURE_POINTS = 150;
const MAX_ACTIVITY_POINTS = 150;
const MAX_REPUTATION_POINTS = 50;
const MAX_SCORE =
  MAX_PAYMENT_HISTORY_POINTS + MAX_VERIFICATION_POINTS + MAX_TENURE_POINTS + MAX_ACTIVITY_POINTS + MAX_REPUTATION_POINTS;

const NEUTRAL_ON_TIME_RATE = 0.6; // no trade history yet — neither punished nor maxed out
const OVERDUE_PENALTY_POINTS = 50; // per currently-overdue invoice, as buyer

const TENURE_MONTHS_FOR_MAX_POINTS = 15;

const TIERS = [
  { min: 900, key: 'excellent', label: 'Excellent', suggestedCreditLimitKori: 5_000_000 },
  { min: 700, key: 'solide', label: 'Solide', suggestedCreditLimitKori: 2_000_000 },
  { min: 450, key: 'fiable', label: 'Fiable', suggestedCreditLimitKori: 500_000 },
  { min: 200, key: 'basique', label: 'Basique', suggestedCreditLimitKori: 100_000 },
  { min: 0, key: 'nouveau', label: 'Nouveau', suggestedCreditLimitKori: 0 },
];

function tierFor(score) {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

function monthsBetween(from, to) {
  return Math.max(0, (to.getTime() - from.getTime()) / (30 * 24 * 3600 * 1000));
}

async function computePaymentHistory(db, businessId) {
  // "As buyer" — invoices where this business is the one who owes money,
  // not the one issuing them. A brand's own supplier invoicing is a
  // separate concern (this business as issuer doesn't affect its own score).
  const [paid, overdue] = await Promise.all([
    db.tradeInvoice.findMany({
      where: { buyerBusinessId: businessId, status: 'paid' },
      select: { dueAt: true, paidAt: true },
    }),
    db.tradeInvoice.count({ where: { buyerBusinessId: businessId, status: 'overdue' } }),
  ]);

  let onTimeRate = NEUTRAL_ON_TIME_RATE;
  if (paid.length > 0) {
    const onTime = paid.filter((inv) => inv.paidAt && inv.paidAt <= inv.dueAt).length;
    onTimeRate = onTime / paid.length;
  }

  const base = Math.round(MAX_PAYMENT_HISTORY_POINTS * onTimeRate);
  const penalty = Math.min(base, overdue * OVERDUE_PENALTY_POINTS);
  const points = Math.max(0, base - penalty);

  return {
    points,
    max: MAX_PAYMENT_HISTORY_POINTS,
    paidInvoiceCount: paid.length,
    onTimeRate: paid.length > 0 ? Math.round(onTimeRate * 100) / 100 : null,
    overdueCount: overdue,
  };
}

async function computeVerification(db, ownerId) {
  const owner = await db.user.findUnique({ where: { id: ownerId } });
  const tier = owner ? effectiveTier(owner) : 1;
  const points = tier >= 3 ? MAX_VERIFICATION_POINTS : tier === 2 ? Math.round(MAX_VERIFICATION_POINTS * 0.6) : Math.round(MAX_VERIFICATION_POINTS * 0.2);
  return { points, max: MAX_VERIFICATION_POINTS, ownerTier: tier };
}

function computeTenure(createdAt) {
  const months = monthsBetween(createdAt, new Date());
  const points = Math.min(MAX_TENURE_POINTS, Math.round((months / TENURE_MONTHS_FOR_MAX_POINTS) * MAX_TENURE_POINTS));
  return { points, max: MAX_TENURE_POINTS, months: Math.round(months) };
}

async function computeActivity(db, businessId) {
  const count = await db.businessLedgerEntry.count({ where: { businessId } });
  let points;
  if (count >= 50) points = MAX_ACTIVITY_POINTS;
  else if (count >= 10) points = Math.round(MAX_ACTIVITY_POINTS * 0.66);
  else if (count >= 1) points = Math.round(MAX_ACTIVITY_POINTS * 0.33);
  else points = 0;
  return { points, max: MAX_ACTIVITY_POINTS, transactionCount: count };
}

async function computeReputation(db, businessId) {
  const agg = await db.review.aggregate({ where: { businessId }, _avg: { rating: true }, _count: true });
  const reviewCount = agg._count ?? 0;
  const averageRating = agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null;
  const points =
    averageRating != null
      ? Math.round((averageRating / 5) * MAX_REPUTATION_POINTS)
      : Math.round(MAX_REPUTATION_POINTS * 0.5);
  return { points, max: MAX_REPUTATION_POINTS, averageRating, reviewCount };
}

export async function computeKebuScore(businessId, db = prisma) {
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return null;

  const [paymentHistory, verification, activity, reputation] = await Promise.all([
    computePaymentHistory(db, businessId),
    computeVerification(db, business.ownerId),
    computeActivity(db, businessId),
    computeReputation(db, businessId),
  ]);
  const tenure = computeTenure(business.createdAt);

  const score = Math.min(
    MAX_SCORE,
    paymentHistory.points + verification.points + tenure.points + activity.points + reputation.points,
  );
  const tier = tierFor(score);

  return {
    businessId,
    score,
    maxScore: MAX_SCORE,
    tier: tier.key,
    tierLabel: tier.label,
    suggestedCreditLimitKori: tier.suggestedCreditLimitKori,
    breakdown: { paymentHistory, verification, tenure, activity, reputation },
  };
}
