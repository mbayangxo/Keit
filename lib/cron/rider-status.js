import { prisma } from '../prisma.js';

const INACTIVE_MS = 20 * 60 * 1000;

/**
 * Every 10 min: mark riders with no recent activity as offline.
 */
export async function runRiderStatusUpdater(db = prisma) {
  const cutoff = new Date(Date.now() - INACTIVE_MS);

  const stale = await db.driverProfile.findMany({
    where: {
      status: { in: ['available', 'busy'] },
      OR: [{ lastActiveAt: { lt: cutoff } }, { lastActiveAt: null }],
    },
    select: { id: true, userId: true, status: true, lastActiveAt: true },
  });

  const updated = [];
  for (const profile of stale) {
    const hasActiveDelivery = await db.deliveryTask.findFirst({
      where: {
        assignedDriverId: profile.userId,
        status: { in: ['accepted', 'picked_up', 'in_transit', 'delivered'] },
      },
    });
    if (hasActiveDelivery) continue;

    await db.driverProfile.update({
      where: { id: profile.id },
      data: { status: 'offline' },
    });
    updated.push({ userId: profile.userId, from: profile.status });
  }

  return {
    job: 'rider_status_updater',
    scanned: stale.length,
    markedOffline: updated.length,
    updated,
    ranAt: new Date().toISOString(),
  };
}

/** Call when a rider performs a delivery action. */
export async function touchRiderActivity(db, userId, status = 'available') {
  await db.driverProfile.upsert({
    where: { userId },
    create: { userId, status, lastActiveAt: new Date() },
    update: { status, lastActiveAt: new Date() },
  });
}
