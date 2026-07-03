import { RISK_LIMITS } from '../risk-constants.js';
import { prisma } from '../prisma.js';
import { writeSecureLog } from '../secure-log.js';

const DUPLICATE_ALERT_WINDOW_MS = 60 * 60 * 1000;

async function alertIfNew(db, { userId, code, message, severity = 'high' }) {
  const since = new Date(Date.now() - DUPLICATE_ALERT_WINDOW_MS);
  const existing = await db.fraudAlert.findFirst({
    where: { userId, code, createdAt: { gte: since } },
  });
  if (existing) return null;

  return db.fraudAlert.create({
    data: { userId, code, message, severity },
  });
}

/**
 * Every 15 min: batch fraud rules — velocity, multi-device, night activity.
 * Flags suspicious accounts; does not move money.
 */
export async function runFraudMonitor(db = prisma) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const alertsCreated = [];

  const outboundRows = await db.$queryRaw`
    SELECT "userId", SUM(ABS(amount))::int AS total
    FROM "LedgerEntry"
    WHERE amount < 0 AND "createdAt" > ${oneDayAgo}
    GROUP BY "userId"
    HAVING SUM(ABS(amount)) > ${RISK_LIMITS.OUTBOUND_24H_XOF}
  `;

  for (const row of outboundRows) {
    const alert = await alertIfNew(db, {
      userId: row.userId,
      code: 'velocity_daily_outbound',
      message: `Outbound ${Number(row.total)} XOF in 24h exceeds ${RISK_LIMITS.OUTBOUND_24H_XOF}`,
      severity: 'high',
    });
    if (alert) alertsCreated.push(alert);
  }

  const txHourRows = await db.$queryRaw`
    SELECT "userId", COUNT(*)::int AS cnt
    FROM "LedgerEntry"
    WHERE amount < 0 AND "createdAt" > ${oneHourAgo}
    GROUP BY "userId"
    HAVING COUNT(*) > ${RISK_LIMITS.TX_PER_HOUR}
  `;

  for (const row of txHourRows) {
    const alert = await alertIfNew(db, {
      userId: row.userId,
      code: 'velocity_tx_hour',
      message: `${Number(row.cnt)} outbound transactions in the last hour`,
      severity: 'high',
    });
    if (alert) alertsCreated.push(alert);
  }

  const deviceRows = await db.$queryRaw`
    SELECT "userId", COUNT(DISTINCT "deviceId")::int AS devices
    FROM "UserDevice"
    WHERE "lastSeenAt" > ${oneDayAgo}
    GROUP BY "userId"
    HAVING COUNT(DISTINCT "deviceId") >= ${RISK_LIMITS.DEVICES_24H}
  `;

  for (const row of deviceRows) {
    const alert = await alertIfNew(db, {
      userId: row.userId,
      code: 'device_multi_login',
      message: `${Number(row.devices)} devices active in 24 hours`,
      severity: 'medium',
    });
    if (alert) alertsCreated.push(alert);
  }

  const pendingHolds = await db.heldTransaction.count({
    where: { status: 'pending_review' },
  });

  const summary = {
    job: 'fraud_monitor',
    alertsCreated: alertsCreated.length,
    pendingReview: pendingHolds,
    scanned: {
      outboundViolations: outboundRows.length,
      hourlyViolations: txHourRows.length,
      multiDevice: deviceRows.length,
    },
    ranAt: now.toISOString(),
  };

  if (alertsCreated.length > 0) {
    await writeSecureLog({
      category: 'fraud_monitor',
      severity: 'warn',
      title: `Fraud monitor flagged ${alertsCreated.length} accounts`,
      payload: { ...summary, alertIds: alertsCreated.map((a) => a.id) },
    });
  }

  return summary;
}
