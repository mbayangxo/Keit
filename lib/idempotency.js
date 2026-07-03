import crypto from 'crypto';

/** userId + timestamp + amount + UUID — unique per partner API call */
export function generateIdempotencyKey(userId, amount, reference = '') {
  return `${userId}:${Date.now()}:${amount}:${reference}:${crypto.randomUUID()}`;
}

export async function findIdempotentResponse(db, key) {
  const row = await db.apiIdempotency.findUnique({ where: { key } });
  if (!row?.responseJson) return null;
  try {
    return JSON.parse(row.responseJson);
  } catch {
    return null;
  }
}

export async function claimIdempotencyKey(db, params) {
  const existing = await db.apiIdempotency.findUnique({ where: { key: params.key } });
  if (existing) {
    const cached = existing.responseJson ? JSON.parse(existing.responseJson) : null;
    return { duplicate: true, row: existing, cached };
  }

  try {
    const row = await db.apiIdempotency.create({
      data: {
        key: params.key,
        provider: params.provider,
        userId: params.userId,
        operation: params.operation,
        reference: params.reference,
        status: 'pending',
      },
    });
    return { duplicate: false, row };
  } catch (error) {
    if (error?.code === 'P2002') {
      return claimIdempotencyKey(db, params);
    }
    throw error;
  }
}

export async function saveIdempotentResponse(db, key, payload) {
  const status = payload.rail?.status ?? payload.status ?? 'pending';
  await db.apiIdempotency.update({
    where: { key },
    data: {
      status,
      responseJson: JSON.stringify(payload),
    },
  });
}
