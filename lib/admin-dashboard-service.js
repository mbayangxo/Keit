import { expectedReserveXof } from './kori-reserve.js';
import { prisma } from './prisma.js';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function ledgerCountsSince(since) {
  return prisma.ledgerEntry.count({ where: { createdAt: { gte: since } } });
}

export async function getAdminDashboard(db = prisma) {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);
  const stale15 = new Date(Date.now() - 15 * 60 * 1000);

  const [
    txToday,
    txWeek,
    txMonth,
    reserve,
    walletKoriAgg,
    pendingRails,
    pendingHeld,
    pendingMoney,
    fraudAlerts,
    supportTickets,
    activeDeliveries,
    signupsToday,
    failedToday,
    topMerchants,
    riders,
  ] = await Promise.all([
    ledgerCountsSince(today),
    ledgerCountsSince(week),
    ledgerCountsSince(month),
    db.koriReserve.findUnique({ where: { id: 'global' } }),
    db.wallet.aggregate({ _sum: { koriBalance: true } }),
    db.railTransaction.findMany({
      where: { status: 'pending', createdAt: { lt: stale15 } },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: { user: { select: { id: true, phone: true, name: true, handle: true } } },
    }),
    db.heldTransaction.findMany({
      where: { status: 'pending_review', createdAt: { lt: stale15 } },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: { fraudAlerts: true, user: { select: { id: true, phone: true, name: true } } },
    }),
    db.moneyRequest.findMany({
      where: { status: 'pending', createdAt: { lt: stale15 } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    }),
    db.fraudAlert.findMany({
      where: { acknowledgedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, phone: true, name: true, handle: true } },
        heldTransaction: { select: { id: true, reference: true, operationType: true, amountNational: true } },
      },
    }),
    db.supportTicket.findMany({
      where: { status: { in: ['open', 'pending'] } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, phone: true, name: true, handle: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    db.deliveryTask.findMany({
      where: { status: { notIn: ['completed', 'cancelled'] } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        assignedDriver: { select: { id: true, name: true, handle: true, phone: true } },
        order: { select: { id: true, totalAmount: true, businessId: true } },
      },
    }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.railTransaction.findMany({
      where: { status: 'failed', createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, phone: true, name: true } } },
    }),
    db.$queryRaw`
      SELECT u.id, u.name, u.handle, u.phone, b.name AS "businessName",
             SUM(le.amount)::int AS volume
      FROM "LedgerEntry" le
      JOIN "Wallet" w ON w.id = le."walletId"
      JOIN "User" u ON u.id = w."userId"
      LEFT JOIN "Business" b ON b."ownerId" = u.id
      WHERE le.type = 'pay_merchant' AND le.amount > 0
        AND le."createdAt" >= ${month}
      GROUP BY u.id, u.name, u.handle, u.phone, b.name
      ORDER BY volume DESC
      LIMIT 10
    `,
    db.$queryRaw`
      SELECT d."assignedDriverId" AS "driverId",
             u.name, u.handle, u.phone,
             COUNT(*) FILTER (WHERE d.status IN ('delivered', 'confirmed'))::int AS "completedDeliveries",
             COUNT(*) FILTER (WHERE d."buyerRating" IS NOT NULL)::int AS "ratedCount",
             ROUND(AVG(d."buyerRating")::numeric, 2) AS "averageRating"
      FROM "DeliveryTask" d
      JOIN "User" u ON u.id = d."assignedDriverId"
      WHERE d."assignedDriverId" IS NOT NULL
      GROUP BY d."assignedDriverId", u.name, u.handle, u.phone
      ORDER BY "completedDeliveries" DESC
      LIMIT 20
    `,
  ]);

  const circulation = reserve?.totalKoriInCirculation ?? walletKoriAgg._sum.koriBalance ?? 0;
  const reserveXof = reserve?.totalReserveHeldXof ?? 0;
  const expectedXof = expectedReserveXof(circulation);

  return {
    generatedAt: now.toISOString(),
    transactions: { today: txToday, week: txWeek, month: txMonth },
    kori: {
      circulation,
      reserveXof,
      expectedReserveXof: expectedXof,
      reserveOk: reserveXof === expectedXof,
      conversionsFrozen: reserve?.conversionsFrozen ?? false,
    },
    pendingOlderThan15Min: {
      rails: pendingRails.map((r) => ({
        id: r.id,
        reference: r.reference,
        userId: r.userId,
        user: r.user,
        direction: r.direction,
        amount: r.amount,
        provider: r.provider,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        ageMinutes: Math.floor((now - r.createdAt) / 60000),
      })),
      held: pendingHeld.map((h) => ({
        id: h.id,
        reference: h.reference,
        userId: h.userId,
        user: h.user,
        operationType: h.operationType,
        amountNational: h.amountNational,
        flags: JSON.parse(h.flagsJson),
        createdAt: h.createdAt.toISOString(),
        alerts: h.fraudAlerts,
      })),
      moneyRequests: pendingMoney.map((m) => ({
        id: m.id,
        reference: m.reference,
        requesterId: m.requesterId,
        payerId: m.payerId,
        amount: m.amount,
        createdAt: m.createdAt.toISOString(),
      })),
    },
    fraudAlerts: fraudAlerts.map((a) => ({
      id: a.id,
      userId: a.userId,
      user: a.user,
      code: a.code,
      message: a.message,
      severity: a.severity,
      heldTransaction: a.heldTransaction,
      createdAt: a.createdAt.toISOString(),
    })),
    supportTickets: supportTickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      user: t.user,
      lastMessage: t.messages[0]?.body ?? null,
      updatedAt: t.updatedAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    })),
    activeDeliveries: activeDeliveries.map((d) => ({
      id: d.id,
      status: d.status,
      dropoffArea: d.dropoffArea,
      deliveryFeeNational: d.deliveryFeeNational,
      driver: d.assignedDriver,
      orderId: d.orderId,
      updatedAt: d.updatedAt.toISOString(),
    })),
    signupsToday,
    failedTransactionsToday: failedToday.map((r) => ({
      id: r.id,
      reference: r.reference,
      userId: r.userId,
      user: r.user,
      direction: r.direction,
      amount: r.amount,
      failureReason: r.failureReason,
      createdAt: r.createdAt.toISOString(),
    })),
    topMerchants,
    riderPerformance: riders.map((r) => ({
      driverId: r.driverId,
      name: r.name,
      handle: r.handle,
      phone: r.phone,
      completedDeliveries: r.completedDeliveries,
      averageRating: r.averageRating != null ? Number(r.averageRating) : null,
      ratedCount: r.ratedCount,
    })),
    morningCheck: buildMorningCheck({
      reserveOk: reserveXof === expectedXof,
      failedCount: failedToday.length,
      pendingRailsCount: pendingRails.length,
      pendingHeldCount: pendingHeld.length,
      fraudCount: fraudAlerts.length,
      openTickets: supportTickets.length,
      conversionsFrozen: reserve?.conversionsFrozen ?? false,
    }),
  };
}

