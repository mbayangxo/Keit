import { auditUnbackedKoriMints } from '../kori-integrity.js';
import { reconcileKoriReserve } from '../kori-reserve.js';
import { prisma } from '../prisma.js';
import { writeSecureLog } from '../secure-log.js';

/**
 * Hourly: verify Kori reserve === circulation × 10 XOF.
 * On mismatch: log alert, freeze conversions (via reconcileKoriReserve), notify admins.
 */
export async function runFinancialIntegrityCheck(db = prisma) {
  const report = await reconcileKoriReserve(db);
  const koriAudit = await auditUnbackedKoriMints(db);

  if (!report.ok) {
    console.error('[CRON financial_integrity_check] Reserve mismatch', report);

    await writeSecureLog({
      category: 'integrity_alert',
      severity: 'critical',
      title: 'Kori reserve mismatch — conversions frozen',
      payload: report,
    });

    const adminUserId = process.env.ADMIN_USER_ID;
    if (adminUserId) {
      await db.notification.create({
        data: {
          userId: adminUserId,
          title: 'Alerte réserve Kori',
          body: `Écart de ${report.mismatchXof} XOF détecté. Conversions ₭ gelées.`,
        },
      });
    }

    if (koriAudit.unbacked > 0) {
      await writeSecureLog({
        category: 'integrity_alert',
        severity: 'critical',
        title: `Unbacked Kori mints: ${koriAudit.unbacked}`,
        payload: koriAudit,
      });
    }
  }

  return { job: 'financial_integrity_check', report, koriAudit, checkedAt: new Date().toISOString() };
}
