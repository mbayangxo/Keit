import { prisma } from './prisma.js';
import { requireBusinessAdmin, requireBusinessMember } from './business-access.js';
import { payEmployee } from './payroll-service.js';

export async function logDelivery({ businessId, farmerUserId, quantityTons, periodStart, periodEnd, note, offlineClientId, loggedByUserId }) {
  await requireBusinessMember(loggedByUserId, businessId);

  if (offlineClientId) {
    const existing = await prisma.farmerDeliveryLog.findUnique({ where: { offlineClientId } });
    if (existing) return existing;
  }

  return prisma.farmerDeliveryLog.create({
    data: {
      businessId,
      farmerUserId,
      quantityTons,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      note: note ?? null,
      offlineClientId: offlineClientId ?? null,
      status: 'pending',
    },
    include: {
      farmer: { select: { id: true, name: true, handle: true, phone: true } },
    },
  });
}

export async function listDeliveries(businessId, { status, farmerUserId } = {}) {
  return prisma.farmerDeliveryLog.findMany({
    where: {
      businessId,
      ...(status ? { status } : {}),
      ...(farmerUserId ? { farmerUserId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      farmer: { select: { id: true, name: true, handle: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
  });
}

export async function verifyDelivery({ businessId, deliveryId, verifierUserId, approved, note }) {
  await requireBusinessAdmin(verifierUserId, businessId);

  const log = await prisma.farmerDeliveryLog.findFirst({
    where: { id: deliveryId, businessId },
  });
  if (!log) throw new Error('Delivery log not found');
  if (log.status !== 'pending') throw new Error('Already processed');

  return prisma.farmerDeliveryLog.update({
    where: { id: deliveryId },
    data: {
      status: approved ? 'verified' : 'rejected',
      verifiedByUserId: verifierUserId,
      verifiedAt: new Date(),
      note: note ?? log.note,
    },
    include: {
      farmer: { select: { id: true, name: true, handle: true } },
    },
  });
}

/**
 * Pay farmer for verified deliveries — uses payroll rail.
 * `ratePerTonXof` defaults from employee payAmount or explicit amount.
 */
export async function payoutFarmerDeliveries({ req, res, businessId, farmerUserId, deliveryIds, ratePerTonXof, note }) {
  await requireBusinessAdmin(req.userId, businessId);

  const logs = await prisma.farmerDeliveryLog.findMany({
    where: {
      businessId,
      farmerUserId,
      status: 'verified',
      payoutReference: null,
      ...(deliveryIds?.length ? { id: { in: deliveryIds } } : {}),
    },
  });
  if (!logs.length) throw new Error('No verified deliveries to pay');

  const employee = await prisma.payrollEmployee.findUnique({
    where: { businessId_userId: { businessId, userId: farmerUserId } },
  });

  const rate = ratePerTonXof ?? employee?.payAmount;
  if (!rate || rate <= 0) throw new Error('Set ratePerTonXof or employee payAmount');

  const totalTons = logs.reduce((sum, l) => sum + l.quantityTons, 0);
  const amount = Math.round(totalTons * rate);

  let payrollEmployee = employee;
  if (!payrollEmployee) {
    payrollEmployee = await prisma.payrollEmployee.create({
      data: {
        businessId,
        userId: farmerUserId,
        jobTitle: 'farmer',
        payAmount: rate,
        paySchedule: 'manual',
      },
    });
  }

  const outcome = await payEmployee({
    req,
    res,
    businessId,
    employeeId: payrollEmployee.id,
    amount,
    note: note ?? `Livraison ${totalTons.toFixed(2)}t`,
  });

  if (!outcome.held && outcome.result) {
    const ref = outcome.result.reference;
    await prisma.farmerDeliveryLog.updateMany({
      where: { id: { in: logs.map((l) => l.id) } },
      data: { status: 'paid', payoutReference: ref },
    });
  }

  return { ...outcome, totalTons, amount, deliveryCount: logs.length };
}

export async function syncOfflineDeliveries(userId, items) {
  const results = [];
  for (const item of items) {
    const clientId = item.clientId;
    const existingQueue = await prisma.offlineSyncQueue.findUnique({ where: { clientId } });
    if (existingQueue?.syncedAt) {
      results.push({ clientId, status: 'already_synced' });
      continue;
    }

    await prisma.offlineSyncQueue.upsert({
      where: { clientId },
      update: { payload: JSON.stringify(item.payload) },
      create: {
        userId,
        entityType: item.entityType ?? 'farmer_delivery',
        payload: JSON.stringify(item.payload),
        clientId,
      },
    });

    if (item.entityType === 'farmer_delivery' || item.payload?.businessId) {
      const p = item.payload;
      const log = await logDelivery({
        businessId: p.businessId,
        farmerUserId: p.farmerUserId ?? userId,
        quantityTons: p.quantityTons,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        note: p.note,
        offlineClientId: clientId,
        loggedByUserId: userId,
      });
      await prisma.offlineSyncQueue.update({
        where: { clientId },
        data: { syncedAt: new Date() },
      });
      results.push({ clientId, status: 'synced', deliveryId: log.id });
    } else {
      results.push({ clientId, status: 'queued' });
    }
  }
  return results;
}
