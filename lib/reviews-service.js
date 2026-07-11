import { prisma } from './prisma.js';

/**
 * Real merchant reviews — one review per user per business (upsert, so users
 * can revise). Ratings shown in the app are always computed from these rows;
 * there is no seeded or default rating anywhere.
 */

export class ReviewError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function upsertReview(userId, businessId, { rating, text } = {}) {
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    throw new ReviewError('invalid_rating', 'La note doit être un entier entre 1 et 5.');
  }
  const cleanText = text == null ? null : String(text).trim().slice(0, 500) || null;

  const business = await prisma.business.findUnique({ where: { id: String(businessId ?? '') } });
  if (!business) throw new ReviewError('business_not_found', 'Marchand introuvable.', 404);
  if (business.ownerId === userId) {
    throw new ReviewError('own_business', 'Tu ne peux pas noter ton propre commerce.', 403);
  }

  return prisma.review.upsert({
    where: { businessId_userId: { businessId: business.id, userId } },
    create: { businessId: business.id, userId, rating: r, text: cleanText },
    update: { rating: r, text: cleanText },
  });
}

export async function getBusinessReviews(businessId, { take = 20 } = {}) {
  const id = String(businessId ?? '');
  const [agg, items] = await Promise.all([
    prisma.review.aggregate({
      where: { businessId: id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { businessId: id },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, rating: true, text: true, createdAt: true, userId: true },
    }),
  ]);

  const userIds = [...new Set(items.map((i) => i.userId))];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, handle: true } })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));

  return {
    average: agg._count > 0 ? Math.round(agg._avg.rating * 10) / 10 : null,
    count: agg._count,
    items: items.map((i) => ({
      id: i.id,
      rating: i.rating,
      text: i.text,
      createdAt: i.createdAt,
      author: byId.get(i.userId)?.name ?? byId.get(i.userId)?.handle ?? 'Membre K21',
    })),
  };
}

/** Rating summaries for a list of business ids — for the Eat grid. */
export async function ratingSummaries(businessIds) {
  if (!businessIds.length) return new Map();
  const rows = await prisma.review.groupBy({
    by: ['businessId'],
    where: { businessId: { in: businessIds } },
    _avg: { rating: true },
    _count: true,
  });
  return new Map(
    rows.map((r) => [r.businessId, { average: Math.round(r._avg.rating * 10) / 10, count: r._count }]),
  );
}
