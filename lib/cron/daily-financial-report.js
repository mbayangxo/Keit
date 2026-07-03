import { expectedReserveXof } from '../kori-reserve.js';
import { prisma } from '../prisma.js';
import { writeSecureLog } from '../secure-log.js';

/**
 * Daily 00:00 WAT: snapshot financial health into secure_logs.
 */
export async function runDailyFinancialReport(db = prisma) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [walletAgg, reserve, pendingRails, heldReview, fraudOpen, tx24h, userCount] =
    await Promise.all([
      db.wallet.aggregate({ _sum: { balance: true, koriBalance: true }, _count: true }),
      db.koriReserve.findUnique({ where: { id: 'global' } }),
      db.railTransaction.count({ where: { status: 'pending' } }),
      db.heldTransaction.count({ where: { status: 'pending_review' } }),
      db.fraudAlert.count({ where: { acknowledgedAt: null } }),
      db.ledgerEntry.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.user.count(),
    ]);

  const walletKori = walletAgg._sum.koriBalance ?? 0;
  const expectedXof = expectedReserveXof(walletKori);
  const reserveOk = reserve ? reserve.totalReserveHeldXof === expectedXof : false;

  const report = {
    generatedAt: new Date().toISOString(),
    users: userCount,
    wallets: walletAgg._count,
    totalNationalXof: walletAgg._sum.balance ?? 0,
    totalKori: walletKori,
    reserve: reserve
      ? {
          circulation: reserve.totalKoriInCirculation,
          heldXof: reserve.totalReserveHeldXof,
          expectedXof,
          conversionsFrozen: reserve.conversionsFrozen,
          ok: reserveOk,
        }
      : null,
    pendingRails,
    heldForReview: heldReview,
    openFraudAlerts: fraudOpen,
    ledgerEntries24h: tx24h,
    healthy: reserveOk && pendingRails < 100 && heldReview < 50,
  };

  await writeSecureLog({
    category: 'daily_financial_report',
    severity: report.healthy ? 'info' : 'warn',
    title: `Daily financial report — ${report.healthy ? 'healthy' : 'attention needed'}`,
    payload: report,
  });

  const adminUserId = process.env.ADMIN_USER_ID;
  if (adminUserId && !report.healthy) {
    await db.notification.create({
      data: {
        userId: adminUserId,
        title: 'Rapport financier quotidien',
        body: `Attention: ${pendingRails} rails en attente, ${heldReview} revues, réserve ${reserveOk ? 'OK' : 'ÉCART'}.`,
      },
    });
  }

  return { job: 'daily_financial_report', report };
}