function buildMorningCheck(metrics) {
  const alerts = [];
  if (!metrics.reserveOk) alerts.push('Kori reserve does not match circulation — investigate immediately');
  if (metrics.conversionsFrozen) alerts.push('Kori conversions are frozen');
  if (metrics.failedCount >= 5) alerts.push(`${metrics.failedCount} failed transactions today — review Julaya/partner status`);
  if (metrics.pendingRailsCount > 0) alerts.push(`${metrics.pendingRailsCount} pending rails older than 15 minutes`);
  if (metrics.pendingHeldCount > 0) alerts.push(`${metrics.pendingHeldCount} held transactions awaiting review`);
  if (metrics.fraudCount > 0) alerts.push(`${metrics.fraudCount} unacknowledged fraud alerts`);
  if (metrics.openTickets >= 10) alerts.push(`${metrics.openTickets} open support tickets`);

  return {
    healthy: alerts.length === 0,
    alerts,
    checkedAt: new Date().toISOString(),
  };
}

export async function getTransactionDetail(id, db = prisma) {
  const [ledger, rail, held, kori] = await Promise.all([
    db.ledgerEntry.findUnique({
      where: { id },
      include: { user: { select: { id: true, phone: true, name: true, handle: true } }, wallet: true },
    }),
    db.railTransaction.findUnique({
      where: { id },
      include: { user: { select: { id: true, phone: true, name: true, handle: true } } },
    }),
    db.heldTransaction.findUnique({
      where: { id },
      include: { user: { select: { id: true, phone: true, name: true } }, fraudAlerts: true },
    }),
    db.koriTransaction.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, phone: true, name: true } },
        recipient: { select: { id: true, phone: true, name: true } },
      },
    }),
  ]);

  if (ledger) return { kind: 'ledger', transaction: ledger };
  if (rail) return { kind: 'rail', transaction: rail };
  if (held)
    return {
      kind: 'held',
      transaction: { ...held, flags: JSON.parse(held.flagsJson), payload: JSON.parse(held.payloadJson) },
    };
  if (kori) return { kind: 'kori', transaction: kori };

  const byRef = await db.ledgerEntry.findUnique({
    where: { reference: id },
    include: { user: { select: { id: true, phone: true, name: true } } },
  });
  if (byRef) return { kind: 'ledger', transaction: byRef };

  const railRef = await db.railTransaction.findUnique({
    where: { reference: id },
    include: { user: { select: { id: true, phone: true, name: true } } },
  });
  if (railRef) return { kind: 'rail', transaction: railRef };

  return null;
}

export async function listDailyReports({ date, limit = 30 }, db = prisma) {
  const where = { category: 'daily_financial_report' };
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }
  const rows = await db.secureLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    createdAt: r.createdAt.toISOString(),
    report: JSON.parse(r.payloadJson),
  }));
}
