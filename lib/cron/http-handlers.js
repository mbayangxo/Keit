import { assertCronAuth } from '../cron-auth.js';
import { runFinancialIntegrityCheck } from './financial-integrity.js';
import { runPendingTransactionResolver } from './pending-transactions.js';
import { runFraudMonitor } from './fraud-monitor.js';
import { runTontineProcessor } from './tontine-processor.js';
import { runRiderStatusUpdater } from './rider-status.js';
import { runDailyFinancialReport } from './daily-financial-report.js';
import { runDeliveryAutoRelease } from './delivery-auto-release.js';
import { purgeExpiredKycImageMetadata } from '../kyc-service.js';
import { runScheduledPayrollCron } from './payroll-processor.js';
import { runSchoolFeeReminders } from './school-reminders.js';

function cronHandler(runner) {
  return async (req, res) => {
    if (!assertCronAuth(req, res)) return;
    try {
      const result = await runner();
      res.json(result);
    } catch (error) {
      console.error('[CRON]', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Cron job failed',
      });
    }
  };
}

/** Hobby beta: one Vercel cron hits this; runs every former /api/cron/* job once daily. */
export async function runAllDailyCronJobs() {
  const jobs = [
    { name: 'financial_integrity', run: runFinancialIntegrityCheck },
    { name: 'pending_transactions', run: runPendingTransactionResolver },
    { name: 'fraud_monitor', run: runFraudMonitor },
    { name: 'tontine_processor', run: runTontineProcessor },
    { name: 'rider_status', run: runRiderStatusUpdater },
    { name: 'daily_financial_report', run: runDailyFinancialReport },
    { name: 'delivery_auto_release', run: runDeliveryAutoRelease },
    { name: 'kyc_purge', run: purgeExpiredKycImageMetadata },
    { name: 'payroll_processor', run: runScheduledPayrollCron },
    { name: 'school_fee_reminders', run: runSchoolFeeReminders },
  ];

  const results = [];
  for (const job of jobs) {
    try {
      results.push({ name: job.name, ok: true, result: await job.run() });
    } catch (error) {
      console.error(`[CRON daily] ${job.name}`, error);
      results.push({
        name: job.name,
        ok: false,
        error: error instanceof Error ? error.message : 'Cron job failed',
      });
    }
  }

  return {
    ranAt: new Date().toISOString(),
    jobs: results,
    failed: results.filter((r) => !r.ok).length,
  };
}

export const cronDailyAll = cronHandler(runAllDailyCronJobs);

export const cronFinancialIntegrity = cronHandler(runFinancialIntegrityCheck);
export const cronPendingTransactions = cronHandler(runPendingTransactionResolver);
export const cronFraudMonitor = cronHandler(runFraudMonitor);
export const cronTontineProcessor = cronHandler(runTontineProcessor);
export const cronRiderStatus = cronHandler(runRiderStatusUpdater);
export const cronDailyFinancialReport = cronHandler(runDailyFinancialReport);
export const cronDeliveryAutoRelease = cronHandler(runDeliveryAutoRelease);

/** @deprecated use cronFinancialIntegrity */
export const cronKoriReconcile = cronFinancialIntegrity;

/** @deprecated use cronDeliveryAutoRelease */
export const cronDeliveriesAutoRelease = cronDeliveryAutoRelease;
